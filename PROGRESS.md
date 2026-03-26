# Landa Repo Replication Playbook (Chunked)

## 1) Snapshot Identity (Source of Truth)

Use this document to replicate the current repository state in controlled chunks.

Snapshot metadata:
- Date: 2026-03-26
- Source branch: reyes
- Source root: D:/Developer/Projects/landa-demo
- Current tracked file count: 3519
- Practical app file count (excluding .venv): 30
- Working tree is intentionally dirty in this snapshot:
  - Untracked: webapp/src/components/AlertScreen.jsx
  - Untracked: webapp/src/components/Dashboard.jsx
  - Untracked: webapp/src/components/AdminControlPanel.jsx
  - Untracked: webapp/src/styles/AdminControlPanel.css

Important:
- Perfect functional replication for this app is defined by the 30 practical files and hashes listed below.
- Full bit-for-bit git replication including the tracked .venv is optional and handled in Section 7.

## 2) Replication Rules For Any LLM

Follow these rules exactly:
1. Do not invent, rename, or omit files.
2. Reproduce files in chunk order.
3. After each chunk, run verification commands and stop on mismatch.
4. Do not auto-format or "improve" code during replication.
5. Keep line endings consistent within target repo.
6. Commit after each chunk using the chunk commit message template.

Chunk commit template:
- chore(replication): apply chunk N

## 3) Chunk Plan (Recommended)

### Chunk 0: Initialize target repo skeleton
Goal:
- Create folder structure only.

Create directories:
- simulator
- webapp
- webapp/public
- webapp/src
- webapp/src/assets
- webapp/src/components
- webapp/src/hooks
- webapp/src/styles

No file content yet.

Checkpoint:
- Directory tree exists exactly as listed.

---

### Chunk 1: Root + simulator domain
Files to copy exactly:
- .gitignore
- simulator/requirements.txt
- simulator/simulate.py

Why this chunk:
- Sets Python simulation behavior and secret-ignore policy first.

Checkpoint commands (PowerShell):

    Get-FileHash -Algorithm SHA256 .gitignore
    Get-FileHash -Algorithm SHA256 simulator/requirements.txt
    Get-FileHash -Algorithm SHA256 simulator/simulate.py

---

### Chunk 2: Webapp project scaffolding
Files to copy exactly:
- webapp/package.json
- webapp/package-lock.json
- webapp/vite.config.js
- webapp/eslint.config.js
- webapp/index.html
- webapp/README.md
- webapp/public/favicon.svg
- webapp/public/icons.svg

Why this chunk:
- Establishes JS dependency graph, scripts, Vite config, static public assets.

Checkpoint commands:

    npm --prefix webapp ci
    npm --prefix webapp run build

Build must succeed.

---

### Chunk 3: Runtime bootstrap + data layer
Files to copy exactly:
- webapp/src/main.jsx
- webapp/src/index.css
- webapp/src/firebase.js
- webapp/src/hooks/useLandaData.js

Why this chunk:
- Connects app entry point and Firebase runtime hook.

Checkpoint command:

    npm --prefix webapp run dev

Expectation:
- Dev server starts without import-resolution errors.

---

### Chunk 4: App shell + global UI behavior
Files to copy exactly:
- webapp/src/App.jsx
- webapp/src/App.css

Why this chunk:
- Defines app phases, tab shell, alert orchestration, and primary styling tokens.

Checkpoint:
- App renders.
- No unresolved imports from App.jsx.

---

### Chunk 5: Feature components + Admin control panel
Files to copy exactly:
- webapp/src/components/SplashScreen.jsx
- webapp/src/components/OnboardingScreen.jsx
- webapp/src/components/PairNodeScreen.jsx
- webapp/src/components/MapScreen.jsx
- webapp/src/components/SimulatorPanel.jsx
- webapp/src/components/AlertScreen.jsx
- webapp/src/components/Dashboard.jsx
- webapp/src/components/AdminControlPanel.jsx
- webapp/src/styles/AdminControlPanel.css

Why this chunk:
- Delivers all UI screens referenced by App.jsx, including untracked files needed for runtime parity.
- AdminControlPanel displays floor plan with live CSI data and scenario controls (matches GIF).

Checkpoint:
- Dev server hot reload succeeds.
- No missing component import errors.
- AdminControlPanel renders when opened.

---

### Chunk 6: Asset layer
Files to copy exactly:
- webapp/src/assets/hero.png
- webapp/src/assets/react.svg
- webapp/src/assets/vite.svg
- webapp/src/assets/SplashScreen.jsx

