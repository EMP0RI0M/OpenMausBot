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
          <Terminal size={15} color={Colors.primary} />
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
          <View style={[styles.badge, actionType === 'create' ? styles.badgeCreate : styles.badgeEdit]}>
            <Text style={styles.badgeText}>{actionType}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleCopy} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            {copied ? <Check size={13} color="#22c55e" /> : <Copy size={13} color={Colors.textMuted} />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic.light();
              setIsExpanded(!isExpanded);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isExpanded ? <ChevronUp size={15} color={Colors.textMuted} /> : <ChevronDown size={15} color={Colors.textMuted} />}
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
    marginVertical: 6,
    backgroundColor: '#0d1117',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
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
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeCreate: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  badgeEdit: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
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
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#07090d',
  },
  codeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#e6edf3',
    lineHeight: 16,
  },
});
