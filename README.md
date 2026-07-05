# v15.21 Safe Offline MP3 Generator Endpoint Fix

Fix ito para sa generator error na `Invalid URI: The hostname could not be parsed` kahit tama naman ang TTS URL.

## Palitan

```text
page.tsx                         -> app/page.tsx
globals.css                      -> app/globals.css
README.md                        -> README.md
package.json                     -> package.json
tsconfig.json                    -> tsconfig.json
app/api/livekit-token/route.ts   -> app/api/livekit-token/route.ts
app/api/tts/route.ts             -> app/api/tts/route.ts
public/                          -> public/
scripts/                         -> scripts/
```

## Generate offline MP3 pack

Mas safe gamitin ang variable:

```powershell
cd D:ealtime-chatroom
Set-ExecutionPolicy -Scope Process Bypass -Force

$tts = "https://realtime-chatroom-orpin.vercel.app/api/tts"

.\scripts\generate-bingo-elevenlabs-mp3-pack.ps1 `
  -TtsEndpoint $tts `
  -UsbDir "E:ingo-elevenlabs-tagalog" `
  -DelayMs 3500 `
  -RetryCount 8 `
  -RetryDelayMs 7000 `
  -Overwrite
```

Bagong voice format:

```text
The next number is B, eight. I repeat, B, eight. [Pinoy Bingo joke]
```

## Check complete pack

```powershell
.\scripts	est-offline-voice-pack.ps1
```

Expected:

```text
OK: Complete 75 MP3 voice pack found
```

## Deploy after successful generation

```powershell
npm run build
git add app/page.tsx app/globals.css app/api/livekit-token/route.ts app/api/tts/route.ts package.json tsconfig.json README.md public scripts
git commit -m "Fix offline Bingo MP3 generator endpoint and add voice pack"
git push
vercel --prod
```
