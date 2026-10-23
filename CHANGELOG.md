# 📜 Changelog — ULTRON SOVEREIGN OS

All notable changes, architectural iterations, and features for **ULTRON SOVEREIGN OS** will be documented in this file.

---

## [1.2.0] — 2026-10-23
### ⚡ Performance & Production Hardening
- **Code Splitting & Chunking**: Configured Rollup vendor chunking (`vendor-three`, `vendor-icons`, `vendor-react`) to optimize client bundle size.
- **CI/CD Pipeline**: Added GitHub Actions workflow (`.github/workflows/ci.yml`) for automated typecheck and build verification on push/PR.
- **Resilience Engine**: Implemented cyberpunk `ErrorBoundary` component with automated matrix reset routine to catch WebGL context and streaming interruptions.
- **PWA Ready**: Added `public/manifest.json` and standalone web application metadata for desktop and mobile home screen installation.

---

## [1.1.0] — 2026-09-01
### 🎨 UI Overhaul & Autonomous Startup
- **Clean 3-Wing Header**: Redesigned navigation into balanced wings (Identity, Pill Navigation, Telemetry & Utility Cluster).
- **Master Startup Orchestrator (`systemBootService`)**: Parallel warm-up sequence for hardware telemetry, local Ollama engine, memory banks, audio, and subagents on mount.
- **Independent Multitasking**: True background concurrency for YouTube Cyber-Player, Hands-free Voice VAD, and Swarm workers across tab transitions.

---

## [1.0.0] — 2026-08-30
### 🚀 Initial Public Release
- **Holographic 3D Three.js Orb Matrix**: Audio-reactive gyroscopic particle nucleus with 6 neon color themes.
- **MediaPipe Gesture Tracking**: Bare-hand 1-hand pitch/rotate and 2-hand pinch/zoom in 3D viewport.
- **ChatGPT-Tier Local LLM**: Streaming inference via Meta Llama 3.2 3B Chat with Devanagari Hindi, Hinglish, and English script mirroring.
- **Real-Time Hardware Telemetry**: Direct Windows 11 sensor polling for 16 CPU cores, physical RAM, and battery charging state via `/api/telemetry`.
- **Autonomous Subagent Swarm**: Veritas Researcher, Daedalus Architect, Aegis Sentinel, and Oracle Analyst.
- **Biometric Face ID Barrier**: 128-bin luminance cosine similarity authentication.
- **In-App YouTube Cyber-Player**: Floating picture-in-picture streaming audio dock.
- **Interactive Terminal & WASM Code Runner**: In-browser Python 3.12 and JavaScript execution sandbox.

---

<sub>Engineered by **Sachindra Pandey** for **nxt IN Company**.</sub>
