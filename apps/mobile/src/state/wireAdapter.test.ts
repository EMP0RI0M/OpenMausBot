import { describe, expect, it } from "vitest";
import {
  normalizeMessage,
  reconcileMessages,
  upsertMessage,
  type RawMessage,
} from "./wireAdapter";
import type { Message } from "../types/models";

function msg(over: Partial<Message>): Message {
  return {
    id: over.id ?? "x",
    botId: over.botId ?? "b1",
    threadId: over.threadId ?? "t1",
    role: over.role ?? "assistant",
    content: over.content ?? "",
    createdAt: over.createdAt ?? 0,
  };
}

describe("normalizeMessage", () => {
  it("maps the wire shape (text/at/bot/tool/card) into the client model", () => {
    const raw: RawMessage = {
      id: "m1",
      role: "bot",
      kind: "text",
      text: "hello",
      at: 1_700_000_000_000,
      from: { botId: "antigravity", name: "Antigravity", color: "#000" },
      tool: { name: "bash", ok: true, output: "done", input: "ls" },
      card: { title: "Approve?", options: ["allow", "deny"], answered: "allow" },
    };

    const out = normalizeMessage(raw, { threadId: "t9" });

    expect(out).toMatchObject({
      id: "m1",
      botId: "antigravity",
      threadId: "t9",
      role: "assistant",
      content: "hello",
      createdAt: 1_700_000_000_000,
    });
    expect(out.toolActivities).toEqual([
      expect.objectContaining({ name: "bash", ok: true, outputSnippet: "done", inputSnippet: "ls" }),
    ]);
    expect(out.optionCard).toMatchObject({ title: "Approve?", answered: "allow" });
  });

  it("falls back to ctx.botId then a stable id, and keeps legacy content", () => {
    const out = normalizeMessage({ role: "user", content: "typed", createdAt: 5 }, { fallbackBotId: "b7" });
    expect(out.role).toBe("user");
    expect(out.botId).toBe("b7");
    expect(out.content).toBe("typed");
    expect(out.createdAt).toBe(5);
    expect(out.id).toMatch(/^msg_/);
  });
});

describe("upsertMessage", () => {
  it("appends new ids and updates existing ones in place (streaming)", () => {
    const list = [msg({ id: "a", content: "Hel" }), msg({ id: "b", content: "second" })];
    const appended = upsertMessage(list, msg({ id: "c", content: "third" }));
    expect(appended.map((m) => m.id)).toEqual(["a", "b", "c"]);

    const patched = upsertMessage(list, msg({ id: "a", content: "Hello!" }));
    expect(patched.map((m) => m.id)).toEqual(["a", "b"]); // no reorder, no dup
    expect(patched[0].content).toBe("Hello!");
  });
});

describe("reconcileMessages", () => {
  it("keeps local-only optimistic rows, lets server win shared fields, sorts by time", () => {
    const local = [
      msg({ id: "server_1", content: "stale", createdAt: 10 }),
      msg({ id: "user_opt_1", role: "user", content: "just sent", createdAt: 20 }),
    ];
    const incoming = [
      msg({ id: "server_0", content: "oldest", createdAt: 5 }),
      msg({ id: "server_1", content: "authoritative", createdAt: 10 }),
    ];

    const out = reconcileMessages(local, incoming);

    expect(out.map((m) => m.id)).toEqual(["server_0", "server_1", "user_opt_1"]);
    expect(out.find((m) => m.id === "server_1")!.content).toBe("authoritative");
    expect(out.some((m) => m.id === "user_opt_1")).toBe(true); // not lost to the fetch
  });
});
