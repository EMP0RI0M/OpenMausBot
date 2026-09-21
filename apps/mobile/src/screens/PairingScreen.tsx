import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QrCode, Link2, Shield, Server, Trash2, ArrowLeft, Check, Smartphone } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useOpenMaus } from '../context/OpenMausContext';
import { triggerHaptic } from '../services/haptics';

interface PairingScreenProps {
  onClose: () => void;
}

export const PairingScreen: React.FC<PairingScreenProps> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const {
    pairServer,
    connectDirect,
    activeServer,
    disconnectServer,
  } = useOpenMaus();

  const [mode, setMode] = useState<'manual' | 'direct'>('manual');
  const [serverUrl, setServerUrl] = useState('http://127.0.0.1:8810');
  const [pairCode, setPairCode] = useState('');
  const [directToken, setDirectToken] = useState('');
  const [isPairing, setIsPairing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const topOffset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 12) + 6;

  const handlePair = async () => {
    if (!serverUrl || !pairCode) {
      setErrorMessage('Please enter both server URL and 6-digit pair code.');
      return;
    }
    setErrorMessage('');
    setIsPairing(true);
    triggerHaptic.medium();
    try {
      await pairServer(serverUrl, pairCode, 'Desktop Maus');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Pairing failed. Check server address and pairing code.');
      triggerHaptic.error();
    } finally {
      setIsPairing(false);
    }
  };

  const handleConnectDirect = async () => {
    if (!serverUrl || !directToken) {
      setErrorMessage('Please enter server URL and bearer token.');
      return;
    }
    setErrorMessage('');
    setIsPairing(true);
    triggerHaptic.medium();
    try {
      await connectDirect(serverUrl, directToken, 'Custom Node');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection failed.');
      triggerHaptic.error();
    } finally {
      setIsPairing(false);
    }
  };

  const handleDisconnect = () => {
    triggerHaptic.warning();
    disconnectServer();
  };

  return (
    <View style={[styles.container, { paddingTop: topOffset }]}>
      {/* Header Pill */}
      <View style={styles.headerPill}>
        <TouchableOpacity style={styles.backPill} onPress={onClose} activeOpacity={0.7}>
          <ArrowLeft size={17} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pair & Sync Instances</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Connected Server Pill */}
        {activeServer ? (
          <View style={styles.activeServerCard}>
            <View style={styles.serverHeader}>
              <View style={styles.serverIconBadge}>
                <Server size={18} color={Colors.accent} />
              </View>
              <View style={styles.serverDetails}>
                <Text style={styles.serverName}>{activeServer.name || 'Connected Desktop'}</Text>
                <Text style={styles.serverUrl}>{activeServer.url}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.disconnectPill}
              onPress={handleDisconnect}
              activeOpacity={0.8}
            >
              <Trash2 size={14} color={Colors.error} style={{ marginRight: 6 }} />
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.standalonePill}>
            <Smartphone size={18} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.standaloneText}>
              Currently in Standalone On-Device Mode (Zero-Root Linux)
            </Text>
          </View>
        )}

        {/* Mode Selector Tabs */}
        <View style={styles.modeTabsRow}>
          <TouchableOpacity
            style={[styles.modeTabPill, mode === 'manual' && styles.modeTabPillActive]}
            onPress={() => setMode('manual')}
          >
            <Text style={[styles.modeTabText, mode === 'manual' && styles.modeTabTextActive]}>
              6-Digit Code
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTabPill, mode === 'direct' && styles.modeTabPillActive]}
            onPress={() => setMode('direct')}
          >
            <Text style={[styles.modeTabText, mode === 'direct' && styles.modeTabTextActive]}>
              Token / Direct URL
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.label}>Companion Server Address</Text>
          <TextInput
            style={styles.input}
            placeholder="http://192.168.1.50:8810"
            placeholderTextColor="#94A3B8"
            value={serverUrl}
            onChangeText={setServerUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {mode === 'manual' ? (
            <>
              <Text style={styles.label}>6-Digit Pair Code</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="123456"
                placeholderTextColor="#94A3B8"
                value={pairCode}
                onChangeText={setPairCode}
                maxLength={6}
                keyboardType="number-pad"
              />
              <Text style={styles.helpText}>
                Run `openmausbot pair` on your computer or scan the QR code in settings.
              </Text>

              <TouchableOpacity
                style={[styles.pairPill, isPairing && styles.pairPillDisabled]}
                onPress={handlePair}
                disabled={isPairing}
                activeOpacity={0.8}
              >
                {isPairing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.pairPillText}>Pair with Companion</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Bearer / Session Token</Text>
              <TextInput
                style={styles.input}
                placeholder="Paste API or tunnel token"
                placeholderTextColor="#94A3B8"
                value={directToken}
                onChangeText={setDirectToken}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.pairPill, isPairing && styles.pairPillDisabled]}
                onPress={handleConnectDirect}
                disabled={isPairing}
                activeOpacity={0.8}
              >
                {isPairing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.pairPillText}>Connect Direct</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
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
  activeServerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomColor: 'rgba(15, 23, 42, 0.08)',
    borderLeftColor: 'rgba(255, 255, 255, 0.80)',
    borderRightColor: 'rgba(255, 255, 255, 0.80)',
  },
  serverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  serverIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  serverDetails: {
    flex: 1,
  },
  serverName: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  serverUrl: {
    color: '#64748B',
    fontSize: 12,
  },
  disconnectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderRadius: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.20)',
  },
  disconnectText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '700',
  },
  standalonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  standaloneText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  modeTabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.60)',
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    gap: 4,
  },
  modeTabPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabPillActive: {
    backgroundColor: Colors.primary,
  },
  modeTabText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomColor: 'rgba(15, 23, 42, 0.08)',
    borderLeftColor: 'rgba(255, 255, 255, 0.80)',
    borderRightColor: 'rgba(255, 255, 255, 0.80)',
    gap: 8,
  },
  label: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#000000',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  codeInput: {
    letterSpacing: 6,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  helpText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
  },
  pairPill: {
    backgroundColor: Colors.primary,
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  pairPillDisabled: {
    opacity: 0.5,
  },
  pairPillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
