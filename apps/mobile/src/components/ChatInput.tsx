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
  const [isRecording, setIsRecording] = useState(false);

  const handleSend = () => {
    if (!text.trim() || isGenerating) return;
    onSendMessage(text);
    setText('');
  };

  const handleMicToggle = () => {
    triggerHaptic.light();
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Simulate quick voice dictation input
      setTimeout(() => {
        setText((prev) => (prev ? `${prev} Run diagnostics` : 'Run diagnostics'));
        setIsRecording(false);
        triggerHaptic.success();
      }, 1500);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.inputBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleMicToggle}
          activeOpacity={0.7}
        >
          {isRecording ? (
            <MicOff size={20} color={Colors.error} />
          ) : (
            <Mic size={20} color={Colors.textSecondary} />
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder={isRecording ? 'Listening...' : 'Type message to agent team...'}
          placeholderTextColor={isRecording ? Colors.error : Colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={4000}
          returnKeyType="default"
        />

        {isGenerating ? (
          <TouchableOpacity
            style={styles.interruptBtn}
            onPress={onInterrupt}
            activeOpacity={0.8}
          >
            <Square size={16} color="#FFF" fill="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim()}
            activeOpacity={0.8}
          >
            <Send size={18} color={text.trim() ? '#000' : Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surface,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 48,
  },
  actionBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    maxHeight: 120,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    paddingHorizontal: 8,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  interruptBtn: {
    backgroundColor: Colors.error,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
});
