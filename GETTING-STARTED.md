# Getting Started

This repo contains two runnable apps and a Python hardware simulator.

```
landa/
├── reference/       # React + Vite web dashboard
└── app/             # React Native + Expo mobile app
```

## Prerequisites

- Node.js 18+
- For mobile: Android Studio (with a running emulator) or Xcode

---

## 1. Web Dashboard (`reference/`)

```bash
cd reference
npm install
npm run dev
```

Opens at `http://localhost:5173`.

---

## 2. Mobile App (`app/`)

Start the Expo dev server:

```bash
cd app
npm install
npx expo start
```

Then press `a` to open on an Android emulator, `i` for iOS simulator, or scan the QR code with Expo Go on a physical device.

Or launch directly on a platform:

```bash
npx expo start --android
npx expo start --ios
```