Why this chunk:
- Completes visual/static resources.

Checkpoint:
- App shows images/icons without 404 errors in browser devtools.

---

### Chunk 7 (Optional): Full historical parity including tracked .venv
Use only if you need exact git-object parity, not just app behavior.

Preferred method:
1. Create bundle from source:

    git bundle create landa-demo.bundle --all

2. Clone from bundle into target:

    git clone landa-demo.bundle target-repo

3. Checkout branch:

    git checkout reyes

Why:
- Avoids chunk-copying 3000+ tracked virtual-environment files manually.

## 4) Authoritative File Manifest (Functional Snapshot)

The following 30 files define practical replication state.

1. .gitignore
2. simulator/requirements.txt
3. simulator/simulate.py
4. webapp/README.md
5. webapp/eslint.config.js
6. webapp/index.html
7. webapp/package-lock.json
8. webapp/package.json
9. webapp/public/favicon.svg
10. webapp/public/icons.svg
11. webapp/src/App.css
12. webapp/src/App.jsx
13. webapp/src/assets/SplashScreen.jsx
14. webapp/src/assets/hero.png
15. webapp/src/assets/react.svg
16. webapp/src/assets/vite.svg
17. webapp/src/components/MapScreen.jsx
18. webapp/src/components/OnboardingScreen.jsx
19. webapp/src/components/PairNodeScreen.jsx
20. webapp/src/components/SimulatorPanel.jsx
21. webapp/src/components/SplashScreen.jsx
22. webapp/src/components/AlertScreen.jsx
23. webapp/src/components/Dashboard.jsx
24. webapp/src/components/AdminControlPanel.jsx
25. webapp/src/firebase.js
26. webapp/src/hooks/useLandaData.js
27. webapp/src/index.css
28. webapp/src/main.jsx
29. webapp/src/styles/AdminControlPanel.css
30. webapp/vite.config.js

## 5) Firebase Setup & Integration (Critical)

### Web App
Already configured in `webapp/src/firebase.js`:
- Uses demo Firebase project
- No credentials file needed
- Reads real-time data via `useLandaData` hook
- Auto-connects on app startup

### Simulator & Service Account
1. Obtain Firebase service account private key:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download as `simulator/serviceAccountKey.json`

2. Verify connection:

    pip install firebase-admin
    python simulator/simulate.py

   Expected output: ~1 second interval CSI variance writes to Firebase

3. Troubleshooting:
   - Missing serviceAccountKey.json → "FileNotFoundError"
   - Invalid credentials → "Auth error"
   - Wrong database URL → Hangs silently (fix in simulate.py line 12)

### Using AdminControlPanel
- Displays live floor plan with CSI variance per room
- Shows system status badge
- Trigger scenario buttons (bathroom fall, bedroom fall, pet)
- Reset all rooms button
- Requires simulator running + Firebase connected

## 6) SHA256 Verification Table (Must Match)

