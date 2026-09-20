import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { ProrootEngineModule } = NativeModules;
const eventEmitter = ProrootEngineModule ? new NativeEventEmitter(ProrootEngineModule) : null;

export interface SandboxOutputEvent {
  stream: 'stdout' | 'stderr';
  data: string;
}

export const ProrootSandbox = {
  isAvailable: (): boolean => {
    return Platform.OS === 'android' && !!ProrootEngineModule;
  },

  runLinuxCommand: async (bashCommand: string): Promise<string> => {
    if (Platform.OS !== 'android' || !ProrootEngineModule) {
      // Simulation fallback on Web/iOS
      return new Promise((resolve) => {
        setTimeout(() => {
          if (bashCommand.includes('agy --version') || bashCommand.includes('antigravity')) {
            resolve('Google Antigravity CLI (agy) v2.0-standalone [arm64-linux-gnu]\nEngine: proroot (MIT)\nSandbox status: Ready\n');
          } else if (bashCommand.includes('uname') || bashCommand.includes('cat /etc/os-release')) {
            resolve('Linux ubuntu-sandbox 6.1.0 #1 SMP aarch64 GNU/Linux\nUbuntu 24.04 LTS (Noble Numbat)\n');
          } else {
            resolve(`[proroot simulated execution]: ${bashCommand}\nExit code: 0\n`);
          }
        }, 800);
      });
    }

    return await ProrootEngineModule.runLinuxCommand(bashCommand);
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
