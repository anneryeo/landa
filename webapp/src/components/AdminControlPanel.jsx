import { useRef } from "react";
import { useEffect } from "react";
import "../styles/AdminControlPanel.css";

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
  const triggerScenario = (roomName, mode) => {
    console.log(
      `[AdminControlPanel] Scenario triggered: ${roomName} = ${mode}`
    );
    // This would wire to Firebase to update room state that simulator watches
    // For now, just log - simulator controls via stdin in Python
  };

  const resetAll = () => {
    console.log("[AdminControlPanel] Reset all rooms");
    triggerScenario("all", "reset");
  };

  // Extract data
  const rooms = homeData?.rooms || {};
  const systemStatus = homeData?.system_status || "all_secure";
  const csiVariance = homeData?.csi_variance || 0;

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
          onClick={() => triggerScenario("bathroom", "fall_spike")}
        >
          Trigger Bathroom Fall
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-danger"
          onClick={() => triggerScenario("bedroom", "fall_spike")}
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
