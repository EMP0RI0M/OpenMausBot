import { NativeModules, Platform } from 'react-native';

const { GoogleAuthBridgeModule } = NativeModules;

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export const AuthHandler = {
  injectCredentials: async (tokens: AuthTokens): Promise<boolean> => {
    if (Platform.OS === 'android' && GoogleAuthBridgeModule) {
      try {
        await GoogleAuthBridgeModule.injectAntigravityCredentials(
          tokens.accessToken,
          tokens.refreshToken || ''
        );
        return true;
      } catch (e) {
        console.warn('Failed to inject credentials:', e);
        return false;
      }
    }
    return true;
  },
};
