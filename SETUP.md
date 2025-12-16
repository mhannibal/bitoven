# Bithoven MVP - Setup Guide

## 🎯 What's Built

A voice-to-task extraction app with AI:
- **Home Page**: Hold-to-record button that captures audio
- **Results Page**: Shows transcription + AI-extracted actionable tasks
- **Smart Task Extraction**: GPT-4 analyzes your speech and extracts tasks with priorities and due dates
- **Cross-platform**: Works on Web, iOS, and Android

## 🚀 Setup Instructions

### 1. Add Your OpenAI API Key

Edit `.env` file and add your OpenAI API key:

```
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-actual-api-key-here
```

Get your API key from: https://platform.openai.com/api-keys

### 2. Install Dependencies (Already Done)

```bash
npm install
```

### 3. Run the App

**For Web:**
```bash
npm run web
```

**For iOS:**
```bash
npm run ios
```

**For Android:**
```bash
npm run android
```

## 📱 How to Use

1. Open the app - you'll see the home screen with a record button (🎙️)
2. **Press and hold** the blue button to start recording
3. Speak your thoughts (e.g., "I need to call the dentist tomorrow and buy groceries this weekend")
4. **Release** the button to stop recording
5. Wait for AI processing (⏳)
   - First: Whisper transcribes your speech
   - Then: GPT-4 extracts actionable tasks
6. View results page with:
   - 📝 Full transcription
   - ✅ Extracted tasks with priorities and due dates
7. Tap "New Recording" to record again

## 🏗️ Project Structure

```
/hooks
  /use-audio-recorder.ts          # Audio recording logic (web + native)
  
/services
  /transcription.ts                # OpenAI Whisper API integration
  /task-extraction.ts              # GPT-4 task extraction with custom prompt
  
/types
  /audio.ts                        # TypeScript interfaces for tasks & recordings
  
/app
  /(tabs)/index.tsx                # Home screen with record button
  /transcription.tsx               # Results page with transcription + tasks
```

## 🔧 Technical Details

- **Audio Recording**: 
  - Web: MediaRecorder API (audio/webm)
  - Native: expo-av (HIGH_QUALITY preset)
  
- **Transcription**: OpenAI Whisper API (whisper-1 model)

- **Task Extraction**: GPT-4 with custom productivity prompt
  - Extracts only actionable tasks
  - Assigns priorities (low/medium/high)
  - Infers due dates from time references
  - Returns structured JSON output

- **Navigation**: Expo Router with typed routes

## ⚠️ Important Notes

1. **API Key Security**: The API key is exposed in the client. For production, use a backend proxy.
2. **Web Permissions**: Browser will request microphone access on first use.
3. **HTTPS Required**: Web microphone access requires HTTPS (or localhost).
4. **API Costs**: 
   - Whisper: $0.006 per minute of audio
   - GPT-4: ~$0.03 per 1K tokens (varies by usage)
5. **Processing Time**: Each recording makes 2 API calls (Whisper + GPT-4), so expect 3-5 seconds processing

## 🐛 Troubleshooting

- **"Failed to start recording"**: Check microphone permissions
- **"OpenAI API key not configured"**: Add your key to `.env` file
- **"Failed to transcribe"**: Verify your API key is correct and has credits
- **Web not recording**: Ensure you're on HTTPS or localhost
- **Native not recording**: Check device microphone permissions
- **"No actionable tasks found"**: Try speaking clearer task-oriented statements

## 🎨 Next Steps

- Save extracted tasks to local storage
- Add task completion/editing functionality
- Store transcription history
- Implement offline support with queued processing
- Add audio playback of recordings
- Export tasks to calendar apps
- Add task categories/tags
- Implement task reminders/notifications
