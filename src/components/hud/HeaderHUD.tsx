import React, { useEffect, useState } from 'react';
import { useAppStore, ActiveTab } from '@/store/useAppStore';
import { ORB_THEMES } from '@/lib/orb/theme';
import {
  Cpu,
  Battery,
  BatteryCharging,
  Activity,
  MessageSquare,
  Globe,
  Database,
  Wrench,
  Users,
  Settings,
  Radio,
  Server,
} from 'lucide-react';
import { audioService } from '@/services/audioService';
import { ollamaService, OllamaStatus } from '@/services/ollamaService';
import { OrbTheme } from '@/types';

export const HeaderHUD: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    theme,
    setTheme,
    activeSoul,
    agentState,
    telemetry,
    settings,
    updateSettings,
  } = useAppStore();

  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({
    isOnline: false,
    endpoint: 'http://localhost:11434',
    models: [],
    activeModel: '',
  });

  const themeConfig = ORB_THEMES[theme];

  // Auto-detect local Ollama
  useEffect(() => {
    const checkOllama = async () => {
      const status = await ollamaService.checkStatus(settings.ollamaEndpoint);
      setOllamaStatus(status);
    };
    checkOllama();
    const interval = setInterval(checkOllama, 6000);
    return () => clearInterval(interval);
  }, [settings.ollamaEndpoint]);

  const handleTabClick = (tab: ActiveTab) => {
    if (settings.soundEffects) audioService.playClickSound();
    setActiveTab(tab);
  };

  const handleThemeChange = (newTheme: OrbTheme) => {
    if (settings.soundEffects) audioService.playClickSound();
    setTheme(newTheme);
  };

  const handleToggleOllama = () => {
    if (settings.soundEffects) audioService.playClickSound();
    if (settings.llmProvider === 'ollama') {
      updateSettings({ llmProvider: 'gemini' });
    } else {
      updateSettings({
        llmProvider: 'ollama',
        modelName: ollamaStatus.models[0] || 'llama3',
      });
    }
  };

  const navItems: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'orb', label: 'ORB MATRIX', icon: Globe },
    { id: 'chat', label: 'NEURAL CHAT', icon: MessageSquare },
    { id: 'memory', label: 'MEMORY HUB', icon: Database },
    { id: 'skills', label: 'SKILLS & OS', icon: Wrench },
    { id: 'harness', label: 'SOUL PRESETS', icon: Users },
    { id: 'settings', label: 'SETTINGS', icon: Settings },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex flex-col md:flex-row items-center justify-between px-4 py-2.5 bg-black/60 backdrop-blur-md border-b border-zinc-800/80 select-none">
      {/* Left: Brand + Active Persona + Ollama Quick Indicator */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => handleTabClick('orb')}
        >
          <div
            className="w-3 h-3 rounded-full animate-ping"
            style={{ backgroundColor: themeConfig.cssPrimary }}
          />
          <span
            className="font-mono font-bold tracking-[0.25em] text-sm group-hover:brightness-125 transition-all"
            style={{ color: themeConfig.cssPrimary, textShadow: `0 0 10px ${themeConfig.cssGlow}` }}
          >
            U.L.T.R.O.N.
          </span>
        </div>

        {/* Soul Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono border tracking-wider ${themeConfig.badge}`}
        >
          <span>{activeSoul.emoji}</span>
          <span className="font-semibold uppercase truncate max-w-[120px]">{activeSoul.name}</span>
          {agentState !== 'idle' && (
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
          )}
        </div>

        {/* Local Ollama Live Badge */}
        {ollamaStatus.isOnline && (
          <button
            onClick={handleToggleOllama}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono border transition-all cursor-pointer ${
              settings.llmProvider === 'ollama'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-emerald-300'
            }`}
            title="Click to toggle Local Ollama AI"
          >
            <Server className="w-3 h-3 text-emerald-400" />
            <span className="font-bold">OLLAMA: {ollamaStatus.activeModel || 'READY'}</span>
          </button>
        )}
      </div>

      {/* Center: Futuristic Navigation Tabs */}
      <nav className="flex items-center gap-1 my-2 md:my-0 overflow-x-auto max-w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono tracking-wider transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-zinc-800/90 text-white border'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
              style={{
                borderColor: isActive ? themeConfig.cssPrimary : 'transparent',
                boxShadow: isActive ? `0 0 10px ${themeConfig.cssGlow}` : 'none',
              }}
            >
              <Icon
                className="w-3.5 h-3.5"
                style={{ color: isActive ? themeConfig.cssPrimary : undefined }}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right: Laptop Telemetry & Theme Selector */}
      <div className="flex items-center gap-3">
        {/* Telemetry HUD */}
        <div className="hidden lg:flex items-center gap-3 px-3 py-1 rounded bg-zinc-950/80 border border-zinc-800/80 text-[10px] font-mono text-zinc-300">
          <div className="flex items-center gap-1" title="CPU Utilization">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>{telemetry.cpuUsage}%</span>
          </div>
          <div className="flex items-center gap-1" title="RAM Heap Usage">
            <Activity className="w-3 h-3 text-purple-400" />
            <span>{telemetry.memoryUsage}%</span>
          </div>
          <div className="flex items-center gap-1" title="Laptop Battery">
            {telemetry.isCharging ? (
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Battery className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{telemetry.batteryLevel}%</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-400" title="Network Ping">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>{telemetry.latencyMs}ms</span>
          </div>
        </div>

        {/* Quick Theme Switcher Pills */}
        <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded border border-zinc-800/80">
          {(Object.keys(ORB_THEMES) as OrbTheme[]).map((tKey) => {
            const t = ORB_THEMES[tKey];
            const isSelected = theme === tKey;
            return (
              <button
                key={tKey}
                onClick={() => handleThemeChange(tKey)}
                title={t.name}
                className={`w-4 h-4 rounded-full transition-all ${
                  isSelected ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: t.cssPrimary }}
              />
            );
          })}
        </div>
      </div>
    </header>
  );
};
