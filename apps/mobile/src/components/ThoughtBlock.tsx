import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { triggerHaptic } from '../services/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ThoughtBlockProps {
  thought: string;
  isStreaming?: boolean;
}

export const ThoughtBlock: React.FC<ThoughtBlockProps> = ({ thought, isStreaming = false }) => {
  const [isExpanded, setIsExpanded] = useState(isStreaming);

  if (!thought || thought.trim().length === 0) return null;

  const toggleExpand = () => {
    triggerHaptic.light();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const previewText = thought.trim().split('\n')[0].slice(0, 65);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={toggleExpand}
        activeOpacity={0.7}
        style={[styles.header, isExpanded && styles.headerExpanded]}
      >
        <View style={styles.headerLeft}>
          <Sparkles size={14} color={Colors.primary} />
          <Text style={styles.title}>
            {isStreaming ? 'Thinking...' : 'Reasoning Process'}
          </Text>
          {!isExpanded && (
            <Text style={styles.preview} numberOfLines={1}>
              {previewText}...
            </Text>
          )}
        </View>

        <View style={styles.headerRight}>
          {isStreaming && (
            <View style={styles.liveIndicator}>
              <Sparkles size={11} color={Colors.primary} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          )}
          {isExpanded ? (
            <ChevronUp size={14} color={Colors.textMuted} />
          ) : (
            <ChevronDown size={14} color={Colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.contentContainer}>
          <Text style={styles.contentText} selectable>
            {thought.trim()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  headerExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  preview: {
    fontSize: 11,
    color: Colors.textMuted,
    flex: 1,
    fontStyle: 'italic',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  contentContainer: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  contentText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
