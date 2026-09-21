import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ShieldAlert, Terminal } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { triggerHaptic } from '../services/haptics';

export interface GovernanceAction {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface GovernanceCardProps {
  title: string;
  description?: string;
  command?: string;
  toolName?: string;
  actions?: GovernanceAction[];
  onAction: (actionId: string) => Promise<void> | void;
  disabled?: boolean;
}

export const GovernanceCard: React.FC<GovernanceCardProps> = ({
  title,
  description,
  command,
  toolName,
  actions = [
    { id: 'allow', label: 'Allow Once', variant: 'primary' },
    { id: 'always', label: 'Always Allow', variant: 'secondary' },
    { id: 'deny', label: 'Deny', variant: 'danger' },
  ],
  onAction,
  disabled = false,
}) => {
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const handlePress = async (actionId: string) => {
    if (disabled || pendingAction) return;

    if (actionId === 'deny') {
      triggerHaptic.warning();
    } else {
      triggerHaptic.medium();
    }

    setPendingAction(actionId);
    try {
      await onAction(actionId);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <ShieldAlert size={16} color={Colors.warning} />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.cardTitle}>{title || 'Approval Required'}</Text>
          {toolName && <Text style={styles.toolBadge}>{toolName}</Text>}
        </View>
      </View>

      {description && <Text style={styles.description}>{description}</Text>}

      {command && (
        <View style={styles.commandBox}>
          <Terminal size={13} color={Colors.textMuted} />
          <Text style={styles.commandText} numberOfLines={3} selectable>
            {command}
          </Text>
        </View>
      )}

      <View style={styles.actionsRow}>
        {actions.map((act) => {
          const isPending = pendingAction === act.id;
          const isDanger = act.variant === 'danger';
          const isPrimary = act.variant === 'primary';

          return (
            <TouchableOpacity
              key={act.id}
              style={[
                styles.actionPill,
                isPrimary && styles.actionPillPrimary,
                isDanger && styles.actionPillDanger,
                (disabled || pendingAction) && styles.actionPillDisabled,
              ]}
              onPress={() => handlePress(act.id)}
              disabled={disabled || !!pendingAction}
              activeOpacity={0.7}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={isPrimary ? '#FFFFFF' : Colors.text} />
              ) : (
                <Text
                  style={[
                    styles.actionLabel,
                    isPrimary && styles.actionLabelPrimary,
                    isDanger && styles.actionLabelDanger,
                  ]}
                >
                  {act.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  toolBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.warning,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  commandBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    marginBottom: 12,
  },
  commandText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: Colors.primary,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  actionPill: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  actionPillPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionPillDanger: {
    backgroundColor: 'rgba(220, 38, 38, 0.10)',
    borderColor: 'rgba(220, 38, 38, 0.25)',
  },
  actionPillDisabled: {
    opacity: 0.5,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  actionLabelPrimary: {
    color: '#FFFFFF',
  },
  actionLabelDanger: {
    color: Colors.error,
  },
});
