import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export const GlassBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <View style={styles.container}>
      {/* Base Light Canvas */}
      <LinearGradient
        colors={['#F0F4F8', '#E6EEF8', '#F5F3FF', '#F0F9FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Foggy / Glowing Ambient Glass Orbs */}
      <View style={styles.orbTopRight} />
      <View style={styles.orbMiddleLeft} />
      <View style={styles.orbBottomRight} />

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  content: {
    flex: 1,
  },
  orbTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    backgroundColor: 'rgba(56, 189, 248, 0.20)', // Sky aura
  },
  orbMiddleLeft: {
    position: 'absolute',
    top: height * 0.35,
    left: -80,
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: (width * 0.75) / 2,
    backgroundColor: 'rgba(129, 140, 248, 0.18)', // Indigo aura
  },
  orbBottomRight: {
    position: 'absolute',
    bottom: -80,
    right: -40,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: 'rgba(52, 211, 153, 0.15)', // Emerald aura
  },
});