- cd2fdc64262bf1517e8a1aa1c041741c19d276e81c4cd280429ad4f7358ae9e4  .gitignore
- e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  simulator/requirements.txt
- 6345f80d8cb56e0520be16dece4f737718fd9fb92d951a69fb26091eb6325c0c  simulator/simulate.py
- a2648adf2f4e92d188d79e14c2b26e207bb0654e90beb5d99e7eb594d995fe65  webapp/README.md
- f6477b521c0d4c5ab0ac73d8cc8ce484795d23bece7cbbd0cd2a9f4301337532  webapp/eslint.config.js
- f6497c94da453f5aed0e527344245018fe35db959134ca3bb2be356132c1ef54  webapp/index.html
- 7bbb056bcc926ef6992c797f795c5396b00a27c75f88f04dc32b40ef89a65ca5  webapp/package-lock.json
- b221cc38c0e97395ca86920b5e31dedc8a7819489551db5b6cd815d4934f1028  webapp/package.json
- 61bc9a161de58248288e6905425d7180f0624c2865007b97d763fdac12043a66  webapp/public/favicon.svg
- 7ca2d67c9c3aebf50cdc8709ee8aacf8cdb8cc7ea6325ea94939caef5da1c53d  webapp/public/icons.svg
- 488abbd0c0c129ec0ef6c63dced4b8024028420588e418dfd45c2f3ea62ae38b  webapp/src/App.css
- 9a06f20c291de7e07e962d239c2abbb6f47abb69dec342ee9511149cddcc4ad5  webapp/src/App.jsx
- dd004a967922db5a80cc8d64c79e9c02fdc5bb1219377f4e03eb99d32607d948  webapp/src/assets/SplashScreen.jsx
- 72a860570eddf1dd9988f26c7106c67be286bc9f2fd3303c465ce87edb1ae6cd  webapp/src/assets/hero.png
- 35ef61ed53b323ae94a16a8ec659b3d0af3880698791133f23b084085ab1c2e5  webapp/src/assets/react.svg
- 2f1f6c6f90a0ef7422cbb4cfafcd8ad329c507a18afdc34cc21fa72179b9c54a  webapp/src/assets/vite.svg
- 6f3a1f0d42d0acb9c205973dc3b24fd373c11975a61e66041a72fa9490f25bd6  webapp/src/components/MapScreen.jsx
- 2b53a0cc52b4537f6ef4e2520c20b108fb9b4d273fae4e6c3c73c768df55ae03  webapp/src/components/OnboardingScreen.jsx
- 4a9390b923755e8d21ce7b998a280dd1b67416570a11c6ecf654b6304e066ae1  webapp/src/components/PairNodeScreen.jsx
- 99fc2753f9a4567f13fb389bf2a212d3152ea9f68250402b36db690037c92552  webapp/src/components/SimulatorPanel.jsx
- a0b11fdc15ab3d6ddeeb73f33bdbb279376831b43935a50d7000059f503aa6ae  webapp/src/components/SplashScreen.jsx
- 2a3616169d1a4e42b16e2380d6720baf96ac70e3ec886d5bbe71ece7efea65cf  webapp/src/components/AlertScreen.jsx
- c3e1819ae412f277d586035ee6018a83d3e941d83878fa476cafee1e60efedcc  webapp/src/components/Dashboard.jsx
- df1e6b7855c23c6a2bdc66d72f046079e20c646b7bcb8eaaf583b6a9139aeddd  webapp/src/firebase.js
- 1172a14fb06b0166e817d1fcf520372700fdc93b30cf50aa0de2c6b3dcb19a75  webapp/src/hooks/useLandaData.js
- 0c57a399408ef4f2a874147f4f300cb332989f1e01610956b0d415a6e2d0465d  webapp/src/index.css
- ae81f1c01f2c8018a1ba5cf73171921c8982d90b049bb6b039ea82f8e1dec958  webapp/src/main.jsx

**New components (AdminControlPanel):**
## 7) Automated Verification Script (Target Repo)

