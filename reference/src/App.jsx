import { useState, useEffect } from "react";
import { useLandaData } from "./hooks/useLandaData";
import SplashScreen from "./components/SplashScreen";
import OnboardingScreen from "./components/OnboardingScreen";
import PairNodeScreen from "./components/PairNodeScreen";
import Dashboard from "./components/Dashboard";
import AlertScreen from "./components/AlertScreen";
import MapScreen from "./components/MapScreen";
import SimulatorPanel from "./components/SimulatorPanel";
import AdminControlPanel from "./components/AdminControlPanel";
import "./App.css";

const ONBOARDING_KEY = "landa_onboarded";

export default function App() {
  const { homeData, loading, connectionStatus } = useLandaData();

  const [phase, setPhase] = useState("splash"); // splash | onboarding | pair | app
  const [activeTab, setActiveTab] = useState("home");
  const [showSimulator, setShowSimulator] = useState(false);
  const [dismissedAlert, setDismissedAlert] = useState(false);
  const [prevStatus, setPrevStatus] = useState(null);

  // Auto-advance splash after 2.4s
  useEffect(() => {
    const timer = setTimeout(() => {
      const onboarded = localStorage.getItem(ONBOARDING_KEY);
      setPhase(onboarded ? "app" : "onboarding");
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  // Reset dismissed when status changes to a new alert
  useEffect(() => {
    const status = homeData?.system_status;
    if (status !== prevStatus) {
      if (isAnyRoomAlert(homeData)) setDismissedAlert(false);
      setPrevStatus(status);
    }
  }, [homeData]);

  const isAlert = !dismissedAlert && isAnyRoomAlert(homeData);

  const alertRoom = getAlertRoom(homeData);
  const alertCsi = getAlertCsiVariance(homeData);

  // ── Phases ──────────────────────────────────────────────────
  if (phase === "splash") return <SplashScreen />;

  if (phase === "onboarding")
    return (
      <OnboardingScreen
        onComplete={() => {
          localStorage.setItem(ONBOARDING_KEY, "1");
          setPhase("pair");
        }}
      />
    );

  if (phase === "pair")
    return <PairNodeScreen onComplete={() => setPhase("app")} />;

  // ── App ──────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      {/* Alert overlay — full screen red */}
      {isAlert && (
        <AlertScreen
          room={alertRoom}
          csiVariance={alertCsi}
          onDismiss={() => setDismissedAlert(true)}
        />
      )}

      {/* Main content area */}
      {!isAlert && (
        <div className="screen-content">
          {activeTab === "home" && (
            <Dashboard
              homeData={homeData}
              loading={loading}
              connectionStatus={connectionStatus}
              onOpenSimulator={() => setShowSimulator(true)}
            />
          )}
          {activeTab === "map" && (
            <MapScreen homeData={homeData} loading={loading} />
          )}
          {activeTab === "alerts" && <AlertsLog />}
          {activeTab === "settings" && <SettingsScreen />}
        </div>
      )}

      {/* Bottom nav always visible unless alert */}
      {!isAlert && (
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Simulator bottom sheet */}
      {showSimulator && (
          <div className="admin-overlay">
            <AdminControlPanel
              homeData={homeData}
              loading={loading}
              onClose={() => setShowSimulator(false)}
            />
          </div>
      )}
    </div>
  );
}

function isAnyRoomAlert(homeData) {
  if (!homeData?.rooms) return false;
  return Object.values(homeData.rooms).some(
    (room) => room?.alert_type === "fall_detected" || room?.status === "anomaly_fall"
  );
}

function getAlertRoom(homeData) {
  if (!homeData?.rooms) return "Bathroom";
  const alertEntry = Object.entries(homeData.rooms).find(
    ([, room]) => room?.alert_type === "fall_detected" || room?.status === "anomaly_fall"
  );
  if (!alertEntry) return "Bathroom";
  const [roomKey] = alertEntry;
  return roomKey
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getAlertCsiVariance(homeData) {
  if (!homeData?.rooms) return undefined;
  const alertEntry = Object.values(homeData.rooms).find(
    (room) => room?.alert_type === "fall_detected" || room?.status === "anomaly_fall"
  );
  return alertEntry?.csi_variance;
}

// ── Sub-pages ────────────────────────────────────────────────

function AlertsLog() {
  return (
    <div className="tab-page fade-in">
      <div className="tab-header">
        <h2 className="tab-title">Alerts</h2>
      </div>
      <div className="alerts-empty">
        <div className="alerts-empty-icon">🔔</div>
        <p className="alerts-empty-text">No recent alerts</p>
        <p className="alerts-empty-sub">
          Landa is actively monitoring. You'll be notified instantly if an
          anomaly is detected.
        </p>
      </div>
    </div>
  );
}

function SettingsScreen() {
  return (
    <div className="tab-page fade-in">
      <div className="tab-header">
        <h2 className="tab-title">Settings</h2>
      </div>
      <div className="settings-list">
        {[
          { label: "Account", icon: "👤", sub: "Kim · kim@email.com" },
          { label: "Notifications", icon: "🔔", sub: "Critical alerts enabled" },
          { label: "Paired Nodes", icon: "📡", sub: "2 active nodes" },
          { label: "Privacy & Data", icon: "🔒", sub: "Zero-lens guarantee" },
          {
            label: "About Landa",
            icon: "ℹ️",
            sub: "v1.0.0 · Laure Architecture",
          },
        ].map((item) => (
          <div key={item.label} className="settings-row">
            <span className="settings-icon">{item.icon}</span>
            <div className="settings-text">
              <span className="settings-label">{item.label}</span>
              <span className="settings-sub">{item.sub}</span>
            </div>
            <span className="settings-chevron">›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bottom Nav ───────────────────────────────────────────────

function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "map", label: "Map", icon: MapIcon },
    { id: "alerts", label: "Alerts", icon: BellIcon },
    { id: "settings", label: "Settings", icon: GearIcon },
  ];
  return (
    <nav className="bottom-nav">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={`nav-btn ${activeTab === id ? "nav-btn--active" : ""}`}
          onClick={() => setActiveTab(id)}
        >
          <Icon active={activeTab === id} />
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}

// ── Icons ────────────────────────────────────────────────────

function HomeIcon({ active }) {
  const c = active ? "#b5546a" : "#c0adb2";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
        stroke={c}
        strokeWidth="1.8"
        fill={active ? "#f5dde4" : "none"}
      />
      <path d="M9 21V12h6v9" stroke={c} strokeWidth="1.8" />
    </svg>
  );
}
function MapIcon({ active }) {
  const c = active ? "#b5546a" : "#c0adb2";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 4L3 7v13l6-3 6 3 6-3V4l-6 3-6-3z"
        stroke={c}
        strokeWidth="1.8"
        fill={active ? "#f5dde4" : "none"}
      />
      <path d="M9 4v13M15 7v13" stroke={c} strokeWidth="1.8" />
    </svg>
  );
}
function BellIcon({ active }) {
  const c = active ? "#b5546a" : "#c0adb2";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function GearIcon({ active }) {
  const c = active ? "#b5546a" : "#c0adb2";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke={c} strokeWidth="1.8" />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={c}
        strokeWidth="1.8"
      />
    </svg>
  );
}
