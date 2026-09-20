import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { Calendar, Play, CheckCircle2, Clock, ArrowLeft, RefreshCw } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useOpenMaus } from '../context/OpenMausContext';
import { Routine } from '../types/models';

interface RoutinesScreenProps {
  onClose: () => void;
}

export const RoutinesScreen: React.FC<RoutinesScreenProps> = ({ onClose }) => {
  const { routines, toggleRoutine, runRoutine, bots } = useOpenMaus();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Routines & Automations</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const assignedBot = bots.find((b) => b.id === item.botId);
          const lastRunText = item.lastRun
            ? new Date(item.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Never';

          return (
            <View style={styles.routineCard}>
              <View style={styles.cardHeader}>
                <View style={styles.routineTitleWrap}>
                  <Clock size={16} color={Colors.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.routineTitle}>{item.title}</Text>
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={() => toggleRoutine(item.id)}
                  trackColor={{ false: Colors.surfaceBorder, true: Colors.primary }}
                  thumbColor={item.enabled ? '#000' : '#888'}
                />
              </View>

              <View style={styles.cronRow}>
                <View style={styles.cronBadge}>
                  <Text style={styles.cronText}>{item.cron}</Text>
                </View>
                {assignedBot && (
                  <Text style={styles.botAssignee}>Assigned: {assignedBot.name}</Text>
                )}
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.lastRunText}>Last run: {lastRunText}</Text>
                <TouchableOpacity
                  style={[styles.runNowBtn, item.status === 'running' && styles.runNowBtnActive]}
                  onPress={() => runRoutine(item.id)}
                  disabled={item.status === 'running'}
                  activeOpacity={0.7}
                >
                  {item.status === 'running' ? (
                    <RefreshCw size={13} color="#FFF" style={{ marginRight: 4 }} />
                  ) : (
                    <Play size={13} color="#000" fill="#000" style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.runNowText, item.status === 'running' && { color: '#FFF' }]}>
                    {item.status === 'running' ? 'Running' : 'Run Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    padding: 6,
  },
  title: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  routineCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
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
    marginRight: 10,
  },
  routineTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  cronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cronBadge: {
    backgroundColor: Colors.codeBg,
    borderColor: Colors.codeBorder,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cronText: {
    color: Colors.primary,
    fontFamily: 'monospace',
    fontSize: 11,
  },
  botAssignee: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingTop: 10,
  },
  lastRunText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  runNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  runNowBtnActive: {
    backgroundColor: Colors.accent,
  },
  runNowText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
});
