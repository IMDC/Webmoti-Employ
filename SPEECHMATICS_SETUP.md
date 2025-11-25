# Speechmatics Integration Setup Guide

## Overview

The Speechmatics Real-Time transcription system has been successfully integrated to replace the Web Speech API. This provides:

- ✅ Better transcription accuracy
- ✅ More reliable performance
- ✅ Speaker role tagging (Interviewer vs Candidate)
- ✅ Real-time streaming transcription
- ✅ Works perfectly in Electron

## What Was Changed

### Files Modified
1. **`shared/src/ai.ts`** - Added optional `speaker` field to `TranscriptMessage`
2. **`client/src/features/interview/ai/useSpeechmaticsTranscription.ts`** - NEW: Speechmatics hook
3. **`client/src/features/interview/session/Room.tsx`** - Updated to use Speechmatics hook
4. **`server/src/durable-objects/ai-room.ts`** - Updated to use speaker tags from transcripts
5. **`client/package.json`** - Removed `react-speech-recognition` dependency

### Files Deleted
- **`client/src/features/interview/ai/useTranscription.ts`** - Old Web Speech API hook

## Setup Instructions

### 1. Get Your Speechmatics API Key

1. Go to [Speechmatics Portal - API Keys](https://portal.speechmatics.com/manage-access/)
2. Sign up or log in
3. Navigate to **Settings > API Keys**
4. Click **"Create API Key"**
5. Give it a name (e.g., "WebMoti Development")
6. Copy the API key

**How it works:** The app automatically generates temporary JWT tokens from your API key using the official `@speechmatics/auth` package. Tokens are valid for 1 hour and regenerated as needed.

### 2. Configure Environment Variables

#### For Client (Speechmatics API Key)
Create a file `client/.env.local` with:

```bash
VITE_SPEECHMATICS_API_KEY=your_api_key_here
```

**Important:** 
- Replace `your_api_key_here` with your actual Speechmatics API key
- The app will automatically generate temporary JWT tokens from this API key
- This file is gitignored, so it won't be committed
- You'll need to create this file on each development machine

#### For Electron (Required)
Create a file `electron/.env.electron` with:

```bash
CLIENT_HOSTED_URL=https://webmoti-employ.vercel.app
```

**Note:** This is required for Electron to run, even in development mode

### 3. Install Dependencies

Run the following to clean up old dependencies and install any new ones:

```bash
pnpm install
```

### 4. Test the Integration

#### In Electron:

```bash
pnpm run dev:electron
```

1. Create or join an interview session
2. Enable your microphone
3. Start speaking
4. Check the console for:
   - `"Speechmatics WebSocket connected"`
   - `"Speechmatics recognition started"`
   - `"Partial transcript: ..."` (as you speak)
   - `"Final transcript: ..."` (when you pause)

#### Expected Console Output:

```
[Zoom logs...]
Speechmatics WebSocket connected
Sent StartRecognition to Speechmatics
Speechmatics recognition started
Started audio capture and streaming to Speechmatics
Partial transcript: hello this is a test
Final transcript: hello this is a test
```

## How It Works

### Architecture

1. **Audio Capture**: Uses Web Audio API to capture microphone input
2. **Processing**: Converts audio to PCM 16-bit format at 16kHz
3. **Streaming**: Sends audio chunks via WebSocket to Speechmatics
4. **Transcription**: Receives partial and final transcripts in real-time
5. **Role Detection**: Determines if speaker is host (interviewer) or participant (candidate)
6. **AI Integration**: Sends tagged transcripts to AI backend

### Speaker Role Detection

The system automatically detects:
- **Interviewer**: User who created the session (isHost = true)
- **Candidate**: Other participants (isHost = false)

Transcripts are tagged accordingly and sent to the AI as:
```
[interviewer] John Smith: Tell me about yourself
[interviewee] Jane Doe: I have 5 years of experience...
```

### Transcript Flow

```
User speaks → Microphone → Web Audio API → PCM Conversion → 
WebSocket → Speechmatics → Transcript → Tagged with role → 
AI Backend → Interview feedback
```

## Troubleshooting

### Issue: "Speechmatics API key not configured"

**Solution:** Create `client/.env.local` file with your API key

### Issue: "Microphone access failed"

**Solution:** 
- Grant microphone permissions in your browser/Electron
- Check if another app is using the microphone
- Try restarting the application

### Issue: WebSocket connection fails

**Possible causes:**
- Invalid API key
- Network connectivity issues
- Speechmatics service is down

**Solution:**
1. Verify your API key is correct
2. Check internet connection
3. Check Speechmatics status page

### Issue: No transcripts appearing

**Check:**
1. Is audio enabled? (microphone button should be on)
2. Are you actually speaking?
3. Check console for errors
4. Verify API key is valid

### Issue: Transcripts are inaccurate

**Notes:**
- Speechmatics works best with clear audio
- Reduce background noise
- Speak clearly and at moderate pace
- Check your microphone quality

## Technical Details

### Audio Format
- **Encoding**: PCM 16-bit little-endian
- **Sample Rate**: 16kHz (optimal for Speechmatics)
- **Channels**: Mono (1 channel)

### WebSocket Endpoint
- **URL**: `wss://eu2.rt.speechmatics.com/v2`
- **Authentication**: JWT token passed as query parameter

### Message Types

**Sent to Speechmatics:**
- `StartRecognition` - Initialize transcription session
- Binary audio data - PCM audio chunks

**Received from Speechmatics:**
- `RecognitionStarted` - Session ready
- `AddPartialTranscript` - Interim results (as you speak)
- `AddTranscript` - Final results (when you pause)
- `EndOfTranscript` - Session ended
- `Error` - Error messages

## Next Steps

### For Production

Consider these enhancements:

1. **AudioWorklet Migration**: Replace `ScriptProcessorNode` with `AudioWorklet` for better performance
2. **Language Selection**: Add UI to select transcription language
3. **Custom Vocabulary**: Add domain-specific terms for better accuracy
4. **Connection Retry Logic**: Enhance reconnection with exponential backoff
5. **Metrics**: Add transcription quality monitoring

### For Multi-Participant Transcription

Currently transcribes only the local user. To transcribe all participants:

1. Would need access to individual participant audio streams from Zoom
2. Zoom SDK limitations may prevent this
3. Alternative: Use mixed audio + Speechmatics diarization feature

## Support

- **Speechmatics Docs**: https://docs.speechmatics.com/
- **Speechmatics Support**: https://speechmatics.com/contact/

## Testing Checklist

- [ ] Created `client/.env.local` with API key
- [ ] Ran `pnpm install`
- [ ] Started Electron app
- [ ] Joined interview session
- [ ] Enabled microphone
- [ ] Verified console shows connection messages
- [ ] Spoke and saw transcripts in console
- [ ] Verified transcripts appear in AI chat
- [ ] Checked speaker role tagging (interviewer vs candidate)

---

✅ **Integration Complete!** The system is ready to use once you add your API key.

