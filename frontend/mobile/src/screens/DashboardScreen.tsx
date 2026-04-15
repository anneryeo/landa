import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { database, onValue, ref } from "../firebase";

interface NodeData {
  node_id: string;
  location: string;
  status: "secure" | "anomaly_fall";
  csi_variance: number;
  last_updated: number;
}

const ROOM_KEYS = ["bathroom", "hallway", "bedroom", "living room"];

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 390;

  const [nodeData, setNodeData] = useState<NodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nodeRef = ref(database, "/nodes/active_node");
    const unsubscribe = onValue(
      nodeRef,
      (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          setNodeData(null);
          setError("No active node data yet.");
          setLoading(false);
          return;
        }

        setNodeData(data as NodeData);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err?.message || "Failed to read live node data.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const activeRoom = useMemo(
    () => (nodeData?.location || "").trim().toLowerCase(),
    [nodeData?.location]
  );

  const status = nodeData?.status || "secure";
  const lastUpdated = formatTimestamp(nodeData?.last_updated);

  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Live Dashboard</Text>
        <Text style={styles.subtle}>Connecting to active node stream...</Text>
      </View>
    );
  }

  if (error && !nodeData) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Live Dashboard</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerCard}>
        <Text style={styles.kicker}>ACTIVE NODE</Text>
        <Text style={styles.title}>Landa Safety Dashboard</Text>
        <Text style={styles.metaLine}>Node: {nodeData?.node_id || "--"}</Text>
        <Text style={styles.metaLine}>Location: {nodeData?.location || "--"}</Text>
        <Text style={styles.metaLine}>Last updated: {lastUpdated}</Text>
      </View>

      {status === "secure" ? (
        <View style={styles.secureCard}>
          <Text style={styles.secureTitle}>Home is Secure</Text>
          <Text style={styles.secureSub}>
            CSI variance is within expected range ({formatVariance(nodeData?.csi_variance)}).
          </Text>
        </View>
      ) : (
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>Potential Fall Detected</Text>
          <Text style={styles.alertSub}>
            Anomaly detected in {nodeData?.location || "active room"}. CSI variance:
            {" "}
            {formatVariance(nodeData?.csi_variance)}
          </Text>
          <View style={styles.alertActions}>
            <Pressable style={[styles.actionBtn, styles.actionBtnPrimary]}>
              <Text style={styles.actionBtnText}>Call Family</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.actionBtnGhost]}>
              <Text style={styles.actionBtnText}>Acknowledge</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={[styles.mapCard, compact ? styles.mapCardCompact : null]}>
        <Text style={styles.mapTitle}>Home Map Simulation</Text>
        <View style={styles.mapArea}>
          <RoomBox label="BATHROOM" roomKey="bathroom" activeRoom={activeRoom} style={styles.rBathroom} />
          <RoomBox label="HALLWAY" roomKey="hallway" activeRoom={activeRoom} style={styles.rHallway} />
          <RoomBox label="BEDROOM" roomKey="bedroom" activeRoom={activeRoom} style={styles.rBedroom} />
          <RoomBox label="LIVING ROOM" roomKey="living room" activeRoom={activeRoom} style={styles.rLiving} />

          <View style={[styles.nodeDot, getDotPosition(activeRoom), status === "anomaly_fall" ? styles.nodeDotAlert : styles.nodeDotSecure]} />
        </View>
        <View style={styles.legendRow}>
          {ROOM_KEYS.map((r) => (
            <Text
              key={r}
              style={[styles.legendItem, activeRoom === r ? styles.legendItemActive : null]}
            >
              {toTitle(r)}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

type RoomBoxProps = {
  label: string;
  roomKey: string;
  activeRoom: string;
  style?: object;
};

function RoomBox({ label, roomKey, activeRoom, style }: RoomBoxProps) {
  return (
    <View style={[styles.room, style, activeRoom === roomKey ? styles.roomActive : null]}>
      <Text style={styles.roomText}>{label}</Text>
    </View>
  );
}

function getDotPosition(activeRoom: string) {
  switch (activeRoom) {
    case "bathroom":
      return styles.dotBathroom;
    case "bedroom":
      return styles.dotBedroom;
    case "living room":
      return styles.dotLiving;
    case "hallway":
      return styles.dotHallway;
    default:
      return styles.dotLiving;
  }
}

function formatVariance(value?: number) {
  if (typeof value !== "number") return "--";
  return value.toFixed(4);
}

function formatTimestamp(ts?: number) {
  if (!ts) return "--";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "--";
  }
}

function toTitle(value: string) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderColor: "#f0dbe6",
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  headerCard: {
    backgroundColor: "#ffe7f0",
    borderRadius: 18,
    borderColor: "#f1bfd2",
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  kicker: {
    color: "#b4537b",
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  title: {
    color: "#351f2d",
    fontSize: 24,
    fontWeight: "700",
  },
  metaLine: {
    color: "#6e5161",
    fontSize: 13,
  },
  subtle: {
    color: "#755769",
    fontSize: 13,
  },
  errorText: {
    color: "#b63654",
    fontSize: 13,
    fontWeight: "600",
  },
  secureCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderColor: "#d7f0e2",
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  secureTitle: {
    color: "#265940",
    fontWeight: "700",
    fontSize: 18,
  },
  secureSub: {
    color: "#3b6a51",
    fontSize: 13,
    lineHeight: 18,
  },
  alertCard: {
    backgroundColor: "#fff3f5",
    borderRadius: 18,
    borderColor: "#f5b9ca",
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  alertTitle: {
    color: "#af2445",
    fontWeight: "700",
    fontSize: 20,
  },
  alertSub: {
    color: "#7f3a4d",
    fontSize: 13,
    lineHeight: 18,
  },
  alertActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  actionBtnPrimary: {
    backgroundColor: "#c9517e",
  },
  actionBtnGhost: {
    backgroundColor: "#eec7d6",
  },
  actionBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  mapCard: {
    backgroundColor: "#2b1524",
    borderRadius: 18,
    padding: 12,
    gap: 10,
  },
  mapCardCompact: {
    padding: 10,
  },
  mapTitle: {
    color: "#ffd9e7",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  mapArea: {
    width: "100%",
    aspectRatio: 1.18,
    backgroundColor: "#0f0912",
    borderColor: "#f6eaf1",
    borderWidth: 2,
    borderRadius: 12,
    position: "relative",
    overflow: "hidden",
  },
  room: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "#d8bfd0",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  roomActive: {
    borderColor: "#ffafcf",
    backgroundColor: "rgba(255, 175, 207, 0.08)",
  },
  roomText: {
    color: "#ead7e3",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  rBathroom: {
    top: "10%",
    left: "7%",
    width: "30%",
    height: "24%",
  },
  rHallway: {
    top: "12%",
    left: "40%",
    width: "23%",
    height: "20%",
  },
  rBedroom: {
    top: "8%",
    left: "66%",
    width: "28%",
    height: "26%",
  },
  rLiving: {
    top: "40%",
    left: "40%",
    width: "48%",
    height: "40%",
  },
  nodeDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#fff",
  },
  nodeDotSecure: {
    backgroundColor: "#9de8c2",
  },
  nodeDotAlert: {
    backgroundColor: "#ff6f9e",
  },
  dotBathroom: {
    top: "24%",
    left: "20%",
  },
  dotHallway: {
    top: "22%",
    left: "50%",
  },
  dotBedroom: {
    top: "22%",
    left: "79%",
  },
  dotLiving: {
    top: "58%",
    left: "62%",
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  legendItem: {
    color: "#d8bfd0",
    fontSize: 11,
    backgroundColor: "#402437",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  legendItemActive: {
    color: "#2b1524",
    backgroundColor: "#ffb4d1",
    fontWeight: "700",
  },
});
