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
        <Terminal size={14} color={Colors.primary} style={styles.icon} />
        <Text style={styles.titleText} numberOfLines={1}>
          {activity.name}
        </Text>
        {activity.ok !== undefined && (
          activity.ok ? (
            <CheckCircle2 size={13} color={Colors.accent} style={styles.statusIcon} />
          ) : (
            <XCircle size={13} color={Colors.error} style={styles.statusIcon} />
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
    backgroundColor: Colors.codeBg,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 3,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 6,
  },
  titleText: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusIcon: {
    marginLeft: 6,
    marginRight: 4,
  },
  detailContainer: {
    paddingHorizontal: 10,
    paddingBottom: 8,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: Colors.codeBorder,
  },
  detailText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});
