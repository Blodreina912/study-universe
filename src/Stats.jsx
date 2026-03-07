import { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, onValue } from "firebase/database";

export default function Stats({ user, onClose }) {
  const [sessions, setSessions] = useState([]);

  const safeKey = (email) => email.replace(/[.#$[\]]/g, "_");

  useEffect(() => {
    const sessRef = ref(db, `sessions/${safeKey(user.email)}`);
    const unsub = onValue(sessRef, (snap) => {
      const data = snap.val() || {};
      const list = Object.values(data).sort((a, b) => b.timestamp - a.timestamp);
      setSessions(list);
    });
    return () => unsub();
  }, [user]);

  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 25), 0);
  const subjectCounts = sessions.reduce((acc, s) => {
    acc[s.subject] = (acc[s.subject] || 0) + 1;
    return acc;
  }, {});
  const topSubject = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0];

  const subjectColors = {
    Mathematics: "#4FC3F7", Literature: "#CE93D8", Science: "#80CBC4",
    History: "#FFCC80", Music: "#F48FB1", Languages: "#A5D6A7"
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}>
      <div style={{ background: "linear-gradient(135deg, #0d1035, #050714)", border: "1px solid rgba(79,195,247,0.3)", borderRadius: 24, padding: 24, width: 420, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontFamily: "Orbitron, monospace", fontWeight: 900, color: "white", fontSize: 14, letterSpacing: 3 }}>📊 MISSION LOG</span>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Sessions", value: sessions.length, color: "#4FC3F7" },
            { label: "Minutes", value: totalMinutes, color: "#80CBC4" },
            { label: "Top Planet", value: topSubject?.[0]?.slice(0,4) || "—", color: "#FFCC80" },
          ].map((card, i) => (
            <div key={i} style={{ padding: "12px 8px", borderRadius: 12, background: `rgba(255,255,255,0.04)`, border: `1px solid ${card.color}33`, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: "bold", color: card.color, fontFamily: "Orbitron, monospace" }}>{card.value}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Subject breakdown */}
        {Object.keys(subjectCounts).length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>By Planet</div>
            {Object.entries(subjectCounts).map(([subject, count], i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "white" }}>{subject}</span>
                  <span style={{ fontSize: 12, color: subjectColors[subject] }}>{count} sessions</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
                  <div style={{ height: "100%", borderRadius: 2, width: `${(count / sessions.length) * 100}%`, background: subjectColors[subject], boxShadow: `0 0 8px ${subjectColors[subject]}` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent sessions */}
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Recent Sessions</div>
          {sessions.length === 0 && (
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, textAlign: "center", padding: "20px 0" }}>No sessions yet — start studying! 🚀</div>
          )}
          {sessions.slice(0, 8).map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 10, marginBottom: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: subjectColors[s.subject] || "#4FC3F7" }} />
                <span style={{ color: "white", fontSize: 12 }}>{s.subject}</span>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ color: "#80CBC4", fontSize: 11 }}>{s.duration} min</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{new Date(s.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}