import { useState } from "react";

// These commands match exactly what the Python simulator does
// They write to Firebase which useLandaData listens to
// But for demo purposes, we also expose them here visually

const COMMANDS = [
  {
    id: "reset",
    label: "Reset: All Secure",
    variant: "sim-btn--reset",
    status: "all_secure",
    csi: 0.02,
    emoji: "🛡️",
  },
  {
    id: "bathroom_fall",
    label: "Trigger Bathroom Fall",
    variant: "sim-btn--fall",
    status: "anomaly_fall_bathroom",
    csi: 0.89,
    emoji: "🚨",
  },
  {
    id: "bedroom_fall",
    label: "Trigger Bedroom Fall",
    variant: "sim-btn--fall",
    status: "anomaly_fall_bedroom",
    csi: 0.89,
    emoji: "🚨",
  },
  {
    id: "pet",
    label: "Pet in Living Room",
    variant: "sim-btn--pet",
    status: "pet_detected",
    csi: 0.14,
    emoji: "🐾",
  },
];

export default function SimulatorPanel({ onClose }) {
  const [activeStatus, setActiveStatus] = useState("all_secure");
  const [csiVal, setCsiVal] = useState(0.02);
  const [lastTriggered, setLastTriggered] = useState(null);

  // In a real deployment, these buttons send commands to Firebase
  // For prototype demo, they update local state to show what would happen
  // The actual Firebase write is handled by the Python simulator
  const handleCommand = async (cmd) => {
    setActiveStatus(cmd.status);
    setCsiVal(cmd.csi);
    setLastTriggered(cmd.id);

    // Try to write to Firebase if available (mirrors Python simulator behavior)
    try {
      // Import firebase dynamically - if firebase.js exists in the project
      const { db } = await import("../firebase.js");
      const { ref, set } = await import("firebase/database");
      const payload = {
        system_status: cmd.status,
        csi_variance: cmd.csi,
        last_sync: Date.now() / 1000,
        nodes: [
          { id: "n1", room: "Bathroom", label: "Node 1", active: true },
          { id: "n2", room: "Bedroom", label: "Node 2", active: true },
        ],
      };
      await set(ref(db, "landa/home"), payload);
    } catch (e) {
      // Firebase unavailable or not configured — UI-only demo mode
      console.warn("[SimPanel] Firebase write skipped:", e.message);
    }
  };

  const isAlert = activeStatus.includes("anomaly");
  const isPet = activeStatus === "pet_detected";

  return (
    <div className="sim-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sim-panel">
        <div className="sim-handle" />
        <h3 className="sim-title">Simulator Panel</h3>
        <p className="sim-sub">Wi-Fi Sensing · Home Presence Detection</p>

        {/* Status row */}
        <div className="sim-status-row">
          <span className="sim-status-label">Status</span>
          <span className={`sim-status-val ${isAlert ? "sim-status-val--alert" : "sim-status-val--ok"}`}>
            {isAlert ? "⚠ FALL DETECTED" : isPet ? "🐾 Pet Activity" : "✓ All Secure"}
          </span>
        </div>
        <div className="sim-status-row">
          <span className="sim-status-label">CSI Variance</span>
          <span className={`sim-status-val ${isAlert ? "sim-status-val--alert" : "sim-status-val--ok"}`}>
            {csiVal.toFixed(2)}
          </span>
        </div>
        <div className="sim-status-row">
          <span className="sim-status-label">Alert</span>
          <span className={`sim-status-val ${isAlert ? "sim-status-val--alert" : "sim-status-val--ok"}`}>
            {isAlert ? "ACTIVE" : "None"}
          </span>
        </div>

        {/* Command grid */}
        <div className="sim-grid" style={{ marginTop: "16px" }}>
          {COMMANDS.map((cmd) => (
            <button
              key={cmd.id}
              className={`sim-btn ${cmd.variant} ${lastTriggered === cmd.id ? "sim-btn--active-now" : ""}`}
              onClick={() => handleCommand(cmd)}
              style={{
                outline: lastTriggered === cmd.id ? "2px solid rgba(255,255,255,0.4)" : "none",
              }}
            >
              {cmd.emoji} {cmd.label}
            </button>
          ))}
        </div>

        <button className="sim-close-btn" onClick={onClose}>
          Close Panel
        </button>
      </div>
    </div>
  );
}
