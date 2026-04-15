import { useState } from "react";

export default function PairNodeScreen({ onComplete }) {
  const [roomName, setRoomName] = useState("");

  return (
    <div className="pair-screen fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p className="pair-step-label">Step 1 of 3 – Plug In</p>
          <h2 className="pair-title">Pair Laure Node</h2>
        </div>
        <button className="btn-ghost pair-back" onClick={onComplete} style={{ marginTop: 0 }}>
          ← Back
        </button>
      </div>

      {/* Card 1 */}
      <div className="pair-card">
        <div className="pair-card-icon">
          <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 4v16M10 16l4 4 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="6" y="20" width="16" height="4" rx="2" stroke="white" strokeWidth="2"/>
          </svg>
        </div>
        <div className="pair-card-body">
          <p className="pair-card-title">Plug into wall outlet</p>
          <p className="pair-card-sub">12–18 inches from floor for optimal fall detection</p>
        </div>
      </div>

      {/* Card 2 */}
      <div className="pair-card">
        <div className="pair-card-icon" style={{ background: "var(--blush-mid)" }}>
          <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="20" height="20" rx="4" stroke="#b5546a" strokeWidth="2"/>
            <path d="M9 14h10M14 9v10" stroke="#b5546a" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="pair-card-body">
          <p className="pair-card-title">Name this room</p>
          <div className="pair-input-wrap">
            <label className="pair-input-label">Room name</label>
            <input
              className="pair-input"
              placeholder='e.g. "Bathroom", "Bedroom"'
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: "auto", paddingTop: "12px" }}>
        <button
          className="btn-primary"
          onClick={onComplete}
        >
          Continue →
        </button>
        <button className="btn-ghost" style={{ width: "100%", textAlign: "center", marginTop: "8px" }} onClick={onComplete}>
          Skip setup
        </button>
      </div>
    </div>
  );
}
