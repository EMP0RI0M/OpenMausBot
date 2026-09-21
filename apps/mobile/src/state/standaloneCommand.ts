// Standalone (no paired server) input handling. The chat box doubles as a
// sandbox terminal here, so parsing is security-relevant: user text must never
// be interpolated into a shell command with naive quoting.

export type StandaloneIntent =
  | { kind: 'shell'; command: string }
  | { kind: 'prompt'; text: string };

/** `!cmd` (or a bare `agy`/shell line typed as a command) runs in the sandbox;
 * everything else is an agent prompt. */
export function parseStandaloneInput(text: string): StandaloneIntent {
  const trimmed = text.trim();
  if (trimmed.startsWith('!')) {
    return { kind: 'shell', command: trimmed.slice(1).trim() };
  }
  return { kind: 'prompt', text: trimmed };
}

/** POSIX single-quote escaping: safe for any byte except NUL. */
export function shellQuote(value: string): string {
  return `'${value.split("'").join(`'\\''`)}'`;
}

/** Build the exact command line handed to the sandbox runner. Prompts go
 * through `agy` as a single quoted argv, never string-interpolated. */
export function buildStandaloneInvocation(intent: StandaloneIntent): string {
  if (intent.kind === 'shell') return intent.command;
  return `agy -p ${shellQuote(intent.text)}`;
}
