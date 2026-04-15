import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

// ── Animated SVG components ───────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath   = Animated.createAnimatedComponent(Path);
const AnimatedRect   = Animated.createAnimatedComponent(Rect);

// ── Color palette ─────────────────────────────────────
const C = {
  usu_koubai:   '#B5546A',
  berry_good:   '#D4849A',
  cream:        '#FDF6F0',
  meadow_mauve: '#9F8A91',
  navy:         '#16121D',
  cyan:         '#29B0E3',
  alert_red:    '#E74C3C',
  alert_dark:   '#C0392B',
  pet_yellow:   '#D4AC0D',
  pet_dark:     '#B8960C',
  room_light:   '#F5EDEC',
  room_mid:     '#EDE8E2',
};

// ── Scenario keys ─────────────────────────────────────
const S = {
  SECURE:        'secure',
  BATHROOM_FALL: 'bathroom_fall',
  BEDROOM_FALL:  'bedroom_fall',
  PET_LIVING:    'pet_living',
};

// ── Log data ──────────────────────────────────────────
const LOG_DATA = {
  [S.SECURE]: [
    { text: 'System initialised. All Laure Nodes online.',         type: 'info'   },
    { text: 'Calibration complete — Bathroom baseline: 0.042',     type: 'data'   },
    { text: 'Calibration complete — Bedroom baseline:  0.051',     type: 'data'   },
    { text: 'Calibration complete — Living Room baseline: 0.088',  type: 'data'   },
    { text: 'Baseline CSI established. Environment Stable.',       type: 'secure' },
  ],
  [S.BATHROOM_FALL]: [
    { text: 'BATHROOM NODE — CSI variance spike detected.',                            type: 'warning'  },
    { text: 'Bathroom variance: 0.042 → 0.891  (delta: +0.849)',                      type: 'alert'    },
    { text: 'Stillness confirmation window initiated …',                              type: 'warning'  },
    { text: 'Sustained stillness confirmed — 2.1 s < 0.08 variance threshold',       type: 'alert'    },
    { text: '⚠  CRITICAL ANOMALY: BATHROOM NODE. Sending Emergency Alert.',          type: 'critical' },
  ],
  [S.BEDROOM_FALL]: [
    { text: 'BEDROOM NODE — CSI variance spike detected.',                             type: 'warning'  },
    { text: 'Bedroom variance: 0.051 → 0.923  (delta: +0.872)',                       type: 'alert'    },
    { text: 'Stillness confirmation window initiated …',                              type: 'warning'  },
    { text: 'Sustained stillness confirmed — 1.8 s < 0.08 variance threshold',       type: 'alert'    },
    { text: '⚠  CRITICAL ANOMALY: BEDROOM NODE. Sending Emergency Alert.',           type: 'critical' },
  ],
  [S.PET_LIVING]: [
    { text: 'LIVING ROOM NODE — Low-amplitude variance detected.',                    type: 'warning'  },
    { text: 'Living Room variance: 0.088 → 0.287  (delta: +0.199)',                  type: 'warning'  },
    { text: 'Mass-displacement analysis: signature below 35 kg threshold.',           type: 'info'     },
    { text: 'Anomaly Detected. Low mass signature identified.',                       type: 'pet'      },
    { text: 'Movement ignored (Filtering Pet). No alert triggered.',                 type: 'pet'      },
  ],
};

const LOG_COLORS = {
  info:     '#29B0E3',
  data:     '#928E5E',
  secure:   '#5DB870',
  warning:  '#E67E22',
  alert:    '#E74C3C',
  critical: '#C0392B',
  pet:      '#D4AC0D',
};

