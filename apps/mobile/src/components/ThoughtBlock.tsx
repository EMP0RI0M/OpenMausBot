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

  const previewText = thought.trim().split('\n')[0].slice(0, 60);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={toggleExpand}
        activeOpacity={0.7}
        style={[styles.headerPill, isExpanded && styles.headerPillExpanded]}
      >
        <View style={styles.headerLeft}>
          <Sparkles size={13} color={Colors.primary} />
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
              <Text style={styles.liveText}>Live</Text>
            </View>
          )}
          {isExpanded ? (
            <ChevronUp size={13} color={Colors.textMuted} />
          ) : (
            <ChevronDown size={13} color={Colors.textMuted} />
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
    marginVertical: 5,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.07)',
    overflow: 'hidden',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(241, 245, 249, 0.60)',
    borderRadius: 18,
  },
  headerPillExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.05)',
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
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  contentContainer: {
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  contentText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
