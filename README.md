<div align="center">

<!-- Replace this image with a screenshot or demo GIF of the app -->

<!-- ![Landa Demo](docs/demo.gif) -->

# Project Landa

**Ambient home safety monitoring. No cameras. No wearables. Just Wi-Fi.**

*3rd Place — Cambridge University Press & Assessment Philippines Women in Tech Hackathon 2026*

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.83-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Expo](https://img.shields.io/badge/Expo-55-000020?logo=expo)](https://expo.dev)
[![Python](https://img.shields.io/badge/Python-Simulator-3776AB?logo=python&logoColor=white)](backend/simulator/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## The Story

Lola Landa passed away a month before this hackathon. My aunts and titos cared for her deeply — but the reality of distance and work meant no one could watch over her 24/7, no matter how much they loved her.

That question stayed with me: *Do we always just have to hope our loved ones are safe?*

Project Landa is named after her. The Wi-Fi sensing nodes in the system are called **Laure Nodes** — after our family name.

Building something technically grounded around that real problem — the gap between love and presence — made this one of the most meaningful things I've worked on.

> *"We can't be there 24/7, no matter how much we love someone."*

---

## What It Does

Landa is an **ambient intelligence platform** for passive, privacy-first home safety monitoring. It uses **Wi-Fi Channel State Information (CSI)** — the data already passing through your home's Wi-Fi signals — to detect falls and unusual inactivity, without any cameras or wearables involved.

Small wall-plug devices (Laure Nodes) establish invisible sensing "corridors" between a home router and receiver. When the system detects something wrong, it sends an alert to caregivers in real time.

**Built for:**

- Elderly family members living alone
- OFW (Overseas Filipino Workers) families monitoring loved ones from abroad
- Anyone who can't always be physically present for the people they care about

---

## Features

### Calm Dashboard

The app stays minimal and quiet under normal conditions — a deliberate "Calm Tech" design choice. When the home is secure, the interface is soft and unobtrusive (`#FFF0F5` background). No noise unless there's a reason for noise.

Shows live CSI variance readings per room, room protection status, and real-time Firebase connection indicator.

### Real-Time Fall Alert

When a fall is detected, the app immediately escalates to a high-contrast, full-screen alert with one-tap access to emergency contacts. No digging through menus when seconds matter.

### Interactive Home Map

A visual floor plan of the monitored home showing active Laure Node positions, sensing corridors, and per-room presence indicators. Caregivers can see exactly where in the home something happened.

### Two-Factor Fall Detection Algorithm

Landa avoids false alarms by requiring both conditions to be true before triggering an alert:

1. **CSI Variance Spike** — A sudden, catastrophic jump in CSI variance (delta > 0.65), indicating rapid mass displacement consistent with a fall.
2. **Sustained Stillness Window** — The variance immediately drops to near-zero and stays there for 2+ seconds, confirming the person is motionless on the floor.

A single spike alone (like someone jumping or a door slamming) doesn't trigger an alert.

### Mass-Displacement Pet Filter

A dog walking through a room creates minor, rapid CSI ripples that stay below the trigger threshold (< 0.35). The algorithm distinguishes the physical signature of a 10kg animal from a human fall, keeping false alarms suppressed without requiring any configuration.

### Prolonged Inactivity Detection

Beyond falls, the system can flag when a room shows no macro-movement over an extended period — useful for detecting incapacitation scenarios or dementia-related wandering at unusual hours.

### Privacy-First by Design

There are no cameras, no microphones, and no wearables. Landa monitors the space, not the person. The only data captured is abstract CSI variance numbers — no images, no biometrics, no video.

### Node Pairing & Onboarding

A step-by-step setup flow guides users through initial configuration and Laure Node pairing. Nodes require a 10-minute calibration window to map room-specific Wi-Fi multipath fingerprints before active monitoring begins.

### Hardware Simulator (Demo Mode)

For development and demonstration, a Python backend simulates the ESP32 hardware, pushing realistic CSI data to Firebase. Scenario triggers (fall, pet activity, reset) are available both from the terminal and from the app UI.

---

## Tech Stack

| Layer              | Technology                               |
| ------------------ | ---------------------------------------- |
| Web Dashboard      | React 19 + Vite 8                        |
| Mobile App         | React Native 0.83 + Expo 55 (TypeScript) |
| Database           | Firebase Realtime Database               |
| Charts             | Recharts                                 |
| Hardware Simulator | Python + firebase-admin                  |
| Target Hardware    | ESP32 microcontroller                    |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Edge Layer                         │
│  ESP32 Laure Node  ──or──  Python Simulator         │
│  (captures Wi-Fi CSI variance per room)             │
└────────────────────┬────────────────────────────────┘
                     │ JSON payloads (1s intervals)
                     ▼
┌─────────────────────────────────────────────────────┐
│            Firebase Realtime Database               │
│  /rooms/{roomId}/csi_variance                       │
│  /rooms/{roomId}/status                             │
│  /alert_history                                     │
│  /system_status                                     │
│  /control/command   ◄── UI trigger commands         │
└──────────┬──────────────────────────┬───────────────┘
           │                          │
           ▼                          ▼
┌──────────────────┐      ┌──────────────────────────┐
│  React Web App   │      │  React Native Mobile App  │
│  (Vite, browser) │      │  (Expo, iOS + Android)    │
│                  │      │                           │
│  • Dashboard     │      │  • Live CSI dashboard     │
│  • Alert Screen  │      │  • Fall alert screen      │
│  • Home Map      │      │  • Room status display    │
│  • Admin Panel   │      │                           │
│  • Simulator UI  │      │                           │
└──────────────────┘      └──────────────────────────┘
```

---

## Firebase Data Model

Each room publishes a standardized payload every second:

```json
{
  "home_id": "landa_demo_001",
  "rooms": {
    "bedroom":     { "csi_variance": 0.051, "status": "normal",      "node_id": "laure_01" },
    "bathroom":    { "csi_variance": 0.045, "status": "normal",      "node_id": "laure_02" },
    "living_room": { "csi_variance": 0.088, "status": "normal",      "node_id": "laure_03" }
  },
  "system_status": "all_secure",
  "alert_history": [],
  "last_sync": 1713214247
}
```

On a fall event, the affected room's status becomes `"anomaly_fall"` and `system_status` becomes `"alert_active"`. The frontends react immediately via Firebase `onValue` listeners — no polling required.

---

## Project Structure

```
landa/
├── backend/
│   └── simulator/
│       ├── simulate.py          # Python CSI data simulator
│       └── requirements.txt     # firebase-admin
├── frontend/
│   ├── webapp/                  # React + Vite web dashboard
│   │   └── src/
│   │       ├── App.jsx          # App routing & phase management
│   │       ├── hooks/
│   │       │   └── useLandaData.js   # Firebase listener hook
│   │       └── components/
│   │           ├── Dashboard.jsx
│   │           ├── AlertScreen.jsx
│   │           ├── MapScreen.jsx
│   │           ├── AdminControlPanel.jsx
│   │           ├── SimulatorPanel.jsx
│   │           ├── OnboardingScreen.jsx
│   │           ├── PairNodeScreen.jsx
│   │           └── SplashScreen.jsx
│   └── mobile/                  # React Native + Expo mobile app
│       └── src/
│           ├── firebase.js
│           └── screens/
│               └── DashboardScreen.tsx
└── README.md
```

---

## Getting Started

See [GETTING-STARTED.md](GETTING-STARTED.md) for full setup and run instructions.

---

## Extended Capabilities (Roadmap)

Because CSI is sensitive to any mass displacement, the algorithm can be tuned for:

- **Respiration tracking** — micro-movements of the chest cavity for sleep apnea / SIDS monitoring
- **Behavioral anomaly detection** — location transitions at unusual hours for dementia wandering alerts
- **Prolonged inactivity check-ins** — flagging rooms with no macro-movement over hours for stroke/incapacitation scenarios

---

## Future Vision: Integrating with Clinivue

Landa handles the **passive** side of remote care — always-on environmental monitoring with zero user interaction required.

[Clinivue](https://clinivue.app) handles the **active** side — cardiovascular measurement using a smartphone camera (rPPG) when the user intentionally checks their vitals.

Together, they form an "Active + Passive" remote care ecosystem: Landa detects that sleep patterns have worsened over three nights, then prompts the family to request a cardiovascular check-in through Clinivue. Moving from reactive emergency alerts to proactive preventative care.

*"The camera doesn't belong on your bedroom ceiling watching you sleep — but the camera in your pocket is a powerful clinical tool when used on your own terms."*

---

## Team

| Name                           | Role                               |
| ------------------------------ | ---------------------------------- |
| **Anne Reyes**           | Concept, architecture, development |
| **Shania Dela Vega**     | Teammate                           |
| **Louella Arce Ng**      | Teammate                           |
| **Kim Caryl Esperanza**  | Teammate                           |
| **Ms. Renilda S. Layno** | Adviser                            |

Built for the **Cambridge University Press & Assessment Philippines Women in Tech Hackathon 2026** — where we placed **3rd**.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

> *Named after Lola Landa. Built with love and a bit of physics.* 🤍
