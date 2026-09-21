import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OpenMausApiClient } from "./api";

// The mobile SSE client previously opened one stream and gave up forever on any
// drop — fatal on phones where backgrounding/cellular handoff kill connections
// constantly. These tests pin the reconnect contract without a real server.

function encode(sse: string): Uint8Array {
  return new TextEncoder().encode(sse);
}

// A body whose reader emits `chunks` then signals a dropped connection.
function droppingBody(chunks: Uint8Array[]) {
  let i = 0;
  return {
    getReader: () => ({
      read: async () => {
        if (i < chunks.length) return { done: false, value: chunks[i++] };
        const err = new Error("stream dropped");
        throw err;
      },
    }),
  };
}

// A body that yields nothing and never resolves — keeps the loop parked.
function hangingBody() {
  return {
    getReader: () => ({
      read: () => new Promise(() => {}),
    }),
  };
}

function okResponse(body: unknown) {
  return { ok: true, status: 200, body };
}

describe("OpenMausApiClient.subscribeToEvents — auto-reconnect", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0); // deterministic backoff
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("reconnects after a dropped stream and keeps delivering events", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okResponse(droppingBody([encode('data: {"type":"status_change","botId":"b1","status":"working"}\n\n')])))
      .mockResolvedValueOnce(okResponse(hangingBody()));
    vi.stubGlobal("fetch", fetchMock);

    const client = new OpenMausApiClient("http://test.local", "tok");
    const events: unknown[] = [];
    client.subscribeToEvents((e) => events.push(e));

    // First connection delivers its event, then drops.
    await vi.advanceTimersByTimeAsync(0);
    expect(events).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Backoff base (1s) elapses -> reconnect opens a second stream.
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("grows the backoff exponentially while no data flows", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(droppingBody([])));
    vi.stubGlobal("fetch", fetchMock);

    const client = new OpenMausApiClient("http://test.local", "tok");
    client.subscribeToEvents(() => {});

    await vi.advanceTimersByTimeAsync(0); // initial connect + immediate drop
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000); // attempt 0 -> 1s
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(2000); // attempt 1 -> 2s
    expect(fetchMock).toHaveBeenCalledTimes(3);

    await vi.advanceTimersByTimeAsync(1000); // must NOT have fired the 4s step early
    expect(fetchMock).toHaveBeenCalledTimes(3);

    await vi.advanceTimersByTimeAsync(3000); // total >= 4s -> attempt 2
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("stops reconnecting once the subscription is disposed", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(droppingBody([])));
    vi.stubGlobal("fetch", fetchMock);

    const client = new OpenMausApiClient("http://test.local", "tok");
    const dispose = client.subscribeToEvents(() => {});

    dispose();

    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1); // only the initial connect, never rescheduled
  });
});
