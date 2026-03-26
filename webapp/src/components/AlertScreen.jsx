export default function AlertScreen({ room, csiVariance, onDismiss }) {
  return (
    <section className="alert-screen" role="alert" aria-live="assertive">
      <div className="alert-wave-icon" aria-hidden="true">
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2l9 16H3L12 2zm0 6v4m0 4h.01"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="alert-title">Potential Fall Detected</h1>
      <p className="alert-room">Room: {room}</p>
      <p className="alert-csi">CSI Variance: {formatVariance(csiVariance)}</p>

      <div className="alert-actions">
        <button type="button" className="alert-btn-primary alert-btn-primary--sos">
          Call Emergency Services
        </button>
        <button type="button" className="alert-btn-primary">
          Call Family Contact
        </button>
        <button type="button" className="alert-btn-dismiss" onClick={onDismiss}>
          Dismiss Alert
        </button>
      </div>
    </section>
  );
}

function formatVariance(value) {
  if (typeof value === "number") return value.toFixed(4);
  return "--";
}
