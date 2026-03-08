import { useState, useEffect } from "react";
import { auth, signInWithGoogle, logOut, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, set, onValue, remove, push } from "firebase/database";
import { PLANET_SOUNDS, SATELLITE_SOUNDS, stopSound } from "./sounds";
import Flashcards from "./Flashcards";

const SUBJECTS = [
  { id: 1, name: "Mathematics", icon: "∑", color: "#4FC3F7", glow: "#0288D1", x: 22, y: 30, size: 90, moons: 2, ring: true },
  { id: 2, name: "Literature", icon: "✦", color: "#CE93D8", glow: "#AB47BC", x: 72, y: 20, size: 70, moons: 1, ring: false },
  { id: 3, name: "Science", icon: "⚛", color: "#80CBC4", glow: "#00897B", x: 55, y: 60, size: 85, moons: 0, ring: false },
  { id: 4, name: "History", icon: "⏳", color: "#FFCC80", glow: "#FB8C00", x: 15, y: 68, size: 65, moons: 1, ring: true },
  { id: 5, name: "Music", icon: "♪", color: "#F48FB1", glow: "#E91E63", x: 83, y: 55, size: 55, moons: 0, ring: false },
  { id: 6, name: "Languages", icon: "◈", color: "#A5D6A7", glow: "#43A047", x: 40, y: 42, size: 50, moons: 2, ring: false },
  { id: 7, name: "Geography", icon: "🌍", color: "#81D4FA", glow: "#0277BD", x: 62, y: 82, size: 68, moons: 1, ring: true },
  { id: 8, name: "Commerce", icon: "₿", color: "#FFD54F", glow: "#F57F17", x: 88, y: 30, size: 62, moons: 0, ring: false },
];

const SCIENCE_SATELLITES = [
  { id: "s1", name: "Physics", icon: "⚡", color: "#80CBC4", angle: 0 },
  { id: "s2", name: "Chemistry", icon: "🧪", color: "#A5D6A7", angle: 90 },
  { id: "s3", name: "Biology", icon: "🧬", color: "#EF9A9A", angle: 180 },
  { id: "s4", name: "Computer Science", icon: "💻", color: "#B39DDB", angle: 270 },
];

const AVATARS = ["🧑‍🚀", "👩‍🚀", "🤖", "👾", "🦊", "🐉"];
const THEMES = [
  { name: "Nebula", locked: false },
  { name: "Aurora", locked: false },
  { name: "Solar", locked: true },
  { name: "Void", locked: true },
];

const STUDY_ROOMS = [
  { id: 1, name: "Deep Focus Nebula", members: 12, vibe: "Silent" },
  { id: 2, name: "Lo-fi Asteroid Belt", members: 8, vibe: "Lo-fi" },
  { id: 3, name: "Debate Pulsar", members: 5, vibe: "Discussion" },
];

const SUBJECT_COLORS = {
  Mathematics: "#4FC3F7", Literature: "#CE93D8", History: "#FFCC80",
  Music: "#F48FB1", Languages: "#A5D6A7", Geography: "#81D4FA",
  Commerce: "#FFD54F", Physics: "#80CBC4", Chemistry: "#A5D6A7",
  Biology: "#EF9A9A", "Computer Science": "#B39DDB"
};

