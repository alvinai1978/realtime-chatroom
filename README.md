# v15.22 First / Regular / Last Bingo Voice Pack Fix

Fix ito para sa MP3 generation bug kung saan parang ones digit lang ang nababasa, halimbawa `nine` imbes na `fifty nine`, or `eight` imbes na `twenty eight`.

## Bagong voice format

Regular call:

```text
The next number is G, fifty nine, number 59. I repeat, G, fifty nine, number 59. [Pinoy Bingo joke]
```

First call:

```text
Eto na ang unang numero. N, thirty four, number 34. I repeat, N, thirty four, number 34. [Pinoy Bingo joke]
```

Last call / 75th ball:

```text
Eto na ang huling numero, pang 75 na bola ay B, ten, number 10. I repeat, B, ten, number 10. [Pinoy Bingo joke]
```

## Important change

Dati 75 MP3 files lang ang generated. Ngayon 225 MP3 files na:

```text
public/voices/bingo-elevenlabs-tagalog/regular/  -> 75 files
public/voices/bingo-elevenlabs-tagalog/first/    -> 75 files
public/voices/bingo-elevenlabs-tagalog/last/     -> 75 files
```

Kailangan ito dahil random ang first at last called number. Halimbawa puwedeng `N34` ang first call, or puwedeng `B10` ang last call.

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

## Generate new offline MP3 pack

Dahil iba na ang format, gamitin muna ang `-Overwrite`:

```powershell
cd D:\realtime-chatroom
Set-ExecutionPolicy -Scope Process Bypass -Force

$tts = "https://realtime-chatroom-orpin.vercel.app/api/tts"

.\scripts\generate-bingo-elevenlabs-mp3-pack.ps1 `
  -TtsEndpoint $tts `
  -UsbDir "E:\bingo-elevenlabs-tagalog" `
  -DelayMs 3500 `
  -RetryCount 8 `
  -RetryDelayMs 7000 `
  -Overwrite
```

## Resume kung naputol

Kapag naputol dahil 502/rate limit, ulitin pero tanggalin ang `-Overwrite` para missing files lang ang ituloy:

```powershell
.\scripts\generate-bingo-elevenlabs-mp3-pack.ps1 `
  -TtsEndpoint $tts `
  -UsbDir "E:\bingo-elevenlabs-tagalog" `
  -DelayMs 3500 `
  -RetryCount 8 `
  -RetryDelayMs 7000
```

## Check complete pack

```powershell
.\scripts\test-offline-voice-pack.ps1
```

Expected:

```text
OK: Complete 225 MP3 voice pack found
```

## Test sample files

```powershell
Start-Process .\public\voices\bingo-elevenlabs-tagalog\regular\g-59.mp3
Start-Process .\public\voices\bingo-elevenlabs-tagalog\first\n-34.mp3
Start-Process .\public\voices\bingo-elevenlabs-tagalog\last\b-10.mp3
```

## Deploy after successful generation

```powershell
npm run build
git add app/page.tsx app/globals.css app/api/livekit-token/route.ts app/api/tts/route.ts package.json tsconfig.json README.md public scripts
git commit -m "Fix Bingo MP3 voice pack first regular last calls"
git push
vercel --prod
```
