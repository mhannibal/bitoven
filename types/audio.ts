export interface RecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  duration: number;
  uri: string | null;
}

export interface TranscriptionResult {
  text: string;
  timestamp: number;
}

export interface Task {
  id: string;
  title: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: number;
}
