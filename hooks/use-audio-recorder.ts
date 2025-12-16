import type { RecordingState } from '@/types/audio';
import { Audio } from 'expo-av';
import { useRef, useState } from 'react';
import { Platform } from 'react-native';

export function useAudioRecorder() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isProcessing: false,
    duration: 0,
    uri: null,
  });

  // Native recording using expo-av
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Web recording using MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web implementation
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm',
        });

        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
      } else {
        // Native implementation
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        recordingRef.current = recording;
      }

      setState((prev) => ({ ...prev, isRecording: true, duration: 0 }));
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  };

  const stopRecording = async (): Promise<string> => {
    try {
      setState((prev) => ({ ...prev, isProcessing: true }));

      if (Platform.OS === 'web') {
        // Web implementation
        return new Promise((resolve, reject) => {
          const mediaRecorder = mediaRecorderRef.current;
          if (!mediaRecorder) {
            reject(new Error('No recording in progress'));
            return;
          }

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, {
              type: 'audio/webm',
            });
            const audioUrl = URL.createObjectURL(audioBlob);

            // Stop all tracks
            mediaRecorder.stream.getTracks().forEach((track) => track.stop());

            setState((prev) => ({
              ...prev,
              isRecording: false,
              isProcessing: false,
              uri: audioUrl,
            }));

            resolve(audioUrl);
          };

          mediaRecorder.stop();
        });
      } else {
        // Native implementation
        const recording = recordingRef.current;
        if (!recording) {
          throw new Error('No recording in progress');
        }

        await recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });

        const uri = recording.getURI();

        if (!uri) {
          throw new Error('Failed to get recording URI');
        }

        setState((prev) => ({
          ...prev,
          isRecording: false,
          isProcessing: false,
          uri,
        }));

        recordingRef.current = null;
        return uri;
      }
    } catch (error) {
      setState((prev) => ({ ...prev, isRecording: false, isProcessing: false }));
      console.error('Failed to stop recording:', error);
      throw error;
    }
  };

  return {
    state,
    startRecording,
    stopRecording,
  };
}