Run this after each chunk to validate hashes:

    $expected = @{
      '.gitignore'='cd2fdc64262bf1517e8a1aa1c041741c19d276e81c4cd280429ad4f7358ae9e4'
      'simulator/requirements.txt'='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      'simulator/simulate.py'='6345f80d8cb56e0520be16dece4f737718fd9fb92d951a69fb26091eb6325c0c'
      'webapp/README.md'='a2648adf2f4e92d188d79e14c2b26e207bb0654e90beb5d99e7eb594d995fe65'
      'webapp/eslint.config.js'='f6477b521c0d4c5ab0ac73d8cc8ce484795d23bece7cbbd0cd2a9f4301337532'
      'webapp/index.html'='f6497c94da453f5aed0e527344245018fe35db959134ca3bb2be356132c1ef54'
      'webapp/package-lock.json'='7bbb056bcc926ef6992c797f795c5396b00a27c75f88f04dc32b40ef89a65ca5'
      'webapp/package.json'='b221cc38c0e97395ca86920b5e31dedc8a7819489551db5b6cd815d4934f1028'
      'webapp/public/favicon.svg'='61bc9a161de58248288e6905425d7180f0624c2865007b97d763fdac12043a66'
      'webapp/public/icons.svg'='7ca2d67c9c3aebf50cdc8709ee8aacf8cdb8cc7ea6325ea94939caef5da1c53d'
      'webapp/src/App.css'='488abbd0c0c129ec0ef6c63dced4b8024028420588e418dfd45c2f3ea62ae38b'
      'webapp/src/App.jsx'='9a06f20c291de7e07e962d239c2abbb6f47abb69dec342ee9511149cddcc4ad5'
      'webapp/src/assets/SplashScreen.jsx'='dd004a967922db5a80cc8d64c79e9c02fdc5bb1219377f4e03eb99d32607d948'
      'webapp/src/assets/hero.png'='72a860570eddf1dd9988f26c7106c67be286bc9f2fd3303c465ce87edb1ae6cd'
      'webapp/src/assets/react.svg'='35ef61ed53b323ae94a16a8ec659b3d0af3880698791133f23b084085ab1c2e5'
      'webapp/src/assets/vite.svg'='2f1f6c6f90a0ef7422cbb4cfafcd8ad329c507a18afdc34cc21fa72179b9c54a'
      'webapp/src/components/MapScreen.jsx'='6f3a1f0d42d0acb9c205973dc3b24fd373c11975a61e66041a72fa9490f25bd6'
      'webapp/src/components/OnboardingScreen.jsx'='2b53a0cc52b4537f6ef4e2520c20b108fb9b4d273fae4e6c3c73c768df55ae03'
      'webapp/src/components/PairNodeScreen.jsx'='4a9390b923755e8d21ce7b998a280dd1b67416570a11c6ecf654b6304e066ae1'
      'webapp/src/components/SimulatorPanel.jsx'='99fc2753f9a4567f13fb389bf2a212d3152ea9f68250402b36db690037c92552'
      'webapp/src/components/SplashScreen.jsx'='a0b11fdc15ab3d6ddeeb73f33bdbb279376831b43935a50d7000059f503aa6ae'
      'webapp/src/components/AlertScreen.jsx'='2a3616169d1a4e42b16e2380d6720baf96ac70e3ec886d5bbe71ece7efea65cf'
      'webapp/src/components/Dashboard.jsx'='c3e1819ae412f277d586035ee6018a83d3e941d83878fa476cafee1e60efedcc'
      'webapp/src/firebase.js'='df1e6b7855c23c6a2bdc66d72f046079e20c646b7bcb8eaaf583b6a9139aeddd'
      'webapp/src/hooks/useLandaData.js'='1172a14fb06b0166e817d1fcf520372700fdc93b30cf50aa0de2c6b3dcb19a75'
      'webapp/src/index.css'='0c57a399408ef4f2a874147f4f300cb332989f1e01610956b0d415a6e2d0465d'
      'webapp/src/main.jsx'='ae81f1c01f2c8018a1ba5cf73171921c8982d90b049bb6b039ea82f8e1dec958'
      'webapp/vite.config.js'='5cabb639b6b62e19064337abc9f5b4fda0f83e50a47396ca9a3bba388abfdd13'
    }

    $failed = @()
    foreach ($k in $expected.Keys) {
      if (-not (Test-Path $k)) { $failed += "MISSING  $k"; continue }
      $actual = (Get-FileHash -Algorithm SHA256 $k).Hash.ToLower()
      if ($actual -ne $expected[$k]) { $failed += "MISMATCH $k expected=$($expected[$k]) actual=$actual" }
    }

    if ($failed.Count -eq 0) { 'PASS: all hashes match.' } else { $failed }

## 8) Functional Runbook (Final Acceptance)

Run in target repo:

1. **Web app install/build/run:**

    npm --prefix webapp ci
    npm --prefix webapp run build
    npm --prefix webapp run dev

   Expected: Vite starts cleanly at http://localhost:5173/

2. **Simulator setup & run:**

    python -m venv .venv
    .\.venv\Scripts\Activate.ps1
    pip install firebase-admin
    python simulator/simulate.py

   Expected: Console output shows CSI variance writes ~1/sec

3. **Integration test:**
   - Open browser to http://localhost:5173/
   - Click "Open Simulator" button on home
   - AdminControlPanel displays floor plan with live CSI data badges
   - Click "Trigger Bathroom Fall" and observe:
     - CSI variance spikes in console
     - Floor plan node shows alert glow
     - Alert screen appears after ~2 seconds

## 9) AdminControlPanel Features

The admin control panel screen displays:
- Floor plan with bathroom, bedroom, hallway, living room
- Wi-Fi nodes (📡 icons) with glow effect when alert triggers
- Real-time CSI variance badge
- System status (All Secure / Alert Active)
- Four action buttons:
  - **Reset All Secure** (green) — returns all rooms to normal
  - **Trigger Bathroom Fall** (red) — simulates bathroom fall
  - **Trigger Bedroom Fall** (red) — simulates bedroom fall
  - **Pet in Living Room** (purple) — simulates pet movement

This is the exact UI shown in the attached GIF.

## 10) Notes For The Next LLM Session

If you are the executing LLM in a fresh repo:
1. Apply one chunk only per session.
2. Run hash checks for that chunk.
3. Commit chunk with message: `chore(replication): apply chunk N`
4. Continue to next chunk.
5. **Do not skip Chunk 5** — AlertScreen.jsx, Dashboard.jsx, and AdminControlPanel.jsx are required for runtime.
6. AdminControlPanel requires Firebase connection and running simulator for full functionality.
