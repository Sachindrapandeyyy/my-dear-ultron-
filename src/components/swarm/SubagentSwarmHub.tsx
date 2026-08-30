import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ORB_THEMES } from '@/lib/orb/theme';
import { swarmService, SwarmAgent } from '@/services/swarmService';
import { audioService } from '@/services/audioService';
import { memoryService } from '@/services/memoryService';
import {
  Users,
  Bot,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  Cpu,
  Radio,
  BookmarkPlus,
} from 'lucide-react';

export const SubagentSwarmHub: React.FC = () => {
  const { theme, settings, addMessage, setActiveTab } = useAppStore();
  const themeConfig = ORB_THEMES[theme];

  const [agents, setAgents] = useState<SwarmAgent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent-researcher');
  const [missionPrompt, setMissionPrompt] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setAgents(swarmService.getAgents());
  }, []);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  const handleLaunchMission = async (customPrompt?: string) => {
    const promptToRun = (customPrompt || missionPrompt).trim();
    if (!promptToRun || isDispatching) return;

    if (settings.soundEffects) audioService.playClickSound();
    setIsDispatching(true);
    setMissionPrompt('');

    await swarmService.launchMission(selectedAgentId, promptToRun, (updatedAgent) => {
      setAgents((prev) => prev.map((a) => (a.id === updatedAgent.id ? updatedAgent : a)));
    });

    setIsDispatching(false);
    if (settings.soundEffects) audioService.playSuccessChime();
  };

  const handleResetAgent = (agentId: string) => {
    if (settings.soundEffects) audioService.playClickSound();
    swarmService.resetAgent(agentId);
    setAgents(swarmService.getAgents());
  };

  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (settings.soundEffects) audioService.playClickSound();
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSaveToMemory = (agent: SwarmAgent) => {
    if (!agent.outputResult) return;
    if (settings.soundEffects) audioService.playSuccessChime();

    memoryService.add({
      title: `${agent.name} Output: ${agent.currentTask.slice(0, 40)}...`,
      content: agent.outputResult,
      category: 'pattern',
      tags: ['subagent', agent.id, 'swarm'],
    });
  };

  const QUICK_MISSION_PRESETS = [
    {
      agentId: 'agent-researcher',
      title: '🔬 State of Quantum Computing in 2026',
      prompt: 'Provide a comprehensive research briefing on major quantum error correction and topological qubit breakthroughs in 2026.',
    },
    {
      agentId: 'agent-architect',
      title: '💻 Ultra-Fast Three.js Particle Shader',
      prompt: 'Write a high-performance GLSL vertex and fragment shader snippet for 100,000 instanced particles with noise turbulence in Three.js.',
    },
    {
      agentId: 'agent-sentinel',
      title: '🛡️ Audit OS Memory & Biometric Integrity',
      prompt: 'Run a diagnostic telemetry audit on local memory buffers, WebGL context, and biometric security barrier hashes.',
    },
    {
      agentId: 'agent-analyst',
      title: '📈 Crypto Market Macro Cycle Synthesis',
      prompt: 'Analyze current Bitcoin halving cycle trajectories, liquidity metrics, and DeFi institutional inflows.',
    },
  ];

  return (
    <div className="pt-16 pb-24 px-4 max-w-6xl mx-auto min-h-screen font-mono select-text">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6" style={{ color: themeConfig.cssPrimary }} />
            <h1 className="text-xl font-bold tracking-widest text-white">
              AUTONOMOUS AI SUBAGENT SWARM & MISSION CONTROL
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Coordinated multi-agent swarm architecture running in parallel under ULTRON SOVEREIGN.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-white font-bold">{agents.filter((a) => a.status === 'running').length} ACTIVE</span>
            <span>/ {agents.length} AGENTS</span>
          </div>
        </div>
      </div>

      {/* Main Grid: 4 Subagents Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {agents.map((agent) => {
          const isSelected = selectedAgentId === agent.id;
          return (
            <div
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                isSelected
                  ? 'bg-zinc-900 border-cyan-500 shadow-[0_0_25px_rgba(0,243,255,0.25)]'
                  : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-2xl">{agent.avatar}</span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${
                      agent.status === 'running'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500 animate-pulse'
                        : agent.status === 'completed'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-white tracking-wider leading-tight mb-1">
                  {agent.name}
                </h3>
                <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                  {agent.role}
                </p>

                {/* Progress bar */}
                {agent.status === 'running' && (
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-[9px] text-cyan-400">
                      <span>Progress</span>
                      <span>{agent.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-300 shadow-[0_0_8px_#22d3ee]"
                        style={{ width: `${agent.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[9px] text-zinc-500">
                <span className="truncate max-w-[120px]">Brain: {agent.model}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetAgent(agent.id);
                  }}
                  className="hover:text-red-400 transition-colors p-1"
                  title="Reset Agent"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Mission Presets */}
      <div className="space-y-2 mb-6 select-none">
        <span className="text-[11px] text-zinc-400 font-bold tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          QUICK AUTONOMOUS MISSION PRESETS:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {QUICK_MISSION_PRESETS.map((preset, i) => (
            <button
              key={i}
              onClick={() => {
                setSelectedAgentId(preset.agentId);
                handleLaunchMission(preset.prompt);
              }}
              className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500 text-left text-xs text-zinc-200 hover:text-white transition-all hover:scale-[1.02]"
            >
              <div className="font-bold text-[11px] text-cyan-400 mb-1">{preset.title}</div>
              <div className="text-[10px] text-zinc-400 line-clamp-2">{preset.prompt}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Agent Mission Dispatcher & Live Thought Console */}
      {selectedAgent && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
          {/* Mission Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedAgent.avatar}</span>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  {selectedAgent.name}
                  <span className="text-[10px] px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-cyan-400 font-bold">
                    {selectedAgent.model}
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-400">{selectedAgent.role}</p>
              </div>
            </div>

            {/* Actions */}
            {selectedAgent.outputResult && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveToMemory(selectedAgent)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-cyan-400 font-bold transition-all"
                  title="Save output to Collective Memory"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>SAVE TO MEMORY</span>
                </button>

                <button
                  onClick={() => handleCopyToClipboard(selectedAgent.outputResult!, selectedAgent.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 font-bold transition-all"
                >
                  {copiedId === selectedAgent.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === selectedAgent.id ? 'COPIED' : 'COPY OUTPUT'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Mission Dispatch Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLaunchMission();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Terminal className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={missionPrompt}
                onChange={(e) => setMissionPrompt(e.target.value)}
                placeholder={`Dispatch autonomous mission to ${selectedAgent.name}...`}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isDispatching}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,243,255,0.4)] disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isDispatching ? 'EXECUTING...' : 'DISPATCH MISSION'}</span>
            </button>
          </form>

          {/* Two-Column Logs & Output */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Thought Stream Log */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 pb-1 border-b border-zinc-800">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Terminal className="w-3.5 h-3.5" />
                  REAL-TIME THOUGHT STREAM
                </span>
                <span className="text-[9px] text-zinc-500">Autonomous Kernel</span>
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto font-mono text-[11px] text-zinc-400 leading-relaxed">
                {selectedAgent.thoughtStream.map((thought, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-zinc-600">›</span>
                    <span>{thought}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Synthesized Output Result */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 pb-1 border-b border-zinc-800">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    SYNTHESIZED MISSION OUTPUT
                  </span>
                  <span className="text-[9px] text-zinc-500">
                    {selectedAgent.completedAt ? `Completed at ${selectedAgent.completedAt}` : 'Pending output'}
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed pt-1">
                  {selectedAgent.outputResult || (
                    <span className="text-zinc-500 italic text-xs">
                      No mission output yet. Dispatch a task above to execute autonomous reasoning.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
