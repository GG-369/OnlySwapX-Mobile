# OnlySwapX Mobile Migration

## Native sensors implemented

| Sensor | Package | Screen | Purpose |
| --- | --- | --- | --- |
| Camera / Gallery | `expo-image-picker` | `app/(tabs)/profile.tsx` | Update profile photo from camera or media library. |
| GPS | `expo-location` | `app/(tabs)/index.tsx` | Detect user location, reverse geocode it, and prioritize nearby campus skills. |
| Microphone / Audio | `expo-av` | `app/exchanges/[id]/chat.tsx` | Record, preview, send, and play voice notes in exchange chats. |

## Required install sync

Run this locally after pulling the files:

```bash
npx expo install expo-image-picker expo-location expo-av expo-secure-store
npm install
```

The execution environment blocked npm registry access while generating this migration, so regenerate `package-lock.json` locally before committing if you use `npm ci`.

## Demo route

1. Sign in.
2. Open Discover and accept GPS permission.
3. Propose an exchange from a nearby skill.
4. Open Intercambios, enter Chat, record and send a voice note.
5. Open Perfil and update the profile photo using camera or gallery.
