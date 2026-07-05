# RIPPLE Jarvis Realtime Chatroom v15.35

## LiveKit Offline Generator Logger Fix

This update fixes the LiveKit offline MP3 generator error:

```text
logger not initialized. did you forget to run initializeLogger()?
```

The generator now initializes the LiveKit Agents logger before creating `inference.TTS`.

## Replace

```text
scripts/              -> scripts/
jarvis-voice-agent/   -> jarvis-voice-agent/
README.md             -> README.md
```

## Run

```powershell
cd D:\realtime-chatroom
Set-ExecutionPolicy -Scope Process Bypass -Force

.\scripts\generate-bingo-livekit-mp3-pack.ps1 `
  -UsbDir "E:\bingo-livekit-tagalog" `
  -DelayMs 2500 `
  -RetryCount 6 `
  -RetryDelayMs 5000 `
  -Overwrite
```

If generation stops midway, resume without `-Overwrite`.