const safeKey = (email) => email.replace(/[.#$[\]]/g, "_");

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
const MEDALS = ["🥇", "🥈", "🥉"];
const RANKS = [
  { name: "Cadet", min: 0, color: "#A5D6A7" },
  { name: "Explorer", min: 1000, color: "#4FC3F7" },
  { name: "Navigator", min: 3000, color: "#CE93D8" },
  { name: "Commander", min: 6000, color: "#FFCC80" },
  { name: "Admiral", min: 10000, color: "#F48FB1" },
];
const getRank = (xp) => [...RANKS].reverse().find(r => xp >= r.min) || RANKS[0];

function Leaderboard({ user, onClose }) {
  const [players, setPlayers] = useState([]);
  useEffect(() => {
    const unsub = onValue(ref(db, "leaderboard"), (snap) => {
      const data = snap.val() || {};
      setPlayers(Object.values(data).sort((a, b) => b.xp - a.xp));
    });
    return () => unsub();
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}>
      <div style={{ background: "linear-gradient(135deg, #0d1035, #050714)", border: "1px solid rgba(255,204,128,0.3)", borderRadius: 24, padding: 24, width: 420, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontFamily: "Orbitron, monospace", fontWeight: 900, color: "white", fontSize: 14, letterSpacing: 3 }}>🏆 GALAXY RANKS</span>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {RANKS.map((r, i) => (
            <div key={i} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 50, background: `${r.color}22`, border: `1px solid ${r.color}44`, color: r.color, letterSpacing: 1 }}>{r.name}</div>
          ))}
        </div>
        {players.length === 0 && (
          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, textAlign: "center", padding: "30px 0" }}>No cosmonauts yet — be the first! 🚀</div>
        )}
        {players.map((p, i) => {
          const rank = getRank(p.xp);
          const isMe = p.email === user.email;
          return (
            <div key={i} style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, marginBottom: 8, background: isMe ? `${rank.color}18` : "rgba(255,255,255,0.03)", border: `1px solid ${isMe ? rank.color + "55" : "rgba(255,255,255,0.07)"}`, boxShadow: isMe ? `0 0 20px ${rank.color}22` : "none", overflow: "hidden" }}>
              <div style={{ fontSize: 20, width: 28, textAlign: "center" }}>
                {i < 3 ? MEDALS[i] : <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>#{i + 1}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "white", fontSize: 13, fontWeight: "bold" }}>
                  {p.name}{isMe && <span style={{ fontSize: 10, marginLeft: 6, color: rank.color }}>(you)</span>}
                </div>
                <div style={{ fontSize: 10, color: rank.color, letterSpacing: 2, marginTop: 2 }}>{rank.name}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "Orbitron, monospace", fontWeight: "bold", color: rank.color, fontSize: 14 }}>{p.xp.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>XP</div>
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.05)" }}>
                <div style={{ height: "100%", width: `${Math.min((p.xp % 1000) / 10, 100)}%`, background: rank.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── FRIENDS ────────────────────────────────────────────────────────────────
function Friends({ user, onClose }) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const unsub1 = onValue(ref(db, `users/${safeKey(user.email)}/friends`), (snap) => {
      setFriends(Object.values(snap.val() || {}));
    });
    const unsub2 = onValue(ref(db, `users/${safeKey(user.email)}/requests`), (snap) => {
      setRequests(Object.values(snap.val() || {}));
    });
    set(ref(db, `users/${safeKey(user.email)}/profile`), {
      email: user.email, name: user.displayName, online: true,
    });
    return () => { unsub1(); unsub2(); };
  }, [user]);

  const sendRequest = async () => {
    if (!searchEmail || searchEmail === user.email) { setStatus("❌ Invalid email"); return; }
    await set(ref(db, `users/${safeKey(searchEmail)}/requests/${safeKey(user.email)}`), {
      email: user.email, name: user.displayName,
    });
    setStatus("✅ Request sent!"); setSearchEmail("");
  };

  const acceptRequest = async (req) => {
    await set(ref(db, `users/${safeKey(user.email)}/friends/${safeKey(req.email)}`), { email: req.email, name: req.name });
    await set(ref(db, `users/${safeKey(req.email)}/friends/${safeKey(user.email)}`), { email: user.email, name: user.displayName });
    await remove(ref(db, `users/${safeKey(user.email)}/requests/${safeKey(req.email)}`));
  };

  const removeFriend = async (email) => {
    await remove(ref(db, `users/${safeKey(user.email)}/friends/${safeKey(email)}`));
    await remove(ref(db, `users/${safeKey(email)}/friends/${safeKey(user.email)}`));
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}>
      <div style={{ background: "linear-gradient(135deg, #0d1035, #050714)", border: "1px solid rgba(206,147,216,0.3)", borderRadius: 24, padding: 24, width: 380, maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontFamily: "Orbitron, monospace", fontWeight: 900, color: "white", fontSize: 14, letterSpacing: 3 }}>👥 COSMONAUTS</span>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Add by email</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={searchEmail} onChange={e => setSearchEmail(e.target.value)} placeholder="friend@email.com"
              style={{ flex: 1, padding: "8px 12px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(206,147,216,0.3)", color: "white", fontSize: 12, outline: "none", fontFamily: "monospace" }} />
            <button onClick={sendRequest} style={{ padding: "8px 16px", borderRadius: 12, background: "rgba(206,147,216,0.2)", border: "1px solid rgba(206,147,216,0.4)", color: "#CE93D8", fontSize: 12, cursor: "pointer" }}>Send</button>
          </div>
          {status && <div style={{ fontSize: 11, marginTop: 6, color: "#80CBC4" }}>{status}</div>}
        </div>
        {requests.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "#FFCC80", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>⭐ Requests ({requests.length})</div>
            {requests.map((req, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 12, marginBottom: 6, background: "rgba(255,204,128,0.08)", border: "1px solid rgba(255,204,128,0.2)" }}>
                <div>
                  <div style={{ color: "white", fontSize: 13, fontWeight: "bold" }}>{req.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{req.email}</div>
                </div>
                <button onClick={() => acceptRequest(req)} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(128,203,196,0.2)", border: "1px solid rgba(128,203,196,0.4)", color: "#80CBC4", fontSize: 11, cursor: "pointer" }}>Accept</button>
              </div>
            ))}
          </div>
        )}
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Friends ({friends.length})</div>
          {friends.length === 0 && <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, textAlign: "center", padding: "20px 0" }}>No cosmonauts yet — add some! 🚀</div>}
          {friends.map((f, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 12, marginBottom: 6, background: "rgba(206,147,216,0.08)", border: "1px solid rgba(206,147,216,0.2)" }}>
              <div>
                <div style={{ color: "white", fontSize: 13, fontWeight: "bold" }}>{f.name}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{f.email}</div>
              </div>
              <button onClick={() => removeFriend(f.email)} style={{ padding: "4px 10px", borderRadius: 8, background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.2)", color: "#ff6464", fontSize: 11, cursor: "pointer" }}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── STATS ───────────────────────────────────────────────────────────────────
function Stats({ user, onClose }) {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const unsub = onValue(ref(db, `sessions/${safeKey(user.email)}`), (snap) => {
      const data = snap.val() || {};
      setSessions(Object.values(data).sort((a, b) => b.timestamp - a.timestamp));
    });
    return () => unsub();
  }, [user]);

  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration || 25), 0);
  const subjectCounts = sessions.reduce((acc, s) => { acc[s.subject] = (acc[s.subject] || 0) + 1; return acc; }, {});
  const topSubject = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}>
      <div style={{ background: "linear-gradient(135deg, #0d1035, #050714)", border: "1px solid rgba(79,195,247,0.3)", borderRadius: 24, padding: 24, width: 420, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontFamily: "Orbitron, monospace", fontWeight: 900, color: "white", fontSize: 14, letterSpacing: 3 }}>📊 MISSION LOG</span>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Sessions", value: sessions.length, color: "#4FC3F7" },
            { label: "Minutes", value: totalMinutes, color: "#80CBC4" },
            { label: "Top Planet", value: topSubject?.[0]?.slice(0, 4) || "—", color: "#FFCC80" },
          ].map((card, i) => (
            <div key={i} style={{ padding: "12px 8px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: `1px solid ${card.color}33`, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: "bold", color: card.color, fontFamily: "Orbitron, monospace" }}>{card.value}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>{card.label}</div>
            </div>
          ))}
        </div>
        {Object.keys(subjectCounts).length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>By Planet</div>
            {Object.entries(subjectCounts).map(([subject, count], i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "white" }}>{subject}</span>
                  <span style={{ fontSize: 12, color: SUBJECT_COLORS[subject] }}>{count} sessions</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
                  <div style={{ height: "100%", borderRadius: 2, width: `${(count / sessions.length) * 100}%`, background: SUBJECT_COLORS[subject], boxShadow: `0 0 8px ${SUBJECT_COLORS[subject]}` }} />
                </div>
              </div>
            ))}
          </div>
        )}
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Recent Sessions</div>
          {sessions.length === 0 && <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, textAlign: "center", padding: "20px 0" }}>No sessions yet — start studying! 🚀</div>}
          {sessions.slice(0, 8).map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 10, marginBottom: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: SUBJECT_COLORS[s.subject] || "#4FC3F7" }} />
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

