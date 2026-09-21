import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MessageSquare, Users, Terminal } from 'lucide-react-native';
import { Colors } from './theme/colors';
import { OpenMausProvider, useOpenMaus } from './context/OpenMausContext';
import { ChatScreen } from './screens/ChatScreen';
import { BotsScreen } from './screens/BotsScreen';
import { StandaloneConsoleScreen } from './screens/StandaloneConsoleScreen';
import { PairingScreen } from './screens/PairingScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { triggerHaptic } from './services/haptics';

type Tab = 'chat' | 'bots' | 'console' | 'pairing' | 'settings';

const MainNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const { attentionItemsCount, bots } = useOpenMaus();

  const handleTabPress = (tab: Tab) => {
    triggerHaptic.light();
    setActiveTab(tab);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View style={styles.container}>
        {/* Main View Area */}
        <View style={styles.screenContainer}>
          {activeTab === 'chat' && (
            <ChatScreen
              onOpenBots={() => setActiveTab('bots')}
              onOpenSettings={() => setActiveTab('settings')}
              onOpenPairing={() => setActiveTab('pairing')}
            />
          )}

          {activeTab === 'bots' && (
            <BotsScreen onClose={() => setActiveTab('chat')} />
          )}

          {activeTab === 'console' && (
            <StandaloneConsoleScreen onClose={() => setActiveTab('chat')} />
          )}

          {activeTab === 'pairing' && (
            <PairingScreen onClose={() => setActiveTab('chat')} />
          )}

          {activeTab === 'settings' && (
            <SettingsScreen
              onClose={() => setActiveTab('chat')}
              onOpenPairing={() => setActiveTab('pairing')}
            />
          )}
        </View>

        {/* Floating Light Glass Pill Bottom Navigation */}
        <View style={styles.bottomBarContainer}>
          <View style={styles.bottomBarPill}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'chat' && styles.tabItemActive]}
              onPress={() => handleTabPress('chat')}
              activeOpacity={0.7}
            >
              <View style={styles.tabIconWrap}>
                <MessageSquare
                  size={18}
                  color={activeTab === 'chat' ? Colors.primary : Colors.textMuted}
                />
                {attentionItemsCount > 0 && (
                  <View style={styles.badgeDot} />
                )}
              </View>
              <Text style={[styles.tabLabel, activeTab === 'chat' && styles.tabLabelActive]}>
                Chat
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'bots' && styles.tabItemActive]}
              onPress={() => handleTabPress('bots')}
              activeOpacity={0.7}
            >
              <View style={styles.tabIconWrap}>
                <Users
                  size={18}
                  color={activeTab === 'bots' ? Colors.primary : Colors.textMuted}
                />
              </View>
              <Text style={[styles.tabLabel, activeTab === 'bots' && styles.tabLabelActive]}>
                Fleet ({bots.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'console' && styles.tabItemActive]}
              onPress={() => handleTabPress('console')}
              activeOpacity={0.7}
            >
              <View style={styles.tabIconWrap}>
                <Terminal
                  size={18}
                  color={activeTab === 'console' ? Colors.primary : Colors.textMuted}
                />
              </View>
              <Text style={[styles.tabLabel, activeTab === 'console' && styles.tabLabelActive]}>
                Sandbox
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <OpenMausProvider>
        <MainNavigator />
      </OpenMausProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenContainer: {
    flex: 1,
  },
  bottomBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 14 : 10,
    paddingTop: 4,
    backgroundColor: 'transparent',
  },
  bottomBarPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 30,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
    borderRadius: 20,
  },
  tabItemActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  tabIconWrap: {
    position: 'relative',
  },
  tabLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.warning,
  },
});