// ── SVG layout constants ──────────────────────────────
const VB_W = 440, VB_H = 310;
const ROOMS = {
  hallway:  { x: 18,  y: 16,  w: 404, h: 86,  label: 'HALLWAY'     },
  bathroom: { x: 18,  y: 102, w: 118, h: 192, label: 'BATHROOM'    },
  living:   { x: 136, y: 102, w: 162, h: 192, label: 'LIVING ROOM' },
  bedroom:  { x: 298, y: 102, w: 124, h: 192, label: 'BEDROOM'     },
};
const ROUTER = { x: 220, y: 59 };
const NODES  = {
  bathroom: { x: 77,  y: 198 },
  living:   { x: 217, y: 198 },
  bedroom:  { x: 360, y: 198 },
};

const { width: SCREEN_W } = Dimensions.get('window');
const SVG_W = SCREEN_W;
const SVG_H = Math.round(SCREEN_W * (VB_H / VB_W));

// ── Helpers ───────────────────────────────────────────
function getLinkState(key, scenario) {
  if (scenario === S.BATHROOM_FALL && key === 'bathroom') return 'alert';
  if (scenario === S.BEDROOM_FALL  && key === 'bedroom')  return 'alert';
  if (scenario === S.PET_LIVING    && key === 'living')   return 'pet';
  return 'normal';
}

// ── WaveLink ─────────────────────────────────────────
function WaveLink({ from, to, state }) {
  const color = state === 'alert' ? C.alert_red : state === 'pet' ? C.pet_yellow : C.cyan;
  const speed = state === 'alert' ? 400 : state === 'pet' ? 700 : 2000;
  const dash  = state === 'alert' ? '5 3' : state === 'pet' ? '3 6' : '8 6';
  const sw    = state === 'alert' ? 2.5 : 1.5;

  const dashAnim = useRef(new Animated.Value(0)).current;
  const dotProg  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dashAnim.setValue(0);
    dotProg.setValue(0);
    const da = Animated.loop(
      Animated.timing(dashAnim, { toValue: -60, duration: Math.round(speed * 0.8), useNativeDriver: false })
    );
    const dp = Animated.loop(
      Animated.timing(dotProg, { toValue: 1, duration: speed, useNativeDriver: false })
    );
    da.start();
    dp.start();
    return () => { da.stop(); dp.stop(); };
  }, [state]);

  // Slight perpendicular offset (matches web bezier control point)
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const cpX = (from.x + to.x) / 2 + (-dy / len) * 12;
  const cpY = (from.y + to.y) / 2 + (dx / len) * 12;
  const pathD = `M ${from.x} ${from.y} Q ${cpX} ${cpY} ${to.x} ${to.y}`;

  // Dot travels linearly between endpoints (straight-line approximation of bezier)
  const cx = dotProg.interpolate({ inputRange: [0, 1], outputRange: [from.x, to.x] });
  const cy = dotProg.interpolate({ inputRange: [0, 1], outputRange: [from.y, to.y] });
  const dotR = state === 'alert' ? 4.5 : 3;

  return (
    <G>
      <Path d={pathD} stroke={color} strokeWidth={1} strokeOpacity={0.18} fill="none" />
      <AnimatedPath
        d={pathD}
        stroke={color}
        strokeWidth={sw}
        strokeOpacity={state === 'alert' ? 0.9 : 0.7}
        fill="none"
        strokeDasharray={dash}
        strokeDashoffset={dashAnim}
      />
      <AnimatedCircle cx={cx} cy={cy} r={dotR} fill={color} fillOpacity={0.95} />
    </G>
  );
}

// ── AlertOverlay ──────────────────────────────────────
function AlertOverlay({ room }) {
  const r = ROOMS[room];
  const opacity = useRef(new Animated.Value(0.07)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.22, duration: 250, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0.04, duration: 250, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <AnimatedRect
      x={r.x} y={r.y} width={r.w} height={r.h}
      fill={C.alert_red}
      fillOpacity={opacity}
      rx={6}
    />
  );
}