// ─── POMODORO ────────────────────────────────────────────────────────────────
function PomodoroTimer({ onClose, userEmail, subjectName }) {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [session, setSession] = useState("focus");
  const [cycles, setCycles] = useState(0);
  const totalSeconds = session === "focus" ? 25 * 60 : 5 * 60;
  const elapsed = totalSeconds - (minutes * 60 + seconds);
  const progress = elapsed / totalSeconds;
  const circumference = 2 * Math.PI * 54;

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSeconds(s => {
        if (s === 0) {
          setMinutes(m => {
            if (m === 0) {
              setIsRunning(false);
              if (session === "focus") {
                setCycles(c => c + 1);
                setSession("break");
                setMinutes(5);
                if (userEmail && subjectName) {
                  push(ref(db, `sessions/${safeKey(userEmail)}`), {
                    subject: subjectName, duration: 25, timestamp: Date.now(),
                  });
                }
              } else {
                setSession("focus");
                setMinutes(25);
              }
              return 0;
            }
            return m - 1;
          });
          return 59;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, session, userEmail, subjectName]);

  const reset = () => { setIsRunning(false); setMinutes(session === "focus" ? 25 : 5); setSeconds(0); };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}>
      <div style={{ position: "relative", background: "linear-gradient(135deg, #0d1035, #050714)", border: "1px solid rgba(79,195,247,0.3)", borderRadius: 24, padding: 32, textAlign: "center", boxShadow: "0 0 60px rgba(79,195,247,0.15)", minWidth: 340 }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, color: "rgba(255,255,255,0.4)", background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
        <div style={{ fontSize: 11, color: "#4FC3F7", letterSpacing: 4, textTransform: "uppercase", marginBottom: 16 }}>
          {session === "focus" ? "⚡ Deep Focus" : "☕ Break Time"} · Cycle {cycles + 1}
          {subjectName && <span style={{ color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>· {subjectName}</span>}
        </div>
        <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto 24px" }}>
          <svg width="140" height="140" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle cx="70" cy="70" r="54" fill="none"
              stroke={session === "focus" ? "#4FC3F7" : "#80CBC4"} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)}
              style={{ transition: "stroke-dashoffset 1s linear", filter: `drop-shadow(0 0 8px ${session === "focus" ? "#4FC3F7" : "#80CBC4"})` }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 32, fontWeight: "bold", color: "white", fontFamily: "'Courier New', monospace", letterSpacing: 2 }}>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={() => setIsRunning(r => !r)} style={{
            padding: "8px 24px", borderRadius: 50, fontWeight: "bold", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", cursor: "pointer",
            background: isRunning ? "rgba(255,100,100,0.2)" : "rgba(79,195,247,0.2)",
            border: `1px solid ${isRunning ? "#ff6464" : "#4FC3F7"}`,
            color: isRunning ? "#ff6464" : "#4FC3F7",
          }}>{isRunning ? "Pause" : "Launch"}</button>
          <button onClick={reset} style={{ padding: "8px 16px", borderRadius: 50, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)" }}>Reset</button>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i < cycles ? "#4FC3F7" : "rgba(255,255,255,0.1)", boxShadow: i < cycles ? "0 0 8px #4FC3F7" : "none" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── STAR ────────────────────────────────────────────────────────────────────
function Star({ x, y, size, opacity, twinkleDelay }) {
  return (
    <div style={{
      position: "absolute", borderRadius: "50%", background: "white",
      left: `${x}%`, top: `${y}%`, width: size, height: size, opacity,
      animation: `twinkle ${2 + twinkleDelay}s ease-in-out infinite`,
      animationDelay: `${twinkleDelay}s`,
    }} />
  );
}

// ─── PLANET ──────────────────────────────────────────────────────────────────
function Planet({ planet, onClick, isSelected }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ position: "absolute", cursor: "pointer", left: `${planet.x}%`, top: `${planet.y}%`, transform: "translate(-50%, -50%)" }}
      onClick={() => onClick(planet)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {planet.ring && (
        <div style={{
          position: "absolute", borderRadius: "50%", border: `1px solid ${planet.color}`,
          width: planet.size * 2.2, height: planet.size * 0.5,
          left: "50%", top: "50%", transform: "translate(-50%, -50%) rotateX(75deg)",
          opacity: hovered ? 0.6 : 0.3, transition: "opacity 0.3s",
        }} />
      )}
      <div style={{
        position: "absolute", borderRadius: "50%",
        width: planet.size + 30, height: planet.size + 30,
        background: `radial-gradient(circle, ${planet.glow}22 0%, transparent 70%)`,
        left: "50%", top: "50%", transform: "translate(-50%, -50%)",
        filter: "blur(8px)", opacity: isSelected ? 1 : 0.6, transition: "opacity 0.5s",
      }} />
      <div style={{
        position: "relative", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        width: planet.size, height: planet.size,
        background: `radial-gradient(circle at 35% 35%, ${planet.color}ff, ${planet.glow}aa, #05071480)`,
        boxShadow: isSelected
          ? `0 0 30px ${planet.color}88, 0 0 60px ${planet.glow}44, inset -15px -10px 30px rgba(0,0,0,0.5)`
          : `0 0 15px ${planet.color}44, inset -10px -8px 20px rgba(0,0,0,0.6)`,
        animation: `float ${3 + planet.id * 0.5}s ease-in-out infinite`,
        animationDelay: `${planet.id * 0.3}s`,
        transform: hovered ? "scale(1.1)" : "scale(1)", transition: "transform 0.3s",
      }}>
        <span style={{ fontSize: planet.size * 0.35, filter: "drop-shadow(0 0 8px rgba(255,255,255,0.8))" }}>{planet.icon}</span>
      </div>
      {Array.from({ length: planet.moons }).map((_, i) => (
        <div key={i} style={{
          position: "absolute", width: 10, height: 10, borderRadius: "50%",
          background: planet.color, opacity: 0.7, left: "50%", top: "50%",
          transformOrigin: `${planet.size * 0.7 + i * 15}px 0`,
          animation: `orbit ${2 + i * 1.5}s linear infinite`,
          boxShadow: `0 0 6px ${planet.color}`,
        }} />
      ))}
      {hovered && (
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: planet.size + 8, textAlign: "center", whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 11, fontWeight: "bold", letterSpacing: 3, textTransform: "uppercase", padding: "4px 8px", borderRadius: 50, color: planet.color, background: "rgba(5,7,20,0.8)", border: `1px solid ${planet.color}44` }}>
            {planet.name}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── NOTES ───────────────────────────────────────────────────────────────────
function Notes({ user, planet, satellite, onClose }) {
  const subject = satellite?.name || planet?.name;
  const color = satellite?.color || planet?.color;
  const safeKeyN = (s) => s.replace(/[.#$[\]/\s]/g, "_");
  const notesPath = `notes/${safeKeyN(user.email)}/${safeKeyN(subject)}`;
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    const unsub = onValue(ref(db, notesPath), (snap) => {
      setNotes(snap.val()?.content || "");
    });
    return () => unsub();
  }, [subject]);

  const save = () => {
    set(ref(db, notesPath), { content: notes, updatedAt: Date.now() });
    setSaved(true);
    setLastSaved(new Date().toLocaleTimeString());
  };

  const handleChange = (e) => { setNotes(e.target.value); setSaved(false); };

  useEffect(() => {
    if (saved) return;
    const timer = setTimeout(save, 3000);
    return () => clearTimeout(timer);
  }, [notes, saved]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}>
      <div style={{ background: "linear-gradient(135deg, #0d1035, #050714)", border: `1px solid ${color}44`, borderRadius: 24, padding: 24, width: 520, height: 560, display: "flex", flexDirection: "column", boxShadow: `0 0 60px ${color}22` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, background: `${color}22`, border: `1px solid ${color}55` }}>
              {satellite?.icon || planet?.icon}
            </div>
            <div>
              <div style={{ fontFamily: "Orbitron, monospace", fontWeight: 900, color: "white", fontSize: 13, letterSpacing: 2 }}>{subject}</div>
              <div style={{ fontSize: 10, color, letterSpacing: 2, textTransform: "uppercase" }}>Study Notes</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {lastSaved && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Saved {lastSaved}</span>}
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: saved ? "#80CBC4" : "#FFCC80", boxShadow: `0 0 8px ${saved ? "#80CBC4" : "#FFCC80"}` }} />
            <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {["## Heading", "**Bold**", "_Italic_", "- List item", "> Quote"].map((snippet, i) => (
            <button key={i} onClick={() => { setNotes(n => n + "\n" + snippet); setSaved(false); }}
              style={{ padding: "4px 8px", borderRadius: 8, fontSize: 10, cursor: "pointer", background: `${color}11`, border: `1px solid ${color}22`, color, letterSpacing: 1 }}>
              {["H", "B", "I", "•", "❝"][i]}
            </button>
          ))}
          <button onClick={save} style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 8, fontSize: 10, cursor: "pointer", background: saved ? "rgba(128,203,196,0.15)" : `${color}33`, border: `1px solid ${saved ? "rgba(128,203,196,0.3)" : color}`, color: saved ? "#80CBC4" : color }}>
            {saved ? "✓ Saved" : "Save"}
          </button>
        </div>
        <textarea value={notes} onChange={handleChange}
          placeholder={`Start your ${subject} notes here...\n\nTip: Use ## for headings, **text** for bold, - for lists`}
          style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: `1px solid ${color}22`, borderRadius: 16, padding: 16, color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.7, resize: "none", outline: "none", fontFamily: "'Space Mono', monospace" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{notes.length} characters · auto-saves every 3s</span>
          <button onClick={() => { setNotes(""); setSaved(false); }} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 8, cursor: "pointer", background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.2)", color: "#ff6464" }}>Clear</button>
        </div>
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [showFriends, setShowFriends] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [selectedSatellite, setSelectedSatellite] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [avatar, setAvatar] = useState(0);
  const [theme, setTheme] = useState(0);
  const [xp, setXp] = useState(2840);
  const [stars] = useState(() =>
    Array.from({ length: 120 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() < 0.1 ? 3 : Math.random() < 0.3 ? 2 : 1,
      opacity: 0.2 + Math.random() * 0.8,
      twinkleDelay: Math.random() * 4,
    }))
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        set(ref(db, `leaderboard/${safeKey(u.email)}`), {
          name: u.displayName, email: u.email, xp: xp,
        });
      }
    });
    return () => unsub();
  }, []);

  const addXp = (amount) => {
    setXp(prev => {
      const newXp = prev + amount;
      if (user) {
        set(ref(db, `leaderboard/${safeKey(user.email)}`), {
          name: user.displayName, email: user.email, xp: newXp,
        });
      }
      return newXp;
    });
  };

  const handlePlanetClick = (planet) => {
    stopSound();
    if (selectedPlanet?.id === planet.id) {
      setSelectedPlanet(null);
      setSelectedSatellite(null);
    } else {
      setSelectedPlanet(planet);
      setSelectedSatellite(null);
      PLANET_SOUNDS[planet.id]?.();
    }
    addXp(10);
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = window.innerWidth < 768;

  if (!user) return (
    <div style={{ background: "#050714", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: "0 24px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap');`}</style>
      <div style={{ fontSize: 64 }}>🌌</div>
      <div style={{ fontFamily: "Orbitron, monospace", fontSize: isMobile ? 24 : 32, fontWeight: 900, color: "#4FC3F7", letterSpacing: 6, textShadow: "0 0 30px #4FC3F788", textAlign: "center" }}>
        STUDY<span style={{ color: "#CE93D8" }}>VERSE</span>
      </div>
      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, letterSpacing: 4, textTransform: "uppercase" }}>Your universe awaits</div>
      <button onClick={signInWithGoogle} style={{
        marginTop: 16, padding: "14px 36px", borderRadius: 50,
        border: "1px solid rgba(79,195,247,0.5)", background: "rgba(79,195,247,0.1)",
        color: "#4FC3F7", fontFamily: "monospace", fontSize: 13, letterSpacing: 3,
        cursor: "pointer", textTransform: "uppercase",
      }}>🚀 Sign in with Google</button>
    </div>
  );

  const NAV_BUTTONS = [
    { label: "👥 Friends", color: "#CE93D8", onClick: () => { setShowFriends(true); setMenuOpen(false); } },
    { label: "📊 Stats", color: "#80CBC4", onClick: () => { setShowStats(true); setMenuOpen(false); } },
    { label: "🏆 Ranks", color: "#FFCC80", onClick: () => { setShowLeaderboard(true); setMenuOpen(false); } },
    { label: "🛸 Rooms", color: "#80CBC4", onClick: () => { setShowRooms(true); setMenuOpen(false); } },
    { label: "⏱ Timer", color: "#4FC3F7", onClick: () => { setShowPomodoro(true); setMenuOpen(false); } },
  ];

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh", overflow: "hidden", background: "linear-gradient(135deg, #050714 0%, #0a0f2e 50%, #050714 100%)", fontFamily: "monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Mono:wght@400;700&display=swap');
        @keyframes twinkle { 0%,100%{opacity:0.2} 50%{opacity:1} }
        @keyframes float { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-12px)} }
        @keyframes orbit { from{transform:rotate(0deg) translateX(40px) rotate(0deg)} to{transform:rotate(360deg) translateX(40px) rotate(-360deg)} }
        @keyframes nebulaDrift { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-10px)} }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes slideDown { from{transform:translateY(-20px);opacity:0} to{transform:translateY(0);opacity:1} }
        * { box-sizing: border-box; }
      `}</style>

      {/* Nebula */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, #1a053588 0%, transparent 70%)", top: "10%", left: "5%", animation: "nebulaDrift 20s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #0a2a4a66 0%, transparent 70%)", bottom: "5%", right: "10%", animation: "nebulaDrift 25s ease-in-out infinite reverse" }} />
      </div>

      {/* Stars */}
      {stars.map((star, i) => <Star key={i} {...star} />)}

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 30, background: "rgba(5,7,20,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>🌌</span>
            <span style={{ fontFamily: "Orbitron, monospace", fontSize: isMobile ? 14 : 18, fontWeight: 900, letterSpacing: 3, color: "#4FC3F7" }}>
              STUDY<span style={{ color: "#CE93D8" }}>VERSE</span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#FFCC80" }}>⭐ {xp.toLocaleString()}</span>
            {!isMobile && (
              <div style={{ width: 60, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.1)" }}>
                <div style={{ height: "100%", borderRadius: 2, width: `${(xp % 1000) / 10}%`, background: "linear-gradient(90deg, #FFCC80, #FF8C00)" }} />
              </div>
            )}
            {isMobile ? (
              <button onClick={() => setMenuOpen(m => !m)} style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", color: "white" }}>
                {menuOpen ? "✕" : "☰"}
              </button>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                {NAV_BUTTONS.map((btn, i) => (
                  <button key={i} onClick={btn.onClick} style={{ padding: "5px 10px", borderRadius: 50, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", background: "rgba(255,255,255,0.05)", border: `1px solid ${btn.color}55`, color: btn.color }}>{btn.label}</button>
                ))}
              </div>
            )}
            <button onClick={() => setShowProfile(true)} style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer" }}>
              {AVATARS[avatar]}
            </button>
          </div>
        </div>
        {/* Mobile dropdown menu */}
        {isMobile && menuOpen && (
          <div style={{ padding: "8px 16px 16px", animation: "slideDown 0.2s ease-out" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {NAV_BUTTONS.map((btn, i) => (
                <button key={i} onClick={btn.onClick} style={{ padding: "10px 12px", borderRadius: 12, fontSize: 12, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: `1px solid ${btn.color}55`, color: btn.color, textAlign: "left" }}>{btn.label}</button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* PLANETS */}
      <div style={{ position: "absolute", inset: 0, top: isMobile ? 56 : 64 }}>
        {SUBJECTS.map(planet => (
          <Planet key={planet.id} planet={planet} onClick={handlePlanetClick} isSelected={selectedPlanet?.id === planet.id} />
        ))}

        {/* SCIENCE SATELLITES — appear when Science is selected */}
        {selectedPlanet?.id === 3 && SCIENCE_SATELLITES.map((sat) => {
          const sciencePlanet = SUBJECTS.find(s => s.id === 3);
          const rad = (sat.angle * Math.PI) / 180;
          const orbitR = 12; // percent offset
          const sx = sciencePlanet.x + Math.cos(rad) * orbitR;
          const sy = sciencePlanet.y + Math.sin(rad) * orbitR * 0.6;
          const isActiveSat = selectedSatellite?.id === sat.id;
          return (
            <div key={sat.id}
              onClick={(e) => { e.stopPropagation(); stopSound(); setSelectedSatellite(s => s?.id === sat.id ? null : sat); SATELLITE_SOUNDS[sat.id]?.(); addXp(10); }}
              style={{ position: "absolute", left: `${sx}%`, top: `${sy}%`, transform: "translate(-50%, -50%)", cursor: "pointer", zIndex: 5, animation: "slideUp 0.3s ease-out" }}>
              {/* Orbit line */}
              <div style={{ position: "absolute", width: 2, height: 2, borderRadius: "50%", background: sat.color, opacity: 0.4, left: "50%", top: "50%" }} />
              {/* Satellite body */}
              <div style={{
                width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                background: `radial-gradient(circle at 35% 35%, ${sat.color}dd, ${sat.color}66)`,
                boxShadow: isActiveSat ? `0 0 20px ${sat.color}, 0 0 40px ${sat.color}66` : `0 0 10px ${sat.color}66`,
                border: `2px solid ${isActiveSat ? sat.color : sat.color + "88"}`,
                transform: isActiveSat ? "scale(1.2)" : "scale(1)",
                transition: "all 0.2s",
              }}>
                {sat.icon}
              </div>
              {/* Label */}
              <div style={{ position: "absolute", top: 48, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: sat.color, background: "rgba(5,7,20,0.9)", padding: "2px 6px", borderRadius: 50, border: `1px solid ${sat.color}44` }}>
                {sat.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* PLANET PANEL */}
      {selectedPlanet && (
        <div style={{
          position: "fixed", zIndex: 20, animation: "slideUp 0.4s ease-out",
          ...(isMobile
            ? { bottom: 80, left: 12, right: 12, top: "auto" }
            : { right: 24, top: "50%", transform: "translateY(-50%)", width: 260 }
          )
        }}>
          <div style={{ borderRadius: 20, padding: 20, background: "linear-gradient(135deg, rgba(13,16,53,0.97), rgba(5,7,20,0.99))", border: `1px solid ${(selectedSatellite || selectedPlanet).color}44`, boxShadow: `0 0 40px ${(selectedSatellite || selectedPlanet).color}22`, backdropFilter: "blur(20px)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, background: `${(selectedSatellite || selectedPlanet).color}22`, border: `1px solid ${(selectedSatellite || selectedPlanet).color}55` }}>
                  {(selectedSatellite || selectedPlanet).icon}
                </div>
                <div>
                  <div style={{ fontFamily: "Orbitron, monospace", fontWeight: "bold", fontSize: 12, color: "white" }}>{(selectedSatellite || selectedPlanet).name}</div>
                  <div style={{ fontSize: 10, color: (selectedSatellite || selectedPlanet).color }}>
                    {selectedSatellite ? `${selectedPlanet.name} · Satellite` : "Subject Planet"}
                  </div>
                </div>
              </div>
              <button onClick={() => { setSelectedPlanet(null); setSelectedSatellite(null); stopSound(); }} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            {selectedPlanet.id === 3 && !selectedSatellite && (
              <div style={{ marginBottom: 10, padding: "6px 10px", borderRadius: 10, background: "rgba(128,203,196,0.08)", border: "1px solid rgba(128,203,196,0.2)", fontSize: 11, color: "#80CBC4", textAlign: "center" }}>
                ☝️ Click a satellite to study a specific subject
              </div>
            )}
            {isMobile ? (
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button onClick={() => setShowNotes(true)} style={{ flex: 1, padding: "10px", borderRadius: 12, fontSize: 11, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", background: "rgba(255,255,255,0.05)", border: `1px solid ${(selectedSatellite || selectedPlanet).color}33`, color: "rgba(255,255,255,0.6)" }}>✏️ Notes</button>
                <button onClick={() => setShowFlashcards(true)} style={{ flex: 1, padding: "10px", borderRadius: 12, fontSize: 11, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", background: "rgba(255,255,255,0.05)", border: `1px solid ${(selectedSatellite || selectedPlanet).color}33`, color: "rgba(255,255,255,0.6)" }}>🃏 Cards</button>
                <button onClick={() => { setShowPomodoro(true); addXp(50); }} style={{ flex: 1, padding: "10px", borderRadius: 12, fontSize: 11, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", background: `linear-gradient(135deg, ${(selectedSatellite || selectedPlanet).color}33, ${selectedPlanet.glow}22)`, border: `1px solid ${(selectedSatellite || selectedPlanet).color}55`, color: (selectedSatellite || selectedPlanet).color }}>⚡ Start</button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  {["Fundamentals", "Advanced Topics", "Problem Sets", "Flashcards"].map((item, i) => (
                    <button key={i} onClick={() => addXp(25)} style={{ width: "100%", textAlign: "left", padding: "7px 10px", borderRadius: 10, fontSize: 11, marginBottom: 5, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, background: `${(selectedSatellite || selectedPlanet).color}11`, border: `1px solid ${(selectedSatellite || selectedPlanet).color}22`, color: "rgba(255,255,255,0.7)" }}>
                      <span style={{ color: (selectedSatellite || selectedPlanet).color }}>▸</span> {item}
                      {i === 0 && <span style={{ marginLeft: "auto", fontSize: 9, padding: "2px 6px", borderRadius: 50, background: `${(selectedSatellite || selectedPlanet).color}33`, color: (selectedSatellite || selectedPlanet).color }}>New</span>}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowNotes(true)} style={{ width: "100%", padding: "8px", borderRadius: 12, fontSize: 11, fontWeight: "bold", letterSpacing: 3, textTransform: "uppercase", cursor: "pointer", marginBottom: 8, background: "rgba(255,255,255,0.05)", border: `1px solid ${(selectedSatellite || selectedPlanet).color}33`, color: "rgba(255,255,255,0.6)" }}>✏️ Open Notes</button>
                <button onClick={() => setShowFlashcards(true)} style={{ width: "100%", padding: "8px", borderRadius: 12, fontSize: 11, fontWeight: "bold", letterSpacing: 3, textTransform: "uppercase", cursor: "pointer", marginBottom: 8, background: "rgba(255,255,255,0.05)", border: `1px solid ${(selectedSatellite || selectedPlanet).color}33`, color: "rgba(255,255,255,0.6)" }}>🃏 Flashcards</button>
                <button onClick={() => { setShowPomodoro(true); addXp(50); }} style={{ width: "100%", padding: "8px", borderRadius: 12, fontSize: 11, fontWeight: "bold", letterSpacing: 3, textTransform: "uppercase", cursor: "pointer", background: `linear-gradient(135deg, ${(selectedSatellite || selectedPlanet).color}33, ${selectedPlanet.glow}22)`, border: `1px solid ${(selectedSatellite || selectedPlanet).color}55`, color: (selectedSatellite || selectedPlanet).color }}>⚡ Start Session</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM HUD */}
      <div style={{ position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 24, padding: isMobile ? "8px 16px" : "12px 24px", borderRadius: 16, background: "rgba(5,7,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}>
          {[
            { label: "Planets", value: SUBJECTS.length, color: "white" },
            { label: "Streak", value: "7🔥", color: "#FFCC80" },
            { label: "Today", value: "2h 15m", color: "#80CBC4" },
            { label: "Level", value: "12", color: "#CE93D8" },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: isMobile ? 9 : 11, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase" }}>{stat.label}</div>
              <div style={{ fontSize: isMobile ? 14 : 18, fontWeight: "bold", fontFamily: "Orbitron, monospace", color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {!selectedPlanet && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none", zIndex: 1 }}>
          <div style={{ fontSize: 11, letterSpacing: 6, textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Select a planet to begin</div>
        </div>
      )}

      {/* ROOMS MODAL */}
      {showRooms && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}>
          <div style={{ background: "linear-gradient(135deg, #0d1035, #050714)", border: "1px solid rgba(128,203,196,0.3)", borderRadius: 24, padding: 24, width: 360 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontFamily: "Orbitron, monospace", fontWeight: 900, color: "white", fontSize: 13, letterSpacing: 3 }}>🛸 LIVE ROOMS</span>
              <button onClick={() => setShowRooms(false)} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            {STUDY_ROOMS.map(room => (
              <div key={room.id} onClick={() => { addXp(30); setShowRooms(false); }} style={{ padding: "12px", borderRadius: 12, marginBottom: 8, cursor: "pointer", background: "rgba(128,203,196,0.08)", border: "1px solid rgba(128,203,196,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "white", fontSize: 13, fontWeight: "bold" }}>{room.name}</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 50, background: "rgba(128,203,196,0.2)", color: "#80CBC4" }}>{room.vibe}</span>
                </div>
                <div style={{ fontSize: 11, marginTop: 4, color: "rgba(255,255,255,0.4)" }}>👥 {room.members} studying now</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROFILE MODAL */}
      {showProfile && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}>
          <div style={{ background: "linear-gradient(135deg, #0d1035, #050714)", border: "1px solid rgba(206,147,216,0.3)", borderRadius: 24, padding: 24, width: 360 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontFamily: "Orbitron, monospace", fontWeight: 900, color: "white", fontSize: 13, letterSpacing: 3 }}>👾 COSMONAUT</span>
              <button onClick={() => setShowProfile(false)} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>{AVATARS[avatar]}</div>
              <div style={{ color: "white", fontWeight: "bold" }}>{user.displayName}</div>
              <div style={{ fontSize: 11, marginTop: 4, color: "#CE93D8" }}>Level 12 · Nebula Rank</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Choose Avatar</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                {AVATARS.map((a, i) => (
                  <button key={i} onClick={() => setAvatar(i)} style={{ width: 36, height: 36, borderRadius: "50%", fontSize: 18, cursor: "pointer", background: avatar === i ? "rgba(206,147,216,0.3)" : "rgba(255,255,255,0.05)", border: `1px solid ${avatar === i ? "#CE93D8" : "rgba(255,255,255,0.1)"}` }}>{a}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Themes</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {THEMES.map((t, i) => (
                  <button key={i} onClick={() => !t.locked && setTheme(i)} style={{ padding: "8px 12px", borderRadius: 12, fontSize: 12, cursor: t.locked ? "default" : "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: theme === i ? "rgba(206,147,216,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${theme === i ? "#CE93D8" : "rgba(255,255,255,0.1)"}`, color: t.locked ? "rgba(255,255,255,0.2)" : theme === i ? "#CE93D8" : "rgba(255,255,255,0.6)", opacity: t.locked ? 0.5 : 1 }}>
                    {t.name} {t.locked && "🔒"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 16 }}>
              <div style={{ fontSize: 11, marginBottom: 8, color: "rgba(255,255,255,0.4)" }}>Signed in as {user.email}</div>
              <button onClick={logOut} style={{ width: "100%", padding: "8px", borderRadius: 12, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", cursor: "pointer", background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.3)", color: "#ff6464" }}>🚀 Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {showNotes && selectedPlanet && <Notes user={user} planet={selectedPlanet} satellite={selectedSatellite} onClose={() => setShowNotes(false)} />}
      {showFlashcards && selectedPlanet && <Flashcards user={user} planet={selectedPlanet} satellite={selectedSatellite} onClose={() => setShowFlashcards(false)} />}
      {showLeaderboard && <Leaderboard user={user} onClose={() => setShowLeaderboard(false)} />}
      {showStats && <Stats user={user} onClose={() => setShowStats(false)} />}
      {showFriends && <Friends user={user} onClose={() => setShowFriends(false)} />}
      {showPomodoro && <PomodoroTimer onClose={() => setShowPomodoro(false)} userEmail={user.email} subjectName={selectedPlanet?.name} />}
    </div>
  );
}
