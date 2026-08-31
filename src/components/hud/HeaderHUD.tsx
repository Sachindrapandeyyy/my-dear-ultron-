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
  ShieldAlert,
  Lock as LockIcon,
  Music,
  Mic,
  MicOff,
  Sparkles,
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
    telemetry,
    refreshTelemetry,
    settings,
    updateSettings,
    setIsLocked,
    isSentryActive,
    setIsSentryActive,
    isHandsFreeActive,
    setIsHandsFreeActive,
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
  const hostIp =
    typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
      ? window.location.hostname
      : '192.168.29.205';
  const networkUrl = `http://${hostIp}:5173`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    networkUrl
  )}&bgcolor=000000&color=ffffff&margin=10`;

  // Auto-refresh real Windows hardware telemetry
  useEffect(() => {
    refreshTelemetry();
    const tInterval = setInterval(refreshTelemetry, 2500);
    return () => clearInterval(tInterval);
  }, [refreshTelemetry]);

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

  const handleCopyUrl = () => {
    if (settings.soundEffects) audioService.playSuccessChime();
    navigator.clipboard.writeText(networkUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const navItems: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'orb', label: 'ORB', icon: Globe },
    { id: 'chat', label: 'CHAT', icon: MessageSquare },
    { id: 'swarm', label: 'AI SWARM', icon: Users },
    { id: 'terminal', label: 'TERMINAL', icon: Server },
    { id: 'memory', label: 'MEMORY', icon: Database },
    { id: 'skills', label: 'SKILLS', icon: Wrench },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-black/85 backdrop-blur-xl border-b border-zinc-800/80 px-4 flex items-center justify-between text-xs font-mono select-none">
        {/* ================= LEFT WING: Identity & Engine Status ================= */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Logo & Core Title */}
          <button
            onClick={() => handleTabClick('orb')}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
          >
            <div
              className="w-3 h-3 rounded-full transition-all duration-300 group-hover:scale-125"
              style={{
                backgroundColor: themeConfig.cssPrimary,
                boxShadow: `0 0 12px ${themeConfig.cssPrimary}`,
              }}
            />
            <span className="font-extrabold tracking-widest text-sm text-white group-hover:text-zinc-200">
              U.L.T.R.O.N.
            </span>
          </button>

          {/* Persona Chip */}
          <button
            onClick={() => handleTabClick('harness')}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${themeConfig.badge} hover:brightness-125`}
            title="Click to switch AI Soul / Persona"
          >
            <span>{activeSoul.emoji}</span>
            <span className="font-bold tracking-wider text-[11px] truncate max-w-[120px]">{activeSoul.name}</span>
          </button>

          {/* AI Model Badge */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              ollamaStatus.isOnline
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                ollamaStatus.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
              }`}
            />
            <span>
              {settings.llmProvider === 'ollama'
                ? `OLLAMA: ${settings.modelName.replace(':latest', '')}`
                : settings.llmProvider.toUpperCase()}
            </span>
          </div>
        </div>

        {/* ================= CENTER WING: Main Navigation Pills ================= */}
        <nav className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800/80 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] tracking-wider transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: themeConfig.cssPrimary + '25',
                        borderColor: themeConfig.cssPrimary + '60',
                        borderWidth: '1px',
                        color: themeConfig.cssPrimary,
                      }
                    : {}
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ================= RIGHT WING: Telemetry, Actions & Themes ================= */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Real Windows 11 Hardware Telemetry Capsule */}
          <div className="hidden lg:flex items-center gap-3 px-3 py-1 rounded-xl bg-zinc-950/90 border border-zinc-800/80 text-[11px]">
            <div className="flex items-center gap-1 text-cyan-400 font-bold" title="Real CPU Load">
              <Cpu className="w-3 h-3" />
              <span>{telemetry.cpuUsage}%</span>
            </div>
            <div className="flex items-center gap-1 text-purple-400 font-bold" title="Real Physical RAM Usage">
              <Activity className="w-3 h-3" />
              <span>{telemetry.memoryUsage}%</span>
            </div>
            <div className="flex items-center gap-1 font-bold" title="Real Battery Status">
              {telemetry.isCharging ? (
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Battery
                  className={`w-3.5 h-3.5 ${
                    telemetry.batteryLevel < 20
                      ? 'text-red-400'
                      : telemetry.batteryLevel < 50
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                />
              )}
              <span className={telemetry.isCharging ? 'text-emerald-400' : 'text-zinc-200'}>
                {telemetry.batteryLevel}%
              </span>
            </div>
            <div className="flex items-center gap-1 text-zinc-400 font-semibold" title="Network Ping">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span>{telemetry.latencyMs}ms</span>
            </div>
          </div>

          {/* Quick Utility Action Buttons */}
          <div className="flex items-center gap-1 bg-zinc-950/90 p-1 rounded-xl border border-zinc-800/80">
            {/* Hands-Free Voice Listener Toggle */}
            <button
              onClick={() => {
                if (settings.soundEffects) audioService.playClickSound();
                setIsHandsFreeActive(!isHandsFreeActive);
              }}
              title={isHandsFreeActive ? 'Hands-Free Voice: ACTIVE' : 'Hands-Free Voice: STANDBY'}
              className={`p-1.5 rounded-lg transition-all ${
                isHandsFreeActive
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              {isHandsFreeActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </button>

            {/* In-App YouTube Cyber-Player Dock Toggle */}
            <button
              onClick={() => {
                if (settings.soundEffects) audioService.playClickSound();
                window.dispatchEvent(new CustomEvent('ultron-toggle-music-player', { detail: { state: 'toggle' } }));
              }}
              title="YouTube Cyber Music Dock"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-400 hover:bg-zinc-900 transition-all"
            >
              <Music className="w-3.5 h-3.5" />
            </button>

            {/* Sentry Mode */}
            <button
              onClick={() => {
                if (settings.soundEffects) audioService.playClickSound();
                setIsSentryActive(!isSentryActive);
              }}
              title={isSentryActive ? 'Sentry Radar: ACTIVE' : 'Sentry Radar: OFF'}
              className={`p-1.5 rounded-lg transition-all ${
                isSentryActive
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
            </button>

            {/* Lock Screen */}
            <button
              onClick={() => {
                if (settings.soundEffects) audioService.playClickSound();
                setIsLocked(true);
              }}
              title="Lock System (Biometric Face ID)"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 transition-all"
            >
              <LockIcon className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Wi-Fi Sync */}
            <button
              onClick={() => {
                if (settings.soundEffects) audioService.playClickSound();
                setIsPhoneSyncOpen(true);
              }}
              title="Wi-Fi Mobile Companion Sync"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-400 hover:bg-zinc-900 transition-all"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>

            {/* Settings Modal */}
            <button
              onClick={() => handleTabClick('settings')}
              title="System Configuration"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Theme Color Switcher Dots */}
          <div className="hidden sm:flex items-center gap-1 bg-zinc-950/90 p-1 rounded-xl border border-zinc-800/80">
            {(Object.keys(ORB_THEMES) as OrbTheme[]).map((tKey) => {
              const t = ORB_THEMES[tKey];
              const isSelected = theme === tKey;
              return (
                <button
                  key={tKey}
                  onClick={() => handleThemeChange(tKey)}
                  title={t.name}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-200 cursor-pointer ${
                    isSelected ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-50 hover:opacity-100'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-mono animate-fadeIn">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsPhoneSyncOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <QrCode className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="font-bold text-white text-sm">MOBILE COMPANION SYNC</h3>
                <p className="text-[10px] text-zinc-400">Scan to stream 3D Orb & Voice on your Phone</p>
              </div>
            </div>

            <div className="flex justify-center p-3 bg-white rounded-xl">
              <img src={qrCodeUrl} alt="LAN QR Code" className="w-48 h-48 rounded" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                <span className="text-zinc-300 font-mono truncate max-w-[260px]">{networkUrl}</span>
                <button
                  onClick={handleCopyUrl}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold"
                >
                  {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedUrl ? 'COPIED' : 'COPY'}
                </button>
              </div>
              <p className="text-[10px] text-zinc-400 text-center">
                Ensure phone and laptop are connected to the same Wi-Fi network.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
