import { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, set, onValue, remove, push } from "firebase/database";

const safeKey = (s) => s.replace(/[.#$[\]/\s]/g, "_");

export default function Flashcards({ user, planet, satellite, onClose }) {
  const subject = satellite?.name || planet?.name;
  const color = satellite?.color || planet?.color;
  const deckPath = `flashcards/${safeKey(user.email)}/${safeKey(subject)}`;

  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(new Set());
  const [mode, setMode] = useState("study"); // study | add | results
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [cardKeys, setCardKeys] = useState([]);

  useEffect(() => {
    const unsub = onValue(ref(db, deckPath), (snap) => {
      const data = snap.val() || {};
      const keys = Object.keys(data);
      setCardKeys(keys);
      setCards(Object.values(data));
      setCurrentIndex(0);
      setFlipped(false);
      setKnown(new Set());
    });
    return () => unsub();
  }, [subject]);

  const addCard = async () => {
    if (!newFront.trim() || !newBack.trim()) return;
    await push(ref(db, deckPath), { front: newFront.trim(), back: newBack.trim() });
    setNewFront(""); setNewBack("");
  };

  const deleteCard = async (index) => {
    const key = cardKeys[index];
    await remove(ref(db, `${deckPath}/${key}`));
  };

  const markKnown = () => {
    setKnown(prev => new Set([...prev, currentIndex]));
    next();
  };

  const markUnknown = () => {
    setKnown(prev => { const s = new Set(prev); s.delete(currentIndex); return s; });
    next();
  };

  const next = () => {
    setFlipped(false);
    setTimeout(() => {
      if (currentIndex >= cards.length - 1) {
        setMode("results");
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 200);
  };

  const restart = () => {
    setCurrentIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setMode("study");
  };

  const current = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex) / cards.length) * 100 : 0;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)" }}>
      <div style={{ background: "linear-gradient(135deg, #0d1035, #050714)", border: `1px solid ${color}44`, borderRadius: 24, padding: 24, width: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: `0 0 60px ${color}22` }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, background: `${color}22`, border: `1px solid ${color}55` }}>
              {satellite?.icon || planet?.icon}
            </div>
            <div>
              <div style={{ fontFamily: "Orbitron, monospace", fontWeight: 900, color: "white", fontSize: 13, letterSpacing: 2 }}>{subject}</div>
              <div style={{ fontSize: 10, color, letterSpacing: 2, textTransform: "uppercase" }}>Flashcards · {cards.length} cards</div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {/* Mode tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["study", "🧠 Study"], ["add", "➕ Add Cards"]].map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); setCurrentIndex(0); setFlipped(false); }}
              style={{ padding: "7px 16px", borderRadius: 50, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", background: mode === m ? `${color}33` : "rgba(255,255,255,0.05)", border: `1px solid ${mode === m ? color : "rgba(255,255,255,0.1)"}`, color: mode === m ? color : "rgba(255,255,255,0.5)" }}>
              {label}
            </button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#80CBC4" }} />
            <span style={{ fontSize: 11, color: "#80CBC4" }}>{known.size} known</span>
          </div>
        </div>

        {/* STUDY MODE */}
        {mode === "study" && (
          <>
            {cards.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🃏</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No cards yet — add some!</div>
                <button onClick={() => setMode("add")} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 50, fontSize: 11, cursor: "pointer", background: `${color}22`, border: `1px solid ${color}55`, color }}>➕ Add Cards</button>
              </div>
            ) : (
              <>
                {/* Progress bar */}
                <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", marginBottom: 20 }}>
                  <div style={{ height: "100%", borderRadius: 2, width: `${progress}%`, background: color, transition: "width 0.3s", boxShadow: `0 0 8px ${color}` }} />
                </div>
                <div style={{ textAlign: "right", fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 12, letterSpacing: 2 }}>
                  {currentIndex + 1} / {cards.length}
                </div>

                {/* Flashcard */}
                <div onClick={() => setFlipped(f => !f)}
                  style={{ cursor: "pointer", minHeight: 200, borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, marginBottom: 20, background: flipped ? `${color}18` : "rgba(255,255,255,0.04)", border: `2px solid ${flipped ? color + "66" : "rgba(255,255,255,0.1)"}`, transition: "all 0.3s", boxShadow: flipped ? `0 0 30px ${color}22` : "none", position: "relative" }}>
                  <div style={{ position: "absolute", top: 12, left: 16, fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: flipped ? color : "rgba(255,255,255,0.3)" }}>
                    {flipped ? "Answer" : "Question"}
                  </div>
                  <div style={{ fontSize: 18, color: "white", textAlign: "center", lineHeight: 1.6, fontFamily: "'Space Mono', monospace" }}>
                    {flipped ? current?.back : current?.front}
                  </div>
                  <div style={{ position: "absolute", bottom: 12, fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: 2 }}>
                    {flipped ? "tap to see question" : "tap to reveal answer"}
                  </div>
                </div>

                {/* Actions */}
                {flipped ? (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={markUnknown} style={{ flex: 1, padding: "12px", borderRadius: 14, fontSize: 13, cursor: "pointer", background: "rgba(255,100,100,0.15)", border: "1px solid rgba(255,100,100,0.4)", color: "#ff6464", fontWeight: "bold" }}>
                      ✗ Still Learning
                    </button>
                    <button onClick={markKnown} style={{ flex: 1, padding: "12px", borderRadius: 14, fontSize: 13, cursor: "pointer", background: "rgba(128,203,196,0.15)", border: "1px solid rgba(128,203,196,0.4)", color: "#80CBC4", fontWeight: "bold" }}>
                      ✓ Got It!
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setFlipped(true)} style={{ width: "100%", padding: "12px", borderRadius: 14, fontSize: 12, cursor: "pointer", background: `${color}22`, border: `1px solid ${color}44`, color, letterSpacing: 3, textTransform: "uppercase", fontWeight: "bold" }}>
                    Reveal Answer
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* ADD CARDS MODE */}
        {mode === "add" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>Question / Front</div>
              <textarea value={newFront} onChange={e => setNewFront(e.target.value)} placeholder="e.g. What is Newton's 2nd law?"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: `1px solid ${color}33`, color: "white", fontSize: 13, outline: "none", fontFamily: "monospace", resize: "none", height: 80 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>Answer / Back</div>
              <textarea value={newBack} onChange={e => setNewBack(e.target.value)} placeholder="e.g. F = ma (Force = mass × acceleration)"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: `1px solid ${color}33`, color: "white", fontSize: 13, outline: "none", fontFamily: "monospace", resize: "none", height: 80 }} />
            </div>
            <button onClick={addCard} style={{ width: "100%", padding: "12px", borderRadius: 14, fontSize: 12, cursor: "pointer", background: `${color}33`, border: `1px solid ${color}66`, color, letterSpacing: 3, textTransform: "uppercase", fontWeight: "bold", marginBottom: 20 }}>
              ➕ Add Card
            </button>

            {/* Existing cards list */}
            {cards.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Your Cards ({cards.length})</div>
                {cards.map((card, i) => (
                  <div key={i} style={{ padding: "10px 14px", borderRadius: 12, marginBottom: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "white", fontSize: 12, marginBottom: 3 }}>{card.front}</div>
                      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{card.back}</div>
                    </div>
                    <button onClick={() => deleteCard(i)} style={{ marginLeft: 10, color: "#ff6464", background: "none", border: "none", fontSize: 16, cursor: "pointer", flexShrink: 0 }}>🗑</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* RESULTS MODE */}
        {mode === "results" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>
              {known.size === cards.length ? "🏆" : known.size > cards.length / 2 ? "⭐" : "💪"}
            </div>
            <div style={{ fontFamily: "Orbitron, monospace", fontWeight: 900, fontSize: 20, color: "white", marginBottom: 8 }}>
              {known.size} / {cards.length}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>
              {known.size === cards.length ? "Perfect! You know all the cards! 🎉" : known.size > cards.length / 2 ? "Great job! Keep practicing the rest!" : "Keep going — practice makes perfect!"}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={restart} style={{ padding: "10px 24px", borderRadius: 50, fontSize: 12, cursor: "pointer", background: `${color}33`, border: `1px solid ${color}66`, color, letterSpacing: 2, textTransform: "uppercase" }}>
                🔄 Restart
              </button>
              <button onClick={() => setMode("add")} style={{ padding: "10px 24px", borderRadius: 50, fontSize: 12, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", letterSpacing: 2, textTransform: "uppercase" }}>
                ➕ Add More
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
