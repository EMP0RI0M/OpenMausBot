# OpenMausBot Mobile (Expo / React Native)

A cross-platform (iOS, Android, Web) mobile application for **OpenMausBot** built with **Expo**, **React Native**, and **TypeScript**.

It connects natively to OpenMausBot's local desktop daemon, Companion sidecar, Tailscale nodes, or remote Cloudflare tunnels, and also supports an offline standalone mode.

---

## 📱 Features

- **Fleet Management & Roster**: Switch between multiple autonomous AI agents (Claude, Codex, Grok, Ollama, custom models), monitor statuses, and deploy new agents with custom system prompts.
- **Real-Time Streaming Chat**: Live SSE (Server-Sent Events) event streaming with real-time response rendering and markdown/code block formatting.
- **Action & Permission Cards**: 1-tap interactive approval cards (`Approve`, `Deny`, `Always allow`), structured multi-choice questions (`AskUserQuestion`), and HPKE credential injection.
- **Tool Activity Telemetry**: Visual tool execution cards for terminal bash commands, file I/O, browser automation, and VM tasks with status pills.
- **Automations & Routines**: Monitor scheduled cron jobs and manually trigger routine workflows.
- **Voice Synthesis & Dictation**: Text-to-speech voice readout for assistant responses and voice input.
- **QR Code & Network Pairing**:
  - Point and shoot QR camera scanner (using `expo-camera`).
  - 6-digit one-time passcodes.
  - Tailscale (`*.ts.net`) and direct bearer token authentication.
- **Secure Token Storage**: Encrypted device tokens using `expo-secure-store`.
- **Tactile Haptics**: Native haptic feedback via `expo-haptics`.

---

## 🚀 Getting Started

### 1. Install Dependencies

From the repository root:

```sh
pnpm install
```

### 2. Run with Expo

Start the development server:

```sh
pnpm mobile
# or
pnpm mobile:android  # Run on Android emulator / connected device
pnpm mobile:ios      # Run on iOS simulator (macOS)
pnpm mobile:web      # Run in web browser
```

Scan the Metro QR code using the **Expo Go** app on your iOS or Android device.

---

## 🔗 Pairing with Desktop OpenMausBot

1. Start your OpenMausBot desktop app or companion sidecar:
   ```sh
   pnpm companion
   # or
   pnpm dev:server
   ```
2. In the mobile app, navigate to the **Pair** tab:
   - **Scan QR Code**: Scan the pairing QR code displayed in the desktop panel.
   - **Manual Code**: Enter your desktop's address (e.g. `http://192.168.1.50:8810` or `mymac.tail1234.ts.net:8810`) along with the 6-digit pairing code.
   - **Direct Bearer Token**: Connect directly to any hosted tunnel with device token authentication.

---

## 📦 Building Standalone Mobile Binaries (EAS Build)

To build production `.apk` / `.aab` for Android or `.ipa` for iOS using Expo Application Services (EAS):

```sh
cd apps/mobile
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile preview
```

---

## 📂 Project Architecture

```
apps/mobile/
├── assets/                  # Icons, splash images, adaptive assets
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AttentionBanner.tsx  # Pending action indicator drawer
│   │   ├── BotAvatar.tsx        # Avatar with persona badge & pulse
│   │   ├── ChatInput.tsx        # Multiline input, voice & interrupt
│   │   ├── Header.tsx           # Navigation header & network pill
│   │   ├── MessageItem.tsx      # Markdown, code blocks & cards
│   │   ├── OptionCardView.tsx   # Approvals & question answer cards
│   │   └── ToolActivityBadge.tsx# Tool execution log badge
│   ├── context/
│   │   ├── OpenMausContext.tsx  # Central state & SSE stream sync
│   │   └── mockData.ts          # Standalone simulation dataset
│   ├── screens/
│   │   ├── ChatScreen.tsx       # Conversation timeline
│   │   ├── BotsScreen.tsx       # Fleet overview & agent creator
│   │   ├── PairingScreen.tsx    # QR scanner & node configuration
│   │   ├── RoutinesScreen.tsx   # Scheduled automations & runner
│   │   └── SettingsScreen.tsx   # Latency test, haptics & cache
│   ├── services/
│   │   ├── api.ts               # Companion API client & SSE stream
│   │   ├── haptics.ts           # Expo haptic feedback
│   │   ├── speech.ts            # Voice synthesis (TTS)
│   │   └── storage.ts           # SecureStore & AsyncStorage
│   ├── theme/
│   │   └── colors.ts            # Neon/dark palette & design tokens
│   ├── types/
│   │   └── models.ts            # TypeScript interfaces
│   └── App.tsx                  # Tab navigator & root component
├── app.json                 # Expo configuration
├── babel.config.js          # Babel preset
├── package.json             # Mobile dependencies & scripts
└── tsconfig.json            # TypeScript configuration
```
