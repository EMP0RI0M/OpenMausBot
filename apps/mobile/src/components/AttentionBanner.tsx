import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShieldAlert, ArrowRight } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useOpenMaus } from '../context/OpenMausContext';

interface AttentionBannerProps {
  onPress: () => void;
}

export const AttentionBanner: React.FC<AttentionBannerProps> = ({ onPress }) => {
  const { attentionItemsCount } = useOpenMaus();

  if (attentionItemsCount === 0) return null;

  return (
    <TouchableOpacity style={styles.banner} onPress={onPress} activeOpacity={0.8}>
      <ShieldAlert size={16} color="#000" style={{ marginRight: 8 }} />
      <Text style={styles.bannerText}>
        {attentionItemsCount} action{attentionItemsCount > 1 ? 's' : ''} awaiting your approval
      </Text>
      <ArrowRight size={14} color="#000" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.warning,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bannerText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
  },
});
