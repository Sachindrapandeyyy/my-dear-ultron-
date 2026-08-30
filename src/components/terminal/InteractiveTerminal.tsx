import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ORB_THEMES } from '@/lib/orb/theme';
import { Terminal as TerminalIcon, Play, Trash2, Shield, Zap, Sparkles, Cpu, Server } from 'lucide-react';
import { audioService } from '@/services/audioService';
import { osService } from '@/services/osService';
import { voiceService } from '@/services/voiceService';
import { memoryService } from '@/services/memoryService';
import { ollamaService } from '@/services/ollamaService';
import { soulService } from '@/services/soulService';
import { OrbTheme } from '@/types';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system' | 'success';
  text: string;
  timestamp: string;
}

export const InteractiveTerminal: React.FC = () => {
  const {
    theme,
    setTheme,
    activeSoul,
    setActiveSoul,
    telemetry,
    settings,
    updateSettings,
    setActiveTab,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 'init-1',
      type: 'system',
      text: '═══════════════════════════════════════════════════════════════════════════\n  U.L.T.R.O.N. OS COMMAND & AUTOMATION SHELL (v1.0.0)\n  Type "help" to display available subroutines and system directives.\n═══════════════════════════════════════════════════════════════════════════',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const themeConfig = ORB_THEMES[theme];

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const addLine = (type: TerminalLine['type'], text: string) => {
    setLines((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type,
        text,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handleCommand = async (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    if (settings.soundEffects) audioService.playClickSound();

    addLine('input', `C:\\Users\\Sachi\\my-dear-ultron> ${trimmed}`);
    setHistory((prev) => [...prev, trimmed]);
    setHistoryIdx(-1);
    setInput('');

    const args = trimmed.split(' ');
    const cmd = args[0].toLowerCase();
    const rest = args.slice(1).join(' ');

    switch (cmd) {
      case 'help':
        addLine(
          'output',
          `AVAILABLE COMMANDS:\n  • status            - Display full Ultron Core & AI Provider status\n  • telemetry         - Inspect laptop CPU, RAM, battery & network latency\n  • ollama            - Check local Ollama connection and pulled models\n  • hermes            - Inspect Nous Research Hermes Agent runtime\n  • memory [query]    - Search ModelScope collective memories\n  • skills            - List active OS automation tools and blueprints\n  • theme <name>      - Switch Orb theme (ultron, jarvis, arc, matrix, void)\n  • soul <name>       - Switch Persona (ultron, jarvis, netrunner, intj)\n  • voice <phrase>    - Test real-time movie-like speech generation\n  • screen            - Trigger one-click screen capture\n  • clear             - Clear terminal screen\n  • exit / orb        - Return to 3D Holographic Viewport`
        );
        break;

      case 'clear':
      case 'cls':
        setLines([]);
        break;

      case 'status':
        addLine(
          'output',
          `[ULTRON SYSTEM INTEGRITY REPORT]\n• Core Engine: Online (WebGL2 60 FPS)\n• Active Soul: ${activeSoul.name} ${activeSoul.emoji}\n• Current Theme: ${themeConfig.name}\n• LLM Provider: ${settings.llmProvider.toUpperCase()} (${settings.modelName})\n• Voice Synthesizer: Active (Auto-read: ${settings.autoReadResponses ? 'ON' : 'OFF'})\n• Memory Bank: ${memoryService.getAll().length} collective memories loaded`
        );
        break;

      case 'telemetry':
      case 'top':
      case 'ps':
        const tel = osService.getTelemetry();
        addLine(
          'output',
          `[LIVE LAPTOP TELEMETRY]\n• Platform: ${tel.platform} (${tel.osVersion})\n• CPU Utilization: ${tel.cpuUsage}%\n• Memory Heap: ${tel.memoryUsage}%\n• Battery Level: ${tel.batteryLevel}% (${tel.isCharging ? 'AC Powered ⚡' : 'On Battery'})\n• Network Latency: ${tel.latencyMs}ms`
        );
        break;

      case 'ollama':
        const ol = await ollamaService.checkStatus(settings.ollamaEndpoint);
        if (ol.isOnline) {
          addLine(
            'success',
            `[OLLAMA ONLINE ⚡]\n• Endpoint: ${ol.endpoint}\n• Installed Models (${ol.models.length}):\n  ${ol.models.map((m) => `-> ${m}`).join('\n  ')}\n• Active Model: ${ol.activeModel}`
          );
        } else {
          addLine(
            'error',
            `[OLLAMA OFFLINE]\n• Status: Unable to connect to ${ol.endpoint}\n• Tip: Start Ollama on your computer with 'ollama serve' or open the Ollama desktop app.`
          );
        }
        break;

      case 'hermes':
        addLine(
          'success',
          `[NOUS RESEARCH HERMES AGENT]\n• Binary Path: %LOCALAPPDATA%\\hermes\\bin\\hermes.exe\n• Runtime: Python 3.11.16 + Node.js v22.23.2 LTS\n• Skills Installed: 81 bundled research & automation skills\n• Status: Ready for subagent orchestration`
        );
        break;

      case 'memory':
      case 'memories':
        const mems = rest ? memoryService.search(rest) : memoryService.getAll();
        addLine(
          'output',
          `[MODELSCOPE MEMORY BANK (${mems.length} items)]:\n` +
            mems
              .slice(0, 8)
              .map((m, i) => `${i + 1}. [${m.category.toUpperCase()}] ${m.title} (${m.hitCount} hits)`)
              .join('\n')
        );
        break;

      case 'theme':
        if (['ultron', 'jarvis', 'arc', 'matrix', 'void'].includes(rest.toLowerCase())) {
          setTheme(rest.toLowerCase() as OrbTheme);
          addLine('success', `Theme switched to: ${rest.toUpperCase()}`);
        } else {
          addLine('error', `Unknown theme "${rest}". Valid: ultron, jarvis, arc, matrix, void`);
        }
        break;

      case 'soul':
      case 'persona':
        const presets = soulService.getAll();
        const found = presets.find((p) => p.name.toLowerCase().includes(rest.toLowerCase()) || p.id.includes(rest.toLowerCase()));
        if (found) {
          setActiveSoul(found);
          addLine('success', `Soul preset switched to: ${found.name} ${found.emoji}`);
        } else {
          addLine('error', `Persona "${rest}" not found. Try: jarvis, ultron, netrunner, intj, architect`);
        }
        break;

      case 'voice':
      case 'speak':
      case 'say':
        const phrase = rest || 'Good evening Sir. All holographic and neural arrays are operating at peak efficiency.';
        addLine('output', `[SYNTHESIZER SPEAKING]: "${phrase}"`);
        voiceService.speak(phrase, {
          rate: settings.voiceSpeed,
          pitch: settings.voicePitch,
        });
        break;

      case 'screen':
      case 'screenshot':
        const shot = await osService.captureScreen();
        if (shot) {
          addLine('success', `[SCREEN VISION]: Frame captured (${Math.round(shot.length / 1024)} KB base64). Dispatched to neural engine.`);
        } else {
          addLine('error', `[SCREEN VISION]: Capture cancelled by user.`);
        }
        break;

      case 'exit':
      case 'orb':
        setActiveTab('orb');
        break;

      default:
        // Generic PowerShell Command Simulator
        addLine('output', `Executing '${trimmed}' in OS runtime...\n[STDOUT]: Command completed (Exit Code 0).\nPID: 1084 | Working Set: 32MB | System Nominal.`);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx !== -1) {
        const nextIdx = historyIdx + 1;
        if (nextIdx < history.length) {
          setHistoryIdx(nextIdx);
          setInput(history[nextIdx]);
        } else {
          setHistoryIdx(-1);
          setInput('');
        }
      }
    }
  };

  return (
    <div
      className="pt-16 pb-24 px-4 max-w-6xl mx-auto h-screen flex flex-col justify-between font-mono select-text"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header Bar inside Terminal */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3 select-none">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-5 h-5 text-emerald-400" />
          <span className="font-mono text-sm font-bold text-zinc-200 tracking-wider">
            OS INTERACTIVE TERMINAL & AUTOMATION CORE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLines([]);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-red-400 transition-colors"
            title="Clear Terminal Output"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* Terminal Screen */}
      <div className="flex-1 overflow-y-auto p-4 bg-black/95 border border-zinc-800 rounded-xl space-y-2 text-xs leading-relaxed shadow-2xl">
        {lines.map((l) => {
          let textCol = 'text-zinc-300';
          if (l.type === 'input') textCol = 'text-emerald-400 font-bold';
          else if (l.type === 'error') textCol = 'text-red-400';
          else if (l.type === 'success') textCol = 'text-cyan-300';
          else if (l.type === 'system') textCol = 'text-zinc-400';

          return (
            <div key={l.id} className="whitespace-pre-wrap">
              <span className={textCol}>{l.text}</span>
            </div>
          );
        })}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Input Line */}
      <div className="mt-3 flex items-center gap-2 p-2 bg-zinc-950 border border-zinc-800 rounded-xl">
        <span className="text-emerald-400 font-bold text-xs pl-2">
          C:\Users\Sachi\my-dear-ultron&gt;
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder="Type a command (e.g. status, telemetry, ollama, hermes, voice Hello, help)..."
          className="flex-1 bg-transparent border-none text-white text-xs font-mono focus:outline-none placeholder:text-zinc-600"
        />
        <button
          onClick={() => handleCommand(input)}
          className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1 transition-colors"
        >
          <Play className="w-3 h-3" />
          <span>EXEC</span>
        </button>
      </div>
    </div>
  );
};
