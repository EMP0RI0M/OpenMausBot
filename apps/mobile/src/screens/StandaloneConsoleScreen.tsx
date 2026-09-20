import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Terminal, Play, Trash2, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { ProrootSandbox } from '../engine/ProrootSandbox';
import { triggerHaptic } from '../services/haptics';

interface StandaloneConsoleScreenProps {
  onClose?: () => void;
}

export const StandaloneConsoleScreen: React.FC<StandaloneConsoleScreenProps> = ({ onClose }) => {
  const [consoleLogs, setConsoleLogs] = useState<string>(
    '⚡ Initializing Standalone Linux Sandbox (MIT / Non-Copyleft)...\n' +
    '✓ proroot path translation engine initialized.\n' +
    '✓ Environment mapped to /root inside private app storage.\n' +
    'Type Antigravity (agy) or Linux commands below:\n\n'
  );
  const [userInput, setUserInput] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onClose ? (
          <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
        ) : (
          <Terminal size={20} color={Colors.primary} />
        )}
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Standalone AGI Console</Text>
          <View style={styles.licenseBadge}>
            <ShieldCheck size={11} color={Colors.accent} style={{ marginRight: 4 }} />
            <Text style={styles.licenseText}>MIT proroot • No Termux</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={handleClear} activeOpacity={0.7}>
          <Trash2 size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Terminal View Body */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.terminalBody}
        contentContainerStyle={styles.terminalContent}
      >
        <Text style={styles.terminalText} selectable>
          {consoleLogs}
        </Text>
      </ScrollView>

      {/* Quick Antigravity Prompts Bar */}
      <View style={styles.quickBar}>
        <TouchableOpacity
          style={styles.quickChip}
          onPress={() => setUserInput('agy --version')}
          activeOpacity={0.7}
        >
          <Text style={styles.quickChipText}>agy --version</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickChip}
          onPress={() => setUserInput('uname -a')}
          activeOpacity={0.7}
        >
          <Text style={styles.quickChipText}>uname -a</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickChip}
          onPress={() => setUserInput("agy -p 'Analyze workspace and run tests'")}
          activeOpacity={0.7}
        >
          <Sparkles size={11} color={Colors.primary} style={{ marginRight: 4 }} />
          <Text style={styles.quickChipText}>agy -p ...</Text>
        </TouchableOpacity>
      </View>

      {/* Input Deck */}
      <View style={styles.controlDeck}>
        <TextInput
          style={styles.terminalInputField}
          value={userInput}
          onChangeText={setUserInput}
          placeholder="e.g. agy -p 'Refactor authentication module'"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isRunning}
          onSubmitEditing={handleCommandSubmission}
        />
        <TouchableOpacity
          style={[styles.triggerBtn, (!userInput.trim() || isRunning) && styles.triggerBtnDisabled]}
          onPress={handleCommandSubmission}
          disabled={!userInput.trim() || isRunning}
          activeOpacity={0.8}
        >
          {isRunning ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Play size={16} color="#000" fill="#000" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  backBtn: {
    padding: 4,
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  licenseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  licenseText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  iconBtn: {
    padding: 6,
  },
  terminalBody: {
    flex: 1,
    backgroundColor: '#05060A',
    margin: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  terminalContent: {
    padding: 12,
  },
  terminalText: {
    color: Colors.primary,
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  quickBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 6,
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  quickChipText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  controlDeck: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    alignItems: 'center',
  },
  terminalInputField: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    color: Colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  triggerBtn: {
    marginLeft: 8,
    backgroundColor: Colors.primary,
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerBtnDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
});
