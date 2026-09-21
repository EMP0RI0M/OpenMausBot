import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Settings, ChevronDown, Terminal } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useOpenMaus } from '../context/OpenMausContext';
import { BotAvatar } from './BotAvatar';
import { triggerHaptic } from '../services/haptics';

interface HeaderProps {
  onOpenBots?: () => void;
  onOpenSettings?: () => void;
  onOpenPairing?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenBots, onOpenSettings, onOpenPairing }) => {
  const insets = useSafeAreaInsets();
  const { activeBot, connectionStatus, attentionItemsCount, isGenerating } = useOpenMaus();
  const isConnected = connectionStatus === 'connected';

  const handleBotPress = () => {
    triggerHaptic.light();
    onOpenBots?.();
  };

  const handleSettingsPress = () => {
    triggerHaptic.light();
    onOpenSettings?.();
  };

  const handlePairingPress = () => {
    triggerHaptic.light();
    onOpenPairing?.();
  };

  const topOffset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 12) + 6;

  return (
    <View style={[styles.outerWrapper, { paddingTop: topOffset }]}>
      <View style={styles.floatingPillHeader}>
        {/* Active Agent Pill Selector */}
        <TouchableOpacity
          style={styles.agentPill}
          onPress={handleBotPress}
          activeOpacity={0.7}
        >
          <BotAvatar
            name={activeBot?.name || 'Agent'}
            provider={activeBot?.provider}
            color={activeBot?.color}
            size={28}
            status={activeBot?.status}
          />
          <View style={styles.agentInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.agentName} numberOfLines={1}>
                {activeBot?.name || 'Antigravity'}
              </Text>
              <ChevronDown size={12} color={Colors.textSecondary} style={{ marginLeft: 3 }} />
            </View>
            <Text style={styles.modelTag} numberOfLines={1}>
              {isGenerating ? 'Thinking…' : (activeBot?.model || 'Autonomous Agent')}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Right Controls */}
        <View style={styles.rightGroup}>
          {/* Status chip */}
          <TouchableOpacity
            style={styles.connectionChip}
            onPress={handlePairingPress}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isConnected ? Colors.accent : '#94A3B8' },
              ]}
            />
            <Text style={styles.statusText}>
              {isConnected ? 'Synced' : 'Local Sandbox'}
            </Text>
          </TouchableOpacity>

          {/* Attention badge if any */}
          {attentionItemsCount > 0 && (
            <TouchableOpacity
              style={styles.attentionPill}
              onPress={handleBotPress}
              activeOpacity={0.7}
            >
              <Text style={styles.attentionText}>{attentionItemsCount}</Text>
            </TouchableOpacity>
          )}

          {/* Settings button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleSettingsPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Settings size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    paddingHorizontal: 14,
    paddingBottom: 6,
    backgroundColor: 'transparent',
  },
  floatingPillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  agentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    maxWidth: '56%',
  },
  agentInfo: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentName: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  modelTag: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
    fontWeight: '500',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  attentionPill: {
    backgroundColor: Colors.warning,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
  },
});
