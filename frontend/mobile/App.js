import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { database, onValue, ref, set } from "./src/firebase";
import DashboardScreen from "./src/screens/DashboardScreen";

export default function App() {
  const { width } = useWindowDimensions();
  const isCompact = width < 390;

  const [phase, setPhase] = useState("splash");
  const [activeTab, setActiveTab] = useState("home");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase("onboarding");
    }, 1100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const homeRef = ref(database, "/");
    const unsubscribe = onValue(
      homeRef,
      (snapshot) => {
        setHomeData(snapshot.val());
        setConnectionStatus("live");
        setLoading(false);
      },
      () => {
        setConnectionStatus("error");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const isAlert = Boolean(homeData?.system_status?.includes("anomaly"));

  if (phase === "splash") {
    return (
      <SafeAreaView style={styles.splashWrap}>
        <StatusBar style="light" />
        <View style={styles.splashOrb} />
        <Text style={styles.splashTitle}>Landa</Text>
        <Text style={styles.splashSub}>Soft safety, always on</Text>
      </SafeAreaView>
    );
  }

  if (phase === "onboarding") {
    return (
      <SafeAreaView style={styles.onboardingWrap}>
        <StatusBar style="dark" />
        <View style={styles.onboardingCard}>
          <Text style={styles.onboardingBadge}>WELCOME</Text>
          <Text style={styles.onboardingTitle}>A gentler way to care at home.</Text>
          <Text style={styles.onboardingBody}>
            Landa uses Wi-Fi sensing to detect patterns and surface possible falls.
            No cameras, no invasive setup.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={() => setPhase("app")}>
            <Text style={styles.primaryBtnText}>Enter Dashboard</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.appWrap}>
      <StatusBar style="dark" />

      {isAlert && <AlertView status={homeData?.system_status} />}

      {!isAlert && !showAdminPanel && (
        <>
          <ScrollView
            style={styles.content}
            contentContainerStyle={[
              styles.contentPad,
              isCompact ? styles.contentPadCompact : null,
            ]}
          >
            {activeTab === "home" && (
              <HomeTab
                homeData={homeData}
                loading={loading}
                connectionStatus={connectionStatus}
                onOpenAdmin={() => setShowAdminPanel(true)}
                compact={isCompact}
              />
            )}
            {activeTab === "map" && (
              <DashboardScreen />
            )}
            {activeTab === "alerts" && (
              <SimpleTab
                title="Alerts"
                text="No recent alerts right now. You will be notified instantly."
              />
            )}
            {activeTab === "settings" && (
              <SimpleTab
                title="Settings"
                text="Profile, notifications, and privacy options coming next."
              />
            )}
          </ScrollView>

          <BottomTabs activeTab={activeTab} onSelect={setActiveTab} />
        </>
      )}

      {showAdminPanel && (
        <AdminPanel
          homeData={homeData}
          loading={loading}
          onClose={() => setShowAdminPanel(false)}
          compact={isCompact}
        />
      )}
    </SafeAreaView>
  );
}

function HomeTab({ homeData, loading, connectionStatus, onOpenAdmin, compact }) {
  const statusLabel = prettifyStatus(homeData?.system_status || "all_secure");
  const cards = useMemo(
    () => [
      {
        name: "Bathroom",
        variance: formatVariance(homeData?.rooms?.bathroom?.csi_variance),
      },
      {
        name: "Bedroom",
        variance: formatVariance(homeData?.rooms?.bedroom?.csi_variance),
      },
      {
        name: "Living Room",
        variance: formatVariance(homeData?.rooms?.living_room?.csi_variance),
      },
    ],
    [homeData]
  );

  return (
    <View style={styles.homeWrap}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Realtime Status</Text>
        <Text style={styles.heroTitle}>Everything feels calm.</Text>
        <Text style={styles.heroSubtitle}>System: {statusLabel}</Text>

        <View style={styles.chipsRow}>
          <StatusChip
            label={connectionStatus === "live" ? "Connected" : "Offline"}
            tone={connectionStatus === "live" ? "good" : "warn"}
          />
          <StatusChip
            label={loading ? "Syncing..." : "Live"}
            tone={loading ? "muted" : "good"}
          />
        </View>
      </View>

      <View style={styles.roomsGrid}>
        {cards.map((room) => (
          <View key={room.name} style={styles.roomCard}>
            <Text style={styles.roomName}>{room.name}</Text>
            <Text style={styles.roomVariance}>CSI {room.variance}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.primaryBtn} onPress={onOpenAdmin}>
        <Text style={[styles.primaryBtnText, compact ? styles.btnTextCompact : null]}>
          Simulator Controls
        </Text>
      </Pressable>
    </View>
  );
}

function StatusChip({ label, tone }) {
  const toneStyle =
    tone === "good"
      ? styles.chipGood
      : tone === "warn"
      ? styles.chipWarn
      : styles.chipMuted;
  return (
    <View style={[styles.chip, toneStyle]}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

function AlertView({ status }) {
  return (
    <View style={styles.alertWrap}>
      <Text style={styles.alertTitle}>Possible Fall Detected</Text>
      <Text style={styles.alertSub}>{prettifyStatus(status || "anomaly_fall")}</Text>
      <Text style={styles.alertHint}>Please check in with your loved one now.</Text>
    </View>
  );
}

function SimpleTab({ title, text }) {
  return (
    <View style={styles.simpleTabCard}>
      <Text style={styles.simpleTabTitle}>{title}</Text>
      <Text style={styles.simpleTabBody}>{text}</Text>
    </View>
  );
}

function BottomTabs({ activeTab, onSelect }) {
  const tabs = [
    { id: "home", label: "Home" },
    { id: "map", label: "Map" },
    { id: "alerts", label: "Alerts" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <View style={styles.bottomTabs}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.id}
          style={[styles.tabBtn, activeTab === tab.id ? styles.tabBtnActive : null]}
          onPress={() => onSelect(tab.id)}
        >
          <Text
            style={[styles.tabText, activeTab === tab.id ? styles.tabTextActive : null]}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function AdminPanel({ homeData, loading, onClose, compact }) {
  const status = prettifyStatus(homeData?.system_status || "all_secure");

  const sendCommand = async (type, room) => {
    await set(ref(database, "/control/command"), {
      type,
      room: room || null,
      ts: Date.now(),
    });
  };

  return (
    <SafeAreaView style={styles.adminWrap}>
      <View style={styles.adminTop}>
        <View style={styles.adminTitleWrap}>
          <Text style={styles.adminTitle}>Wi-Fi Presence Studio</Text>
          <Text style={styles.adminSub}>Live home map with one-tap controls</Text>
        </View>
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Done</Text>
        </Pressable>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusText}>Status: {status}</Text>
        <Text style={styles.statusText}>
          Living CSI: {formatVariance(homeData?.rooms?.living_room?.csi_variance)}
        </Text>
        <Text style={styles.statusText}>{loading ? "Sync: Loading" : "Sync: Live"}</Text>
      </View>

      <FloorPlan compact={compact} />

      <View style={styles.controlGrid}>
        <Pressable style={[styles.ctrlBtn, styles.ctrlSafe]} onPress={() => sendCommand("reset")}>
          <Text style={styles.ctrlText}>Reset All Secure</Text>
        </Pressable>
        <Pressable
          style={[styles.ctrlBtn, styles.ctrlDanger]}
          onPress={() => sendCommand("fall", "bathroom")}
        >
          <Text style={styles.ctrlText}>Trigger Bathroom Fall</Text>
        </Pressable>
        <Pressable
          style={[styles.ctrlBtn, styles.ctrlDanger]}
          onPress={() => sendCommand("fall", "bedroom")}
        >
          <Text style={styles.ctrlText}>Trigger Bedroom Fall</Text>
        </Pressable>
        <Pressable
          style={[styles.ctrlBtn, styles.ctrlPet]}
          onPress={() => sendCommand("pet", "living_room")}
        >
          <Text style={styles.ctrlText}>Pet in Living Room</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function FloorPlan({ compact }) {
  return (
    <View style={[styles.planOuter, compact ? styles.planOuterCompact : null]}>
      <View style={[styles.room, styles.bathroom]}>
        <Text style={styles.roomLabel}>BATHROOM</Text>
      </View>
      <View style={[styles.room, styles.hallway]}>
        <Text style={styles.roomLabel}>HALLWAY</Text>
      </View>
      <View style={[styles.room, styles.bedroom]}>
        <Text style={styles.roomLabel}>BEDROOM</Text>
      </View>
      <View style={[styles.room, styles.living]}>
        <Text style={styles.roomLabel}>LIVING ROOM</Text>
      </View>
      <View style={[styles.nodeDot, styles.nodeBath]} />
      <View style={[styles.nodeDot, styles.nodeBed]} />
      <View style={[styles.nodeDot, styles.nodeLiving]} />
    </View>
  );
}

function formatVariance(value) {
  if (typeof value === "number") return value.toFixed(4);
  return "--";
}

function prettifyStatus(status) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  splashWrap: {
    flex: 1,
    backgroundColor: "#2b1727",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  splashOrb: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#f6afc7",
    shadowColor: "#f6afc7",
    shadowOpacity: 0.6,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
  },
  splashTitle: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  splashSub: {
    color: "#f3c9d7",
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  onboardingWrap: {
    flex: 1,
    backgroundColor: "#fff2f7",
    padding: 22,
    justifyContent: "center",
  },
  onboardingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderColor: "#f4d9e6",
    borderWidth: 1,
    padding: 24,
    gap: 14,
    shadowColor: "#b24f74",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  onboardingBadge: {
    color: "#c05d84",
    fontSize: 11,
    letterSpacing: 1.3,
    fontWeight: "700",
  },
  onboardingTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    color: "#351e2d",
  },
  onboardingBody: {
    fontSize: 15,
    lineHeight: 22,
    color: "#705066",
  },
  appWrap: {
    flex: 1,
    backgroundColor: "#fff7fb",
  },
  content: {
    flex: 1,
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  contentPadCompact: {
    paddingHorizontal: 12,
  },
  homeWrap: {
    gap: 14,
  },
  heroCard: {
    backgroundColor: "#ffe4ef",
    borderRadius: 22,
    borderColor: "#f3bcd2",
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  heroEyebrow: {
    color: "#bb5a82",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#321c2b",
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "700",
  },
  heroSubtitle: {
    color: "#6e4d61",
    fontSize: 14,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  chip: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipGood: {
    backgroundColor: "#d5f5e4",
  },
  chipWarn: {
    backgroundColor: "#ffe3d9",
  },
  chipMuted: {
    backgroundColor: "#efe8ee",
  },
  chipText: {
    color: "#51394a",
    fontSize: 12,
    fontWeight: "600",
  },
  roomsGrid: {
    gap: 10,
  },
  roomCard: {
    backgroundColor: "#fff",
    borderColor: "#f2dfe8",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomName: {
    fontSize: 15,
    color: "#3a2431",
    fontWeight: "600",
  },
  roomVariance: {
    fontSize: 13,
    color: "#7e6273",
    fontWeight: "600",
  },
  primaryBtn: {
    backgroundColor: "#c95d88",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#c95d88",
    shadowOpacity: 0.26,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.2,
    fontSize: 15,
  },
  btnTextCompact: {
    fontSize: 14,
  },
  simpleTabCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f2dfe8",
    padding: 18,
    gap: 8,
  },
  simpleTabTitle: {
    color: "#35212f",
    fontSize: 22,
    fontWeight: "700",
  },
  simpleTabBody: {
    color: "#6c4e61",
    fontSize: 14,
    lineHeight: 20,
  },
  bottomTabs: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f0dce6",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: "#ffe9f2",
  },
  tabText: {
    color: "#9b7d8d",
    fontSize: 12,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#c45782",
  },
  alertWrap: {
    flex: 1,
    backgroundColor: "#bd3656",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 8,
  },
  alertTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  alertSub: {
    color: "#ffd9e6",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  alertHint: {
    color: "#ffd9e6",
    fontSize: 13,
    textAlign: "center",
  },
  adminWrap: {
    flex: 1,
    backgroundColor: "#2a1324",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 10,
  },
  adminTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  adminTitleWrap: {
    flex: 1,
    gap: 2,
  },
  adminTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  adminSub: {
    color: "#e8c8d8",
    fontSize: 12,
  },
  closeBtn: {
    backgroundColor: "#5d304b",
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  closeBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  statusRow: {
    backgroundColor: "#3a1d31",
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  statusText: {
    color: "#f8d9e8",
    fontSize: 12,
    fontWeight: "700",
  },
  planOuter: {
    width: "100%",
    aspectRatio: 1.18,
    backgroundColor: "#0f0813",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#f1e8ef",
    position: "relative",
    overflow: "hidden",
  },
  planOuterCompact: {
    aspectRatio: 1.1,
  },
  room: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "#d8bfd0",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  bathroom: {
    top: "10%",
    left: "6%",
    width: "30%",
    height: "24%",
  },
  hallway: {
    top: "11%",
    left: "39%",
    width: "24%",
    height: "20%",
  },
  bedroom: {
    top: "8%",
    left: "66%",
    width: "29%",
    height: "26%",
  },
  living: {
    top: "40%",
    left: "40%",
    width: "48%",
    height: "40%",
  },
  roomLabel: {
    color: "#f0ddeb",
    fontSize: 10,
    letterSpacing: 0.4,
    fontWeight: "700",
  },
  nodeDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 99,
    backgroundColor: "#ffc8dc",
    borderWidth: 1,
    borderColor: "#fff",
  },
  nodeBath: {
    top: "24%",
    left: "19%",
  },
  nodeBed: {
    top: "21%",
    left: "79%",
  },
  nodeLiving: {
    top: "57%",
    left: "61%",
  },
  controlGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  ctrlBtn: {
    width: "48.8%",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  ctrlSafe: {
    backgroundColor: "#59658f",
  },
  ctrlDanger: {
    backgroundColor: "#7f365c",
  },
  ctrlPet: {
    backgroundColor: "#5e5b91",
  },
  ctrlText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },
});
