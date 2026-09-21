import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ServerEndpoint, Bot, Message } from '../types/models';

const STORAGE_KEYS = {
  ACTIVE_SERVER: 'omb_active_server',
  SERVERS_LIST: 'omb_saved_servers',
  STANDALONE_BOTS: 'omb_standalone_bots',
  STANDALONE_MESSAGES: 'omb_standalone_messages',
  PREFERENCES: 'omb_user_preferences',
};

const isSecureStoreAvailable = (): boolean => {
  return (
    Platform.OS !== 'web' &&
    typeof SecureStore !== 'undefined' &&
    SecureStore !== null &&
    typeof SecureStore.setItemAsync === 'function' &&
    typeof SecureStore.getItemAsync === 'function'
  );
};

export const StorageService = {
  // Secure Device Token storage with reliable AsyncStorage fallback
  saveDeviceToken: async (serverUrl: string, token: string): Promise<void> => {
    const key = `token_${encodeURIComponent(serverUrl)}`;
    try {
      if (isSecureStoreAvailable()) {
        await SecureStore.setItemAsync(key, token);
        return;
      }
    } catch {
      // Fallback to AsyncStorage on any native SecureStore failure
    }
    try {
      await AsyncStorage.setItem(key, token);
    } catch (e) {
      console.warn('StorageService.saveDeviceToken error:', e);
    }
  },

  getDeviceToken: async (serverUrl: string): Promise<string | null> => {
    const key = `token_${encodeURIComponent(serverUrl)}`;
    try {
      if (isSecureStoreAvailable()) {
        const val = await SecureStore.getItemAsync(key);
        if (val) return val;
      }
    } catch {
      // Fallback to AsyncStorage
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn('StorageService.getDeviceToken error:', e);
      return null;
    }
  },

  deleteDeviceToken: async (serverUrl: string): Promise<void> => {
    const key = `token_${encodeURIComponent(serverUrl)}`;
    try {
      if (isSecureStoreAvailable() && typeof SecureStore.deleteItemAsync === 'function') {
        await SecureStore.deleteItemAsync(key);
      }
    } catch {
      // ignore
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('StorageService.deleteDeviceToken error:', e);
    }
  },

  // Server endpoints
  saveActiveServer: async (endpoint: ServerEndpoint): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SERVER, JSON.stringify(endpoint));
    } catch (e) {
      console.warn('StorageService.saveActiveServer error:', e);
    }
  },

  getActiveServer: async (): Promise<ServerEndpoint | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SERVER);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  saveServersList: async (endpoints: ServerEndpoint[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SERVERS_LIST, JSON.stringify(endpoints));
    } catch (e) {
      console.warn('StorageService.saveServersList error:', e);
    }
  },

  getServersList: async (): Promise<ServerEndpoint[]> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SERVERS_LIST);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  // Standalone offline bots & messages caching
  saveOfflineBots: async (bots: Bot[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STANDALONE_BOTS, JSON.stringify(bots));
    } catch (e) {
      console.warn('StorageService.saveOfflineBots error:', e);
    }
  },

  getOfflineBots: async (): Promise<Bot[]> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STANDALONE_BOTS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveOfflineMessages: async (messages: Record<string, Message[]>): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STANDALONE_MESSAGES, JSON.stringify(messages));
    } catch (e) {
      console.warn('StorageService.saveOfflineMessages error:', e);
    }
  },

  getOfflineMessages: async (): Promise<Record<string, Message[]>> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STANDALONE_MESSAGES);
      if (!data) return {};
      return JSON.parse(data);
    } catch {
      return {};
    }
  },

  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.warn('StorageService.clearAll error:', e);
    }
  }
};
