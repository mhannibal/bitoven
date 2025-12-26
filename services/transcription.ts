import { Platform } from 'react-native';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions';

export interface TranscribeOptions {
  audioUri: string;
  language?: string;
}

export async function transcribeAudio(options: TranscribeOptions): Promise<string> {
  const { audioUri, language = 'en' } = options;

  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in your .env file');
  }

  try {
    // Convert audio URI to Blob
    const audioResponse = await fetch(audioUri);
    const audioBlob = await audioResponse.blob();

    // Create FormData for multipart/form-data request
    const formData = new FormData();
    
    // Determine file extension and MIME type based on platform
    const fileName = Platform.OS === 'web' ? 'recording.webm' : 'recording.m4a';
    const mimeType = Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a';
    
    // For React Native, append Blob directly with metadata
    // For web, create a File object
    if (Platform.OS === 'web') {
      const audioFile = new File([audioBlob], fileName, { type: mimeType });
      formData.append('file', audioFile);
    } else {
      // React Native: Append blob with filename and type as metadata
      formData.append('file', {
        uri: audioUri,
        type: mimeType,
        name: fileName,
      } as any);
    }
    
    formData.append('model', 'whisper-1');
    formData.append('language', language);

    // Make direct API call to OpenAI
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to transcribe audio'
    );
  }
}
