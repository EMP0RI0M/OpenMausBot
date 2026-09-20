import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wifi, WifiOff, Settings, AlertCircle } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useOpenMaus } from '../context/OpenMausContext';
import { BotAvatar } from './BotAvatar';

interface HeaderProps {
  onOpenBots?: () => void;
  onOpenSettings?: () => void;
  onOpenPairing?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenBots, onOpenSettings, onOpenPairing }) => {
  const { activeBot, connectionStatus, attentionItemsCount } = useOpenMaus();

  const isConnected = connectionStatus === 'connected';

  return (
    <View style={styles.container}>
      {/* Bot Info & Switcher Button */}
      <TouchableOpacity style={styles.botSelector} onPress={onOpenBots} activeOpacity={0.7}>
        <BotAvatar
          name={activeBot?.name || 'Maus'}
          provider={activeBot?.provider}
          color={activeBot?.color}
          size={36}
          status={activeBot?.status}
        />
        <View style={styles.botTextWrap}>
          <View style={styles.nameRow}>
            <Text style={styles.botName} numberOfLines={1}>
              {activeBot?.name || 'OpenMausBot'}
            </Text>
          </View>
          <Text style={styles.botModel} numberOfLines={1}>
            {activeBot?.model || 'Autonomous Agent'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Right Controls: Attention indicator, Connection pill, Settings */}
      <View style={styles.rightGroup}>
        {attentionItemsCount > 0 && (
          <View style={styles.attentionBadge}>
            <AlertCircle size={14} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.attentionText}>{attentionItemsCount}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.statusPill} onPress={onOpenPairing} activeOpacity={0.7}>
          {isConnected ? (
            <Wifi size={14} color={Colors.accent} />
          ) : (
            <WifiOff size={14} color={connectionStatus === 'connecting' ? Colors.warning : Colors.textMuted} />
          )}
          <Text
            style={[
              styles.statusPillText,
              isConnected && { color: Colors.accent },
              connectionStatus === 'connecting' && { color: Colors.warning },
            ]}
          >
            {connectionStatus === 'connected' ? 'Synced' : connectionStatus === 'connecting' ? 'Syncing' : 'Offline'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={onOpenSettings} activeOpacity={0.7}>
          <Settings size={20} color={Colors.textSecondary} />
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  botSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  botTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botName: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  botModel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attentionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  attentionText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 5,
  },
  statusPillText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  iconBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
