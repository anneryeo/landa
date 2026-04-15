import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { database, onValue, ref, set } from "./src/firebase";
import MapSimulatorTab from "./src/components/MapSimulatorTab";

export default function App() {
  const [phase, setPhase] = useState("splash");
  const [activeTab, setActiveTab] = useState("home");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  useEffect(() => {
    const timer = setTimeout(() => setPhase("onboarding"), 1200);
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
      <SafeAreaProvider>
      <SafeAreaView style={styles.splashWrap}>
        <StatusBar style="light" />
        <Text style={styles.splashTitle}>Landa</Text>
        <Text style={styles.splashSub}>Wi-Fi Home Safety</Text>
      </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (phase === "onboarding") {
    return (
      <SafeAreaProvider>
      <SafeAreaView style={styles.onboardingWrap}>
        <StatusBar style="dark" />
        <Text style={styles.onboardingTitle}>Calm care, without cameras.</Text>
        <Text style={styles.onboardingBody}>
          This MVP monitors motion patterns using Wi-Fi CSI and raises alerts for
          possible falls.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={() => setPhase("app")}>
          <Text style={styles.primaryBtnText}>Continue</Text>
        </Pressable>
      </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.appWrap}>
      <StatusBar style="dark" />

      {isAlert && <AlertView status={homeData?.system_status} />}

      {!isAlert && !showAdminPanel && (
        <>
          {activeTab === "map" ? (
            <View style={styles.content}>
              <MapSimulatorTab />
            </View>
          ) : (
            <ScrollView style={styles.content} contentContainerStyle={styles.contentPad}>
              {activeTab === "home" && (
                <HomeTab
                  homeData={homeData}
                  loading={loading}
                  connectionStatus={connectionStatus}
                  onOpenAdmin={() => setShowAdminPanel(true)}
                />
              )}
              {activeTab === "alerts" && <SimpleTab title="Alerts" text="No recent alerts." />}
              {activeTab === "settings" && (
                <SimpleTab title="Settings" text="Account and notification options." />
              )}
            </ScrollView>
          )}
          <BottomTabs activeTab={activeTab} onSelect={setActiveTab} />
        </>
      )}

      {showAdminPanel && (
        <AdminPanel
          homeData={homeData}
          loading={loading}
          onClose={() => setShowAdminPanel(false)}
        />
      )}
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

function HomeTab({ homeData, loading, connectionStatus, onOpenAdmin }) {
  const status = homeData?.system_status || "all_secure";
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Home Dashboard</Text>
      <Text style={styles.cardRow}>System: {status}</Text>
      <Text style={styles.cardRow}>Connection: {connectionStatus}</Text>
      <Text style={styles.cardRow}>
        Bathroom variance: {formatVariance(homeData?.rooms?.bathroom?.csi_variance)}
      </Text>
      <Text style={styles.cardRow}>
        Bedroom variance: {formatVariance(homeData?.rooms?.bedroom?.csi_variance)}
      </Text>
      <Text style={styles.cardRow}>
        Living room variance: {formatVariance(homeData?.rooms?.living_room?.csi_variance)}
      </Text>
      <Pressable style={styles.primaryBtn} onPress={onOpenAdmin}>
        <Text style={styles.primaryBtnText}>Open Simulator Controls</Text>
      </Pressable>
      {loading && <Text style={styles.muted}>Loading realtime data...</Text>}
    </View>
  );
}

function AlertView({ status }) {
  return (
    <View style={styles.alertWrap}>
      <Text style={styles.alertTitle}>Potential Fall Detected</Text>
      <Text style={styles.alertSub}>{status}</Text>
    </View>
  );
}

function SimpleTab({ title, text }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardRow}>{text}</Text>
    </View>
  );
}

function BottomTabs({ activeTab, onSelect }) {
  const tabs = ["home", "map", "alerts", "settings"];
  return (
    <View style={styles.bottomTabs}>
      {tabs.map((tab) => (
        <Pressable
          key={tab}
          style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
          onPress={() => onSelect(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function AdminPanel({ homeData, loading, onClose }) {
  const status = homeData?.system_status || "all_secure";

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
          <Text style={styles.adminTitle}>Wi-Fi Sensing: Home Presence Detection</Text>
          <Text style={styles.adminSub}>Baseline CSI established. Environment stable.</Text>
        </View>
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Close</Text>
        </Pressable>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusText}>STATUS: {status}</Text>
        <Text style={styles.statusText}>
          CSI: {formatVariance(homeData?.rooms?.living_room?.csi_variance)}
        </Text>
        <Text style={styles.statusText}>{loading ? "SYNC: LOADING" : "SYNC: LIVE"}</Text>
      </View>

      <FloorPlan />

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

function FloorPlan() {
  return (
    <View style={styles.planOuter}>
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
      <View style={[styles.nodeDot, { top: 120, left: 92 }]} />
      <View style={[styles.nodeDot, { top: 96, left: 238 }]} />
      <View style={[styles.nodeDot, { top: 216, left: 178 }]} />
    </View>
  );
}

function formatVariance(value) {
  if (typeof value === "number") return value.toFixed(4);
  return "--";
}

const styles = StyleSheet.create({
  splashWrap: {
    flex: 1,
    backgroundColor: "#211723",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  splashTitle: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "700",
  },
  splashSub: {
    color: "#cc9eaa",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontSize: 12,
  },
  onboardingWrap: {
    flex: 1,
    backgroundColor: "#f8ede8",
    padding: 24,
    justifyContent: "center",
    gap: 16,
  },
  onboardingTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2d2028",
  },
  onboardingBody: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5a4550",
  },
  appWrap: {
    flex: 1,
    backgroundColor: "#fdf6f0",
  },
  content: {
    flex: 1,
  },
  contentPad: {
    padding: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#f0dde2",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2d2028",
  },
  cardRow: {
    color: "#4f3d46",
    fontSize: 14,
  },
  muted: {
    color: "#8f7f86",
    fontSize: 12,
  },
  primaryBtn: {
    backgroundColor: "#b5546a",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  bottomTabs: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#ecd9df",
    backgroundColor: "#fff",
    paddingVertical: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  tabBtnActive: {
    backgroundColor: "#f8e7ec",
  },
  tabText: {
    textTransform: "capitalize",
    color: "#9f8a91",
  },
  tabTextActive: {
    color: "#b5546a",
    fontWeight: "700",
  },
  alertWrap: {
    flex: 1,
    backgroundColor: "#b5253a",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  alertTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  alertSub: {
    color: "#ffd6dd",
    fontSize: 14,
  },
  adminWrap: {
    flex: 1,
    backgroundColor: "#16121d",
    padding: 14,
    gap: 12,
  },
  adminTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  adminTitleWrap: {
    flex: 1,
  },
  adminTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  adminSub: {
    color: "#c6bccb",
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: "#302538",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  closeBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  statusRow: {
    backgroundColor: "#211927",
    borderRadius: 10,
    padding: 10,
    gap: 5,
  },
  statusText: {
    color: "#d6ccda",
    fontSize: 12,
    fontWeight: "700",
  },
  planOuter: {
    height: 320,
    backgroundColor: "#0f0d16",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#f0f0f0",
    position: "relative",
  },
  room: {
    position: "absolute",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#c9c0cc",
    alignItems: "center",
    justifyContent: "center",
  },
  bathroom: {
    top: 36,
    left: 20,
    width: 120,
    height: 90,
  },
  hallway: {
    top: 36,
    left: 152,
    width: 92,
    height: 70,
  },
  bedroom: {
    top: 28,
    left: 252,
    width: 112,
    height: 98,
  },
  living: {
    top: 136,
    left: 142,
    width: 180,
    height: 130,
  },
  roomLabel: {
    color: "#d9d2dd",
    fontSize: 11,
    fontWeight: "700",
  },
  nodeDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#9ec2ff",
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  controlGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ctrlBtn: {
    width: "48.8%",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  ctrlSafe: {
    backgroundColor: "#3b486f",
  },
  ctrlDanger: {
    backgroundColor: "#4e3144",
  },
  ctrlPet: {
    backgroundColor: "#2f4b58",
  },
  ctrlText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },
});
