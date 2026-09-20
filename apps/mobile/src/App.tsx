import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MessageSquare, Users, Terminal, QrCode, Settings as SettingsIcon } from 'lucide-react-native';
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
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

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

        {/* Bottom Tab Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'chat' && styles.tabItemActive]}
            onPress={() => handleTabPress('chat')}
            activeOpacity={0.7}
          >
            <View style={styles.tabIconWrap}>
              <MessageSquare
                size={20}
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
                size={20}
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
                size={20}
                color={activeTab === 'console' ? Colors.primary : Colors.textMuted}
              />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'console' && styles.tabLabelActive]}>
              Sandbox
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'pairing' && styles.tabItemActive]}
            onPress={() => handleTabPress('pairing')}
            activeOpacity={0.7}
          >
            <View style={styles.tabIconWrap}>
              <QrCode
                size={20}
                color={activeTab === 'pairing' ? Colors.primary : Colors.textMuted}
              />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'pairing' && styles.tabLabelActive]}>
              Pair
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]}
            onPress={() => handleTabPress('settings')}
            activeOpacity={0.7}
          >
            <View style={styles.tabIconWrap}>
              <SettingsIcon
                size={20}
                color={activeTab === 'settings' ? Colors.primary : Colors.textMuted}
              />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>
              Settings
            </Text>
          </TouchableOpacity>
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
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenContainer: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabItemActive: {},
  tabIconWrap: {
    position: 'relative',
  },
  tabLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 3,
  },
  tabLabelActive: {
    color: Colors.primary,
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.warning,
  },
});
