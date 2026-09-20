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

export const StorageService = {
  // Secure Device Token storage
  saveDeviceToken: async (serverUrl: string, token: string): Promise<void> => {
    const key = `token_${encodeURIComponent(serverUrl)}`;
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, token);
    } else {
      await SecureStore.setItemAsync(key, token);
    }
  },

  getDeviceToken: async (serverUrl: string): Promise<string | null> => {
    const key = `token_${encodeURIComponent(serverUrl)}`;
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  deleteDeviceToken: async (serverUrl: string): Promise<void> => {
    const key = `token_${encodeURIComponent(serverUrl)}`;
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },

  // Server endpoints
  saveActiveServer: async (endpoint: ServerEndpoint): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SERVER, JSON.stringify(endpoint));
  },

  getActiveServer: async (): Promise<ServerEndpoint | null> => {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SERVER);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  saveServersList: async (endpoints: ServerEndpoint[]): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.SERVERS_LIST, JSON.stringify(endpoints));
  },

  getServersList: async (): Promise<ServerEndpoint[]> => {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SERVERS_LIST);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  // Standalone offline bots & messages caching
  saveOfflineBots: async (bots: Bot[]): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.STANDALONE_BOTS, JSON.stringify(bots));
  },

  getOfflineBots: async (): Promise<Bot[]> => {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STANDALONE_BOTS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveOfflineMessages: async (messages: Record<string, Message[]>): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.STANDALONE_MESSAGES, JSON.stringify(messages));
  },

  getOfflineMessages: async (): Promise<Record<string, Message[]>> => {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STANDALONE_MESSAGES);
    if (!data) return {};
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  },

  clearAll: async (): Promise<void> => {
    await AsyncStorage.clear();
  }
};
