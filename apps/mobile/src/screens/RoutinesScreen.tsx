import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Switch, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Clock, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useOpenMaus } from '../context/OpenMausContext';
import { triggerHaptic } from '../services/haptics';

interface RoutinesScreenProps {
  onClose: () => void;
}

export const RoutinesScreen: React.FC<RoutinesScreenProps> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const { routines, toggleRoutine, runRoutine, bots } = useOpenMaus();

  const topOffset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 12) + 6;

  const handleRun = (id: string) => {
    triggerHaptic.medium();
    runRoutine(id);
  };

  return (
    <View style={[styles.container, { paddingTop: topOffset }]}>
      {/* Header Pill */}
      <View style={styles.headerPill}>
        <TouchableOpacity style={styles.backPill} onPress={onClose} activeOpacity={0.7}>
          <ArrowLeft size={17} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Routines & Scheduled Tasks</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Clock size={32} color={Colors.primary} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyTitle}>No scheduled routines</Text>
            <Text style={styles.emptySubtitle}>
              Create recurring automated cron tasks for your agents to execute in the background.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const assignedBot = bots.find((b) => b.id === item.botId);
          const lastRunText = item.lastRun
            ? new Date(item.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Never';

          return (
            <View style={styles.routineCard}>
              <View style={styles.cardHeader}>
                <View style={styles.routineTitleWrap}>
                  <View style={styles.clockBadge}>
                    <Clock size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.routineTitle}>{item.title}</Text>
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={() => {
                    triggerHaptic.light();
                    toggleRoutine(item.id);
                  }}
                  trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.cronRow}>
                <View style={styles.cronPill}>
                  <Text style={styles.cronText}>{item.cron}</Text>
                </View>
                {assignedBot && (
                  <Text style={styles.botAssignee}>Agent: {assignedBot.name}</Text>
                )}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.lastRunText}>Last execution: {lastRunText}</Text>
                <TouchableOpacity
                  style={styles.runPill}
                  onPress={() => handleRun(item.id)}
                  activeOpacity={0.8}
                >
                  <Play size={11} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.runPillText}>Trigger Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomColor: 'rgba(15, 23, 42, 0.08)',
    borderLeftColor: 'rgba(255, 255, 255, 0.80)',
    borderRightColor: 'rgba(255, 255, 255, 0.80)',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 12,
  },
  backPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  headerTitle: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
    gap: 10,
  },
  routineCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomColor: 'rgba(15, 23, 42, 0.08)',
    borderLeftColor: 'rgba(255, 255, 255, 0.80)',
    borderRightColor: 'rgba(255, 255, 255, 0.80)',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  routineTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  clockBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  routineTitle: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  cronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cronPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  cronText: {
    color: Colors.primary,
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  botAssignee: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 23, 42, 0.06)',
    paddingTop: 8,
  },
  lastRunText: {
    color: '#64748B',
    fontSize: 11,
  },
  runPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  runPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  emptyTitle: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
