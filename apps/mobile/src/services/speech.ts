import * as Speech from 'expo-speech';

let isSpeaking = false;

export const VoiceService = {
  speak: async (text: string, onDone?: () => void) => {
    try {
      if (isSpeaking) {
        await Speech.stop();
      }
      isSpeaking = true;
      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 1.05,
        onDone: () => {
          isSpeaking = false;
          onDone?.();
        },
        onError: () => {
          isSpeaking = false;
        },
      });
    } catch (e) {
      console.warn('Speech playback error:', e);
      isSpeaking = false;
    }
  },

  stop: async () => {
    try {
      await Speech.stop();
      isSpeaking = false;
    } catch (e) {
      console.warn('Speech stop error:', e);
    }
  },

  getSpeakingStatus: () => isSpeaking,
};
