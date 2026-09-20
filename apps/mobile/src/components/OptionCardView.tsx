import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShieldAlert, HelpCircle, Check, X, ShieldCheck } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { OptionCard } from '../types/models';

interface OptionCardViewProps {
  card: OptionCard;
  onRespond: (choice: string) => void;
}

export const OptionCardView: React.FC<OptionCardViewProps> = ({ card, onRespond }) => {
  const isAnswered = !!card.answered;
  const isPermission = card.tool != null;

  return (
    <View style={[styles.container, isAnswered && styles.containerAnswered]}>
      <View style={styles.header}>
        {isPermission ? (
          <ShieldAlert size={18} color={isAnswered ? Colors.accent : Colors.warning} style={styles.headerIcon} />
        ) : (
          <HelpCircle size={18} color={isAnswered ? Colors.textMuted : Colors.primary} style={styles.headerIcon} />
        )}
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>{card.title}</Text>
          {card.subtitle ? <Text style={styles.subtitle}>{card.subtitle}</Text> : null}
        </View>
      </View>

      {/* If already answered, show the settled resolution */}
      {isAnswered ? (
        <View style={styles.settledBadge}>
          <Check size={14} color={Colors.accent} style={{ marginRight: 6 }} />
          <Text style={styles.settledText}>
            Settled: <Text style={styles.settledValue}>{card.answered}</Text>
          </Text>
        </View>
      ) : (
        <View style={styles.actionsContainer}>
          {card.options.map((option, idx) => {
            const isRefusal = ['deny', 'cancel', 'dismiss'].includes(option.toLowerCase());
            const isAlways = option.toLowerCase().includes('always');

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.button,
                  isRefusal && styles.buttonDeny,
                  isAlways && styles.buttonAlways,
                  !isRefusal && !isAlways && styles.buttonAllow,
                ]}
                onPress={() => onRespond(option)}
                activeOpacity={0.8}
              >
                {isRefusal && <X size={14} color={Colors.error} style={styles.btnIcon} />}
                {isAlways && <ShieldCheck size={14} color={Colors.secondary} style={styles.btnIcon} />}
                {!isRefusal && !isAlways && <Check size={14} color={Colors.accent} style={styles.btnIcon} />}
                <Text
                  style={[
                    styles.buttonText,
                    isRefusal && styles.buttonTextDeny,
                    isAlways && styles.buttonTextAlways,
                    !isRefusal && !isAlways && styles.buttonTextAllow,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderColor: Colors.warning,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    marginBottom: 4,
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  containerAnswered: {
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    backgroundColor: Colors.surfaceLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonAllow: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: Colors.accent,
  },
  buttonDeny: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: Colors.error,
  },
  buttonAlways: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: Colors.secondary,
  },
  btnIcon: {
    marginRight: 6,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttonTextAllow: {
    color: Colors.accent,
  },
  buttonTextDeny: {
    color: Colors.error,
  },
  buttonTextAlways: {
    color: Colors.secondary,
  },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.codeBg,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  settledText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  settledValue: {
    color: Colors.text,
    fontWeight: '600',
  },
});
