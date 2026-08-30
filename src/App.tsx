import React, { useEffect } from 'react';
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

export const App: React.FC = () => {
  const { activeTab, setActiveTab, settings, updateSettings, isLocked, setIsLocked, isEnrollModalOpen } = useAppStore();

  // Load saved settings from local storage on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ultron_settings_v1');
      if (saved) {
        updateSettings(JSON.parse(saved));
      }
    } catch {}
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
    </div>
  );
};

export default App;
