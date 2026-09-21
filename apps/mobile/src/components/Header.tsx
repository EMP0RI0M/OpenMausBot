import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Settings, ChevronDown } from 'lucide-react-native';
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

  return (
    <View style={styles.container}>
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
            <ChevronDown size={12} color={Colors.textMuted} style={{ marginLeft: 3 }} />
          </View>
          <Text style={styles.modelTag} numberOfLines={1}>
            {isGenerating ? 'Thinking…' : (activeBot?.model || 'Autonomous Linux Agent')}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Right Controls */}
      <View style={styles.rightGroup}>
        {/* Status pill */}
        <TouchableOpacity
          style={styles.connectionPill}
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
          <Settings size={17} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.06)',
  },
  agentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    maxWidth: '58%',
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
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
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
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
});
