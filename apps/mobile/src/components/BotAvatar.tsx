import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface BotAvatarProps {
  name: string;
  provider?: string;
  color?: string;
  size?: number;
  status?: 'idle' | 'working' | 'waiting' | 'error';
}

export const BotAvatar: React.FC<BotAvatarProps> = ({
  name,
  provider = 'claude',
  color = Colors.primary,
  size = 40,
  status,
}) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const getStatusColor = () => {
    switch (status) {
      case 'working':
        return Colors.accent;
      case 'waiting':
        return Colors.warning;
      case 'error':
        return Colors.error;
      default:
        return Colors.textMuted;
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.avatarCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color || Colors.primary,
          },
        ]}
      >
        <Text style={[styles.initialsText, { fontSize: size * 0.38 }]}>{initials}</Text>
      </View>
      {status && (
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: getStatusColor(),
              width: Math.max(size * 0.28, 8),
              height: Math.max(size * 0.28, 8),
              borderRadius: size * 0.14,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: Colors.text,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    borderWidth: 2,
    borderColor: Colors.background,
  },
});
