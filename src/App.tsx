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
import { audioService } from '@/services/audioService';

export const App: React.FC = () => {
  const { activeTab, setActiveTab, settings, updateSettings } = useAppStore();

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
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [activeTab, setActiveTab, settings.soundEffects]);

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
            {activeTab === 'memory' && <MemoryHub />}
            {activeTab === 'skills' && <SkillHub />}
            {activeTab === 'harness' && <HarnessSelector />}
            {activeTab === 'settings' && <SettingsModal />}
          </div>
        )}
      </main>

      {/* Bottom Voice & Screen Vision Floating Assistant Controls */}
      <VoiceControls />
    </div>
  );
};

export default App;
