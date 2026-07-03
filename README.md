# Realtime Chatroom Jarvis v13.7

BingoTV 75-inch fixed layout hard fix.

## Fix in v13.7

- BingoTV no longer depends on `display: contents`, which can fail on some Smart TV browsers.
- TV screen now uses direct grid sections for Title, Latest Calls, Big Call Number, Patterns, Master Board, Stats, and Winner Verification.
- Main TV screen is forced to one-screen 16:9 fit on desktop/Smart TV sizes.
- The full page scrollbar is hidden on TV layout; panels auto-compress text and board cells.

## Replace files

```text
page.tsx     -> app/page.tsx
globals.css  -> app/globals.css
README.md    -> README.md
```

## Deploy

```bash
git add app/page.tsx app/globals.css README.md
git commit -m "Fix BingoTV 75 inch fixed layout"
git push
vercel --prod
```

After deploy, open BingoTV, hard refresh, then click Fullscreen.
