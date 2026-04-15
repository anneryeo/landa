import { useState, useEffect, useRef } from 'react';
import styles from './MapSimulator.module.css';

/* ── Scenario definitions ─────────────────────────── */
const S = {
  SECURE:        'secure',
  BATHROOM_FALL: 'bathroom_fall',
  BEDROOM_FALL:  'bedroom_fall',
  PET_LIVING:    'pet_living',
};

const LOG_DATA = {
  [S.SECURE]: [
    { text: 'System initialised. All Laure Nodes online.',           type: 'info'    },
    { text: 'Calibration complete — Bathroom baseline: 0.042',       type: 'data'    },
    { text: 'Calibration complete — Bedroom baseline:  0.051',       type: 'data'    },
    { text: 'Calibration complete — Living Room baseline: 0.088',    type: 'data'    },
    { text: 'Baseline CSI established. Environment Stable.',         type: 'secure'  },
  ],
  [S.BATHROOM_FALL]: [
    { text: 'BATHROOM NODE — CSI variance spike detected.',                               type: 'warning'  },
    { text: 'Bathroom variance: 0.042 → 0.891  (delta: +0.849)',                          type: 'alert'    },
    { text: 'Stillness confirmation window initiated …',                                  type: 'warning'  },
    { text: 'Sustained stillness confirmed — 2.1 s < 0.08 variance threshold',           type: 'alert'    },
    { text: '⚠  CRITICAL ANOMALY: BATHROOM NODE.  Sending Emergency Alert.',             type: 'critical' },
  ],
  [S.BEDROOM_FALL]: [
    { text: 'BEDROOM NODE — CSI variance spike detected.',                                type: 'warning'  },
    { text: 'Bedroom variance: 0.051 → 0.923  (delta: +0.872)',                          type: 'alert'    },
    { text: 'Stillness confirmation window initiated …',                                  type: 'warning'  },
    { text: 'Sustained stillness confirmed — 1.8 s < 0.08 variance threshold',           type: 'alert'    },
    { text: '⚠  CRITICAL ANOMALY: BEDROOM NODE.  Sending Emergency Alert.',              type: 'critical' },
  ],
  [S.PET_LIVING]: [
    { text: 'LIVING ROOM NODE — Low-amplitude variance detected.',                        type: 'warning'  },
    { text: 'Living Room variance: 0.088 → 0.287  (delta: +0.199)',                      type: 'warning'  },
    { text: 'Mass-displacement analysis: signature below 35 kg threshold.',               type: 'info'     },
    { text: 'Anomaly Detected.  Low mass signature identified.',                          type: 'pet'      },
    { text: 'Movement ignored (Filtering Pet).  No alert triggered.',                    type: 'pet'      },
  ],
};

/* ── SVG floor-plan constants ─────────────────────── */
// viewBox: "0 0 440 310"
const ROOMS = {
  hallway:  { x: 18,  y: 16,  w: 404, h: 86,  label: 'HALLWAY'    },
  bathroom: { x: 18,  y: 102, w: 118, h: 192, label: 'BATHROOM'   },
  living:   { x: 136, y: 102, w: 162, h: 192, label: 'LIVING ROOM' },
  bedroom:  { x: 298, y: 102, w: 124, h: 192, label: 'BEDROOM'    },
};

const ROUTER = { x: 220, y: 59 };

const NODES = {
  bathroom: { x: 77,  y: 198 },
  living:   { x: 217, y: 198 },
  bedroom:  { x: 360, y: 198 },
};

/* ── Sub-components ──────────────────────────────── */

function RouterIcon({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Outer glow */}
      <circle r="14" fill="var(--navy)" fillOpacity="0.08" />
      <circle r="10" fill="var(--navy)" />
      {/* Wi-Fi arcs */}
      <path d="M -7 1 A 8 8 0 0 1 7 1"   stroke="var(--cream)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M -4.5 3.5 A 5 5 0 0 1 4.5 3.5" stroke="var(--cream)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="0" cy="6" r="1.4" fill="var(--cream)" />
    </g>
  );
}

