import React, { useRef, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useOpenMaus } from '../context/OpenMausContext';
import { Colors } from '../theme/colors';
import { MessageItem } from '../components/MessageItem';
import { ChatInput } from '../components/ChatInput';
import { AttentionBanner } from '../components/AttentionBanner';
import { Header } from '../components/Header';
import { Bot, Message } from '../types/models';

interface ChatScreenProps {
  onOpenBots: () => void;
  onOpenSettings: () => void;
  onOpenPairing: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  onOpenBots,
  onOpenSettings,
  onOpenPairing,
}) => {
  const {
    activeBot,
    activeMessages,
    isGenerating,
    sendMessage,
    respondToCard,
    interruptActiveTurn,
  } = useOpenMaus();

  const flatListRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    if (activeMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [activeMessages.length, isGenerating]);

  const handleRespondCard = (
    requestId: string,
    choice: string,
    isPermission: boolean,
    allowKey?: string
  ) => {
    respondToCard(requestId, choice, isPermission, allowKey);
  };

  return (
    <View style={styles.container}>
      <Header
        onOpenBots={onOpenBots}
        onOpenSettings={onOpenSettings}
        onOpenPairing={onOpenPairing}
      />

      <AttentionBanner onPress={onOpenBots} />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={activeMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageItem
              message={item}
              bot={activeBot}
              onRespondCard={handleRespondCard}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>
                Send a message to start working with {activeBot?.name || 'this agent'}.
              </Text>
            </View>
          }
          ListFooterComponent={
            isGenerating ? (
              <View style={styles.generatingIndicator}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.generatingText}>
                  {activeBot?.name || 'Agent'} is thinking and executing tools...
                </Text>
              </View>
            ) : null
          }
        />

        <ChatInput
          onSendMessage={sendMessage}
          isGenerating={isGenerating}
          onInterrupt={interruptActiveTurn}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 80,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  generatingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  generatingText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
});
