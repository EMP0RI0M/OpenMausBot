import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bot, Message, Routine, ServerEndpoint, ConnectionStatus } from '../types/models';
import { OpenMausApiClient } from '../services/api';
import { StorageService } from '../services/storage';
import { triggerHaptic } from '../services/haptics';
import { ProrootSandbox } from '../engine/ProrootSandbox';
import { normalizeMessage, upsertMessage, reconcileMessages, type RawMessage } from '../state/wireAdapter';
import { buildStandaloneInvocation, parseStandaloneInput } from '../state/standaloneCommand';

const DEFAULT_INITIAL_BOTS: Bot[] = [
  {
    id: 'bot_antigravity',
    name: 'Antigravity Core',
    provider: 'custom',
    model: 'agy-v2.0',
    color: '#2563EB',
    status: 'idle',
    unreadCount: 0,
    hasPendingAction: false,
    currentActivity: 'Ready',
    systemPrompt: 'Autonomous Linux agent workstation with on-device sandbox and tool execution.',
    lastActive: Date.now(),
  },
];

interface OpenMausContextType {
  connectionStatus: ConnectionStatus;
  activeServer: ServerEndpoint | null;
  savedServers: ServerEndpoint[];
  bots: Bot[];
  activeBot: Bot | null;
  activeBotId: string;
  activeMessages: Message[];
  routines: Routine[];
  isGenerating: boolean;
  attentionItemsCount: number;

  pairServer: (url: string, code: string, name?: string) => Promise<void>;
  connectDirect: (url: string, token: string, name?: string) => Promise<void>;
  disconnectServer: () => Promise<void>;
  selectBot: (botId: string) => void;
  createBot: (name: string, provider?: string, model?: string, prompt?: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  respondToCard: (requestId: string, choice: string, isPermission: boolean, allowKey?: string) => Promise<void>;
  interruptActiveTurn: () => Promise<void>;
  toggleRoutine: (routineId: string) => void;
  runRoutine: (routineId: string) => Promise<void>;
  refreshFleet: () => Promise<void>;
}

const OpenMausContext = createContext<OpenMausContextType | undefined>(undefined);

export const OpenMausProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('standalone');
  const [activeServer, setActiveServer] = useState<ServerEndpoint | null>(null);
  const [savedServers, setSavedServers] = useState<ServerEndpoint[]>([]);
  const [bots, setBots] = useState<Bot[]>(DEFAULT_INITIAL_BOTS);
  const [activeBotId, setActiveBotId] = useState<string>('bot_antigravity');
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [apiClient, setApiClient] = useState<OpenMausApiClient | null>(null);

  // Load persisted server, bots, and messages on startup
  useEffect(() => {
    let isMounted = true;

    const loadPersistedContext = async () => {
      try {
        const saved = await StorageService.getServersList();
        if (!isMounted) return;
        setSavedServers(saved);

        const current = await StorageService.getActiveServer();
        if (current && current.url) {
          const token = await StorageService.getDeviceToken(current.url);
          if (token && isMounted) {
            const client = new OpenMausApiClient(current.url, token);
            setApiClient(client);
            setActiveServer(current);
            setConnectionStatus('connecting');

            try {
              const health = await client.checkHealth();
              if (!isMounted) return;
              if (health.ok) {
                setConnectionStatus('connected');
                const remoteBots = await client.fetchBots();
                if (remoteBots.length > 0 && isMounted) {
                  setBots(remoteBots);
                  setActiveBotId(remoteBots[0].id);
                }
              } else {
                setConnectionStatus('disconnected');
              }
            } catch {
              if (isMounted) setConnectionStatus('disconnected');
            }
          }
        }

        // Restore local persistent messages
        const storedMessages = await AsyncStorage.getItem('@openmaus_messages');
        if (storedMessages && isMounted) {
          try {
            setMessagesMap(JSON.parse(storedMessages));
          } catch {
            // ignore malformed cache
          }
        }
      } catch (err) {
        console.warn('Error loading persisted context:', err);
      }
    };

    loadPersistedContext();

    return () => {
      isMounted = false;
    };
  }, []);

