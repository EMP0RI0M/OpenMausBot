import { Bot, Message } from '../types/models';
import { normalizeMessageList, type RawMessage } from '../state/wireAdapter';

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
    const rawMsgs: RawMessage[] = Array.isArray(data) ? data : data.messages || [];

    return normalizeMessageList(rawMsgs, { fallbackBotId: botId });
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

  // Subscribe to the SSE stream with automatic reconnect. Phones drop
  // connections constantly (backgrounding, cellular handoff), so one silent
  // failure must not leave the UI stale forever: we reopen the stream with
  // capped exponential backoff + jitter and collapse the backoff whenever data
  // actually flows. Returns a disposer that stops reconnection.
  subscribeToEvents(
    onEvent: (event: any) => void,
    onError?: (err: any) => void,
    options?: {
      baseDelayMs?: number;
      maxDelayMs?: number;
      maxReconnectAttempts?: number;
    }
  ): () => void {
    const baseDelayMs = options?.baseDelayMs ?? 1_000;
    const maxDelayMs = options?.maxDelayMs ?? 30_000;
    const maxReconnectAttempts =
      options?.maxReconnectAttempts ?? Number.POSITIVE_INFINITY;

    if (this.eventSourceAbortController) {
      this.eventSourceAbortController.abort();
    }

    const sseUrl = `${this.baseUrl}/api/events`;
    let disposed = false;
    let attempt = 0;
    let controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleReconnect = () => {
      if (disposed) return;
      if (attempt >= maxReconnectAttempts) {
        onError?.(new Error(`SSE reconnect gave up after ${attempt} attempts`));
        return;
      }
      const delay =
        Math.min(baseDelayMs * 2 ** attempt, maxDelayMs) + Math.random() * baseDelayMs;
      attempt += 1;
      timer = setTimeout(() => {
        if (!disposed) start();
      }, delay);
    };

    const start = async () => {
      controller = new AbortController();
      this.eventSourceAbortController = controller;
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
        if (!reader) throw new Error('SSE response body is not readable');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          attempt = 0; // stream is alive — collapse the backoff
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const chunk of lines) {
            const match = chunk.match(/^data:\s*(.+)$/m);
            if (match) {
              try {
                onEvent(JSON.parse(match[1]));
              } catch {
                // Ignore malformed frames
              }
            }
          }
        }

        if (!disposed) scheduleReconnect(); // a clean end still means reopen
      } catch (err: any) {
        if (disposed || err?.name === 'AbortError') return;
        onError?.(err);
        scheduleReconnect();
      }
    };

    start();

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      controller?.abort();
      if (this.eventSourceAbortController === controller) {
        this.eventSourceAbortController = null;
      }
    };
  }
}

export { OpenMausApiClient };
export default OpenMausApiClient;

