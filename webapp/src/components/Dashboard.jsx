export default function Dashboard({
  homeData,
  loading,
  connectionStatus,
  onOpenSimulator,
}) {
  const csiVariance = homeData?.csi_variance;
  const statusText = loading
    ? "Loading status..."
    : homeData?.system_status
    ? formatStatus(homeData.system_status)
    : "All rooms normal";

  const nodes = [
    {
      name: "Living Room",
      value: valueOrFallback(homeData?.living_room?.csi_variance, csiVariance),
    },
    {
      name: "Bedroom",
      value: valueOrFallback(homeData?.bedroom?.csi_variance, csiVariance),
    },
  ];

  return (
    <section className="dashboard fade-in">
      <header className="dash-header">
        <p className="dash-greeting">
          Welcome back, <strong>Kim</strong>
        </p>
        <div className="dash-avatar" aria-label="User avatar">
          K
        </div>
      </header>

      <div className="dash-orb-wrap">
        <div className="dash-orb" aria-hidden="true">
          <span className="dash-orb-ring" />
          <span className="dash-orb-ring" />
          <span className="dash-orb-ring" />
          <span className="dash-orb-core" />
        </div>

        <h1 className="dash-status-title">Protected</h1>
        <p className="dash-status-sub">{statusText}</p>

        <div className="dash-csi-badge">
          CSI Variance: {formatVariance(csiVariance)}
        </div>
      </div>

      <div className="dash-nodes">
        {nodes.map((node) => (
          <article key={node.name} className="node-card">
            <span className="node-card-dot" aria-hidden="true" />
            <h3 className="node-card-name">{node.name}</h3>
            <p className="node-card-sub">Variance: {node.value}</p>
          </article>
        ))}
      </div>

      <div
        className={`dash-connection-badge ${
          connectionStatus === "live"
            ? "dash-connection-badge--live"
            : "dash-connection-badge--offline"
        }`}
      >
        <span aria-hidden="true">●</span>
        {connectionStatus === "live" ? "Realtime connected" : "Offline"}
      </div>

      <button type="button" className="dash-sim-btn" onClick={onOpenSimulator}>
        Open Simulator
      </button>
    </section>
  );
}

function formatStatus(status) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatVariance(value) {
  if (typeof value === "number") return value.toFixed(4);
  return "--";
}

function valueOrFallback(value, fallback) {
  if (typeof value === "number") return value.toFixed(4);
  return formatVariance(fallback);
}
