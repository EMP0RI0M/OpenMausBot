import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Keyboard } from 'react-native';
import { Send, Square, Mic, MicOff, Plus, Terminal } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { triggerHaptic } from '../services/haptics';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isGenerating?: boolean;
  onInterrupt?: () => void;
  onQuickCommand?: (cmd: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isGenerating = false,
  onInterrupt,
}) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const hasText = text.trim().length > 0;

  const handleSend = () => {
    if (!hasText || isGenerating) return;
    triggerHaptic.medium();
    onSendMessage(text.trim());
    setText('');
  };

  const handleMicToggle = () => {
    triggerHaptic.light();
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setText((prev) => (prev ? `${prev} Run diagnostics` : 'Run diagnostics'));
        setIsRecording(false);
        triggerHaptic.success();
      }, 1400);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
        {/* Voice dictation button */}
        <TouchableOpacity
          style={styles.leadingButton}
          onPress={handleMicToggle}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isRecording ? (
            <MicOff size={18} color={Colors.error} />
          ) : (
            <Mic size={18} color={Colors.textMuted} />
          )}
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          style={styles.textInput}
          placeholder={isRecording ? 'Listening...' : 'Ask agent or run linux command...'}
          placeholderTextColor={isRecording ? Colors.error : Colors.textMuted}
          value={text}
          onChangeText={setText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline
          maxLength={4000}
          returnKeyType="default"
        />

        {/* Action Button: Interrupt or Send */}
        {isGenerating ? (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={() => {
              triggerHaptic.medium();
              onInterrupt?.();
            }}
            activeOpacity={0.8}
          >
            <Square size={13} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.sendButton, hasText && styles.sendButtonActive]}
            onPress={handleSend}
            disabled={!hasText}
            activeOpacity={0.8}
          >
            <Send size={15} color={hasText ? '#FFFFFF' : Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 14 : 10,
    backgroundColor: Colors.background,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#10121A',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    minHeight: 44,
  },
  inputContainerFocused: {
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: '#121520',
  },
  leadingButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
  textInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
    maxHeight: 110,
    paddingTop: Platform.OS === 'ios' ? 7 : 5,
    paddingBottom: Platform.OS === 'ios' ? 7 : 5,
    paddingHorizontal: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sendButtonActive: {
    backgroundColor: Colors.primary,
  },
  stopButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
