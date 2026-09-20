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
} from 'react-native';
import { Plus, Check, X, Bot as BotIcon, Sparkles, RefreshCw } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useOpenMaus } from '../context/OpenMausContext';
import { BotAvatar } from '../components/BotAvatar';

interface BotsScreenProps {
  onClose: () => void;
}

const PROVIDERS = [
  { id: 'claude', name: 'Claude', defaultModel: 'claude-3-5-sonnet', color: '#D97706' },
  { id: 'codex', name: 'Codex / GPT', defaultModel: 'gpt-4o', color: '#10B981' },
  { id: 'grok', name: 'Grok', defaultModel: 'grok-2-beta', color: '#E11D48' },
  { id: 'ollama', name: 'Local Ollama', defaultModel: 'llama3.3', color: '#8B5CF6' },
  { id: 'custom', name: 'Custom API', defaultModel: 'custom-model', color: '#38BDF8' },
];

export const BotsScreen: React.FC<BotsScreenProps> = ({ onClose }) => {
  const { bots, activeBotId, selectBot, createBot, refreshFleet } = useOpenMaus();
  const [modalVisible, setModalVisible] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0]);
  const [newBotPrompt, setNewBotPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectBot = (botId: string) => {
    selectBot(botId);
    onClose();
  };

  const handleCreate = async () => {
    if (!newBotName.trim()) return;
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <BotIcon size={22} color={Colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.title}>Agent Fleet</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={refreshFleet}
            activeOpacity={0.7}
          >
            <RefreshCw size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#000" />
            <Text style={styles.createBtnText}>New Agent</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bots list */}
      <FlatList
        data={bots}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = item.id === activeBotId;

          return (
            <TouchableOpacity
              style={[styles.botCard, isSelected && styles.botCardActive]}
              onPress={() => handleSelectBot(item.id)}
              activeOpacity={0.7}
            >
              <BotAvatar
                name={item.name}
                provider={item.provider}
                color={item.color}
                size={44}
                status={item.status}
              />
              <View style={styles.botDetails}>
                <View style={styles.botTitleRow}>
                  <Text style={styles.botName}>{item.name}</Text>
                  {isSelected && (
                    <View style={styles.activeCheck}>
                      <Check size={14} color={Colors.primary} />
                    </View>
                  )}
                </View>
                <Text style={styles.botModel} numberOfLines={1}>
                  {item.model || item.provider}
                </Text>
                {item.currentActivity && (
                  <Text style={styles.botActivity} numberOfLines={1}>
                    {item.currentActivity}
                  </Text>
                )}
              </View>
              {item.unreadCount && item.unreadCount > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
      />

      {/* Create Bot Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Agent</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.inputLabel}>Agent Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. SRE Ops Bot, Code Reviewer"
                placeholderTextColor={Colors.textMuted}
                value={newBotName}
                onChangeText={setNewBotName}
              />

              <Text style={styles.inputLabel}>Model Provider</Text>
              <View style={styles.providerGrid}>
                {PROVIDERS.map((p) => {
                  const isChosen = selectedProvider.id === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.providerChip,
                        isChosen && { borderColor: p.color, backgroundColor: `${p.color}22` },
                      ]}
                      onPress={() => setSelectedProvider(p)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.providerDot, { backgroundColor: p.color }]} />
                      <Text style={[styles.providerText, isChosen && { color: '#FFF', fontWeight: '700' }]}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>System Instructions / Persona</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe this agent's specialty, tools access, and responsibilities..."
                placeholderTextColor={Colors.textMuted}
                value={newBotPrompt}
                onChangeText={setNewBotPrompt}
                multiline
              />

              <TouchableOpacity
                style={[styles.submitBtn, !newBotName.trim() && styles.submitBtnDisabled]}
                onPress={handleCreate}
                disabled={!newBotName.trim() || isSubmitting}
                activeOpacity={0.8}
              >
                <Sparkles size={16} color="#000" style={{ marginRight: 6 }} />
                <Text style={styles.submitBtnText}>Deploy Agent</Text>
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
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  listContent: {
    padding: 14,
  },
  botCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  botCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },
  botDetails: {
    flex: 1,
    marginLeft: 12,
  },
  botTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  activeCheck: {
    marginLeft: 6,
  },
  botModel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  botActivity: {
    color: Colors.accent,
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  modalContent: {
    paddingBottom: 20,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  providerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  providerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  providerText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  submitBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
});
