import { beforeEach, describe, expect, it, vi } from "vitest";

// StorageService guards tokens behind SecureStore with an AsyncStorage
// fallback — the exact behavior of commit 88e9389a, previously untested.
// All three native deps are mocked so this runs in plain node (AGENTS.md:
// fixtures only, never live app state).

const env = vi.hoisted(() => ({
  os: "android",
  secureFailWrites: false,
  secureStore: new Map<string, string>(),
  asyncStore: new Map<string, string>(),
}));

vi.mock("react-native", () => ({
  Platform: {
    get OS() {
      return env.os;
    },
  },
}));

vi.mock("expo-secure-store", () => ({
  setItemAsync: async (key: string, value: string) => {
    if (env.secureFailWrites) throw new Error("keychain unavailable");
    env.secureStore.set(key, value);
  },
  getItemAsync: async (key: string) => env.secureStore.get(key) ?? null,
  deleteItemAsync: async (key: string) => {
    env.secureStore.delete(key);
  },
}));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    setItem: async (key: string, value: string) => {
      env.asyncStore.set(key, value);
    },
    getItem: async (key: string) => env.asyncStore.get(key) ?? null,
    removeItem: async (key: string) => {
      env.asyncStore.delete(key);
    },
    clear: async () => env.asyncStore.clear(),
  },
}));

const { StorageService } = await import("./storage");

const URL = "http://192.168.1.10:8787";
const KEY = `token_${encodeURIComponent(URL)}`;

beforeEach(() => {
  env.os = "android";
  env.secureFailWrites = false;
  env.secureStore.clear();
  env.asyncStore.clear();
});

describe("StorageService device tokens", () => {
  it("stores tokens in SecureStore on native and not in AsyncStorage", async () => {
    await StorageService.saveDeviceToken(URL, "tok-123");
    expect(env.secureStore.get(KEY)).toBe("tok-123");
    expect(env.asyncStore.has(KEY)).toBe(false);
  });

  it("falls back to AsyncStorage when a native SecureStore write throws", async () => {
    env.secureFailWrites = true;
    await StorageService.saveDeviceToken(URL, "tok-456");
    expect(env.asyncStore.get(KEY)).toBe("tok-456");
  });

  it("uses AsyncStorage directly on web", async () => {
    env.os = "web";
    await StorageService.saveDeviceToken(URL, "tok-web");
    expect(env.secureStore.size).toBe(0);
    expect(env.asyncStore.get(KEY)).toBe("tok-web");

    await expect(StorageService.getDeviceToken(URL)).resolves.toBe("tok-web");
  });

  it("reads SecureStore first but still finds AsyncStorage-only tokens", async () => {
    env.asyncStore.set(KEY, "legacy-token");
    await expect(StorageService.getDeviceToken(URL)).resolves.toBe("legacy-token");

    env.secureStore.set(KEY, "secure-token");
    await expect(StorageService.getDeviceToken(URL)).resolves.toBe("secure-token");
  });

  it("deletes from both stores", async () => {
    env.secureStore.set(KEY, "s");
    env.asyncStore.set(KEY, "a");
    await StorageService.deleteDeviceToken(URL);
    expect(env.secureStore.has(KEY)).toBe(false);
    expect(env.asyncStore.has(KEY)).toBe(false);
  });

  it("round-trips the active server and servers list through AsyncStorage", async () => {
    await StorageService.saveActiveServer({ url: URL, name: "Home" });
    await expect(StorageService.getActiveServer()).resolves.toMatchObject({ url: URL });

    await StorageService.saveServersList([{ url: URL, name: "Home", token: "t" }]);
    await expect(StorageService.getServersList()).resolves.toHaveLength(1);
  });
});
