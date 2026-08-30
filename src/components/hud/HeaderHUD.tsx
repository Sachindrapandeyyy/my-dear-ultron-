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
  Smartphone,
  QrCode,
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Lock as LockIcon,
  Music,
  Mic,
  MicOff,
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

  const [isPhoneSyncOpen, setIsPhoneSyncOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const themeConfig = ORB_THEMES[theme];

  // Derive phone sync network URL
  const hostIp = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? window.location.hostname
    : '192.168.29.205';
  const networkUrl = `http://${hostIp}:5173`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(networkUrl)}&bgcolor=000000&color=ffffff&margin=10`;

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

  const handleCopyUrl = () => {
    if (settings.soundEffects) audioService.playSuccessChime();
    navigator.clipboard.writeText(networkUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const navItems: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'orb', label: 'ORB MATRIX', icon: Globe },
    { id: 'chat', label: 'NEURAL CHAT', icon: MessageSquare },
    { id: 'terminal', label: 'TERMINAL', icon: Server },
    { id: 'swarm', label: 'AI SWARM', icon: Users },
    { id: 'memory', label: 'MEMORY HUB', icon: Database },
    { id: 'skills', label: 'SKILLS & OS', icon: Wrench },
    { id: 'harness', label: 'SOULS', icon: Users },
    { id: 'settings', label: 'SETTINGS', icon: Settings },
  ];

  return (
    <>
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

        {/* Right: Security, Phone Sync, Telemetry & Themes */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hands-Free Wake Word Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              if (settings.soundEffects) audioService.playClickSound();
              const next = !useAppStore.getState().isHandsFreeActive;
              useAppStore.getState().setIsHandsFreeActive(next);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-mono transition-all ${
              useAppStore.getState().isHandsFreeActive
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400'
            }`}
            title="Toggle Hands-Free Wake Word Mode ('Hey Ultron' / 'Jarvis')"
          >
            {useAppStore.getState().isHandsFreeActive ? (
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <MicOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline">HANDS-FREE</span>
          </button>

          {/* Sentry Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              if (settings.soundEffects) audioService.playClickSound();
              const next = !useAppStore.getState().isSentryActive;
              useAppStore.getState().setIsSentryActive(next);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-mono transition-all ${
              useAppStore.getState().isSentryActive
                ? 'bg-red-950/80 border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-pulse'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400'
            }`}
            title="Toggle Sentry Surveillance Guard Mode"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden md:inline">SENTRY</span>
          </button>

          {/* Biometric Lock Button */}
          <button
            type="button"
            onClick={() => {
              if (settings.soundEffects) audioService.playClickSound();
              useAppStore.getState().setIsLocked(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 text-xs font-mono transition-all"
            title="Lock Desktop with Biometric Face ID (Ctrl+L)"
          >
            <LockIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">LOCK</span>
          </button>

          {/* YouTube Cyber Music Player Button */}
          <button
            type="button"
            onClick={() => {
              if (settings.soundEffects) audioService.playClickSound();
              window.dispatchEvent(new CustomEvent('ultron-toggle-music-player', { detail: { state: 'toggle' } }));
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-red-400 hover:text-red-300 text-xs font-mono transition-all"
            title="Launch YouTube Cyber Music Player"
          >
            <Music className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden md:inline">MUSIC</span>
          </button>

          {/* Phone Sync Button */}
          <button
            type="button"
            onClick={() => {
              if (settings.soundEffects) audioService.playClickSound();
              setIsPhoneSyncOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-cyan-400 text-xs font-mono transition-all hover:scale-105"
            title="Sync with Mobile Phone (Wi-Fi Companion)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PHONE SYNC</span>
          </button>

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

      {/* Phone Sync Modal with QR Code */}
      {isPhoneSyncOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-mono">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsPhoneSyncOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-cyan-400" />
              <h2 className="text-base font-bold tracking-wider text-white">MOBILE PHONE SYNC (WI-FI)</h2>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Connect your phone to the same Wi-Fi network and scan the QR code below (or type the URL) to control Ultron from your phone!
            </p>

            {/* QR Code Card */}
            <div className="p-4 bg-black border border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-inner">
                <img
                  src={qrCodeUrl}
                  alt="Ultron Mobile Sync QR Code"
                  className="w-48 h-48 object-contain"
                />
              </div>

              <div className="w-full flex items-center justify-between gap-2 p-2 bg-zinc-900 rounded-lg border border-zinc-800 text-xs">
                <span className="text-emerald-400 font-bold truncate">{networkUrl}</span>
                <button
                  onClick={handleCopyUrl}
                  className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded transition-colors text-[11px]"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
            </div>

            {/* Mobile Capabilities Guide */}
            <div className="space-y-1.5 text-[11px] text-zinc-400 bg-zinc-900/60 p-3 rounded-lg border border-zinc-900">
              <div className="font-bold text-zinc-300 mb-1 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                <span>MOBILE COMPANION FEATURES:</span>
              </div>
              <div>• 📱 **Touch 3D Orb**: Touch-spin and pinch-zoom the holographic matrix.</div>
              <div>• 🎙️ **Voice AI on Phone**: Use your phone's microphone & speakers.</div>
              <div>• 🧠 **Shared Memory & Chat**: Full live sync with your laptop's brain.</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
