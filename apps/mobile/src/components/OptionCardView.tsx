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
        <View style={styles.settledPill}>
          <Check size={13} color={Colors.accent} style={{ marginRight: 5 }} />
          <Text style={styles.settledText}>
            Resolved: <Text style={styles.settledValue}>{card.answered}</Text>
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
                  styles.pillButton,
                  isRefusal && styles.buttonDeny,
                  isAlways && styles.buttonAlways,
                  !isRefusal && !isAlways && styles.buttonAllow,
                ]}
                onPress={() => onRespond(option)}
                activeOpacity={0.8}
              >
                {isRefusal && <X size={13} color={Colors.error} style={styles.btnIcon} />}
                {isAlways && <ShieldCheck size={13} color={Colors.secondary} style={styles.btnIcon} />}
                {!isRefusal && !isAlways && <Check size={13} color={Colors.accent} style={styles.btnIcon} />}
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
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(217, 119, 6, 0.25)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginTop: 8,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  containerAnswered: {
    borderColor: 'rgba(15, 23, 42, 0.08)',
    borderWidth: 1,
    backgroundColor: 'rgba(241, 245, 249, 0.80)',
    shadowOpacity: 0,
    elevation: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    color: Colors.text,
    fontSize: 13,
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
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  buttonAllow: {
    backgroundColor: 'rgba(5, 150, 105, 0.10)',
    borderColor: 'rgba(5, 150, 105, 0.3)',
  },
  buttonDeny: {
    backgroundColor: 'rgba(220, 38, 38, 0.10)',
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  buttonAlways: {
    backgroundColor: 'rgba(124, 58, 237, 0.10)',
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  btnIcon: {
    marginRight: 5,
  },
  buttonText: {
    fontSize: 12,
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
  settledPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  settledText: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  settledValue: {
    color: Colors.text,
    fontWeight: '700',
  },
});
