# Getting Started

This repo contains two runnable apps and a Python hardware simulator.

```
landa/
├── reference/       # React + Vite web dashboard
├── app/             # React Native + Expo mobile app
└── backend/
    └── simulator/   # Python CSI data simulator
```

## Prerequisites

- Node.js 18+
- Python 3.9+
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

---

## 3. Hardware Simulator (`backend/simulator/`)

The simulator pushes realistic CSI data to Firebase so both apps have live data without physical ESP32 hardware.

```bash
cd backend/simulator
pip install -r requirements.txt
python simulate.py
```

While running, use these keyboard commands to trigger scenarios:

| Key | Action                         |
| --- | ------------------------------ |
| `b` | Trigger fall in **B**athroom   |
| `r` | Trigger fall in bed**R**oom    |
| `p` | Trigger **P**et movement       |
| `x` | Reset all rooms to normal      |
| `q` | Quit                           |

You can also trigger scenarios directly from the Admin Control Panel in the web dashboard.