// ── RouterIcon ────────────────────────────────────────
function RouterIcon({ x, y }) {
  return (
    <G transform={`translate(${x},${y})`}>
      <Circle r={14} fill={C.navy} fillOpacity={0.08} />
      <Circle r={10} fill={C.navy} />
      <Path d="M -7 1 A 8 8 0 0 1 7 1"         stroke={C.cream} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Path d="M -4.5 3.5 A 5 5 0 0 1 4.5 3.5" stroke={C.cream} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <Circle cx={0} cy={6} r={1.4} fill={C.cream} />
    </G>
  );
}

// ── NodeIcon ──────────────────────────────────────────
function NodeIcon({ x, y, state }) {
  const fill = state === 'alert' ? C.alert_dark : state === 'pet' ? C.pet_yellow : C.usu_koubai;
  const glow = state === 'alert' ? C.alert_dark : state === 'pet' ? C.pet_yellow : C.berry_good;
  return (
    <G transform={`translate(${x},${y})`}>
      <Circle r={13} fill={glow} fillOpacity={0.18} />
      <Circle r={9}  fill={fill} />
      <Rect   x={-2.5} y={-5} width={5} height={6} rx={0.8} fill={C.cream} />
      <Rect   x={-4}   y={1}  width={8} height={3} rx={1}   fill={C.cream} />
      <Line x1={-1.5} y1={-5} x2={-1.5} y2={-7.5} stroke={C.cream} strokeWidth={1.3} strokeLinecap="round" />
      <Line x1={1.5}  y1={-5} x2={1.5}  y2={-7.5} stroke={C.cream} strokeWidth={1.3} strokeLinecap="round" />
    </G>
  );
}

// ── StandingPerson ────────────────────────────────────
function StandingPerson({ x, y }) {
  return (
    <G transform={`translate(${x},${y})`}>
      <Circle cx={0}  cy={-18} r={5.5} fill={C.usu_koubai} />
      <Line x1={0}  y1={-12} x2={0}  y2={2}  stroke={C.usu_koubai} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={-7} y1={-6}  x2={7}  y2={-6} stroke={C.usu_koubai} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={0}  y1={2}   x2={-5} y2={14} stroke={C.usu_koubai} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={0}  y1={2}   x2={5}  y2={14} stroke={C.usu_koubai} strokeWidth={2.5} strokeLinecap="round" />
    </G>
  );
}

// ── FallenPerson ──────────────────────────────────────
function FallenPerson({ x, y }) {
  return (
    <G transform={`translate(${x},${y})`}>
      <Circle cx={-14} cy={0} r={5.5} fill={C.alert_red} />
      <Line x1={-8}  y1={0}  x2={8}  y2={0}  stroke={C.alert_red} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={-3}  y1={-7} x2={-3} y2={7}  stroke={C.alert_red} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={8}   y1={0}  x2={14} y2={-6} stroke={C.alert_red} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={8}   y1={0}  x2={14} y2={6}  stroke={C.alert_red} strokeWidth={2.5} strokeLinecap="round" />
    </G>
  );
}

// ── DogIcon ───────────────────────────────────────────
function DogIcon({ x, y }) {
  return (
    <G transform={`translate(${x},${y})`}>
      <Ellipse cx={0}    cy={2}   rx={11} ry={7}   fill={C.pet_yellow} />
      <Circle  cx={12}   cy={-2}  r={7}            fill={C.pet_yellow} />
      <Ellipse cx={9}    cy={-7}  rx={3}  ry={4.5} fill={C.pet_dark}   transform="rotate(-15 9 -7)" />
      <Circle  cx={14}   cy={-3}  r={1.5}          fill="#333" />
      <Ellipse cx={17.5} cy={-0.5} rx={2} ry={1.5} fill="#333" />
      <Path d="M -10 -2 Q -18 -10 -14 -16" stroke={C.pet_yellow} strokeWidth={3} fill="none" strokeLinecap="round" />
      <Line x1={-6} y1={8}  x2={-6} y2={16} stroke={C.pet_dark} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={0}  y1={9}  x2={0}  y2={17} stroke={C.pet_dark} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={6}  y1={8}  x2={6}  y2={16} stroke={C.pet_dark} strokeWidth={2.5} strokeLinecap="round" />
    </G>
  );
}

