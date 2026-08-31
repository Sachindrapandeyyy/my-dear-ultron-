import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { HeaderHUD } from '@/components/hud/HeaderHUD';
import { VoiceControls } from '@/components/hud/VoiceControls';
import { JarvisOrb } from '@/components/orb/JarvisOrb';
import { ChatConsole } from '@/components/chat/ChatConsole';
import { MemoryHub } from '@/components/memory/MemoryHub';
import { SkillHub } from '@/components/skills/SkillHub';
import { HarnessSelector } from '@/components/harness/HarnessSelector';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { InteractiveTerminal } from '@/components/terminal/InteractiveTerminal';
import { FaceLockScreen } from '@/components/security/FaceLockScreen';
import { FaceEnrollModal } from '@/components/security/FaceEnrollModal';
import { YouTubeCyberPlayer } from '@/components/music/YouTubeCyberPlayer';
import { HandsFreeVoiceController } from '@/components/voice/HandsFreeVoiceController';
import { SubagentSwarmHub } from '@/components/swarm/SubagentSwarmHub';
import { audioService } from '@/services/audioService';
import { systemBootService, BootStatus } from '@/services/systemBootService';
import { Zap, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const { activeTab, setActiveTab, settings, updateSettings, isLocked, setIsLocked, isEnrollModalOpen, refreshMemories } = useAppStore();
  const [bootStatus, setBootStatus] = useState<BootStatus | null>(null);
  const [showBootToast, setShowBootToast] = useState(false);

  // Auto-Boot all core subsystems on application launch
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ultron_settings_v1');
      if (saved) {
        updateSettings(JSON.parse(saved));
      }
    } catch {}

    refreshMemories();

    systemBootService.boot().then((status) => {
      setBootStatus(status);
      setShowBootToast(true);
      if (settings.soundEffects) audioService.playSuccessChime();
      setTimeout(() => setShowBootToast(false), 4500);
    });
  }, []);

  // Global hotkeys listener
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      // Ctrl + Space -> Quick Neural Chat Toggle
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        if (settings.soundEffects) audioService.playClickSound();
        setActiveTab(activeTab === 'chat' ? 'orb' : 'chat');
      }
      // Ctrl + L -> Lock Screen
      if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        if (settings.soundEffects) audioService.playClickSound();
        setIsLocked(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [activeTab, setActiveTab, settings.soundEffects, setIsLocked]);

  return (
    <div className="relative w-screen h-screen bg-black text-white overflow-hidden select-none font-mono">
      {/* Top Holographic Navigation & Telemetry HUD */}
      <HeaderHUD />

      {/* Main Viewport Container */}
      <main className="w-full h-full relative">
        {/* Always active Three.js 3D Orb Viewport (hidden or visible) */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            activeTab === 'orb' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <JarvisOrb />
        </div>

        {/* Tab Content Views */}
        {activeTab !== 'orb' && (
          <div className="absolute inset-0 overflow-y-auto bg-black/90 backdrop-blur-md z-10 animate-fadeIn">
            {activeTab === 'chat' && <ChatConsole />}
            {activeTab === 'terminal' && <InteractiveTerminal />}
            {activeTab === 'swarm' && <SubagentSwarmHub />}
            {activeTab === 'memory' && <MemoryHub />}
            {activeTab === 'skills' && <SkillHub />}
            {activeTab === 'harness' && <HarnessSelector />}
            {activeTab === 'settings' && <SettingsModal />}
          </div>
        )}
      </main>

      {/* Bottom Voice & Screen Vision Floating Assistant Controls */}
      <VoiceControls />

      {/* Biometric Face ID Lock Barrier */}
      {isLocked && <FaceLockScreen />}

      {/* Biometric Face ID Enrollment Modal */}
      {isEnrollModalOpen && <FaceEnrollModal />}

      {/* Hands-Free Wake-Word & Full-Duplex Voice Controller */}
      <HandsFreeVoiceController />

      {/* Floating Holographic YouTube Music & Video Cyber-Dock */}
      <YouTubeCyberPlayer />

      {/* Holographic System Startup Confirmation Toast */}
      {showBootToast && bootStatus && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full bg-zinc-950/95 border border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.35)] backdrop-blur-xl animate-fadeIn text-xs font-mono select-none">
          <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-white font-bold tracking-wider">
            ALL NEURAL SUBSYSTEMS ONLINE
          </span>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full font-bold">
            {bootStatus.activeModel.replace(':latest', '')} // ACTIVE
          </span>
        </div>
      )}
    </div>
  );
};

export default App;
