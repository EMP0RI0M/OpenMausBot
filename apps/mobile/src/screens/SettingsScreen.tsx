import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Server,
  Volume2,
  Trash2,
  Activity,
  ArrowLeft,
  Smartphone,
  Clock,
} from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useOpenMaus } from '../context/OpenMausContext';
import { StorageService } from '../services/storage';
import { triggerHaptic } from '../services/haptics';

interface SettingsScreenProps {
  onClose: () => void;
  onOpenPairing: () => void;
  onOpenRoutines?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose, onOpenPairing, onOpenRoutines }) => {
  const insets = useSafeAreaInsets();
  const {
    activeServer,
  } = useOpenMaus();

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const topOffset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 12) + 6;

  const handleTestLatency = async () => {
    if (!activeServer?.url) {
      Alert.alert('Standalone Sandbox', 'Running fully on-device via native proroot Linux sandbox.');
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
      'This will reset local cached messages and preferences.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearAll();
            triggerHaptic.success();
            Alert.alert('Cleared', 'Cache cleared successfully.');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topOffset }]}>
      {/* Header Pill */}
      <View style={styles.headerPill}>
        <TouchableOpacity style={styles.backPill} onPress={onClose} activeOpacity={0.7}>
          <ArrowLeft size={17} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings & Engine</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Environment & Mode Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Runtime Engine</Text>
          <View style={styles.row}>
            <View style={styles.rowIconBadge}>
              <Smartphone size={18} color={Colors.primary} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Linux Sandbox</Text>
              <Text style={styles.rowSubtitle}>Embedded arm64-v8a proroot (Zero-Root)</Text>
            </View>
            <View style={styles.statusPillActive}>
              <Text style={styles.statusPillText}>Ready</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={onOpenPairing}
            activeOpacity={0.7}
          >
            <View style={styles.rowIconBadge}>
              <Server size={18} color={Colors.secondary} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Remote Companion Sync</Text>
              <Text style={styles.rowSubtitle}>
                {activeServer ? activeServer.url : 'Not connected (Standalone mode)'}
              </Text>
            </View>
          </TouchableOpacity>

          {onOpenRoutines && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.actionRow}
                onPress={onOpenRoutines}
                activeOpacity={0.7}
              >
                <View style={styles.rowIconBadge}>
                  <Clock size={18} color={Colors.accent} />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowTitle}>Routines & Automations</Text>
                  <Text style={styles.rowSubtitle}>Scheduled recurring agent tasks</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Preferences Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.row}>
            <View style={styles.rowIconBadge}>
              <Volume2 size={18} color={Colors.primary} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Speech Synthesis (TTS)</Text>
              <Text style={styles.rowSubtitle}>Read assistant answers out loud</Text>
            </View>
            <Switch
              value={voiceEnabled}
              onValueChange={setVoiceEnabled}
              trackColor={{ false: '#E2E8F0', true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowIconBadge}>
              <Activity size={18} color={Colors.accent} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Haptic Feedback</Text>
              <Text style={styles.rowSubtitle}>Vibrate on actions and approvals</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: '#E2E8F0', true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Diagnostic & Storage Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Maintenance</Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleTestLatency}
            activeOpacity={0.7}
          >
            <View style={styles.rowIconBadge}>
              <Activity size={18} color={Colors.warning} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Diagnostics Ping</Text>
              <Text style={styles.rowSubtitle}>
                {isPinging
                  ? 'Testing connection…'
                  : pingLatency !== null
                  ? `${pingLatency}ms latency`
                  : 'Test latency to node'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleClearCache}
            activeOpacity={0.7}
          >
            <View style={[styles.rowIconBadge, { backgroundColor: 'rgba(220, 38, 38, 0.10)' }]}>
              <Trash2 size={18} color={Colors.error} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={[styles.rowTitle, { color: Colors.error }]}>Clear Local Cache</Text>
              <Text style={styles.rowSubtitle}>Reset cached conversation messages</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomColor: 'rgba(15, 23, 42, 0.08)',
    borderLeftColor: 'rgba(255, 255, 255, 0.80)',
    borderRightColor: 'rgba(255, 255, 255, 0.80)',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 12,
  },
  backPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  headerTitle: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomColor: 'rgba(15, 23, 42, 0.08)',
    borderLeftColor: 'rgba(255, 255, 255, 0.80)',
    borderRightColor: 'rgba(255, 255, 255, 0.80)',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  rowSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 1,
  },
  statusPillActive: {
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusPillText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
    marginVertical: 12,
  },
});
