import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Check, X, Bot as BotIcon, Sparkles, RefreshCw, ArrowLeft } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useOpenMaus } from '../context/OpenMausContext';
import { BotAvatar } from '../components/BotAvatar';
import { triggerHaptic } from '../services/haptics';

interface BotsScreenProps {
  onClose: () => void;
}

const PROVIDERS = [
  { id: 'claude', name: 'Claude', defaultModel: 'claude-3-5-sonnet', color: '#D97706' },
  { id: 'codex', name: 'Codex / GPT', defaultModel: 'gpt-4o', color: '#059669' },
  { id: 'grok', name: 'Grok', defaultModel: 'grok-2-beta', color: '#E11D48' },
  { id: 'ollama', name: 'Local Ollama', defaultModel: 'llama3.3', color: '#7C3AED' },
  { id: 'custom', name: 'Custom API', defaultModel: 'custom-model', color: '#2563EB' },
];

export const BotsScreen: React.FC<BotsScreenProps> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const { bots, activeBotId, selectBot, createBot, refreshFleet } = useOpenMaus();
  const [modalVisible, setModalVisible] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0]);
  const [newBotPrompt, setNewBotPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const topOffset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 12) + 6;

  const handleSelectBot = (botId: string) => {
    triggerHaptic.light();
    selectBot(botId);
    onClose();
  };

  const handleCreate = async () => {
    if (!newBotName.trim()) return;
    triggerHaptic.medium();
    setIsSubmitting(true);
    try {
      await createBot(
        newBotName.trim(),
        selectedProvider.id,
        selectedProvider.defaultModel,
        newBotPrompt.trim()
      );
      setNewBotName('');
      setNewBotPrompt('');
      setModalVisible(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topOffset }]}>
      {/* Floating Glass Header */}
      <View style={styles.headerPill}>
        <View style={styles.titleWrap}>
          <BotIcon size={20} color={Colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.title}>Agent Fleet ({bots.length})</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconPill}
            onPress={() => {
              triggerHaptic.light();
              refreshFleet();
            }}
            activeOpacity={0.7}
          >
            <RefreshCw size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createPill}
            onPress={() => {
              triggerHaptic.light();
              setModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Plus size={15} color="#FFFFFF" />
            <Text style={styles.createBtnText}>New Agent</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bots list */}
      <FlatList
        data={bots}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isSelected = item.id === activeBotId;

          return (
            <TouchableOpacity
              style={[styles.botCard, isSelected && styles.botCardActive]}
              onPress={() => handleSelectBot(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.botCardLeft}>
                <BotAvatar
                  name={item.name}
                  provider={item.provider}
                  color={item.color}
                  size={42}
                  status={item.status}
                />
                <View style={styles.botInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.botName}>{item.name}</Text>
                    {isSelected && (
                      <View style={styles.activePillBadge}>
                        <Check size={11} color="#FFFFFF" />
                        <Text style={styles.activeBadgeText}>Active</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.botSubtitle} numberOfLines={1}>
                    {item.model || item.provider} • {(item as any).prompt ? 'Custom instructions' : 'Autonomous mode'}
                  </Text>
                </View>
              </View>

              <View style={styles.providerBadge}>
                <Text style={styles.providerText}>{item.provider}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Create New Agent Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Agent</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <X size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.fieldLabel}>Agent Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Code Reviewer, Python Dev"
                placeholderTextColor="#94A3B8"
                value={newBotName}
                onChangeText={setNewBotName}
              />

              <Text style={styles.fieldLabel}>AI Provider</Text>
              <View style={styles.providersRow}>
                {PROVIDERS.map((prov) => {
                  const isProvActive = selectedProvider.id === prov.id;
                  return (
                    <TouchableOpacity
                      key={prov.id}
                      style={[styles.providerPill, isProvActive && styles.providerPillActive]}
                      onPress={() => setSelectedProvider(prov)}
                    >
                      <Text
                        style={[
                          styles.providerPillText,
                          isProvActive && styles.providerPillTextActive,
                        ]}
                      >
                        {prov.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>System Prompt / Instructions (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the agent's role and behavior..."
                placeholderTextColor="#94A3B8"
                value={newBotPrompt}
                onChangeText={setNewBotPrompt}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={[styles.submitPill, !newBotName.trim() && styles.submitPillDisabled]}
                onPress={handleCreate}
                disabled={!newBotName.trim() || isSubmitting}
                activeOpacity={0.8}
              >
                <Text style={styles.submitPillText}>
                  {isSubmitting ? 'Creating Agent…' : 'Deploy Agent to Fleet'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 14,
    paddingVertical: 8,
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
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  createPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 20,
    gap: 8,
  },
  botCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  botCardActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  botCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  botInfo: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  botName: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  activePillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  botSubtitle: {
    color: '#475569',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  providerBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  providerText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
  },
  modalBody: {
    gap: 12,
  },
  fieldLabel: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#000000',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  providersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  providerPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  providerPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  providerPillText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  providerPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submitPill: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitPillDisabled: {
    opacity: 0.5,
  },
  submitPillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
