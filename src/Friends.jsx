import { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, set, onValue, remove } from "firebase/database";

export default function Friends({ user, onClose }) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [status, setStatus] = useState("");

  const safeKey = (email) => email.replace(/[.#$[\]]/g, "_");

  useEffect(() => {
    // Listen for my friends
    const friendsRef = ref(db, `users/${safeKey(user.email)}/friends`);
    const unsub1 = onValue(friendsRef, (snap) => {
      const data = snap.val() || {};
      setFriends(Object.values(data));
    });

    // Listen for incoming friend requests
    const reqRef = ref(db, `users/${safeKey(user.email)}/requests`);
    const unsub2 = onValue(reqRef, (snap) => {
      const data = snap.val() || {};
      setRequests(Object.values(data));
    });

    // Register myself in the database
    set(ref(db, `users/${safeKey(user.email)}/profile`), {
      email: user.email,
      name: user.displayName,
      avatar: user.photoURL,
      online: true,
    });

    return () => { unsub1(); unsub2(); };
  }, [user]);

  const sendRequest = async () => {
    if (!searchEmail || searchEmail === user.email) {
      setStatus("❌ Invalid email"); return;
    }
    await set(ref(db, `users/${safeKey(searchEmail)}/requests/${safeKey(user.email)}`), {
      email: user.email,
      name: user.displayName,
    });
    setStatus("✅ Friend request sent!");
    setSearchEmail("");
  };

  const acceptRequest = async (req) => {
    // Add to both users' friends lists
    await set(ref(db, `users/${safeKey(user.email)}/friends/${safeKey(req.email)}`), {
      email: req.email, name: req.name,
    });
    await set(ref(db, `users/${safeKey(req.email)}/friends/${safeKey(user.email)}`), {
      email: user.email, name: user.displayName,
    });
    // Remove request
    await remove(ref(db, `users/${safeKey(user.email)}/requests/${safeKey(req.email)}`));
  };

  const removeFriend = async (email) => {
    await remove(ref(db, `users/${safeKey(user.email)}/friends/${safeKey(email)}`));
    await remove(ref(db, `users/${safeKey(email)}/friends/${safeKey(user.email)}`));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}>
      <div className="rounded-3xl p-6" style={{
        background: "linear-gradient(135deg, #0d1035, #050714)",
        border: "1px solid rgba(206,147,216,0.3)",
        boxShadow: "0 0 60px rgba(206,147,216,0.1)",
        width: 380, maxHeight: "80vh", overflowY: "auto"
      }}>
        <div className="flex justify-between items-center mb-5">
          <span style={{ fontFamily: "Orbitron, monospace", fontWeight: 900, color: "white", fontSize: 14, letterSpacing: 3 }}>
            👥 COSMONAUTS
          </span>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {/* Add Friend */}
        <div className="mb-5">
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Add by email</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={searchEmail}
              onChange={e => setSearchEmail(e.target.value)}
              placeholder="friend@email.com"
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(206,147,216,0.3)",
                color: "white", fontSize: 12, outline: "none",
                fontFamily: "monospace"
              }}
            />
            <button onClick={sendRequest} style={{
              padding: "8px 16px", borderRadius: 12,
              background: "rgba(206,147,216,0.2)",
              border: "1px solid rgba(206,147,216,0.4)",
              color: "#CE93D8", fontSize: 12, cursor: "pointer",
              fontFamily: "monospace"
            }}>Send</button>
          </div>
          {status && <div style={{ fontSize: 11, marginTop: 6, color: "#80CBC4" }}>{status}</div>}
        </div>

        {/* Incoming Requests */}
        {requests.length > 0 && (
          <div className="mb-5">
            <div style={{ fontSize: 11, color: "#FFCC80", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
              ⭐ Requests ({requests.length})
            </div>
            {requests.map((req, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 12px", borderRadius: 12, marginBottom: 6,
                background: "rgba(255,204,128,0.08)", border: "1px solid rgba(255,204,128,0.2)"
              }}>
                <div>
                  <div style={{ color: "white", fontSize: 13, fontWeight: "bold" }}>{req.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{req.email}</div>
                </div>
                <button onClick={() => acceptRequest(req)} style={{
                  padding: "6px 12px", borderRadius: 8,
                  background: "rgba(128,203,196,0.2)", border: "1px solid rgba(128,203,196,0.4)",
                  color: "#80CBC4", fontSize: 11, cursor: "pointer"
                }}>Accept</button>
              </div>
            ))}
          </div>
        )}

        {/* Friends List */}
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
            Friends ({friends.length})
          </div>
          {friends.length === 0 && (
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, textAlign: "center", padding: "20px 0" }}>
              No cosmonauts yet — add some! 🚀
            </div>
          )}
          {friends.map((f, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 12px", borderRadius: 12, marginBottom: 6,
              background: "rgba(206,147,216,0.08)", border: "1px solid rgba(206,147,216,0.2)"
            }}>
              <div>
                <div style={{ color: "white", fontSize: 13, fontWeight: "bold" }}>{f.name}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{f.email}</div>
              </div>
              <button onClick={() => removeFriend(f.email)} style={{
                padding: "4px 10px", borderRadius: 8,
                background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.2)",
                color: "#ff6464", fontSize: 11, cursor: "pointer"
              }}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}