  // Persist messages whenever they change
  useEffect(() => {
    if (Object.keys(messagesMap).length > 0) {
      AsyncStorage.setItem('@openmaus_messages', JSON.stringify(messagesMap)).catch(() => {});
    }
  }, [messagesMap]);

  // Latest active bot, readable from the long-lived SSE closure without making
  // it a dependency (which would tear down and reopen the stream on every pick).
  const activeBotIdRef = useRef(activeBotId);
  useEffect(() => {
    activeBotIdRef.current = activeBotId;
  }, [activeBotId]);

  // Listen to SSE events when connected to companion server
  useEffect(() => {
    if (connectionStatus === 'connected' && apiClient) {
      const unsubscribe = apiClient.subscribeToEvents(
        (event: any) => {
          const kind: string | undefined = event?.kind ?? event?.type;

          if (kind === 'message' || kind === 'message.patch') {
            const raw = event.message as RawMessage | undefined;
            if (!raw) return;
            const normalized = normalizeMessage(raw, {
              threadId: event.threadId,
              fallbackBotId: activeBotIdRef.current,
            });
            setMessagesMap((prev) => ({
              ...prev,
              [normalized.botId]: upsertMessage(prev[normalized.botId] || [], normalized),
            }));
            if (kind === 'message' && normalized.optionCard && !normalized.optionCard.answered) {
              triggerHaptic.warning();
            }
            return;
          }

          if (kind === 'bot' && event.bot?.id) {
            const botId: string = event.bot.id;
            setBots((prev) =>
              prev.some((b) => b.id === botId)
                ? prev.map((b) => (b.id === botId ? { ...b, ...event.bot } : b))
                : prev
            );
          }
        },
        (err) => {
          console.warn('SSE connection error:', err);
        }
      );
      return () => unsubscribe();
    }
  }, [connectionStatus, apiClient]);

  // Count pending attention cards
  const attentionItemsCount = Object.values(messagesMap).reduce((count, msgs) => {
    const pendingInBot = msgs.filter((m) => m.optionCard && !m.optionCard.answered && !m.optionCard.dismissed);
    return count + pendingInBot.length;
  }, 0);

  const activeBot = bots.find((b) => b.id === activeBotId) || bots[0] || null;
  const activeMessages = messagesMap[activeBotId] || [];

  const selectBot = useCallback((botId: string) => {
    setActiveBotId(botId);
    triggerHaptic.light();
    if (apiClient && connectionStatus === 'connected') {
      apiClient.markAsRead(botId);
      apiClient.fetchMessages(botId).then((msgs) => {
        if (msgs.length > 0) {
          setMessagesMap((prev) => ({ ...prev, [botId]: reconcileMessages(prev[botId] || [], msgs) }));
        }
      }).catch(() => {});
    }
  }, [apiClient, connectionStatus]);

  const pairServer = async (url: string, code: string, name: string = 'Desktop Maus') => {
    triggerHaptic.medium();
    setConnectionStatus('connecting');
    try {
      const cleanUrl = url.trim().replace(/\/+$/, '');
      const client = new OpenMausApiClient(cleanUrl);
      const pairRes = await client.pairWithCode(code);

      client.setToken(pairRes.token);
      await StorageService.saveDeviceToken(cleanUrl, pairRes.token);

      const endpoint: ServerEndpoint = {
        url: cleanUrl,
        name: name || pairRes.deviceName || 'Maus Server',
        token: pairRes.token,
        isTailscale: cleanUrl.includes('.ts.net'),
        isHostedHttps: cleanUrl.startsWith('https://'),
        lastConnected: Date.now(),
      };

      await StorageService.saveActiveServer(endpoint);
      const updatedList = [endpoint, ...savedServers.filter((s) => s.url !== endpoint.url)];
      await StorageService.saveServersList(updatedList);

      setSavedServers(updatedList);
      setActiveServer(endpoint);
      setApiClient(client);
      setConnectionStatus('connected');
      triggerHaptic.success();

      const remoteBots = await client.fetchBots();
      if (remoteBots.length > 0) {
        setBots(remoteBots);
        setActiveBotId(remoteBots[0].id);
      }
    } catch (e) {
      setConnectionStatus('disconnected');
      triggerHaptic.error();
      throw e;
    }
  };

