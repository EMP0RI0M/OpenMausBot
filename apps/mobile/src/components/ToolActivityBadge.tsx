import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Terminal, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { ToolActivity } from '../types/models';

interface ToolActivityBadgeProps {
  activity: ToolActivity;
}

export const ToolActivityBadge: React.FC<ToolActivityBadgeProps> = ({ activity }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.headerRow}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Terminal size={12} color={Colors.primary} style={styles.icon} />
        <Text style={styles.titleText} numberOfLines={1}>
          {activity.name}
        </Text>
        {activity.ok !== undefined && (
          activity.ok ? (
            <CheckCircle2 size={12} color={Colors.accent} style={styles.statusIcon} />
          ) : (
            <XCircle size={12} color={Colors.error} style={styles.statusIcon} />
          )
        )}
        {activity.spoken && (
          expanded ? (
            <ChevronUp size={12} color={Colors.textMuted} />
          ) : (
            <ChevronDown size={12} color={Colors.textMuted} />
          )
        )}
      </TouchableOpacity>

      {expanded && activity.spoken && (
        <View style={styles.detailContainer}>
          <Text style={styles.detailText}>{activity.spoken}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(241, 245, 249, 0.70)',
    borderColor: 'rgba(15, 23, 42, 0.06)',
    borderWidth: 1,
    borderRadius: 14,
    marginVertical: 2,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 6,
  },
  titleText: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statusIcon: {
    marginLeft: 6,
    marginRight: 4,
  },
  detailContainer: {
    paddingHorizontal: 10,
    paddingBottom: 6,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 23, 42, 0.05)',
  },
  detailText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
