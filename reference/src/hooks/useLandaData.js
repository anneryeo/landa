// webapp/src/hooks/useLandaData.js
import { useState, useEffect } from "react";
import { database, ref, onValue } from "../firebase";

export function useLandaData() {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  useEffect(() => {
    const homeRef = ref(database, "/");

    const unsubscribe = onValue(
      homeRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setHomeData(data);
          setConnectionStatus("live");
        }
        setLoading(false);
      },
      (error) => {
        console.error("Firebase read error:", error);
        setConnectionStatus("error");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { homeData, loading, connectionStatus };
}