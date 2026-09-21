import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const GlassBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <View style={styles.container}>
      {/* Ambient Foggy Glass Light Orbs */}
      <View style={styles.orbTopRight} />
      <View style={styles.orbMiddleLeft} />
      <View style={styles.orbBottomRight} />

      {/* Main App Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Slate 50 clean light background
  },
  content: {
    flex: 1,
  },
  orbTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    backgroundColor: 'rgba(56, 189, 248, 0.12)', // Sky blue aura
  },
  orbMiddleLeft: {
    position: 'absolute',
    top: height * 0.35,
    left: -60,
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: (width * 0.75) / 2,
    backgroundColor: 'rgba(129, 140, 248, 0.10)', // Indigo aura
  },
  orbBottomRight: {
    position: 'absolute',
    bottom: -60,
    right: -40,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: 'rgba(52, 211, 153, 0.10)', // Emerald aura
  },
});
