import { useRef } from "react";
import { useEffect } from "react";
import "../styles/AdminControlPanel.css";
import { database, ref, set } from "../firebase";

export default function AdminControlPanel({ homeData, loading, onClose }) {
  const canvasRef = useRef(null);

  // Draw floor plan and nodes
  const drawFloorPlan = (canvas) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = "#0f0f1a";
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Room definitions with positions (x, y, w, h)
    const rooms = [
      { name: "BATHROOM", x: 60, y: 80, w: 120, h: 100, nodeId: "laure_node_02" },
      { name: "HALLWAY", x: 200, y: 80, w: 100, h: 80 },
      { name: "BEDROOM", x: 320, y: 60, w: 120, h: 120, nodeId: "laure_node_01" },
      {
        name: "LIVING ROOM",
        x: 150,
        y: 220,
        w: 200,
        h: 140,
        nodeId: "laure_node_03",
      },
    ];

    // Draw rooms
    rooms.forEach((room) => {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(room.x, room.y, room.w, room.h);
      ctx.setLineDash([]);

      // Room name
      ctx.fillStyle = "#c0adb2";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(room.name, room.x + room.w / 2, room.y - 8);
    });

    // Draw nodes
    rooms.forEach((room) => {
      if (room.nodeId) {
        const roomData = homeData?.rooms?.[
          room.name
            .toLowerCase()
            .replace(" ", "_")
            .replace("hallway", "living_room")
        ] || {};

        // Node circle
        ctx.fillStyle = "#b5546a";
        ctx.beginPath();
        ctx.arc(
          room.x + room.w / 2,
          room.y + room.h / 2,
          10,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Glow effect for active/alert
        if (roomData.alert_type === "fall_detected") {
          ctx.strokeStyle = "rgba(192, 57, 43, 0.5)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(
            room.x + room.w / 2,
            room.y + room.h / 2,
            16,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }

        // Node icon (inside circle)
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 8px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "📡",
          room.x + room.w / 2,
          room.y + room.h / 2
        );
      }
    });

    // Legend
    const legendY = height - 30;
    ctx.fillStyle = "#9e8a90";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("● Node  ● Presence Detection", 40, legendY);
  };

  // Trigger scenario via Firebase (update room state)
  const triggerScenario = async (roomName, mode) => {
    const payload = {
      type: mode,
      room: roomName ?? null,
      ts: Date.now(),
    };
    await set(ref(database, "/control/command"), payload);

    // Fallback simulator mode for web-only runs when Python simulator isn't active.
    const simulatedState = buildSimulatedHomeState(homeData, mode, roomName);
    await set(ref(database, "/"), simulatedState);
  };

  const resetAll = () => {
    triggerScenario(null, "reset");
  };

  // Extract data
  const rooms = homeData?.rooms || {};
  const systemStatus = homeData?.system_status || "all_secure";
  const csiVariance = getAggregateVariance(rooms) || 0;

  const formatStatus = (status) => {
    if (status === "all_secure") return "All Secure";
    if (status && status.includes("anomaly")) return "Alert Active";
    return "Monitoring";
  };

  // Redraw on data change
    useEffect(() => {
    const timer = setTimeout(() => drawFloorPlan(canvasRef.current), 0);
    return () => clearTimeout(timer);
  }, [homeData]);

  return (
    <section className="admin-control-panel">
      <div className="admin-header">
        <div className="admin-title-group">
          <h1 className="admin-title">WI-Fi Sensing: Home Presence Detection</h1>
          <p className="admin-subtitle">Baseline CSI established. Environment Stable.</p>
        </div>
        <button
          type="button"
          className="admin-close-btn"
          onClick={onClose}
          aria-label="Close admin panel"
        >
          ✕
        </button>
      </div>

      <div className="admin-status-bar">
        <div className="admin-stat">
          <span className="admin-stat-label">STATUS</span>
          <span className="admin-stat-value">{formatStatus(systemStatus)}</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-label">CSI VARIANCE</span>
          <span className="admin-stat-value">
            &lt; {(csiVariance || 0.02).toFixed(3)}
          </span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-label">ALERT</span>
          <span className="admin-stat-value">
            {systemStatus && systemStatus.includes("anomaly") ? "ACTIVE" : "None"}
          </span>
        </div>
      </div>

      <div className="admin-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={540}
          height={420}
          className="admin-floorplan"
          role="img"
          aria-label="Floor plan with Wi-Fi node positions"
        />
      </div>

      <div className="admin-controls">
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={resetAll}
        >
          Reset All Secure
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-danger"
          onClick={() => triggerScenario("bathroom", "fall")}
        >
          Trigger Bathroom Fall
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-danger"
          onClick={() => triggerScenario("bedroom", "fall")}
        >
          Trigger Bedroom Fall
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => triggerScenario("living_room", "pet")}
        >
          Pet in Living Room
        </button>
      </div>

      <div className="admin-footer">
        <p className="admin-footer-text">
          🔴 Live Firebase connection active • Simulator: {loading ? "Loading..." : "Ready"}
        </p>
      </div>
    </section>
  );
}

function buildSimulatedHomeState(existingHomeData, mode, roomName) {
  const now = Math.floor(Date.now() / 1000);
  const currentRooms = existingHomeData?.rooms || {};

  const createRoom = (key, baseline, nodeId) => ({
    status: "normal",
    csi_variance: currentRooms[key]?.csi_variance ?? baseline,
    baseline_variance: baseline,
    delta_from_baseline:
      (currentRooms[key]?.csi_variance ?? baseline) - baseline,
    last_updated: now,
    node_id: nodeId,
    stillness_confirmed: false,
    alert_type: null,
  });

  const rooms = {
    bathroom: createRoom("bathroom", 0.04, "laure_node_02"),
    bedroom: createRoom("bedroom", 0.05, "laure_node_01"),
    living_room: createRoom("living_room", 0.09, "laure_node_03"),
  };

  if (mode === "fall" && roomName && rooms[roomName]) {
    rooms[roomName] = {
      ...rooms[roomName],
      status: "anomaly_fall",
      csi_variance: 0.89,
      delta_from_baseline: 0.89 - rooms[roomName].baseline_variance,
      stillness_confirmed: true,
      alert_type: "fall_detected",
    };
  }

  if (mode === "pet" && roomName && rooms[roomName]) {
    rooms[roomName] = {
      ...rooms[roomName],
      status: "normal",
      csi_variance: 0.22,
      delta_from_baseline: 0.22 - rooms[roomName].baseline_variance,
      stillness_confirmed: false,
      alert_type: null,
    };
  }

  const anyAlert = Object.values(rooms).some((room) => room.alert_type === "fall_detected");

  return {
    home_id: existingHomeData?.home_id || "landa_demo_001",
    rooms,
    alert_history: existingHomeData?.alert_history || [],
    system_status: anyAlert ? "alert_active" : "all_secure",
    last_sync: now,
  };
}

function getAggregateVariance(rooms) {
  const values = Object.values(rooms)
    .map((room) => room?.csi_variance)
    .filter((v) => typeof v === "number");
  if (!values.length) return undefined;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}
