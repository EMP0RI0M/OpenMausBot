import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ShieldCheck, ShieldAlert, Check, X, Terminal } from 'lucide-react-native';
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
          <ShieldAlert size={16} color={Colors.warning || '#f59e0b'} />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.cardTitle}>{title || 'Action Approval Required'}</Text>
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
                styles.actionBtn,
                isPrimary && styles.actionBtnPrimary,
                isDanger && styles.actionBtnDanger,
                (disabled || pendingAction) && styles.actionBtnDisabled,
              ]}
              onPress={() => handlePress(act.id)}
              disabled={disabled || !!pendingAction}
              activeOpacity={0.7}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
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
    marginVertical: 10,
    backgroundColor: '#161922',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: 14,
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
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
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
    color: '#ffffff',
  },
  toolBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
    backgroundColor: '#0a0c10',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  commandText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#38bdf8',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  actionBtnPrimary: {
    backgroundColor: Colors.primary || '#6366f1',
    borderColor: Colors.primary || '#6366f1',
  },
  actionBtnDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  actionLabelPrimary: {
    color: '#ffffff',
  },
  actionLabelDanger: {
    color: '#ef4444',
  },
});