// ── FloorPlanSvg ──────────────────────────────────────
function FloorPlanSvg({ scenario }) {
  const roomFills = {
    hallway:  C.room_mid,
    bathroom: C.room_light,
    living:   C.room_mid,
    bedroom:  C.room_light,
  };

  return (
    <Svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      {/* Rooms */}
      {Object.entries(ROOMS).map(([key, r]) => (
        <G key={key}>
          <Rect
            x={r.x} y={r.y} width={r.w} height={r.h}
            fill={roomFills[key]}
            stroke={C.usu_koubai}
            strokeWidth={1.5}
            rx={6}
          />
          <SvgText x={r.x + 10} y={r.y + 18} fontSize={9} fill={C.meadow_mauve} fontWeight="700">
            {r.label}
          </SvgText>
        </G>
      ))}

      {/* Alert room overlays */}
      {scenario === S.BATHROOM_FALL && <AlertOverlay room="bathroom" />}
      {scenario === S.BEDROOM_FALL  && <AlertOverlay room="bedroom"  />}

      {/* Wave links from router to each node */}
      {Object.entries(NODES).map(([key, node]) => (
        <WaveLink
          key={key}
          from={ROUTER}
          to={node}
          state={getLinkState(key, scenario)}
        />
      ))}

      {/* Router */}
      <RouterIcon x={ROUTER.x} y={ROUTER.y} />
      <SvgText x={ROUTER.x} y={ROUTER.y + 22} fontSize={8} fill={C.navy} textAnchor="middle" fontWeight="600">
        Router
      </SvgText>

      {/* Nodes */}
      {Object.entries(NODES).map(([key, node]) => (
        <G key={key}>
          <NodeIcon x={node.x} y={node.y} state={getLinkState(key, scenario)} />
          <SvgText x={node.x} y={node.y + 22} fontSize={8} fill={C.meadow_mauve} textAnchor="middle" fontWeight="600">
            Laure Node
          </SvgText>
        </G>
      ))}

      {/* Scene figures */}
      {scenario === S.SECURE        && <StandingPerson x={217} y={173} />}
      {scenario === S.BATHROOM_FALL && <FallenPerson   x={77}  y={160} />}
      {scenario === S.BEDROOM_FALL  && <FallenPerson   x={360} y={160} />}
      {scenario === S.PET_LIVING    && <DogIcon        x={207} y={162} />}
    </Svg>
  );
}