function NodeIcon({ x, y, state }) {
  const fill   = state === 'alert' ? '#C0392B' : state === 'pet' ? '#D4AC0D' : 'var(--usu-koubai)';
  const glow   = state === 'alert' ? '#C0392B' : state === 'pet' ? '#D4AC0D' : 'var(--berry-good)';
  return (
    <g transform={`translate(${x},${y})`}>
      <circle r="13" fill={glow} fillOpacity="0.18" />
      <circle r="9"  fill={fill} />
      {/* Plug symbol */}
      <rect x="-2.5" y="-5" width="5" height="6" rx="0.8" fill="var(--cream)" />
      <rect x="-4"   y="1"  width="8" height="3" rx="1"   fill="var(--cream)" />
      <line x1="-1.5" y1="-5" x2="-1.5" y2="-7.5" stroke="var(--cream)" strokeWidth="1.3" strokeLinecap="round" />
      <line x1=" 1.5" y1="-5" x2=" 1.5" y2="-7.5" stroke="var(--cream)" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  );
}

function WaveLink({ from, to, nodeKey, state }) {
  const color  = state === 'alert' ? '#E74C3C' : state === 'pet' ? '#D4AC0D' : 'var(--cyan)';
  const dur    = state === 'alert' ? '0.45s'   : state === 'pet' ? '0.75s'   : '2s';
  const dur2   = state === 'alert' ? '0.45s'   : state === 'pet' ? '0.75s'   : '2s';
  const width  = state === 'alert' ? 2.5        : 1.5;
  const dash   = state === 'alert' ? '5 3'      : state === 'pet' ? '3 6'    : '8 6';
  const opacity = state === 'alert' ? 0.9       : state === 'pet' ? 0.75     : 0.7;

  // Slight perpendicular curve for visual interest
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const cpX = (from.x + to.x) / 2 + (-dy / len) * 12;
  const cpY = (from.y + to.y) / 2 + ( dx / len) * 12;
  const pathD  = `M ${from.x} ${from.y} Q ${cpX} ${cpY} ${to.x} ${to.y}`;

  return (
    <g>
      {/* Base trace */}
      <path d={pathD} stroke={color} strokeWidth="1" strokeOpacity="0.18" fill="none" />

      {/* Animated dash layer 1 */}
      <path
        d={pathD}
        stroke={color}
        strokeWidth={width}
        strokeOpacity={opacity}
        fill="none"
        strokeDasharray={dash}
        style={{ animation: `dashFlow ${dur} linear infinite` }}
      />
      {/* Animated dash layer 2 (offset) */}
      <path
        d={pathD}
        stroke={color}
        strokeWidth={width * 0.6}
        strokeOpacity={opacity * 0.55}
        fill="none"
        strokeDasharray={dash}
        style={{ animation: `dashFlow ${dur2} linear infinite`, animationDelay: state === 'alert' ? '-0.22s' : '-1s' }}
      />

      {/* Travelling pulse dot 1 */}
      <circle r={state === 'alert' ? 4.5 : 3} fill={color} fillOpacity="0.95">
        <animateMotion dur={dur} repeatCount="indefinite" path={pathD} />
      </circle>

      {/* Travelling pulse dot 2 (alert has two fast dots) */}
      {state !== 'secure' && (
        <circle r={state === 'alert' ? 3.5 : 2.5} fill={color} fillOpacity="0.65">
          <animateMotion dur={dur2} repeatCount="indefinite" begin={state === 'alert' ? '-0.22s' : '-0.38s'} path={pathD} />
        </circle>
      )}
    </g>
  );
}

