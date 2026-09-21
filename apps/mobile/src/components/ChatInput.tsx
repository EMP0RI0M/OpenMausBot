import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Send, Square, Mic, MicOff } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { triggerHaptic } from '../services/haptics';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isGenerating?: boolean;
  onInterrupt?: () => void;
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
      <View style={[styles.glossyInputPill, isFocused && styles.glossyInputPillFocused]}>
        {/* Voice Dictation Button */}
        <TouchableOpacity
          style={styles.leadingButton}
          onPress={handleMicToggle}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isRecording ? (
            <MicOff size={18} color={Colors.error} />
          ) : (
            <Mic size={18} color="#64748B" />
          )}
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          style={styles.textInput}
          placeholder={isRecording ? 'Listening...' : 'Message agent or run linux command...'}
          placeholderTextColor={isRecording ? Colors.error : '#64748B'}
          value={text}
          onChangeText={setText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline
          maxLength={4000}
          returnKeyType="default"
        />

        {/* Action Button */}
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
            <Send size={15} color={hasText ? '#FFFFFF' : '#94A3B8'} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 14 : 10,
    backgroundColor: 'transparent',
  },
  glossyInputPill: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 28,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomColor: 'rgba(15, 23, 42, 0.08)',
    borderLeftColor: 'rgba(255, 255, 255, 0.80)',
    borderRightColor: 'rgba(255, 255, 255, 0.80)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 46,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  glossyInputPillFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderColor: Colors.primary,
    shadowOpacity: 0.14,
    shadowRadius: 12,
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
    color: '#000000',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    maxHeight: 110,
    paddingTop: Platform.OS === 'ios' ? 7 : 5,
    paddingBottom: Platform.OS === 'ios' ? 7 : 5,
    paddingHorizontal: 8,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sendButtonActive: {
    backgroundColor: Colors.primary,
  },
  stopButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
