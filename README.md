# 🔮 U.L.T.R.O.N. — Holographic AI Desktop Assistant & Collective Memory Brain

<div align="center">

![Ultron](https://img.shields.io/badge/ULTRON-Desktop%20AI-ff1e42?style=for-the-badge&logo=electron)
[![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Tasks%20Vision-00f0ff?style=for-the-badge&logo=google)](https://developers.google.com/mediapipe)
[![ModelScope](https://img.shields.io/badge/ModelScope-Collective%20Memory-624AFF?style=for-the-badge)](https://modelscope.cn/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <b>A top-tier, laptop-optimized autonomous AI desktop assistant merging Sagar's 3D Holographic Hand-Gesture Orb with ModelScope's Collective Intelligence, Self-Evolving Memory, and Soul Presets.</b>
</p>

</div>

---

## 🌟 Key Innovations & Architecture

`mermaid
graph TD
    subgraph UI ["Desktop Frontend & Viewport"]
        A[Holographic 3D Orb Matrix] --> A1[Three.js Wireframe & Bloom Shaders]
        A --> A2[MediaPipe Hand Gesture Tracking]
        A --> A3[WebAudio Spectrum Reactive Pulsation]
        
        B[Command Center HUD] --> B1[Neural Chat Stream]
        B --> B2[ModelScope Collective Memory Hub]
        B --> B3[ModelScope Skill Hub & OS Tools]
        B --> B4[200+ Soul & Harness Presets]
        B --> B5[Laptop Telemetry: CPU, RAM, Battery, Ping]
    end

    subgraph Brain ["Neural Engine & Services"]
        C[Universal LLM Gateway] --> C1[Google Gemini 2.0 Flash]
        C --> C2[OpenAI GPT-4o / GPT-4o-mini]
        C --> C3[Anthropic Claude 3.5 Sonnet]
        C --> C4[DeepSeek-V3 / DeepSeek-R1]
        C --> C5[Groq Llama 3.3 70B]
        C --> C6[Local Ollama / LM Studio]
        
        D[Voice & Vision Engine] --> D1[WebSpeech STT Recognition]
        D --> D2[SpeechSynthesis Robotic/Butler TTS]
        D --> D3[One-Click Screen Vision Capture]
        
        E[Memory & OS Store] --> E1[Tiered SQLite/IndexedDB Semantic Memories]
        E --> E2[Terminal & PowerShell OS Automation]
    end

    UI <===> Brain
`

---

## 🔮 Core Features

### 1. 🌐 Holographic 3D Interactive Orb (Sagar Builds Integration)
- **Layered Three.js WebGL2/WebGPU Architecture**: Dense wireframe shells, equatorial grids, inner spiral core, floating code-text sprites, particle dust swirl, and bloom + chromatic aberration post-processing.
- **5 Dynamic Color Themes**:
  - 🔴 **Ultron Crimson Sovereign**: Deep cybernetic red with high-energy pulse.
  - 🟡 **J.A.R.V.I.S. Gold Amber**: Classic Tony Stark butler hologram.
  - 🔵 **Arc Reactor Cyan**: Electric blue arc reactor matrix.
  - 🟢 **Matrix Emerald**: Cyberpunk terminal green.
  - 🟣 **Void Violet**: Synthwave netrunner aesthetic.
- **Audio-Reactive Pulsation**: Core spiral and particle dust expand and pulse in real-time with your voice and the assistant's speech frequencies.

### 2. ✋ Bare-Hand Gesture Control (MediaPipe Tasks Vision)
- **Webcam Hand Tracking**: Zero hardware required — uses your laptop's standard webcam.
- **Single-Hand Pinch & Drag**: Rotates the holographic orb in 3D space.
- **Two-Hand Pinch & Spread**: Zooms the camera closer or further away.
- **HUD Landmark Visualizer**: Real-time visual hand tracking markers and status overlay.

### 3. 🧠 ModelScope Collective Memory Hub
- **Tiered Memory Taxonomy**:
  - pattern: Reusable architectural and coding idioms.
  - error: Past bugs, crashes, and verified fixes.
  - correction: Explicit developer instructions and rules.
  - preference: User preferences and environment parameters.
  - security: Safe execution safeguards and privacy rules.
  - workflow: Multi-step automation blueprints.
- **Semantic Recall**: Pre-injects relevant past memories into the LLM context before every response.
- **Hit Count Leaderboard & Export**: Backup and restore memory banks as JSON.

### 4. 🎭 200+ Soul & Harness Persona Presets
- Switch between **Ultron Sovereign**, **J.A.R.V.I.S. Protocol**, **Netrunner 2077**, **Principal Architect**, **INTJ / ENTP MBTI Souls**, and 190+ specialized role profiles.
- Automatic theme alignment when switching personas.

### 5. 🎙️ Bi-Directional Voice & Screen Vision
- **Voice-to-Voice AI**: Push-to-talk or continuous speech recognition + natural speech synthesis.
- **Screen Vision OCR**: One-click screen capture sent directly to multimodal models (Gemini / GPT-4o) for instant debugging and document analysis.
- **Laptop Telemetry HUD**: Real-time monitor of CPU load, RAM usage, battery level, and network ping.

---

## 🎮 Desktop Keyboard & Gesture Controls

| Key / Gesture | Action |
|---|---|
| G / Click **GESTURES** | Toggle MediaPipe Webcam Hand Tracking |
| Pinch + Move 1 Hand | Rotate the 3D Orb |
| Pinch Both Hands ± Spread | Zoom in / Zoom out |
| Ctrl + Space | Quick toggle between 3D Orb and Neural Chat Console |
| R | Reset 3D camera to home position |
| + / − | Zoom camera in / out |
| Drag Mouse | Rotate 3D Orb manually |
| Scroll Wheel | Zoom in / out manually |

---

## ⚡ Quickstart Guide

### Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **Webcam & Microphone** (for gesture tracking and voice assistant)

### 1. Install Dependencies
`ash
npm install
`

### 2. Launch Development Server
`ash
npm run dev
`
Open [http://localhost:5173](http://localhost:5173) in your browser or desktop container.

### 3. Build for Production
`ash
npm run build
`

---

## ⚙️ AI Engine Configuration

Ultron supports all major LLM providers. Open **Settings (⚙️)** in the app to configure:
1. **Google Gemini**: Enter your Gemini API key (defaults to gemini-2.0-flash).
2. **OpenAI**: Enter your OpenAI key (gpt-4o-mini / gpt-4o).
3. **Anthropic Claude**: Enter your Claude key (claude-3-5-sonnet-20241022).
4. **DeepSeek**: Enter your DeepSeek key (deepseek-chat).
5. **Groq**: Enter your Groq key (llama-3.3-70b-versatile).
6. **Local Ollama**: Set endpoint to http://localhost:11434 with model llama3 for **100% offline, private desktop AI**.

*If no API key is provided, Ultron runs in built-in **Offline Simulation Mode** with full interactive capabilities.*

---

## 📜 License & Credits

- **License**: MIT
- Built upon concepts from [SAGAR-TAMANG/ultron-by-sagar-builds](https://github.com/SAGAR-TAMANG/ultron-by-sagar-builds) and [modelscope/ultron](https://github.com/modelscope/ultron).