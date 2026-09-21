import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Settings, Sparkles, Terminal, ChevronDown } from 'lucide-react-native';
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
            <ChevronDown size={12} color={Colors.textMuted} style={{ marginLeft: 2 }} />
          </View>
          <Text style={styles.modelTag} numberOfLines={1}>
            {isGenerating ? 'Generating response…' : (activeBot?.model || 'Autonomous Linux Agent')}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Right Minimal Controls */}
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
              { backgroundColor: isConnected ? Colors.accent : '#64748b' },
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
          <Settings size={18} color={Colors.textSecondary} />
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
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  agentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
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
    fontWeight: '600',
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
  connectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    fontWeight: '500',
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
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
});
