import { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, set, onValue } from "firebase/database";

export default function Notes({ user, planet, satellite, onClose }) {
  const subject = satellite?.name || planet?.name;
  const color = satellite?.color || planet?.color;
  const safeKey = (s) => s.replace(/[.#$[\]\/\s]/g, "_");
  const notesPath = `notes/${safeKey(user.email)}/${safeKey(subject)}`;

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

  const handleChange = (e) => {
    setNotes(e.target.value);
    setSaved(false);
  };

  // Auto-save every 3 seconds
  useEffect(() => {
    if (saved) return;
    const timer = setTimeout(save, 3000);
    return () => clearTimeout(timer);
  }, [notes, saved]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}>
      <div style={{ background: "linear-gradient(135deg, #0d1035, #050714)", border: `1px solid ${color}44`, borderRadius: 24, padding: 24, width: 520, height: 560, display: "flex", flexDirection: "column", boxShadow: `0 0 60px ${color}22` }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, background: `${color}22`, border: `1px solid ${color}55` }}>
              {satellite?.icon || planet?.icon}
            </div>
            <div>
              <div style={{ fontFamily: "Orbitron, monospace", fontWeight: 900, color: "white", fontSize: 13, letterSpacing: 2 }}>
                {subject}
              </div>
              <div style={{ fontSize: 10, color, letterSpacing: 2, textTransform: "uppercase" }}>Study Notes</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {lastSaved && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Saved {lastSaved}</span>}
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: saved ? "#80CBC4" : "#FFCC80", boxShadow: `0 0 8px ${saved ? "#80CBC4" : "#FFCC80"}` }} />
            <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {["## Heading", "**Bold**", "_Italic_", "- List item", "> Quote"].map((snippet, i) => (
            <button key={i} onClick={() => { setNotes(n => n + "\n" + snippet); setSaved(false); }}
              style={{ padding: "4px 8px", borderRadius: 8, fontSize: 10, cursor: "pointer", background: `${color}11`, border: `1px solid ${color}22`, color, letterSpacing: 1 }}>
              {["H", "B", "I", "•", "❝"][i]}
            </button>
          ))}
          <button onClick={save} style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 8, fontSize: 10, cursor: "pointer", background: saved ? "rgba(128,203,196,0.15)" : `${color}33`, border: `1px solid ${saved ? "rgba(128,203,196,0.3)" : color}`, color: saved ? "#80CBC4" : color, letterSpacing: 1 }}>
            {saved ? "✓ Saved" : "Save"}
          </button>
        </div>

        {/* Text area */}
        <textarea
          value={notes}
          onChange={handleChange}
          placeholder={`Start your ${subject} notes here...\n\nTip: Use ## for headings, **text** for bold, - for lists`}
          style={{
            flex: 1, background: "rgba(255,255,255,0.03)", border: `1px solid ${color}22`,
            borderRadius: 16, padding: 16, color: "rgba(255,255,255,0.85)", fontSize: 13,
            lineHeight: 1.7, resize: "none", outline: "none", fontFamily: "'Space Mono', monospace",
          }}
        />

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{notes.length} characters · auto-saves every 3s</span>
          <button onClick={() => { setNotes(""); setSaved(false); }}
            style={{ fontSize: 10, padding: "4px 10px", borderRadius: 8, cursor: "pointer", background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.2)", color: "#ff6464" }}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}