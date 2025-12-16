import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { extractTasksFromText } from '@/services/task-extraction';
import { transcribeAudio } from '@/services/transcription';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

type Language = 'en' | 'fr' | 'ar';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { state, startRecording, stopRecording } = useAudioRecorder();
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');

  const handlePressIn = async () => {
    try {
      setError(null);
      await startRecording();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      Alert.alert('Recording Error', message);
    }
  };

  const handlePressOut = async () => {
    try {
      const audioUri = await stopRecording();
      
      // Transcribe the audio with selected language
      const transcription = await transcribeAudio({ audioUri, language: selectedLanguage });
      
      // Extract tasks from transcription using ChatGPT with same language
      const taskResult = await extractTasksFromText(transcription, selectedLanguage);
      
      // Navigate to result page with transcription and tasks
      router.push({
        pathname: '/transcription',
        params: { 
          text: transcription,
          tasksJson: JSON.stringify(taskResult.tasks),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process recording';
      setError(message);
      Alert.alert('Processing Error', message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Bithoven</ThemedText>
        <ThemedText style={styles.subtitle}>Voice to Tasks</ThemedText>
        
        {/* Language Selector */}
        <ThemedView style={styles.languageSelector}>
          {LANGUAGES.map((lang) => (
            <Pressable
              key={lang.code}
              onPress={() => setSelectedLanguage(lang.code)}
              style={({ pressed }) => [
                styles.languageButton,
                selectedLanguage === lang.code && styles.languageButtonActive,
                pressed && styles.languageButtonPressed,
              ]}>
              <ThemedText style={styles.languageFlag}>{lang.flag}</ThemedText>
              <ThemedText
                style={[
                  styles.languageLabel,
                  selectedLanguage === lang.code && styles.languageLabelActive,
                ]}>
                {lang.label}
              </ThemedText>
            </Pressable>
          ))}
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.recordContainer}>
        <ThemedText style={styles.instructions}>
          {state.isRecording
            ? 'Recording... Release to extract tasks'
            : state.isProcessing
            ? 'Extracting tasks with AI...'
            : 'Hold to record your thoughts'}
        </ThemedText>

        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={state.isProcessing}
          style={({ pressed }) => [
            styles.recordButton,
            state.isRecording && styles.recordButtonActive,
            state.isProcessing && styles.recordButtonDisabled,
            pressed && styles.recordButtonPressed,
          ]}>
          <ThemedText style={styles.recordButtonText}>
            {state.isRecording ? '🎤' : state.isProcessing ? '⏳' : '🎙️'}
          </ThemedText>
        </Pressable>

        {error && (
          <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </ThemedView>
        )}
      </ThemedView>

      <ThemedView style={styles.footer}>
        <ThemedText style={styles.footerText}>
          Powered by OpenAI Whisper + GPT-4
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    gap: 16,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 8,
  },
  languageSelector: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageButtonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderColor: '#007AFF',
  },
  languageButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  languageFlag: {
    fontSize: 18,
  },
  languageLabel: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  languageLabelActive: {
    opacity: 1,
    fontWeight: '700',
    color: '#007AFF',
  },
  recordContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  instructions: {
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.8,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#FF3B30',
    transform: [{ scale: 1.1 }],
  },
  recordButtonDisabled: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  recordButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  recordButtonText: {
    fontSize: 48,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
  },
  footer: {
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    opacity: 0.5,
  },
});
