export interface Bot {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
  provider?: 'claude' | 'codex' | 'grok' | 'openai' | 'ollama' | 'custom';
  model?: string;
  systemPrompt?: string;
  status?: 'idle' | 'working' | 'waiting' | 'error';
  lastActive?: number;
  unreadCount?: number;
  hasPendingAction?: boolean;
  currentActivity?: string;
}

export interface Thread {
  id: string;
  botId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount?: number;
}

export interface AskQuestion {
  id: string;
  question: string;
  options: string[];
  isMultiSelect?: boolean;
}

export interface QuestionRequestCardData {
  requestId: string;
  questions: AskQuestion[];
}

export interface SkillRequestCardData {
  version: number;
  requestId: string;
  botId: string;
  threadId: string;
  stagedId: string;
  action: string;
  name: string;
  gist: string;
  source?: string;
  preview?: string;
  sha256?: string;
  warnings: string[];
  createdAt: number;
}

export interface SecretRequestCardData {
  target?: string;
  label?: string;
  description?: string;
  placeholder?: string;
  helpUrl?: string;
  requestKey?: string;
  provided?: boolean;
  dismissed?: boolean;
  resumed?: boolean;
  error?: string;
}

export interface ToolActivity {
  name: string;
  ok?: boolean;
  spoken?: string;
  setup?: boolean;
  timestamp?: number;
  inputSnippet?: string;
  outputSnippet?: string;
}

export interface OptionCard {
  title: string;
  subtitle: string;
  options: string[];
  answered?: string;
  dismissed?: boolean;
  requestId?: string;
  tool?: string;
  held?: string;
  allowKey?: string;
  skillRequest?: SkillRequestCardData;
  questionRequest?: QuestionRequestCardData;
  answeredText?: string;
}

export interface Message {
  id: string;
  botId: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  isStreaming?: boolean;
  toolActivities?: ToolActivity[];
  optionCard?: OptionCard;
  secretRequest?: SecretRequestCardData;
  attachments?: {
    name: string;
    type: string;
    size?: number;
    url?: string;
  }[];
}

export interface Routine {
  id: string;
  title: string;
  cron: string;
  botId: string;
  enabled: boolean;
  lastRun?: number;
  nextRun?: number;
  status?: 'idle' | 'running' | 'failed' | 'success';
}

export interface ServerEndpoint {
  url: string;
  name: string;
  token?: string;
  isTailscale?: boolean;
  isHostedHttps?: boolean;
  lastConnected?: number;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'standalone';
