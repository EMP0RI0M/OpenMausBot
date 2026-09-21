import { describe, expect, it } from "vitest";
import {
  buildStandaloneInvocation,
  parseStandaloneInput,
  shellQuote,
} from "./standaloneCommand";

describe("parseStandaloneInput", () => {
  it("treats a leading ! as an explicit sandbox command", () => {
    expect(parseStandaloneInput("  ! ls -la  ")).toEqual({ kind: "shell", command: "ls -la" });
  });

  it("treats ordinary chat text as an agent prompt", () => {
    expect(parseStandaloneInput("summarize the logs")).toEqual({
      kind: "prompt",
      text: "summarize the logs",
    });
  });

  it("does not guess commands from word prefixes any more", () => {
    // The old heuristic ran any message starting with `ls`/`cat`/`agy` as a
    // shell command — that surface is gone.
    expect(parseStandaloneInput("ls my notes for me")).toEqual({
      kind: "prompt",
      text: "ls my notes for me",
    });
  });
});

describe("shellQuote", () => {
  it("wraps values so metacharacters are inert", () => {
    expect(shellQuote("hi; rm -rf / #")).toBe("'hi; rm -rf / #'");
  });

  it("survives embedded single quotes", () => {
    expect(shellQuote("it's")).toBe(`'it'\\''s'`);
  });
});

describe("buildStandaloneInvocation", () => {
  it("passes the prompt to agy as one quoted argv — injection stays inert", () => {
    const intent = parseStandaloneInput('x"; touch /pwned; echo "');
    expect(buildStandaloneInvocation(intent)).toBe(`agy -p 'x"; touch /pwned; echo "'`);
  });

  it("runs explicit shell commands verbatim (the user's own terminal line)", () => {
    const intent = parseStandaloneInput("!uname -a");
    expect(buildStandaloneInvocation(intent)).toBe("uname -a");
  });
});
