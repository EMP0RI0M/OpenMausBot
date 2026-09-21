import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Terminal, Play, Trash2, ShieldCheck } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { ProrootSandbox } from '../engine/ProrootSandbox';
import { triggerHaptic } from '../services/haptics';

interface StandaloneConsoleScreenProps {
  onClose?: () => void;
}

export const StandaloneConsoleScreen: React.FC<StandaloneConsoleScreenProps> = ({ onClose: _onClose }) => {
  const insets = useSafeAreaInsets();
  const [consoleLogs, setConsoleLogs] = useState<string>(
    '⚡ Standalone Linux Sandbox (MIT proroot / Non-Copyleft)\n' +
    '✓ Environment mapped to /root inside private app storage\n' +
    '✓ Google Antigravity CLI (agy) runtime initialized\n' +
    'Type commands below:\n\n'
  );
  const [userInput, setUserInput] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const topOffset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 12) + 6;

  useEffect(() => {
    const unsubscribe = ProrootSandbox.subscribeToStream((event) => {
      setConsoleLogs((prev) => prev + event.data + '\n');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [consoleLogs]);

  const handleCommandSubmission = async () => {
    if (!userInput.trim() || isRunning) return;

    const cmd = userInput.trim();
    setUserInput('');
    triggerHaptic.light();
    setConsoleLogs((prev) => prev + `root@sandbox-ubuntu:~# ${cmd}\n`);
    setIsRunning(true);

    try {
      const output = await ProrootSandbox.runLinuxCommand(cmd);
      setConsoleLogs((prev) => prev + output + '\n');
      triggerHaptic.success();
    } catch (err: any) {
      setConsoleLogs((prev) => prev + `[Execution Error]: ${err.message}\n`);
      triggerHaptic.error();
    } finally {
      setIsRunning(false);
    }
  };

  const handleClear = () => {
    triggerHaptic.light();
    setConsoleLogs('Console cleared.\nroot@sandbox-ubuntu:~# ');
  };

  const handleQuickCmd = (cmd: string) => {
    setUserInput(cmd);
  };

  return (
    <View style={[styles.container, { paddingTop: topOffset }]}>
      {/* Floating Glass Header */}
      <View style={styles.headerPill}>
        <View style={styles.headerLeft}>
          <Terminal size={18} color={Colors.primary} style={{ marginRight: 8 }} />
          <View>
            <Text style={styles.headerTitle}>Linux Sandbox</Text>
            <View style={styles.licenseRow}>
              <ShieldCheck size={11} color={Colors.accent} style={{ marginRight: 3 }} />
              <Text style={styles.licenseText}>MIT proroot • Zero-Root</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.clearBtn}
          onPress={handleClear}
          activeOpacity={0.7}
        >
          <Trash2 size={16} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Quick Action Pills */}
      <View style={styles.quickActionsRow}>
        {['agy --version', 'uname -a', 'ls -la /root', 'agy status'].map((cmd) => (
          <TouchableOpacity
            key={cmd}
            style={styles.quickPill}
            onPress={() => handleQuickCmd(cmd)}
            activeOpacity={0.7}
          >
            <Text style={styles.quickPillText}>{cmd}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Terminal Canvas */}
      <View style={styles.terminalContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.terminalBody}
          contentContainerStyle={styles.terminalContent}
        >
          <Text style={styles.terminalText} selectable>
            {consoleLogs}
          </Text>
        </ScrollView>
      </View>

      {/* Input Bar */}
      <View style={styles.inputBarPill}>
        <Text style={styles.promptText}>$</Text>
        <TextInput
          style={styles.cmdInput}
          placeholder="Type bash or agy command..."
          placeholderTextColor="#94A3B8"
          value={userInput}
          onChangeText={setUserInput}
          onSubmitEditing={handleCommandSubmission}
          returnKeyType="go"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.runPill, (!userInput.trim() || isRunning) && styles.runPillDisabled]}
          onPress={handleCommandSubmission}
          disabled={!userInput.trim() || isRunning}
          activeOpacity={0.8}
        >
          {isRunning ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Play size={13} color="#FFFFFF" fill="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  licenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  licenseText: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '600',
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  quickPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  quickPillText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  terminalContainer: {
    flex: 1,
    backgroundColor: '#0A0C14',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  terminalBody: {
    flex: 1,
  },
  terminalContent: {
    padding: 14,
  },
  terminalText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
    color: '#38BDF8',
  },
  inputBarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 28,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomColor: 'rgba(15, 23, 42, 0.08)',
    borderLeftColor: 'rgba(255, 255, 255, 0.80)',
    borderRightColor: 'rgba(255, 255, 255, 0.80)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  promptText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginRight: 6,
  },
  cmdInput: {
    flex: 1,
    color: '#000000',
    fontSize: 13,
    fontFamily: 'monospace',
    paddingVertical: 4,
  },
  runPill: {
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  runPillDisabled: {
    opacity: 0.4,
  },
});