  const connectDirect = async (url: string, token: string, name: string = 'Custom Endpoint') => {
    triggerHaptic.medium();
    setConnectionStatus('connecting');
    try {
      const cleanUrl = url.trim().replace(/\/+$/, '');
      const client = new OpenMausApiClient(cleanUrl, token);
      const health = await client.checkHealth();

      if (!health.ok) {
        throw new Error('Server returned unhealthy response');
      }

      await StorageService.saveDeviceToken(cleanUrl, token);
      const endpoint: ServerEndpoint = {
        url: cleanUrl,
        name,
        token,
        lastConnected: Date.now(),
      };

      await StorageService.saveActiveServer(endpoint);
      const updatedList = [endpoint, ...savedServers.filter((s) => s.url !== endpoint.url)];
      await StorageService.saveServersList(updatedList);

      setSavedServers(updatedList);
      setActiveServer(endpoint);
      setApiClient(client);
      setConnectionStatus('connected');
      triggerHaptic.success();

      const remoteBots = await client.fetchBots();
      if (remoteBots.length > 0) {
        setBots(remoteBots);
        setActiveBotId(remoteBots[0].id);
      }
    } catch (e) {
      setConnectionStatus('disconnected');
      triggerHaptic.error();
      throw e;
    }
  };

  const disconnectServer = async () => {
    triggerHaptic.light();
    await StorageService.saveActiveServer({ url: '', name: '' });
    setActiveServer(null);
    setApiClient(null);
    setConnectionStatus('standalone');
  };

  const refreshFleet = async () => {
    if (apiClient && connectionStatus === 'connected') {
      try {
        const remoteBots = await apiClient.fetchBots();
        if (remoteBots.length > 0) {
          setBots(remoteBots);
        }
      } catch (e) {
        console.warn('Failed to refresh bots', e);
      }
    }
  };

