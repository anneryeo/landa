import firebase_admin
from firebase_admin import credentials, db
import time
import random
import math
import threading
from pathlib import Path

# --- FIREBASE INIT ---
BASE_DIR = Path(__file__).resolve().parent
cred = credentials.Certificate(str(BASE_DIR / "serviceAccountKey.json"))
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://landa-demo-default-rtdb.firebaseio.com/'
    # Replace with your actual databaseURL from Firebase console
})

ref = db.reference('/')
control_ref = db.reference('/control')

# --- ROOM BASELINES ---
# Each room has its own learned baseline variance.
# This is the "calibration" — what normal looks like per room.
ROOM_BASELINES = {
    "bedroom":     {"baseline": 0.05, "node_id": "laure_node_01"},
    "bathroom":    {"baseline": 0.04, "node_id": "laure_node_02"},
    "living_room": {"baseline": 0.09, "node_id": "laure_node_03"},
}

# --- ANOMALY THRESHOLDS --- ASSUMPTIONS/HYPOTHETICAL VALUES
FALL_DELTA_THRESHOLD = 0.75      # delta_from_baseline must exceed this
STILLNESS_VARIANCE_MAX = 0.08    # post-spike variance must drop below this
STILLNESS_CONFIRM_SECONDS = 2.0  # must stay still for this long
PET_VARIANCE_CAP = 0.35          # pets produce spikes but never this high

# --- GLOBAL STATE ---
# Tracks what each room is currently doing for the simulation
room_states = {
    "bedroom":     {"mode": "normal", "anomaly_start": None, "stillness_start": None},
    "bathroom":    {"mode": "normal", "anomaly_start": None, "stillness_start": None},
    "living_room": {"mode": "normal", "anomaly_start": None, "stillness_start": None},
}

alert_history = []

def generate_normal_variance(baseline):
    """Simulate realistic normal CSI variance — slight random walk around baseline."""
    noise = random.gauss(0, 0.01)
    return round(max(0.01, baseline + noise), 4)

def generate_fall_signature(phase, baseline):
    """
    A fall has three phases:
    1. spike — sudden chaotic high variance (impact)
    2. stillness — variance drops as person lies motionless
    3. resolved — back to normal after alert dismissed
    """
    if phase == "spike":
        return round(random.uniform(0.78, 0.95), 4)
    elif phase == "stillness":
        # Person is on the floor, very low variance, slight breathing movement
        return round(random.uniform(0.03, 0.07), 4)
    return generate_normal_variance(baseline)

def generate_pet_signature(baseline):
    """
    Pet movement: moderate variance spike, but it KEEPS MOVING.
    Never triggers stillness confirmation.
    """
    return round(random.uniform(0.18, 0.32), 4)

def compute_room_data(room_name, timestamp):
    """
    Core logic: given a room's current mode, generate realistic CSI data
    and determine if an alert should fire.
    """
    config = ROOM_BASELINES[room_name]
    state = room_states[room_name]
    baseline = config["baseline"]
    mode = state["mode"]

    csi_variance = generate_normal_variance(baseline)
    alert_type = None
    stillness_confirmed = False
    status = "normal"

    if mode == "fall_spike":
        csi_variance = generate_fall_signature("spike", baseline)
        # After 1.2 seconds of spike, transition to stillness phase
        if state["anomaly_start"] and (timestamp - state["anomaly_start"]) > 1.2:
            state["mode"] = "fall_stillness"
            state["stillness_start"] = timestamp

    elif mode == "fall_stillness":
        csi_variance = generate_fall_signature("stillness", baseline)
        elapsed_still = timestamp - state["stillness_start"] if state["stillness_start"] else 0
        
        if elapsed_still >= STILLNESS_CONFIRM_SECONDS:
            # BOTH conditions met: high spike + sustained stillness = confirmed fall
            stillness_confirmed = True
            alert_type = "fall_detected"
            status = "anomaly_fall"
            # Log to alert history if not already logged
            if not alert_history or alert_history[-1].get("room") != room_name:
                alert_history.append({
                    "timestamp": int(timestamp),
                    "room": room_name,
                    "alert_type": "fall_detected",
                    "csi_variance": csi_variance,
                    "resolved": False
                })
        else:
            status = "anomaly_fall"

    elif mode == "pet":
        # Pet in room — variance spikes but stillness never confirmed
        csi_variance = generate_pet_signature(baseline)
        # Notice: stillness_confirmed stays False, alert_type stays None
        # This is the pet filter working in real time
        status = "normal"  # No alert fires

    delta = round(csi_variance - baseline, 4)

    return {
        "status": status,
        "csi_variance": csi_variance,
        "baseline_variance": baseline,
        "delta_from_baseline": delta,
        "last_updated": int(timestamp),
        "node_id": config["node_id"],
        "stillness_confirmed": stillness_confirmed,
        "alert_type": alert_type
    }

