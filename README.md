# 🌌 StudyVerse

> A gamified, space-themed study platform where every subject is a planet in your universe.

**Live Demo → [study-universe.vercel.app](https://study-universe.vercel.app)**

---

## ✨ Features

- **🪐 Interactive Universe** — 8 subject planets with animations, orbital rings, moons, and glowing nebula backgrounds
- **⚛️ Science Solar System** — Click the Science planet to reveal 4 orbiting satellites (Physics, Chemistry, Biology, Computer Science)
- **🔐 Google Authentication** — Sign in securely via Firebase Auth
- **✏️ Study Notes** — Write and auto-save notes per subject, synced to Firebase in real time
- **🃏 Flashcard System** — Create, flip, and track flashcard decks per subject with Got It / Still Learning tracking
- **⏱ Pomodoro Timer** — 25-minute focus sessions with break cycles and XP rewards
- **🏆 Live Leaderboard** — Real-time XP rankings across all users with rank titles (Cadet → Admiral)
- **👥 Friends System** — Add friends by email, send and accept friend requests
- **📊 Stats Dashboard** — Track total sessions, study time, and top subjects
- **🎵 Ambient Sounds** — Unique Web Audio API soundscapes per planet and satellite
- **📱 Mobile Friendly** — Responsive layout with hamburger nav and bottom sheet panels

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Styling | Inline styles + Tailwind CDN |
| Auth | Firebase Authentication (Google) |
| Database | Firebase Realtime Database |
| Sounds | Web Audio API |
| Deployment | Vercel |
| Fonts | Google Fonts (Orbitron, Space Mono) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project with Google Auth and Realtime Database enabled

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/study-universe.git
cd study-universe

# Install dependencies
npm install

# Start the dev server
npm run dev -- --host
```

### Firebase Setup

1. Create a project at [firebase.google.com](https://firebase.google.com)
2. Enable **Google Authentication** under Authentication → Sign-in methods
3. Enable **Realtime Database** (start in test mode)
4. Copy your Firebase config into `src/firebase.js`

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com"
};
```

5. Add your domain to Firebase Auth → Settings → Authorized domains

---

## 📁 Project Structure

```
src/
├── App.jsx          # Main app — universe, planets, nav, all UI
├── Flashcards.jsx   # Flashcard system component
├── firebase.js      # Firebase config and auth helpers
├── sounds.js        # Web Audio API ambient sounds per planet
└── main.jsx         # React entry point
```

---

## 🪐 Subjects & Planets

| Planet | Subject | Color |
|---|---|---|
| ∑ | Mathematics | Blue |
| ✦ | Literature | Purple |
| ⚛ | Science | Teal (+ 4 satellites) |
| ⏳ | History | Amber |
| ♪ | Music | Pink |
| ◈ | Languages | Green |
| 🌍 | Geography | Sky Blue |
| ₿ | Commerce | Gold |

---

## 🔮 Roadmap

- [ ] AI study assistant per subject
- [ ] Custom planet creation
- [ ] Collaborative study rooms (live)
- [ ] Spaced repetition algorithm for flashcards
- [ ] Push notifications for study streaks

---

## 📄 License

MIT — feel free to fork and build your own universe.

---

<div align="center">
  Built with 🚀 by a developer exploring the study-verse
</div>
