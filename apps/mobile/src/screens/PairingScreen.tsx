import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { QrCode, Link2, Shield, Check, Server, Trash2, ArrowLeft } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useOpenMaus } from '../context/OpenMausContext';
import { triggerHaptic } from '../services/haptics';

const Camera = CameraView as unknown as React.ComponentType<any>;

interface PairingScreenProps {
  onClose: () => void;
}

export const PairingScreen: React.FC<PairingScreenProps> = ({ onClose }) => {
  const {
    pairServer,
    connectDirect,
    connectionStatus,
    activeServer,
    savedServers,
    disconnectServer,
  } = useOpenMaus();

  const [mode, setMode] = useState<'scan' | 'manual' | 'direct'>('manual');
  const [serverUrl, setServerUrl] = useState('http://127.0.0.1:8810');
  const [pairCode, setPairCode] = useState('');
  const [directToken, setDirectToken] = useState('');
  const [serverName, setServerName] = useState('');
  const [isPairing, setIsPairing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [permission, requestPermission] = useCameraPermissions();

  const handlePair = async () => {
    if (!serverUrl || !pairCode) {
      setErrorMessage('Please enter both server URL and 6-digit pair code.');
      return;
    }
    setErrorMessage('');
    setIsPairing(true);
    try {
      await pairServer(serverUrl, pairCode, serverName || 'Desktop Maus');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Pairing failed. Check server address and pairing code.');
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
    try {
      await connectDirect(serverUrl, directToken, serverName || 'Custom Node');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Connection failed.');
    } finally {
      setIsPairing(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    try {
      // Expected QR format: openmausbot://pair?url=...&code=... or json
      if (data.startsWith('openmausbot://pair')) {
        const urlParams = new URL(data);
        const url = urlParams.searchParams.get('url');
        const code = urlParams.searchParams.get('code');
        if (url && code) {
          triggerHaptic.success();
          setServerUrl(url);
          setPairCode(code);
          setMode('manual');
          return;
        }
      } else {
        const parsed = JSON.parse(data);
        if (parsed.url && parsed.code) {
          triggerHaptic.success();
          setServerUrl(parsed.url);
          setPairCode(parsed.code);
          setMode('manual');
        }
      }
    } catch {
      // Try treating raw data as code or URL
      if (data.length === 6) {
        setPairCode(data);
        setMode('manual');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Desktop Pairing</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Tab switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, mode === 'manual' && styles.tabBtnActive]}
            onPress={() => setMode('manual')}
          >
            <Link2 size={16} color={mode === 'manual' ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.tabText, mode === 'manual' && styles.tabTextActive]}>Manual Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, mode === 'scan' && styles.tabBtnActive]}
            onPress={async () => {
              if (!permission?.granted) {
                await requestPermission();
              }
              setMode('scan');
            }}
          >
            <QrCode size={16} color={mode === 'scan' ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.tabText, mode === 'scan' && styles.tabTextActive]}>Scan QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, mode === 'direct' && styles.tabBtnActive]}
            onPress={() => setMode('direct')}
          >
            <Shield size={16} color={mode === 'direct' ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.tabText, mode === 'direct' && styles.tabTextActive]}>Token</Text>
          </TouchableOpacity>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Scan Mode */}
        {mode === 'scan' && (
          <View style={styles.scannerWrapper}>
            {permission?.granted ? (
              <View style={styles.cameraBox}>
                <Camera
                  style={StyleSheet.absoluteFillObject}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                  onBarcodeScanned={handleBarCodeScanned}
                />
                <View style={styles.scannerTarget} />
              </View>
            ) : (
              <View style={styles.permissionBox}>
                <Text style={styles.permText}>Camera permission needed to scan pairing QR code.</Text>
                <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                  <Text style={styles.permBtnText}>Grant Permission</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={styles.scannerHint}>
              Point camera at the QR code displayed on your OpenMausBot Desktop / Companion screen.
            </Text>
          </View>
        )}

        {/* Manual Pairing Form */}
        {mode === 'manual' && (
          <View style={styles.form}>
            <Text style={styles.label}>Companion Address / Host</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. http://192.168.1.50:8810 or *.ts.net:8810"
              placeholderTextColor={Colors.textMuted}
              value={serverUrl}
              onChangeText={setServerUrl}
              autoCapitalize="none"
            />

            {/* Quick URL Presets */}
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => setServerUrl('http://127.0.0.1:8810')}
              >
                <Text style={styles.presetText}>Localhost:8810</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => setServerUrl('http://10.0.2.2:8810')}
              >
                <Text style={styles.presetText}>Android Emu</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>6-Digit Pairing Code</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="123456"
              placeholderTextColor={Colors.textMuted}
              value={pairCode}
              onChangeText={setPairCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              style={[styles.pairButton, (!serverUrl || !pairCode) && styles.btnDisabled]}
              onPress={handlePair}
              disabled={isPairing || !serverUrl || !pairCode}
              activeOpacity={0.8}
            >
              {isPairing ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.pairButtonText}>Complete Pairing</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Direct Token Form */}
        {mode === 'direct' && (
          <View style={styles.form}>
            <Text style={styles.label}>Server Endpoint URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://your-openmausbot-instance.com"
              placeholderTextColor={Colors.textMuted}
              value={serverUrl}
              onChangeText={setServerUrl}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Device / Bearer Token</Text>
            <TextInput
              style={styles.input}
              placeholder="Bearer Token"
              placeholderTextColor={Colors.textMuted}
              value={directToken}
              onChangeText={setDirectToken}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.pairButton, (!serverUrl || !directToken) && styles.btnDisabled]}
              onPress={handleConnectDirect}
              disabled={isPairing || !serverUrl || !directToken}
              activeOpacity={0.8}
            >
              {isPairing ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.pairButtonText}>Connect Directly</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Active connection & saved servers */}
        {activeServer && (
          <View style={styles.savedSection}>
            <Text style={styles.sectionHeader}>Active Connection</Text>
            <View style={styles.activeServerCard}>
              <Server size={18} color={Colors.primary} />
              <View style={styles.serverDetails}>
                <Text style={styles.serverName}>{activeServer.name}</Text>
                <Text style={styles.serverUrl} numberOfLines={1}>
                  {activeServer.url}
                </Text>
              </View>
              <TouchableOpacity style={styles.disconnectBtn} onPress={disconnectServer}>
                <Trash2 size={16} color={Colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: Colors.surfaceLight,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.primary,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
  },
  form: {
    gap: 12,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.surface,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
  },
  codeInput: {
    letterSpacing: 8,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: -4,
    marginBottom: 4,
  },
  presetChip: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  presetText: {
    color: Colors.primary,
    fontSize: 11,
  },
  pairButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  pairButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  btnDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  scannerWrapper: {
    alignItems: 'center',
    gap: 16,
  },
  cameraBox: {
    width: 260,
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTarget: {
    width: 180,
    height: 180,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  permissionBox: {
    width: 260,
    height: 200,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 12,
  },
  permBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  permBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 13,
  },
  scannerHint: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  savedSection: {
    marginTop: 32,
  },
  sectionHeader: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  activeServerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  serverDetails: {
    flex: 1,
    marginLeft: 10,
  },
  serverName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  serverUrl: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  disconnectBtn: {
    padding: 8,
  },
});
