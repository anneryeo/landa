# Landa MVP Build Spec (React Native + Segmented Frontend/Backend)

## Purpose
This file is the single source of truth for recreating the Landa MVP in a brand-new repository.
A new LLM should be able to read only this file and reproduce the working app quickly.

## Product Goal
Build a mobile-first MVP that runs on an Android Virtual Device and provides:
1. Real-time home telemetry from Firebase Realtime Database.
2. Alert UI when anomaly/fall states are detected.
3. Admin simulator control screen (same controls as the reference GIF):
   - Reset All Secure
   - Trigger Bathroom Fall
   - Trigger Bedroom Fall
   - Pet in Living Room
4. Python simulator backend that writes room data and consumes control commands from mobile.

## Required Top-Level Structure
Create this exact structure:

- frontend/
  - mobile/                # React Native (Expo) app for Android emulator
  - webapp/                # Optional existing web client (Vite React)
- backend/
  - simulator/             # Python simulator writing to Firebase
- .gitignore
- PROGRESS.md

## Runtime Data Contract (Firebase Realtime Database)
Use these root keys:

1. /rooms
- bathroom
- bedroom
- living_room
Each room object includes:
- status
- csi_variance
- baseline_variance
- delta_from_baseline
- last_updated
- node_id
- stillness_confirmed
- alert_type

2. /system_status
- all_secure
- anomaly_fall
- alert_active (optional aggregate)

3. /alert_history
Array of recent events:
- timestamp
- room
- alert_type
- csi_variance
- resolved

4. /control/command
Written by mobile app and consumed by simulator:
- type: "fall" | "pet" | "reset"
- room: "bathroom" | "bedroom" | "living_room" | null
- ts: unix ms

## Chunked Build Plan (For LLM Execution)
Apply chunks in order. Commit each chunk.

Commit message format:
- chore(mvp): apply chunk N

### Chunk 0: Repo Skeleton
Create directories:
- frontend/mobile
- frontend/webapp
- backend/simulator

Checkpoint:
- Tree matches "Required Top-Level Structure".

### Chunk 1: Backend Simulator Core
Create/update:
- backend/simulator/simulate.py
- backend/simulator/requirements.txt

requirements.txt must include:
- firebase-admin

simulate.py must:
1. Load service account from path relative to file:
   - backend/simulator/serviceAccountKey.json
2. Initialize firebase_admin with databaseURL.
3. Simulate room baselines and variance updates every 1 second.
4. Write payload to root (/).
5. Read /control/command each loop and apply:
   - type=fall -> trigger_fall(room)
   - type=pet -> trigger_pet(room)
   - type=reset -> reset_all()
6. Clear /control/command after applying command.
7. Keep keyboard command listener for local manual simulation.

Checkpoint command:

    python backend/simulator/simulate.py

Expected:
- Simulator prints periodic writes.
- No path errors for credentials when key exists.

### Chunk 2: React Native App Scaffold (Android)
From repo root:

    npx create-expo-app@latest frontend/mobile --template blank

Then install dependencies:

    cd frontend/mobile
    npm install firebase
    npx expo install react-dom react-native-web

Checkpoint:
- package.json scripts include "android".

### Chunk 3: Mobile Firebase Layer
Create:
- frontend/mobile/src/firebase.js

firebase.js must export:
- database
- ref
- onValue
- set

Use project config for:
- landa-demo-default-rtdb.firebaseio.com

Checkpoint:
- App can import and call ref/onValue/set without module errors.

### Chunk 4: Mobile MVP App UI + Logic
Update:
- frontend/mobile/App.js

App.js must include:
1. Phase flow:
   - splash -> onboarding -> app
2. Realtime subscription:
   - onValue(ref(database, "/"), ...)
3. Home dashboard tab with live room variance data.
4. Alert full-screen view when system_status contains "anomaly".
5. Admin control panel screen with:
   - Status row
   - Floor plan visual
   - Four control buttons matching GIF behavior
6. Control button handlers writing commands to /control/command with set().

Mandatory control writes:
- Reset: { type: "reset", room: null, ts }
- Bathroom fall: { type: "fall", room: "bathroom", ts }
- Bedroom fall: { type: "fall", room: "bedroom", ts }
- Pet: { type: "pet", room: "living_room", ts }

Checkpoint command:

    npm run android

Expected on AVD:
- App launches.
- Tabs visible.
- Admin panel opens from Home.

### Chunk 5: Segment Existing Web Client (Optional but Recommended)
If a Vite web client exists, place it under:
- frontend/webapp

Keep it buildable:

    cd frontend/webapp
    npm run build

Checkpoint:
- Build succeeds.

### Chunk 6: Project Hygiene + Secrets
Root .gitignore must include:
- backend/simulator/serviceAccountKey.json
- node_modules
- dist
- .env

Checkpoint:
- serviceAccountKey.json is not tracked by git.

## Android Virtual Device Workflow (Windows)

### Prerequisites
Install:
1. Android Studio (SDK + Platform Tools + at least one AVD image)
2. Node.js LTS
3. Python 3.10+

Set environment variables:
- ANDROID_HOME = %LOCALAPPDATA%\Android\Sdk
- Add to PATH:
  - %ANDROID_HOME%\platform-tools
  - %ANDROID_HOME%\emulator

### Run Sequence
Terminal A (backend):

    cd backend/simulator
    python -m venv .venv
    .\.venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    python simulate.py

Terminal B (mobile):

    cd frontend/mobile
    npm install
    npm run android

Expected:
- Expo launches app in emulator.
- Home tab shows live room data.
- Admin control buttons change simulator behavior.

## Firebase Setup

### Web/Mobile Client Config
Use frontend/mobile/src/firebase.js with project values.

### Service Account for Backend
Place key here:
- backend/simulator/serviceAccountKey.json

Source:
- Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key

### Firebase Rules (MVP only)
Use permissive dev rules temporarily for MVP testing.
For production, tighten rules and require auth.

## Acceptance Criteria (MVP Done)
All must pass:
1. Android app runs on AVD from npm run android.
2. Simulator runs and writes updates every second.
3. Mobile app reflects live changes without refresh.
4. Pressing each control button causes expected simulator transition.
5. Anomaly state displays alert screen.
6. Repository is segmented into frontend/ and backend/.

## Quick Rebuild Script (Human/LLM Friendly)
From a blank repo, execute in this order:
1. Create structure from "Required Top-Level Structure".
2. Implement backend simulator (Chunk 1).
3. Scaffold Expo app + install deps (Chunk 2).
4. Add mobile firebase module (Chunk 3).
5. Implement App.js logic/UI (Chunk 4).
6. Configure .gitignore and secrets handling (Chunk 6).
7. Run backend and mobile concurrently and verify acceptance criteria.

## Current Repo Notes
This repository already contains:
- frontend/mobile (Expo React Native MVP)
- backend/simulator (Python Firebase simulator with remote command ingestion)
- frontend/webapp (legacy web client)

If behavior drifts, treat this file as canonical and reconcile implementation to this spec.
