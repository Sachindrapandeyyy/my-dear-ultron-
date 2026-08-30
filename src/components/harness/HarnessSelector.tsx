import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ORB_THEMES } from '@/lib/orb/theme';
import { Users, Search, Check, Sparkles, UserCheck, Shield, Zap } from 'lucide-react';
import { soulService } from '@/services/soulService';
import { audioService } from '@/services/audioService';
import { SoulPreset } from '@/types';

export const HarnessSelector: React.FC = () => {
  const { theme, setTheme, activeSoul, setActiveSoul, addMessage, setActiveTab, settings } = useAppStore();

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
              MODELSCOPE SOUL HARNESS & PERSONAS
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Swap personas, MBTI soul archetypes, and specialized engineering profiles on the fly.
          </p>
        </div>

        {/* Current Active Soul Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-300">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>ACTIVE:</span>
          <span className="font-bold text-white">{activeSoul.name}</span>
          <span>{activeSoul.emoji}</span>
        </div>
      </div>

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
                  boxShadow: isSelected ? `0 0 8px ${themeConfig.cssGlow}` : 'none',
                }}
              >
                {cat.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Soul Presets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPresets.map((preset) => {
          const isActive = activeSoul.id === preset.id;
          return (
            <div
              key={preset.id}
              className={`p-4 rounded-lg bg-zinc-950/90 border transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-2 shadow-lg'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
              style={{
                borderColor: isActive ? themeConfig.cssPrimary : undefined,
                boxShadow: isActive ? `0 0 16px ${themeConfig.cssGlow}` : undefined,
              }}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-2xl">{preset.emoji}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                    {preset.category}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-sm font-bold text-white mb-1">{preset.name}</h3>

                {/* Description & Vibe */}
                <p className="text-xs text-zinc-300 mb-2 leading-relaxed">{preset.description}</p>
                <div className="text-[11px] text-zinc-400 italic bg-zinc-900/60 p-2 rounded border border-zinc-900 mb-3">
                  "{preset.vibe}"
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-zinc-800/80">
                {isActive ? (
                  <div className="w-full py-1.5 rounded flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 select-none">
                    <Check className="w-3.5 h-3.5" />
                    <span>CURRENTLY ACTIVE</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleActivateSoul(preset)}
                    className="w-full py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 select-none hover:scale-[1.02]"
                    style={{
                      backgroundColor: themeConfig.cssPrimary,
                      color: '#000',
                    }}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>ACTIVATE SOUL</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