// ── Main export ───────────────────────────────────────
export default function MapSimulatorTab() {
  const [scenario, setScenario]       = useState(S.SECURE);
  const [visibleLogs, setVisibleLogs] = useState([]);
  const timerRef = useRef([]);

  useEffect(() => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    setVisibleLogs([]);

    LOG_DATA[scenario].forEach((log, i) => {
      const t = setTimeout(() => {
        setVisibleLogs(prev => [...prev, { ...log, key: `${scenario}-${i}` }]);
      }, i * 650);
      timerRef.current.push(t);
    });

    return () => timerRef.current.forEach(clearTimeout);
  }, [scenario]);

  const isAlert     = scenario === S.BATHROOM_FALL || scenario === S.BEDROOM_FALL;
  const statusLabel = isAlert ? 'Alert Active' : scenario === S.PET_LIVING ? 'Pet Detected' : 'All Secure';
  const statusColor = isAlert ? '#E74C3C'       : scenario === S.PET_LIVING ? '#D4AC0D'      : '#5DB870';

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerText}>
          <Text style={s.title}>Laure Node Simulation</Text>
          <Text style={s.subtitle}>Wi-Fi CSI sensing · interactive floor plan</Text>
        </View>
        <View style={[s.statusPill, { backgroundColor: statusColor + '22' }]}>
          <View style={[s.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[s.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Floor plan */}
        <View style={s.mapPanel}>
          <Text style={s.panelLabel}>Floor Plan · Live</Text>
          <FloorPlanSvg scenario={scenario} />
        </View>

        {/* Data feed */}
        <View style={s.feedPanel}>
          <Text style={s.panelLabel}>Live Data Feed</Text>
          <View style={s.feedBody}>
            {visibleLogs.length === 0 && (
              <Text style={s.feedEmpty}>Awaiting data stream…</Text>
            )}
            {visibleLogs.map(log => (
              <Text key={log.key} style={[s.logEntry, { color: LOG_COLORS[log.type] ?? '#DDD3C9' }]}>
                {'› '}{log.text}
              </Text>
            ))}
          </View>
        </View>

        {/* Controls */}
        <View style={s.controlPanel}>
          <Text style={s.panelLabel}>Interactive Control Panel</Text>
          <View style={s.btnGrid}>
            <Pressable
              style={[s.ctrlBtn, s.btnSecure, scenario === S.SECURE && s.ctrlActive]}
              onPress={() => setScenario(S.SECURE)}
            >
              <Text style={s.ctrlText}>Reset: All Secure</Text>
            </Pressable>
            <Pressable
              style={[s.ctrlBtn, s.btnAlert, scenario === S.BATHROOM_FALL && s.ctrlActive]}
              onPress={() => setScenario(S.BATHROOM_FALL)}
            >
              <Text style={s.ctrlText}>Trigger Bathroom Fall</Text>
            </Pressable>
            <Pressable
              style={[s.ctrlBtn, s.btnAlert, scenario === S.BEDROOM_FALL && s.ctrlActive]}
              onPress={() => setScenario(S.BEDROOM_FALL)}
            >
              <Text style={s.ctrlText}>Trigger Bedroom Fall</Text>
            </Pressable>
            <Pressable
              style={[s.ctrlBtn, s.btnPet, scenario === S.PET_LIVING && s.ctrlActive]}
              onPress={() => setScenario(S.PET_LIVING)}
            >
              <Text style={s.ctrlText}>Pet in Living Room</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#1a1525' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#2e2640' },
  headerText:   { flex: 1, marginRight: 8 },
  title:        { color: '#fff', fontSize: 16, fontWeight: '700' },
  subtitle:     { color: '#9F8A91', fontSize: 11, marginTop: 2 },
  statusPill:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot:    { width: 7, height: 7, borderRadius: 4 },
  statusLabel:  { fontSize: 11, fontWeight: '700' },
  scroll:       { flex: 1 },
  scrollContent:{ paddingBottom: 24 },
  mapPanel:     { backgroundColor: '#12101a', paddingBottom: 4 },
  panelLabel:   { color: '#5c5070', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4, textTransform: 'uppercase' },
  feedPanel:    { marginHorizontal: 12, marginTop: 10, backgroundColor: '#0e0d14', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#2a1f38' },
  feedBody:     { gap: 4 },
  feedEmpty:    { color: '#4a3f5c', fontSize: 12, fontStyle: 'italic' },
  logEntry:     { fontSize: 11, lineHeight: 18, fontFamily: 'monospace' },
  controlPanel: { marginHorizontal: 12, marginTop: 10 },
  btnGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  ctrlBtn:      { width: '48%', borderRadius: 10, paddingVertical: 12, alignItems: 'center', opacity: 0.75 },
  ctrlActive:   { opacity: 1, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.33)' },
  btnSecure:    { backgroundColor: '#2a4a3a' },
  btnAlert:     { backgroundColor: '#4a2030' },
  btnPet:       { backgroundColor: '#3a3a0a' },
  ctrlText:     { color: '#fff', fontWeight: '700', fontSize: 12, textAlign: 'center' },
});
