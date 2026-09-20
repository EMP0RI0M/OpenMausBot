import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Volume2, VolumeX, Copy, Check } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { Message, Bot } from '../types/models';
import { Colors } from '../theme/colors';
import { BotAvatar } from './BotAvatar';
import { ToolActivityBadge } from './ToolActivityBadge';
import { OptionCardView } from './OptionCardView';
import { VoiceService } from '../services/speech';
import { triggerHaptic } from '../services/haptics';

interface MessageItemProps {
  message: Message;
  bot?: Bot | null;
  onRespondCard: (requestId: string, choice: string, isPermission: boolean, allowKey?: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, bot, onRespondCard }) => {
  const isUser = message.role === 'user';
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    triggerHaptic.light();
    await Clipboard.setStringAsync(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleVoice = () => {
    triggerHaptic.light();
    if (isPlayingVoice) {
      VoiceService.stop();
      setIsPlayingVoice(false);
    } else {
      setIsPlayingVoice(true);
      VoiceService.speak(message.content, () => setIsPlayingVoice(false));
    }
  };

  // Simple Markdown & Code block renderer for React Native
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const lang = lines[0].match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : '';
        const code = lang ? lines.slice(1).join('\n') : lines.join('\n');

        return (
          <View key={index} style={styles.codeBlockContainer}>
            {lang ? (
              <View style={styles.codeHeader}>
                <Text style={styles.codeLang}>{lang}</Text>
              </View>
            ) : null}
            <Text style={styles.codeText} selectable>
              {code}
            </Text>
          </View>
        );
      }

      // Inline formatting (bold, inline code)
      return (
        <Text key={index} style={[styles.bodyText, isUser && styles.userBodyText]} selectable>
          {part}
        </Text>
      );
    });
  };

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.wrapper, isUser ? styles.userWrapper : styles.botWrapper]}>
      {!isUser && (
        <View style={styles.avatarGutter}>
          <BotAvatar
            name={bot?.name || 'Agent'}
            provider={bot?.provider}
            color={bot?.color}
            size={32}
            status={bot?.status}
          />
        </View>
      )}

      <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
        {!isUser && bot && (
          <View style={styles.botMetaHeader}>
            <Text style={styles.botName}>{bot.name}</Text>
            <View style={[styles.providerBadge, { backgroundColor: bot.color || Colors.primary }]}>
              <Text style={styles.providerBadgeText}>{bot.model || bot.provider}</Text>
            </View>
          </View>
        )}

        {/* Content Body */}
        {message.content ? <View style={styles.contentWrap}>{renderFormattedContent(message.content)}</View> : null}

        {/* Tool Activity Logs */}
        {message.toolActivities && message.toolActivities.length > 0 && (
          <View style={styles.toolActivitiesContainer}>
            {message.toolActivities.map((activity, idx) => (
              <ToolActivityBadge key={idx} activity={activity} />
            ))}
          </View>
        )}

        {/* Interactive Option / Approval Card */}
        {message.optionCard && (
          <OptionCardView
            card={message.optionCard}
            onRespond={(choice) =>
              onRespondCard(
                message.optionCard?.requestId || '',
                choice,
                message.optionCard?.tool != null,
                message.optionCard?.allowKey
              )
            }
          />
        )}

        {/* Footer info: time, copy, voice button */}
        <View style={styles.footerRow}>
          <Text style={styles.timestamp}>{formattedTime}</Text>

          {!isUser && (
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={handleCopy} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                {copied ? <Check size={13} color={Colors.accent} /> : <Copy size={13} color={Colors.textMuted} />}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleToggleVoice}
                style={{ marginLeft: 10 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {isPlayingVoice ? (
                  <VolumeX size={13} color={Colors.primary} />
                ) : (
                  <Volume2 size={13} color={Colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    marginVertical: 6,
    paddingHorizontal: 12,
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  botWrapper: {
    justifyContent: 'flex-start',
  },
  avatarGutter: {
    marginRight: 8,
    marginTop: 2,
  },
  bubble: {
    maxWidth: '84%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: Colors.surface,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  botMetaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  botName: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 8,
  },
  providerBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  providerBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  contentWrap: {
    marginVertical: 2,
  },
  bodyText: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  userBodyText: {
    color: '#F1F5F9',
  },
  codeBlockContainer: {
    backgroundColor: Colors.codeBg,
    borderColor: Colors.codeBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  codeHeader: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.codeBorder,
    paddingBottom: 4,
    marginBottom: 6,
  },
  codeLang: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  codeText: {
    color: '#E2E8F0',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  toolActivitiesContainer: {
    marginTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 4,
  },
  timestamp: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
