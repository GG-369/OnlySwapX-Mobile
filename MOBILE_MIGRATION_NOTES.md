# OnlySwapX Mobile Migration

## Native sensors implemented

| Sensor | Package | Screen | Purpose |
| --- | --- | --- | --- |
| Camera / Gallery | `expo-image-picker` | `app/(tabs)/profile.tsx` | Update profile photo from camera or media library. |
| GPS | `expo-location` | `app/(tabs)/index.tsx` | Detect user location, reverse geocode it, and prioritize nearby campus skills. |

## Required install sync

Run this locally after pulling the files:

```bash
npx expo install expo-image-picker expo-location expo-secure-store
npm install
```

## Demo route

1. Sign in.
2. Open Discover and accept GPS permission.
3. Propose an exchange with a custom message.
4. Open Intercambios and create a session with custom topic, date, credits and duration.
5. Open Sesiones and submit a review with custom rating and comment.
6. Open Perfil and update the profile photo using camera or gallery.
