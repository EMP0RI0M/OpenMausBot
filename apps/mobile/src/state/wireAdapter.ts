import type { Message, OptionCard, ToolActivity } from '../types/models';

// The paired server speaks a different wire contract than the mobile app's
// internal `Message` model. SSE frames are `{ kind: "message" | "message.patch",
// threadId, message }` where `message` is a `WireMessage` using `text` / `at` /
// `role: "bot"` / `tool` / `card` / `from.botId`. This module is the single
// place that translates that shape into the client model, so the rest of the
// app stays decoupled from server drift. It is intentionally pure and RN-free
// so it can be unit-tested against captured fixtures (never a live backend).

export interface RawTool {
  name?: string;
  ok?: boolean;
  spoken?: string;
  setup?: boolean;
  input?: string;
  output?: string;
}

export interface RawMessage {
  id?: string;
  role?: string;
  kind?: string;
  text?: string;
  content?: string;
  at?: number;
  createdAt?: number;
  from?: { botId?: string; name?: string; color?: string };
  tool?: RawTool;
  toolActivities?: ToolActivity[];
  card?: Partial<OptionCard> | Record<string, unknown>;
  optionCard?: OptionCard;
  secret?: unknown;
  secretRequest?: unknown;
}

let syntheticSeq = 0;
function syntheticId(prefix: string): string {
  syntheticSeq += 1;
  return `${prefix}_${Date.now()}_${syntheticSeq}`;
}

function mapRole(role: string | undefined): Message['role'] {
  if (role === 'user') return 'user';
  if (role === 'system') return 'system';
  return 'assistant'; // server emits "bot"
}

/** Translate one wire message into the client `Message` model. */
export function normalizeMessage(
  raw: RawMessage,
  ctx: { threadId?: string; fallbackBotId?: string } = {}
): Message {
  const createdAt = raw.at ?? raw.createdAt ?? Date.now();
  const botId = raw.from?.botId ?? ctx.fallbackBotId ?? ctx.threadId ?? 'main';

  const msg: Message = {
    id: raw.id ?? syntheticId('msg'),
    botId,
    threadId: ctx.threadId ?? 'main',
    role: mapRole(raw.role),
    content: raw.text ?? raw.content ?? '',
    createdAt,
  };

  const tools = normalizeTool(raw, createdAt);
  if (tools) msg.toolActivities = tools;

  const card = raw.card ?? raw.optionCard;
  if (card) msg.optionCard = card as OptionCard;

  const secret = raw.secret ?? raw.secretRequest;
  if (secret) msg.secretRequest = secret as Message['secretRequest'];

  return msg;
}

function normalizeTool(raw: RawMessage, timestamp: number): ToolActivity[] | undefined {
  if (Array.isArray(raw.toolActivities)) return raw.toolActivities;
  if (raw.tool && raw.tool.name) {
    const activity: ToolActivity = {
      name: raw.tool.name,
      ok: raw.tool.ok,
      spoken: raw.tool.spoken,
      timestamp,
      inputSnippet: raw.tool.input,
      outputSnippet: raw.tool.output,
    };
    return [activity];
  }
  return undefined;
}

/** Translate a server messages-list response into client messages. */
export function normalizeMessageList(raws: RawMessage[], ctx: { threadId?: string; fallbackBotId?: string } = {}): Message[] {
  return raws.map((raw) => normalizeMessage(raw, ctx));
}

/** Insert or update by id, preserving position; append only when new. */
export function upsertMessage(list: Message[], msg: Message): Message[] {
  const idx = list.findIndex((m) => m.id === msg.id);
  if (idx === -1) return [...list, msg];
  if (list[idx] === msg) return list;
  const next = list.slice();
  next[idx] = { ...list[idx], ...msg };
  return next;
}

/**
 * Reconcile a locally-held transcript with a freshly fetched server list.
 * Server rows win on shared fields, but local-only messages (optimistic user
 * sends and in-flight SSE frames the fetch raced ahead of) are preserved.
 * Result is ordered by createdAt so merged streams read chronologically.
 */
export function reconcileMessages(local: Message[], incoming: Message[]): Message[] {
  const byId = new Map<string, Message>();
  for (const m of local) byId.set(m.id, m);
  for (const m of incoming) {
    const prev = byId.get(m.id);
    byId.set(m.id, prev ? { ...prev, ...m } : m);
  }
  return [...byId.values()].sort((a, b) => a.createdAt - b.createdAt);
}
