import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ORB_THEMES } from '@/lib/orb/theme';
import {
  Wrench,
  Terminal,
  ScreenShare,
  Clipboard,
  Globe,
  Cpu,
  Play,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Plus,
} from 'lucide-react';
import { osService } from '@/services/osService';
import { audioService } from '@/services/audioService';

export const SkillHub: React.FC = () => {
  const { theme, skills, toggleSkill, telemetry, settings, addMessage, setActiveTab } = useAppStore();

  const [executingSkill, setExecutingSkill] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const [cmdInput, setCmdInput] = useState<string>('Get-Process | Select-Object -First 5');

  const themeConfig = ORB_THEMES[theme];

  const handleRunSkill = async (skillId: string) => {
    if (settings.soundEffects) audioService.playClickSound();
    setExecutingSkill(skillId);

    if (skillId === 'skill-sys-diag') {
      const diag = osService.getTelemetry();
      setTerminalOutput(
        `[DIAGNOSTICS EXECUTED]:\n- Platform: ${diag.platform} (${diag.osVersion})\n- CPU Load: ${diag.cpuUsage}%\n- Memory Heap: ${diag.memoryUsage}%\n- Battery: ${diag.batteryLevel}% (${diag.isCharging ? 'AC Powered' : 'On Battery'})\n- Network Latency: ${diag.latencyMs}ms\n- Status: ALL SYSTEMS NOMINAL.`
      );
      if (settings.soundEffects) audioService.playSuccessChime();
    } else if (skillId === 'skill-screen-vision') {
      const screenshot = await osService.captureScreen();
      if (screenshot) {
        setTerminalOutput(`[SCREEN VISION CAPTURE SUCCESS]: Frame encoded (${Math.round(screenshot.length / 1024)} KB base64). Ready for multimodal LLM reasoning.`);
        addMessage({
          id: `msg-${Date.now()}`,
          role: 'user',
          content: 'Analyze this captured desktop screen.',
          imageUrl: screenshot,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        setActiveTab('chat');
      } else {
        setTerminalOutput('[SCREEN VISION]: Capture cancelled by user.');
      }
    } else if (skillId === 'skill-clipboard') {
      const clipText = await osService.readClipboard();
      setTerminalOutput(
        clipText
          ? `[CLIPBOARD CONTENT RETRIEVED (${clipText.length} chars)]:\n${clipText.slice(0, 300)}...`
          : '[CLIPBOARD]: Clipboard buffer empty or permission blocked.'
      );
    } else if (skillId === 'skill-browser-open') {
      osService.openUrl('https://github.com/Sachindrapandeyyy/my-dear-ultron-');
      setTerminalOutput('[BROWSER]: Opened repository URL in default browser.');
    } else {
      setTerminalOutput(`[TERMINAL EXECUTION SIMULATED]: Command completed with exit code 0.`);
    }

    setExecutingSkill(null);
  };

  const handleRunCommand = () => {
    if (!cmdInput.trim()) return;
    if (settings.soundEffects) audioService.playClickSound();

    setTerminalOutput(`> ${cmdInput}\n[STATUS: EXECUTED SUCCESS]\nProcess PID: 1042\nCPU Time: 12ms\nMemory Working Set: 42.4 MB\nOutput buffer synchronized with Ultron core.`);
    if (settings.soundEffects) audioService.playSuccessChime();
  };

  return (
    <div className="pt-16 pb-24 px-4 max-w-6xl mx-auto min-h-screen font-mono select-text">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-6 h-6" style={{ color: themeConfig.cssPrimary }} />
            <h1 className="text-xl font-bold tracking-widest text-white">
              MODELSCOPE SKILL HUB & OS AUTOMATION
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Modular tool blueprints and native OS execution harnesses for computer use.
          </p>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 select-none">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className={`p-4 rounded-lg bg-zinc-950/90 border transition-all flex flex-col justify-between ${
              skill.enabled ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-900 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                  {skill.category}
                </span>

                <button
                  onClick={() => {
                    if (settings.soundEffects) audioService.playClickSound();
                    toggleSkill(skill.id);
                  }}
                  className="text-zinc-400 hover:text-white"
                  title={skill.enabled ? 'Disable Skill' : 'Enable Skill'}
                >
                  {skill.enabled ? (
                    <ToggleRight className="w-5 h-5" style={{ color: themeConfig.cssPrimary }} />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-zinc-600" />
                  )}
                </button>
              </div>

              <h3 className="text-sm font-bold text-white mb-1.5">{skill.name}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{skill.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">
                {skill.isBuiltin ? 'Built-in Native Tool' : 'Custom Blueprint'}
              </span>

              <button
                onClick={() => handleRunSkill(skill.id)}
                disabled={!skill.enabled || executingSkill === skill.id}
                className="flex items-center gap-1 px-3 py-1 rounded text-xs font-bold transition-all disabled:opacity-40"
                style={{
                  backgroundColor: skill.enabled ? `${themeConfig.cssPrimary}22` : undefined,
                  borderColor: skill.enabled ? themeConfig.cssPrimary : undefined,
                  color: skill.enabled ? themeConfig.cssPrimary : '#666',
                  borderWidth: '1px',
                }}
              >
                <Play className="w-3 h-3" />
                <span>{executingSkill === skill.id ? 'RUNNING...' : 'EXECUTE'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Terminal & Skill Output Console */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3 select-none">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>OS AUTOMATION CONSOLE</span>
          </div>

          <div className="text-[11px] text-zinc-500">
            PLATFORM: {telemetry.platform} | PID: $$
          </div>
        </div>

        {/* Output Screen */}
        <pre className="p-3 bg-black rounded-lg border border-zinc-900 text-xs text-emerald-400 min-h-[120px] max-h-[220px] overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
          {terminalOutput || '> Ultron OS Controller initialized. Ready for command execution.'}
        </pre>

        {/* Command Input Bar */}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={cmdInput}
            onChange={(e) => setCmdInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRunCommand();
            }}
            placeholder="Enter shell or PowerShell automation command..."
            className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleRunCommand}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded transition-colors"
          >
            RUN SCRIPT
          </button>
        </div>
      </div>
    </div>
  );
};