  const createBot = async (name: string, provider: string = 'claude', model: string = 'claude-3-5-sonnet', prompt?: string) => {
    triggerHaptic.medium();
    if (apiClient && connectionStatus === 'connected') {
      const newBot = await apiClient.createBot({ name, provider, model, prompt });
      setBots((prev) => [...prev, newBot]);
      setActiveBotId(newBot.id);
    } else {
      const localBot: Bot = {
        id: `bot_${Date.now()}`,
        name,
        provider: provider as any,
        model,
        color: '#2563EB',
        status: 'idle',
        systemPrompt: prompt || 'You are an autonomous agent in OpenMausBot.',
        lastActive: Date.now(),
        unreadCount: 0,
        hasPendingAction: false,
      };
      setBots((prev) => [...prev, localBot]);
      setActiveBotId(localBot.id);
    }
    triggerHaptic.success();
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    triggerHaptic.light();

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      botId: activeBotId,
      threadId: 'main',
      role: 'user',
      content: text,
      createdAt: Date.now(),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeBotId]: [...(prev[activeBotId] || []), userMsg],
    }));

    if (apiClient && connectionStatus === 'connected') {
      setIsGenerating(true);
      try {
        await apiClient.sendMessage(activeBotId, text);
      } catch {
        triggerHaptic.error();
      } finally {
        setIsGenerating(false);
      }
    } else {
      // Standalone mode: execute in on-device Linux sandbox
      setIsGenerating(true);
      try {
        let output = '';
        const intent = parseStandaloneInput(text);
        const cmdToRun = buildStandaloneInvocation(intent);
        if (!cmdToRun) {
          setIsGenerating(false);
          return;
        }

        output = await ProrootSandbox.runLinuxCommand(cmdToRun);

        const replyMsg: Message = {
          id: `asst_${Date.now()}`,
          botId: activeBotId,
          threadId: 'main',
          role: 'assistant',
          content: `<thought>Executed task in on-device proroot Linux sandbox.</thought>\n\n${output || 'Command completed with exit status 0.'}`,
          createdAt: Date.now(),
          toolActivities: [
            {
              name: cmdToRun.slice(0, 40),
              ok: true,
              spoken: 'Executed command in sandbox',
              timestamp: Date.now(),
            }
          ]
        };

        setMessagesMap((prev) => ({
          ...prev,
          [activeBotId]: [...(prev[activeBotId] || []), replyMsg],
        }));
        triggerHaptic.success();
      } catch (err: any) {
        const errorReply: Message = {
          id: `asst_${Date.now()}`,
          botId: activeBotId,
          threadId: 'main',
          role: 'assistant',
          content: `Error executing command: ${err.message || 'Unknown error'}`,
          createdAt: Date.now(),
        };
        setMessagesMap((prev) => ({
          ...prev,
          [activeBotId]: [...(prev[activeBotId] || []), errorReply],
        }));
        triggerHaptic.error();
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const respondToCard = async (requestId: string, choice: string, _isPermission: boolean, _allowKey?: string) => {
    triggerHaptic.medium();
    const behavior = choice.toLowerCase() === 'deny' ? 'deny' : 'allow';

    setMessagesMap((prev) => {
      const list = prev[activeBotId] || [];
      const updated = list.map((m) => {
        if (m.optionCard && m.optionCard.requestId === requestId) {
          return {
            ...m,
            optionCard: {
              ...m.optionCard,
              answered: choice,
            },
          };
        }
        return m;
      });
      return { ...prev, [activeBotId]: updated };
    });

    if (apiClient && connectionStatus === 'connected') {
      try {
        await apiClient.respondToCard(activeBotId, requestId, choice, behavior);
        triggerHaptic.success();
      } catch (e) {
        console.warn('Failed to submit card response', e);
        triggerHaptic.error();
      }
    }
  };

  const interruptActiveTurn = async () => {
    triggerHaptic.warning();
    if (apiClient && connectionStatus === 'connected') {
      try {
        await apiClient.interrupt(activeBotId);
      } catch (e) {
        console.warn('Failed to interrupt turn', e);
      }
    }
    setIsGenerating(false);
  };

  const toggleRoutine = (routineId: string) => {
    setRoutines((prev) =>
      prev.map((r) => (r.id === routineId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const runRoutine = async (routineId: string) => {
    triggerHaptic.medium();
    const routine = routines.find((r) => r.id === routineId);
    if (!routine) return;

    setRoutines((prev) =>
      prev.map((r) => (r.id === routineId ? { ...r, lastRun: Date.now() } : r))
    );
    triggerHaptic.success();
  };

  return (
    <OpenMausContext.Provider
      value={{
        connectionStatus,
        activeServer,
        savedServers,
        bots,
        activeBot,
        activeBotId,
        activeMessages,
        routines,
        isGenerating,
        attentionItemsCount,
        pairServer,
        connectDirect,
        disconnectServer,
        selectBot,
        createBot,
        sendMessage,
        respondToCard,
        interruptActiveTurn,
        toggleRoutine,
        runRoutine,
        refreshFleet,
      }}
    >
      {children}
    </OpenMausContext.Provider>
  );
};

export const useOpenMaus = () => {
  const context = useContext(OpenMausContext);
  if (!context) {
    throw new Error('useOpenMaus must be used within an OpenMausProvider');
  }
  return context;
};
