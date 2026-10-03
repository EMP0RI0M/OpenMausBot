import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { ProrootEngineModule } = NativeModules;
let eventEmitter: NativeEventEmitter | null = null;
try {
  if (Platform.OS === 'android' && ProrootEngineModule) {
    eventEmitter = new NativeEventEmitter(ProrootEngineModule);
  }
} catch {
  eventEmitter = null;
}

export interface SandboxOutputEvent {
  stream: 'stdout' | 'stderr';
  data: string;
}

export interface SandboxEnvironmentStatus {
  hasProroot: boolean;
  hasProot: boolean;
  isRootfsExtracted: boolean;
  rootfsPath: string;
  nativeLibDir: string;
  isDeviceBridgeRunning?: boolean;
}

// The "sandbox" is not simulated inside the app any more: it is the user's real
// Ubuntu (Termux/PRoot) box, reached through exec_bridge.py (`POST /exec`).
// This is what makes "the app controls the agents/box" actually true. Default
// base is loopback because the phone IS the host (Termux/PRoot); 127.0.0.1 is
// stable across WiFi drop/roam, unlike a LAN IP (e.g. 10.108.123.51) that goes stale.
const DEFAULT_EXEC_BASE = 'http://127.0.0.1:8770';
let execBase = DEFAULT_EXEC_BASE;
let execToken = '';

export function setExecTarget(base: string, token?: string): void {
  if (base) execBase = base.replace(/\/+$/, '');
  if (typeof token === 'string') execToken = token;
}

export function getExecTarget(): string {
  return execBase;
}

async function execOverBridge(bashCommand: string, timeoutSec = 30): Promise<string> {
  const res = await fetch(`${execBase}/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(execToken ? { 'X-Exec-Token': execToken } : {}),
    },
    body: JSON.stringify({ cmd: bashCommand, timeout: timeoutSec, token: execToken || undefined }),
  });
  if (!res.ok) {
    throw new Error(`exec bridge HTTP ${res.status}`);
  }
  const data = await res.json();
  const out = typeof data?.output === 'string' ? data.output : '';
  if (data?.ok) return out;
  return `${out}\n[exit ${data?.exit ?? 'error'}]`.replace(/^\n/, '');
}

export const ProrootSandbox = {
  isAvailable: (): boolean => {
    // A real command bridge is available on every platform (it is network, not
    // a native module), so the console always has a backend to talk to.
    return true;
  },

  getEnvironmentStatus: async (): Promise<SandboxEnvironmentStatus> => {
    let bridgeRunning = false;
    try {
      const res = await fetch(`${execBase}/health`, { method: 'GET' });
      bridgeRunning = res.ok;
    } catch {
      bridgeRunning = false;
    }
    return {
      hasProroot: true,
      hasProot: true,
      isRootfsExtracted: true,
      rootfsPath: '/root (Ubuntu host via exec bridge)',
      nativeLibDir: 'n/a',
      isDeviceBridgeRunning: bridgeRunning,
    };
  },

  startHarnessService: async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !ProrootEngineModule?.startHarnessService) {
      return true;
    }
    return await ProrootEngineModule.startHarnessService();
  },

  stopHarnessService: async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !ProrootEngineModule?.stopHarnessService) {
      return true;
    }
    return await ProrootEngineModule.stopHarnessService();
  },

  runLinuxCommand: async (bashCommand: string): Promise<string> => {
    // Prefer the real Ubuntu host bridge. If it is unreachable, fall back to a
    // native engine if one is ever wired, then to an honest offline message —
    // never a fabricated result.
    try {
      return await execOverBridge(bashCommand);
    } catch (bridgeErr: any) {
      if (Platform.OS === 'android' && ProrootEngineModule?.runLinuxCommand) {
        try {
          return await ProrootEngineModule.runLinuxCommand(bashCommand);
        } catch {
          /* fall through to bridge error text */
        }
      }
      return (
        `[command bridge offline] could not reach ${execBase} (${bridgeErr?.message ?? bridgeErr}).\n` +
        'Start it on the phone host with:  python3 /root/exec_bridge.py'
      );
    }
  },

  subscribeToStream: (onData: (event: SandboxOutputEvent) => void): (() => void) => {
    if (!eventEmitter) {
      return () => {};
    }
    const subscription = eventEmitter.addListener('onProrootOutput', onData);
    return () => {
      subscription.remove();
    };
  },
};
