import { Bot, Message } from '../types/models';

export type PairingResponse = {
  token: string;
  deviceName?: string;
  serverVersion?: string;
};

class OpenMausApiClient {
  private baseUrl: string;
  private token: string | null;
  private eventSourceAbortController: AbortController | null = null;

  constructor(baseUrl: string, token: string | null = null) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = token;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
    if (this.token) {
      headers['X-Device-Token'] = this.token;
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async checkHealth(): Promise<{ ok: boolean; status: number; endpoints?: any }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/config`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return { ok: res.ok, status: res.status };
    } catch {
      return { ok: false, status: 0 };
    }
  }

  async pairWithCode(code: string, deviceName: string = 'Expo Mobile'): Promise<PairingResponse> {
    const res = await fetch(`${this.baseUrl}/pair/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim(), deviceName }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Pairing failed: ${res.status} ${err}`);
    }

    const data = await res.json();
    return {
      token: data.token || data.deviceToken,
      deviceName: data.deviceName,
      serverVersion: data.version,
    };
  }

  async fetchBots(): Promise<Bot[]> {
    const res = await fetch(`${this.baseUrl}/api/bots`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch bots: ${res.statusText}`);
    }

    const data = await res.json();
    const rawBots = Array.isArray(data) ? data : data.bots || [];

    return rawBots.map((b: any) => ({
      id: b.id,
      name: b.name || 'Agent',
      avatar: b.avatar || b.icon,
      color: b.color || '#38BDF8',
      provider: b.provider || 'claude',
      model: b.model || 'claude-3-5-sonnet',
      systemPrompt: b.systemPrompt || b.prompt,
      status: b.status || (b.isWorking ? 'working' : 'idle'),
      lastActive: b.lastActive || Date.now(),
      unreadCount: b.unreadCount || 0,
      hasPendingAction: b.hasPendingAction || !!b.pendingRequest,
    }));
  }

  async createBot(params: { name: string; provider?: string; model?: string; prompt?: string }): Promise<Bot> {
    const res = await fetch(`${this.baseUrl}/api/bots`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`Failed to create bot: ${res.statusText}`);
    }

    return await res.json();
  }

  async fetchMessages(botId: string): Promise<Message[]> {
    const res = await fetch(`${this.baseUrl}/api/bots/${botId}/messages`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      // Fallback if not supported or empty
      return [];
    }

    const data = await res.json();
    const rawMsgs = Array.isArray(data) ? data : data.messages || [];

    return rawMsgs.map((m: any) => ({
      id: m.id || `msg_${Date.now()}_${Math.random()}`,
      botId: botId,
      threadId: m.threadId || 'main',
      role: m.role || (m.isUser ? 'user' : 'assistant'),
      content: m.content || m.text || '',
      createdAt: m.createdAt || Date.now(),
      toolActivities: m.toolActivities || m.tools,
      optionCard: m.optionCard || m.card,
      secretRequest: m.secretRequest,
    }));
  }

  async sendMessage(botId: string, text: string, threadId?: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/bots/${botId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        content: text,
        threadId: threadId || 'main',
        timestamp: Date.now(),
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to send message: ${res.statusText}`);
    }
  }

  async respondToCard(botId: string, requestId: string, response: string, behavior: 'allow' | 'deny' | 'answer' = 'allow'): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/bots/${botId}/respond`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        requestId,
        response,
        behavior,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to submit card response: ${res.statusText}`);
    }
  }

  async alwaysAllowPermission(botId: string, allowKey: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/bots/${botId}/always-allow`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ allowKey }),
    });

    if (!res.ok) {
      throw new Error(`Failed to save permission: ${res.statusText}`);
    }
  }

  async interrupt(botId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/bots/${botId}/interrupt`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ timestamp: Date.now() }),
    });

    if (!res.ok) {
      throw new Error(`Failed to interrupt: ${res.statusText}`);
    }
  }

  async markAsRead(botId: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/bots/${botId}/read`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch {
      // Non-critical
    }
  }

  // Subscribe to SSE stream
  subscribeToEvents(onEvent: (event: any) => void, onError?: (err: any) => void): () => void {
    if (this.eventSourceAbortController) {
      this.eventSourceAbortController.abort();
    }

    const controller = new AbortController();
    this.eventSourceAbortController = controller;
    const sseUrl = `${this.baseUrl}/api/events`;

    const startEventStream = async () => {
      try {
        const response = await fetch(sseUrl, {
          method: 'GET',
          headers: {
            ...this.getHeaders(),
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`SSE failed with status: ${response.status}`);
        }

        // On React Native fetch streaming
        const reader = response.body.getReader ? response.body.getReader() : null;
        if (reader) {
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const chunk of lines) {
              const match = chunk.match(/^data:\s*(.+)$/m);
              if (match) {
                try {
                  const data = JSON.parse(match[1]);
                  onEvent(data);
                } catch {
                  // Ignore JSON parse err
                }
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          onError?.(err);
        }
      }
    };

    startEventStream();

    return () => {
      controller.abort();
    };
  }
}

export { OpenMausApiClient };
export default OpenMausApiClient;

