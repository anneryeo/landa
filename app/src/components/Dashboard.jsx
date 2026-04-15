import styles from './Dashboard.module.css';

const NODE_STATUS = [
  { id: 'laure_01', room: 'Bathroom',    status: 'Protected' },
  { id: 'laure_02', room: 'Living Room', status: 'Protected' },
  { id: 'laure_03', room: 'Bedroom',     status: 'Protected' },
];

export default function Dashboard({ onOpenSimulator }) {
  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.logoMark}>L</div>
        <div>
          <h1 className={styles.brand}>Project Landa</h1>
          <p className={styles.tagline}>Ambient Home Safety</p>
        </div>
        <div className={styles.connBadge}>
          <span className={styles.connDot} />
          Demo Mode
        </div>
      </header>

      {/* ── Hero status card ───────────────────── */}
      <section className={styles.heroCard}>
        <div className={styles.heroIconWrap}>
          <svg className={styles.shieldIcon} viewBox="0 0 48 48" fill="none">
            <path
              d="M24 4L8 11v13c0 9.4 6.8 18.2 16 20.4C33.2 42.2 40 33.4 40 24V11L24 4z"
              fill="var(--berry-good)"
              stroke="var(--usu-koubai)"
              strokeWidth="2"
            />
            <path
              d="M16 24l6 6 10-10"
              stroke="var(--soldier-green)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className={styles.pulseRing} />
        </div>
        <div>
          <h2 className={styles.statusText}>Home is Secure</h2>
          <p className={styles.statusSub}>All Laure Nodes active · No anomalies detected</p>
        </div>
      </section>

      {/* ── Node cards ────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Active Nodes</h3>
        <div className={styles.nodeGrid}>
          {NODE_STATUS.map((node) => (
            <div key={node.id} className={styles.nodeCard}>
              <div className={styles.nodeIconWrap}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                  <rect x="8" y="2" width="8" height="14" rx="2" fill="var(--usu-koubai)" />
                  <rect x="10" y="16" width="4" height="4" rx="1" fill="var(--meadow-mauve)" />
                  <rect x="6" y="18" width="3" height="3" rx="0.5" fill="var(--meadow-mauve)" />
                  <rect x="15" y="18" width="3" height="3" rx="0.5" fill="var(--meadow-mauve)" />
                  <circle cx="12" cy="9" r="2.5" fill="var(--cream)" />
                </svg>
              </div>
              <div className={styles.nodeInfo}>
                <span className={styles.nodeRoom}>{node.room}</span>
                <span className={styles.nodeId}>{node.id}</span>
              </div>
              <span className={styles.nodeStatus}>{node.status}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── About section ────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>How It Works</h3>
        <div className={styles.pillRow}>
          <div className={styles.pill}>
            <span className={styles.pillIcon}>📡</span>
            <span>Wi-Fi CSI Sensing</span>
          </div>
          <div className={styles.pill}>
            <span className={styles.pillIcon}>🚫</span>
            <span>No Cameras</span>
          </div>
          <div className={styles.pill}>
            <span className={styles.pillIcon}>🔔</span>
            <span>Fall Detection</span>
          </div>
          <div className={styles.pill}>
            <span className={styles.pillIcon}>🐾</span>
            <span>Pet Filter</span>
          </div>
        </div>
        <p className={styles.about}>
          Laure Nodes establish invisible sensing corridors between your home Wi-Fi
          router and each plug. A two-factor algorithm — CSI variance spike followed
          by sustained stillness — confirms a fall before sending an alert. No
          cameras, no wearables, no privacy trade-off.
        </p>
      </section>

      {/* ── CTA ──────────────────────────────── */}
      <div className={styles.ctaWrap}>
        <button className={styles.ctaButton} onClick={onOpenSimulator}>
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
            <path d="M3 10a7 7 0 1014 0A7 7 0 003 10z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 7v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Open Live Simulation Map
        </button>
        <p className={styles.ctaNote}>
          See how fall detection works in real time
        </p>
      </div>
    </div>
  );
}
