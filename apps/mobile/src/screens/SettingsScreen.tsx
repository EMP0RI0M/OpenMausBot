import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import {
  Settings,
  Server,
  Volume2,
  Trash2,
  Activity,
  Shield,
  ArrowLeft,
  Smartphone,
  ExternalLink,
  Info,
} from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useOpenMaus } from '../context/OpenMausContext';
import { StorageService } from '../services/storage';
import { triggerHaptic } from '../services/haptics';

interface SettingsScreenProps {
  onClose: () => void;
  onOpenPairing: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose, onOpenPairing }) => {
  const {
    connectionStatus,
    activeServer,
    disconnectServer,
  } = useOpenMaus();

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const handleTestLatency = async () => {
    if (!activeServer?.url) {
      Alert.alert('Standalone Mode', 'Connect to a desktop companion instance to measure ping latency.');
      return;
    }
    setIsPinging(true);
    triggerHaptic.light();
    const start = Date.now();
    try {
      await fetch(`${activeServer.url}/api/config`, { method: 'GET' });
      const elapsed = Date.now() - start;
      setPingLatency(elapsed);
      triggerHaptic.success();
    } catch {
      setPingLatency(-1);
      triggerHaptic.error();
    } finally {
      setIsPinging(false);
    }
  };

  const handleClearCache = async () => {
    triggerHaptic.warning();
    Alert.alert(
      'Clear Cache',
      'This will reset local cached messages and saved preferences.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearAll();
            triggerHaptic.success();
            Alert.alert('Cache Cleared', 'Local offline data reset.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings & Companion</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Connection Status Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network & Node</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Server size={18} color={Colors.primary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.rowTitle}>Server Link</Text>
                  <Text style={styles.rowSubtitle}>
                    {activeServer?.url || 'Standalone Demo Mode'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.chipBtn} onPress={onOpenPairing}>
                <Text style={styles.chipBtnText}>
                  {activeServer ? 'Switch' : 'Pair'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Activity size={18} color={Colors.accent} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.rowTitle}>Round-Trip Latency</Text>
                  <Text style={styles.rowSubtitle}>
                    {pingLatency === null
                      ? 'Not measured'
                      : pingLatency === -1
                      ? 'Unreachable'
                      : `${pingLatency} ms`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.chipBtn}
                onPress={handleTestLatency}
                disabled={isPinging}
              >
                <Text style={styles.chipBtnText}>{isPinging ? 'Pinging...' : 'Ping'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Interaction Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Volume2 size={18} color={Colors.secondary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.rowTitle}>Voice Synthesis</Text>
                  <Text style={styles.rowSubtitle}>Read out bot answers on tap</Text>
                </View>
              </View>
              <Switch
                value={voiceEnabled}
                onValueChange={setVoiceEnabled}
                trackColor={{ false: Colors.surfaceBorder, true: Colors.primary }}
                thumbColor={voiceEnabled ? '#000' : '#888'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Smartphone size={18} color={Colors.accent} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.rowTitle}>Haptic Feedback</Text>
                  <Text style={styles.rowSubtitle}>Tactile clicks for actions & approvals</Text>
                </View>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
                trackColor={{ false: Colors.surfaceBorder, true: Colors.primary }}
                thumbColor={hapticsEnabled ? '#000' : '#888'}
              />
            </View>
          </View>
        </View>

        {/* Security & Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security & Cache</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.dangerRow} onPress={handleClearCache}>
              <Trash2 size={18} color={Colors.error} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: Colors.error }]}>Clear Local Data Cache</Text>
                <Text style={styles.rowSubtitle}>Purge offline transcript history</Text>
              </View>
            </TouchableOpacity>

            {activeServer && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.dangerRow} onPress={disconnectServer}>
                  <Shield size={18} color={Colors.warning} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: Colors.warning }]}>Unpair Current Device</Text>
                    <Text style={styles.rowSubtitle}>Revoke local token & return to standalone</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* About Info */}
        <View style={styles.aboutBox}>
          <Info size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
          <Text style={styles.aboutText}>
            OpenMausBot Mobile • Built with React Native & Expo • Local-First Multi-Agent Engine
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    padding: 6,
  },
  title: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  rowTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginVertical: 12,
  },
  chipBtn: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  aboutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  aboutText: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    flex: 1,
  },
});
