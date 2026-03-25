export default function MapScreen({ homeData, loading }) {
  return (
    <div className="map-screen fade-in">
      <div className="map-top">
        <h2 className="map-title">Home Map</h2>
        <button className="map-add-btn">+ Add Node</button>
      </div>

      {/* Floor plan */}
      <div className="floor-plan" style={{ height: "320px" }}>
        {/* Top row: BATHROOM + HALL + BEDROOM */}
        <div
          className="room"
          style={{ top: "12px", left: "12px", width: "34%", height: "44%" }}
        >
          <div className="room-dot room-dot--node" />
          <span>Bathroom</span>
        </div>

        {/* Hall - center connector */}
        <div
          className="room"
          style={{
            top: "12px",
            left: "calc(34% + 20px)",
            width: "18%",
            height: "44%",
            background: "transparent",
          }}
        >
          <span style={{ fontSize: "9px" }}>Hall</span>
        </div>

        <div
          className="room"
          style={{
            top: "12px",
            right: "12px",
            width: "34%",
            height: "44%",
          }}
        >
          <div className="room-dot room-dot--node" />
          <span>Bedroom</span>
        </div>

        {/* Bottom: LIVING ROOM */}
        <div
          className="room"
          style={{
            bottom: "12px",
            left: "12px",
            right: "12px",
            height: "46%",
          }}
        >
          <div className="room-dot room-dot--presence" />
          <span>Living Room</span>
        </div>
      </div>

      {/* Legend */}
      <div className="map-legend">
        <div className="map-legend-item">
          <div className="legend-dot" style={{ background: "var(--mauve)" }} />
          <span>Laure Node</span>
        </div>
        <div className="map-legend-item">
          <div className="legend-dot" style={{ background: "var(--green-dot)" }} />
          <span>Presence</span>
        </div>
      </div>
    </div>
  );
}
