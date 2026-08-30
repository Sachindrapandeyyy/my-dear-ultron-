import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ORB_THEMES } from '@/lib/orb/theme';
import { Users, Search, Check, Sparkles, UserCheck, Shield, Zap, Cpu } from 'lucide-react';
import { soulService } from '@/services/soulService';
import { audioService } from '@/services/audioService';
import { SoulPreset } from '@/types';
import { FreeModelsMatrix } from '@/components/harness/FreeModelsMatrix';

export const HarnessSelector: React.FC = () => {
  const { theme, setTheme, activeSoul, setActiveSoul, addMessage, setActiveTab, settings } = useAppStore();

  const [activeSubTab, setActiveSubTab] = useState<'personas' | 'models'>('models');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const themeConfig = ORB_THEMES[theme];
  const allPresets = soulService.getAll();
  const categories = soulService.getCategories();

  const filteredPresets = soulService.filter(selectedCategory, searchQuery);

  const handleActivateSoul = (preset: SoulPreset) => {
    if (settings.soundEffects) audioService.playSuccessChime();

    setActiveSoul(preset);

    // Smart theme auto-switch based on persona
    if (preset.id.includes('jarvis')) {
      setTheme('jarvis');
    } else if (preset.id.includes('ultron')) {
      setTheme('ultron');
    } else if (preset.id.includes('cyberpunk') || preset.id.includes('netrunner')) {
      setTheme('void');
    } else if (preset.id.includes('vision') || preset.id.includes('spatial')) {
      setTheme('arc');
    } else if (preset.id.includes('architect')) {
      setTheme('matrix');
    }

    addMessage({
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `⚡ **HARNESS PROTOCOL SHIFT**: Active persona migrated to **${preset.name}** ${preset.emoji}.\n*${preset.vibe}*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setActiveTab('chat');
  };

  return (
    <div className="pt-16 pb-24 px-4 max-w-6xl mx-auto min-h-screen font-mono select-text">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6" style={{ color: themeConfig.cssPrimary }} />
            <h1 className="text-xl font-bold tracking-widest text-white">
              MODELSCOPE SOUL HARNESS & AI MODELS
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Swap 100% free local Ollama AI models, MBTI soul archetypes, and specialized engineering profiles on the fly.
          </p>
        </div>

        {/* Current Active Soul Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-300">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>ACTIVE SOUL:</span>
          <span className="font-bold text-white">{activeSoul.name}</span>
          <span>{activeSoul.emoji}</span>
        </div>
      </div>

      {/* Primary Top View Mode Switcher */}
      <div className="flex items-center gap-2 p-1 bg-zinc-950/90 border border-zinc-800 rounded-xl mb-6 select-none max-w-xl">
        <button
          onClick={() => {
            if (settings.soundEffects) audioService.playClickSound();
            setActiveSubTab('models');
          }}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'models'
              ? 'bg-zinc-800 text-white shadow-[0_0_15px_rgba(0,243,255,0.2)] border border-cyan-500'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>FREE AI MODELS (OLLAMA & NVIDIA)</span>
        </button>

        <button
          onClick={() => {
            if (settings.soundEffects) audioService.playClickSound();
            setActiveSubTab('personas');
          }}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeSubTab === 'personas'
              ? 'bg-zinc-800 text-white shadow-[0_0_15px_rgba(0,243,255,0.2)] border border-cyan-500'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-4 h-4 text-cyan-400" />
          <span>SOUL PERSONAS & MBTI</span>
        </button>
      </div>

      {/* Tab 1: Free AI Models (Ollama & NVIDIA) */}
      {activeSubTab === 'models' && <FreeModelsMatrix />}

      {/* Tab 2: Soul Personas & MBTI Archetypes */}
      {activeSubTab === 'personas' && (
        <div>
          {/* Search & Categories */}
          <div className="space-y-3 mb-6 select-none">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search personas (e.g. Jarvis, Netrunner, INTJ, Architect, Scorpio)..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/90 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-600 transition-all placeholder:text-zinc-600"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      if (settings.soundEffects) audioService.playClickSound();
                      setSelectedCategory(cat);
                    }}
                    className={`px-3 py-1.5 rounded text-xs tracking-wider transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-zinc-800 text-white border'
                        : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-transparent'
                    }`}
                    style={{
                      borderColor: isSelected ? themeConfig.cssPrimary : undefined,
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPresets.map((preset) => {
              const isActive = activeSoul.id === preset.id;
              return (
                <div
                  key={preset.id}
                  className={`p-5 rounded-xl border transition-all flex flex-col justify-between relative group ${
                    isActive
                      ? 'bg-zinc-900/90 border-zinc-600 shadow-lg'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40'
                  }`}
                  style={{
                    borderColor: isActive ? themeConfig.cssPrimary : undefined,
                    boxShadow: isActive ? `0 0 20px ${themeConfig.cssGlow}` : undefined,
                  }}
                >
                  <div>
                    {/* Card Top: Emoji, Name, Category */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{preset.emoji}</span>
                        <div>
                          <h3 className="text-base font-bold text-white tracking-wide">{preset.name}</h3>
                          <span className="text-[10px] tracking-widest uppercase text-zinc-400">
                            {preset.category}
                          </span>
                        </div>
                      </div>

                      {isActive && (
                        <span
                          className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border"
                          style={{
                            color: themeConfig.cssPrimary,
                            borderColor: themeConfig.cssPrimary,
                            backgroundColor: `${themeConfig.cssPrimary}15`,
                          }}
                        >
                          <Check className="w-3 h-3" />
                          <span>ACTIVE</span>
                        </span>
                      )}
                    </div>

                    {/* Vibe / Tagline */}
                    <div className="text-xs text-cyan-400 font-semibold mb-2">"{preset.vibe}"</div>

                    {/* Description */}
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 mb-4">
                      {preset.description}
                    </p>
                  </div>

                  {/* Activation Button */}
                  <div className="pt-3 border-t border-zinc-800/60">
                    <button
                      onClick={() => handleActivateSoul(preset)}
                      disabled={isActive}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                        isActive
                          ? 'bg-zinc-800/80 text-zinc-500 cursor-default'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-500'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>CURRENTLY HARNESSED</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" style={{ color: themeConfig.cssPrimary }} />
                          <span>HARNESS SOUL</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