def trigger_fall(room_name):
    """Call this to simulate a fall in a specific room."""
    print(f"[SIMULATOR] Triggering fall in: {room_name}")
    room_states[room_name]["mode"] = "fall_spike"
    room_states[room_name]["anomaly_start"] = time.time()
    room_states[room_name]["stillness_start"] = None

def trigger_pet(room_name="living_room"):
    """Simulate pet movement — spikes variance but never confirms stillness."""
    print(f"[SIMULATOR] Triggering pet movement in: {room_name}")
    room_states[room_name]["mode"] = "pet"
    # Auto-reset after 8 seconds
    def reset():
        time.sleep(8)
        reset_room(room_name)
    threading.Thread(target=reset, daemon=True).start()

def reset_room(room_name):
    """Return a room to normal state."""
    print(f"[SIMULATOR] Resetting: {room_name}")
    room_states[room_name]["mode"] = "normal"
    room_states[room_name]["anomaly_start"] = None
    room_states[room_name]["stillness_start"] = None

def reset_all():
    for room in room_states:
        reset_room(room)
    alert_history.clear()
    print("[SIMULATOR] All rooms reset to normal.")


def apply_remote_command():
    """Apply control commands written by the mobile app to /control/command."""
    command = control_ref.child("command").get()
    if not command or not isinstance(command, dict):
        return

    cmd_type = command.get("type")
    room = command.get("room")

    if cmd_type == "fall" and room in room_states:
        trigger_fall(room)
    elif cmd_type == "pet" and room in room_states:
        trigger_pet(room)
    elif cmd_type == "reset":
        reset_all()

    control_ref.child("command").set(None)

def write_to_firebase():
    """Main loop — writes complete home state to Firebase every second."""
    print("[SIMULATOR] Landa simulation running. Writing to Firebase...")
    print("Commands: [b]athroom fall | [r]oom bedroom fall | [p]et living room | [x] reset all | [q]uit")
    
    while True:
        now = time.time()

        # Pull and consume mobile-triggered control commands.
        apply_remote_command()
        
        rooms_data = {}
        for room_name in ROOM_BASELINES:
            rooms_data[room_name] = compute_room_data(room_name, now)

        # Determine overall system status
        any_alert = any(
            r["alert_type"] == "fall_detected" for r in rooms_data.values()
        )
        system_status = "alert_active" if any_alert else "all_secure"

        payload = {
            "home_id": "landa_demo_001",
            "rooms": rooms_data,
            "alert_history": alert_history[-10:],  # Last 10 alerts only
            "system_status": system_status,
            "last_sync": int(now)
        }

        ref.set(payload)
        time.sleep(1)

def command_listener():
    """Listen for keyboard commands to trigger scenarios."""
    while True:
        cmd = input().strip().lower()
        if cmd == 'b':
            trigger_fall("bathroom")
        elif cmd == 'r':
            trigger_fall("bedroom")
        elif cmd == 'p':
            trigger_pet("living_room")
        elif cmd == 'x':
            reset_all()
        elif cmd == 'q':
            print("[SIMULATOR] Shutting down.")
            break

if __name__ == "__main__":
    # Run Firebase writer in main thread, command listener in background
    threading.Thread(target=command_listener, daemon=True).start()
    write_to_firebase()