import { Bot, Message, Routine } from '../types/models';

export const INITIAL_MOCK_BOTS: Bot[] = [
  {
    id: 'bot_scout',
    name: 'Scout Architect',
    provider: 'claude',
    model: 'claude-3-5-sonnet',
    color: '#38BDF8',
    status: 'waiting',
    unreadCount: 1,
    hasPendingAction: true,
    currentActivity: 'Awaiting bash command approval',
    systemPrompt: 'Senior cloud architect and systems designer.',
    lastActive: Date.now() - 1000 * 60 * 2,
  },
  {
    id: 'bot_codex',
    name: 'Code Master',
    provider: 'codex',
    model: 'gpt-4o-mini',
    color: '#10B981',
    status: 'working',
    unreadCount: 0,
    hasPendingAction: false,
    currentActivity: 'Refactoring SQLite schema...',
    systemPrompt: 'Fullstack TypeScript and React Native expert.',
    lastActive: Date.now() - 1000 * 60 * 15,
  },
  {
    id: 'bot_grok',
    name: 'Grok Operator',
    provider: 'grok',
    model: 'grok-2-beta',
    color: '#E11D48',
    status: 'idle',
    unreadCount: 0,
    hasPendingAction: false,
    currentActivity: 'Idle',
    systemPrompt: 'Autonomous researcher and data scraper.',
    lastActive: Date.now() - 1000 * 60 * 60,
  }
];

export const INITIAL_MOCK_MESSAGES: Record<string, Message[]> = {
  bot_scout: [
    {
      id: 'm1',
      botId: 'bot_scout',
      threadId: 'main',
      role: 'user',
      content: 'Inspect the cluster deployment status and check if microservice containers are healthy.',
      createdAt: Date.now() - 1000 * 60 * 5,
    },
    {
      id: 'm2',
      botId: 'bot_scout',
      threadId: 'main',
      role: 'assistant',
      content: 'I will query the Kubernetes cluster and check the status of all active pods in the `production` namespace.',
      createdAt: Date.now() - 1000 * 60 * 4,
      toolActivities: [
        {
          name: 'kubectl get pods -n production',
          ok: true,
          spoken: 'Executed kubectl get pods',
          timestamp: Date.now() - 1000 * 60 * 4,
        },
        {
          name: 'docker stats --no-stream',
          ok: true,
          spoken: 'Retrieved container resource telemetry',
          timestamp: Date.now() - 1000 * 60 * 3,
        }
      ]
    },
    {
      id: 'm3',
      botId: 'bot_scout',
      threadId: 'main',
      role: 'assistant',
      content: 'Found 1 pod `auth-service-7f98b` reporting `CrashLoopBackOff` due to missing database connection string.\n\nWould you like me to patch the configmap and restart the deployment?',
      createdAt: Date.now() - 1000 * 60 * 2,
      optionCard: {
        title: 'Permission Request: Kubernetes Patch',
        subtitle: 'Authorize Scout to execute kubectl patch deployment',
        options: ['Always allow', 'Approve', 'Deny'],
        requestId: 'req_k8s_patch_01',
        tool: 'Bash:kubectl',
        allowKey: 'Bash:kubectl',
      }
    }
  ],
  bot_codex: [
    {
      id: 'mc1',
      botId: 'bot_codex',
      threadId: 'main',
      role: 'user',
      content: 'Let’s implement the offline SQLite cache for the mobile application.',
      createdAt: Date.now() - 1000 * 60 * 20,
    },
    {
      id: 'mc2',
      botId: 'bot_codex',
      threadId: 'main',
      role: 'assistant',
      content: '```typescript\nimport AsyncStorage from "@react-native-async-storage/async-storage";\n\nexport const cacheData = async (key: string, data: any) => {\n  await AsyncStorage.setItem(key, JSON.stringify(data));\n};\n```\n\nI have wired up persistence and storage hooks across all mobile tabs.',
      createdAt: Date.now() - 1000 * 60 * 18,
    }
  ],
  bot_grok: [
    {
      id: 'mg1',
      botId: 'bot_grok',
      threadId: 'main',
      role: 'user',
      content: 'Summarize latest arXiv papers on agentic loop efficiency.',
      createdAt: Date.now() - 1000 * 60 * 70,
    },
    {
      id: 'mg2',
      botId: 'bot_grok',
      threadId: 'main',
      role: 'assistant',
      content: 'Top findings indicate subagent memory isolation reduces token consumption by **38%** while maintaining 94% reasoning fidelity.',
      createdAt: Date.now() - 1000 * 60 * 68,
    }
  ]
};

export const INITIAL_MOCK_ROUTINES: Routine[] = [
  {
    id: 'r1',
    title: 'Nightly Workspace Backup & Git Sync',
    cron: '0 2 * * *',
    botId: 'bot_codex',
    enabled: true,
    lastRun: Date.now() - 1000 * 60 * 60 * 18,
    nextRun: Date.now() + 1000 * 60 * 60 * 6,
    status: 'success',
  },
  {
    id: 'r2',
    title: 'Hourly API Health & Token Budget Monitor',
    cron: '0 * * * *',
    botId: 'bot_scout',
    enabled: true,
    lastRun: Date.now() - 1000 * 60 * 40,
    nextRun: Date.now() + 1000 * 60 * 20,
    status: 'idle',
  },
  {
    id: 'r3',
    title: 'Morning AI News Briefing Digest',
    cron: '0 8 * * *',
    botId: 'bot_grok',
    enabled: false,
    status: 'idle',
  }
];
