import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Terminal, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../theme/colors';
import { triggerHaptic } from '../services/haptics';

interface ArtifactPreviewCardProps {
  filePath: string;
  diffOrContent: string;
  actionType?: 'create' | 'edit' | 'view';
}

export const ArtifactPreviewCard: React.FC<ArtifactPreviewCardProps> = ({
  filePath,
  diffOrContent,
  actionType = 'edit',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    triggerHaptic.light();
    await Clipboard.setStringAsync(diffOrContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fileName = filePath.split('/').pop() || filePath;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => {
            triggerHaptic.light();
            setIsExpanded(!isExpanded);
          }}
          activeOpacity={0.7}
        >
          <Terminal size={14} color={Colors.primary} />
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
          <View style={[styles.badge, actionType === 'create' ? styles.badgeCreate : styles.badgeEdit]}>
            <Text style={styles.badgeText}>{actionType}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleCopy} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            {copied ? <Check size={13} color={Colors.accent} /> : <Copy size={13} color={Colors.textMuted} />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic.light();
              setIsExpanded(!isExpanded);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isExpanded ? <ChevronUp size={14} color={Colors.textMuted} /> : <ChevronDown size={14} color={Colors.textMuted} />}
          </TouchableOpacity>
        </View>
      </View>

      {isExpanded && (
        <View style={styles.contentBox}>
          <Text style={styles.codeText} selectable>
            {diffOrContent}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(241, 245, 249, 0.70)',
    borderRadius: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'monospace',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  badgeCreate: {
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
  },
  badgeEdit: {
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    padding: 2,
  },
  contentBox: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 23, 42, 0.06)',
    backgroundColor: '#F8FAFC',
  },
  codeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#0F172A',
    lineHeight: 17,
  },
});