/* Standing person (Living Room calm state) */
function StandingPerson({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`} style={{ animation: 'fadeInUp 0.4s ease' }}>
      <circle cx="0" cy="-18" r="5.5" fill="var(--usu-koubai)" />
      <line x1="0" y1="-12" x2="0"  y2="2"  stroke="var(--usu-koubai)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="-7" y1="-6" x2="7"  y2="-6" stroke="var(--usu-koubai)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="0"  y1="2"  x2="-5" y2="14" stroke="var(--usu-koubai)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="0"  y1="2"  x2="5"  y2="14" stroke="var(--usu-koubai)" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

/* Fallen person */
function FallenPerson({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`} style={{ animation: 'fadeInUp 0.3s ease' }}>
      <circle cx="-14" cy="0" r="5.5" fill="var(--alert-red)" />
      <line x1="-8"  y1="0"  x2="8"  y2="0"  stroke="var(--alert-red)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="-3"  y1="-7" x2="-3" y2="7"  stroke="var(--alert-red)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="8"   y1="0"  x2="14" y2="-6" stroke="var(--alert-red)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="8"   y1="0"  x2="14" y2="6"  stroke="var(--alert-red)" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

/* Dog / pet icon */
function DogIcon({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`} style={{ animation: 'petBounce 0.9s ease-in-out infinite' }}>
      {/* Body */}
      <ellipse cx="0" cy="2" rx="11" ry="7" fill="var(--pet-yellow)" />
      {/* Head */}
      <circle cx="12" cy="-2" r="7" fill="var(--pet-yellow)" />
      {/* Ear */}
      <ellipse cx="9" cy="-7" rx="3" ry="4.5" fill="#B8960C" transform="rotate(-15 9 -7)" />
      {/* Eye */}
      <circle cx="14" cy="-3" r="1.5" fill="#333" />
      {/* Nose */}
      <ellipse cx="17.5" cy="-0.5" rx="2" ry="1.5" fill="#333" />
      {/* Tail */}
      <path d="M -10 -2 Q -18 -10 -14 -16" stroke="var(--pet-yellow)" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Legs */}
      <line x1="-6"  y1="8"  x2="-6"  y2="16" stroke="#B8960C" strokeWidth="2.5" strokeLinecap="round" />
      <line x1=" 0"  y1="9"  x2=" 0"  y2="17" stroke="#B8960C" strokeWidth="2.5" strokeLinecap="round" />
      <line x1=" 6"  y1="8"  x2=" 6"  y2="16" stroke="#B8960C" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

/* Alert pulse overlay on a room */
function AlertOverlay({ room }) {
  const r = ROOMS[room];
  return (
    <rect
      x={r.x} y={r.y} width={r.w} height={r.h}
      fill="#E74C3C"
      fillOpacity="0.07"
      rx="6"
      style={{ animation: 'alertFlicker 0.5s ease-in-out infinite' }}
    />
  );
}

/* ── Floor Plan SVG ───────────────────────────────── */
function FloorPlan({ scenario }) {
  const getLinkState = (key) => {
    if (scenario === S.BATHROOM_FALL && key === 'bathroom') return 'alert';
    if (scenario === S.BEDROOM_FALL  && key === 'bedroom')  return 'alert';
    if (scenario === S.PET_LIVING    && key === 'living')   return 'pet';
    return 'normal';
  };

  const roomFills = {
    hallway:  '#EDE8E2',
    bathroom: '#F5EDEC',
    living:   '#EDE8E2',
    bedroom:  '#F5EDEC',
  };

  return (
    <svg
      viewBox="0 0 440 310"
      xmlns="http://www.w3.org/2000/svg"
      className={styles.svg}
    >
      <defs>
        <filter id="blur-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ── Room rectangles ── */}
      {Object.entries(ROOMS).map(([key, r]) => (
        <g key={key}>
          <rect
            x={r.x} y={r.y} width={r.w} height={r.h}
            fill={roomFills[key]}
            stroke="var(--usu-koubai)"
            strokeWidth="1.5"
            rx="6"
          />
          <text
            x={r.x + 10}
            y={r.y + 18}
            fontSize="9"
            fill="var(--meadow-mauve)"
            fontFamily="'Instrument Sans', sans-serif"
            fontWeight="700"
            letterSpacing="1.8"
          >
            {r.label}
          </text>
        </g>
      ))}

      {/* ── Alert overlays ── */}
      {scenario === S.BATHROOM_FALL && <AlertOverlay room="bathroom" />}
      {scenario === S.BEDROOM_FALL  && <AlertOverlay room="bedroom"  />}

      {/* ── Wave links ── */}
      {Object.entries(NODES).map(([key, node]) => (
        <WaveLink
          key={key}
          nodeKey={key}
          from={ROUTER}
          to={node}
          state={getLinkState(key)}
        />
      ))}

      {/* ── Router ── */}
      <RouterIcon x={ROUTER.x} y={ROUTER.y} />
      <text
        x={ROUTER.x}
        y={ROUTER.y + 22}
        fontSize="8"
        fill="var(--navy)"
        textAnchor="middle"
        fontFamily="'Instrument Sans', sans-serif"
        fontWeight="600"
        letterSpacing="0.5"
      >
        Router
      </text>

      {/* ── Nodes ── */}
      {Object.entries(NODES).map(([key, node]) => (
        <g key={key}>
          <NodeIcon x={node.x} y={node.y} state={getLinkState(key)} />
          <text
            x={node.x}
            y={node.y + 22}
            fontSize="8"
            fill="var(--meadow-mauve)"
            textAnchor="middle"
            fontFamily="'Instrument Sans', sans-serif"
            fontWeight="600"
          >
            Laure Node
          </text>
        </g>
      ))}

      {/* ── Figures ── */}
      {scenario === S.SECURE        && <StandingPerson x={217} y={173} />}
      {scenario === S.BATHROOM_FALL && <FallenPerson   x={77}  y={160} />}
      {scenario === S.BEDROOM_FALL  && <FallenPerson   x={360} y={160} />}
      {scenario === S.PET_LIVING    && <DogIcon        x={207} y={162} />}
    </svg>
  );
}

/* ── Log entry ───────────────────────────────────── */
const LOG_COLORS = {
  info:     '#29B0E3',
  data:     '#928E5E',
  secure:   '#5DB870',
  warning:  '#E67E22',
  alert:    '#E74C3C',
  critical: '#C0392B',
  pet:      '#D4AC0D',
};

function LogEntry({ log }) {
  return (
    <div
      className={styles.logEntry}
      style={{ color: LOG_COLORS[log.type] ?? '#DDD3C9', animation: 'fadeInUp 0.3s ease' }}
    >
      <span className={styles.logPrefix}>›</span>
      <span>{log.text}</span>
    </div>
  );
}

/* ── Control button ──────────────────────────────── */
function ControlButton({ label, onClick, active, variant }) {
  const variantClass = {
    secure: styles.btnSecure,
    alert:  styles.btnAlert,
    pet:    styles.btnPet,
  }[variant];

  return (
    <button
      className={`${styles.ctrlBtn} ${variantClass} ${active ? styles.ctrlActive : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

/* ── Main export ─────────────────────────────────── */
export default function MapSimulator({ onBack }) {
  const [scenario, setScenario]     = useState(S.SECURE);
  const [visibleLogs, setVisibleLogs] = useState([]);
  const logRef  = useRef(null);
  const timerRef = useRef([]);

  useEffect(() => {
    // Clear pending timers from previous scenario
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    setVisibleLogs([]);

    LOG_DATA[scenario].forEach((log, i) => {
      const t = setTimeout(() => {
        setVisibleLogs((prev) => [...prev, { ...log, key: `${scenario}-${i}` }]);
      }, i * 650);
      timerRef.current.push(t);
    });

    return () => timerRef.current.forEach(clearTimeout);
  }, [scenario]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [visibleLogs]);

  const isAlert = scenario === S.BATHROOM_FALL || scenario === S.BEDROOM_FALL;

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <div className={styles.headerCenter}>
          <h2 className={styles.title}>Laure Node Simulation</h2>
          <p className={styles.subtitle}>Wi-Fi CSI sensing — interactive floor plan</p>
        </div>
        <div className={`${styles.statusPill} ${isAlert ? styles.statusAlert : ''}`}>
          <span className={styles.statusDot} />
          {isAlert ? 'Alert Active' : scenario === S.PET_LIVING ? 'Pet Detected' : 'All Secure'}
        </div>
      </header>

      {/* ── Top panel: map + feed ── */}
      <div className={styles.topPanel}>
        {/* Floor plan */}
        <div className={styles.mapPanel}>
          <span className={styles.panelLabel}>Floor Plan · Live</span>
          <FloorPlan scenario={scenario} />
        </div>

        {/* Data feed */}
        <div className={styles.feedPanel}>
          <span className={styles.feedLabel}>Live Data Feed</span>
          <div className={styles.feedBody} ref={logRef}>
            {visibleLogs.length === 0 && (
              <span className={styles.feedEmpty}>Awaiting data stream…</span>
            )}
            {visibleLogs.map((log) => (
              <LogEntry key={log.key} log={log} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Control panel ── */}
      <div className={styles.controlPanel}>
        <span className={styles.controlLabel}>Interactive Control Panel</span>
        <div className={styles.btnRow}>
          <ControlButton label="Reset: All Secure"      onClick={() => setScenario(S.SECURE)}        active={scenario === S.SECURE}        variant="secure" />
          <ControlButton label="Trigger Bathroom Fall"  onClick={() => setScenario(S.BATHROOM_FALL)} active={scenario === S.BATHROOM_FALL} variant="alert"  />
          <ControlButton label="Trigger Bedroom Fall"   onClick={() => setScenario(S.BEDROOM_FALL)}  active={scenario === S.BEDROOM_FALL}  variant="alert"  />
          <ControlButton label="Pet in Living Room"     onClick={() => setScenario(S.PET_LIVING)}    active={scenario === S.PET_LIVING}    variant="pet"    />
        </div>
      </div>
    </div>
  );
}
