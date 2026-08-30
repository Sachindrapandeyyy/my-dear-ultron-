import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ORB_THEMES } from '@/lib/orb/theme';
import {
  Music,
  Play,
  Maximize2,
  Minimize2,
  X,
  Search,
  ExternalLink,
  Radio,
} from 'lucide-react';
import { audioService } from '@/services/audioService';

interface MusicPreset {
  id: string;
  title: string;
  genre: string;
  query: string;
  icon: string;
}

const MUSIC_PRESETS: MusicPreset[] = [
  {
    id: 'iron-man',
    title: 'AC/DC - Back in Black / Shoot to Thrill',
    genre: '⚡ Stark Rock',
    query: 'AC DC Back in Black Iron Man',
    icon: '⚡',
  },
  {
    id: 'interstellar',
    title: 'Hans Zimmer - Interstellar OST Suite',
    genre: '🌌 Epic Cinema',
    query: 'Hans Zimmer Interstellar Main Theme Live',
    icon: '🌌',
  },
  {
    id: 'synthwave',
    title: 'Synthwave & Cyberpunk 2077 Mix',
    genre: '🌃 Retrowave',
    query: 'Synthwave Cyberpunk radio mix',
    icon: '🌃',
  },
  {
    id: 'lofi',
    title: 'Lofi Girl - Coding & Chill Beats',
    genre: '☕ Chill Focus',
    query: 'Lofi hip hop radio beats to relax study to',
    icon: '☕',
  },
  {
    id: 'phonk',
    title: 'Drift Phonk & Night Drive',
    genre: '🏎️ High Energy',
    query: 'Drift Phonk gym workout mix',
    icon: '🏎️',
  },
];

export const YouTubeCyberPlayer: React.FC = () => {
  const { theme, settings } = useAppStore();
  const themeConfig = ORB_THEMES[theme];

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('Synthwave Cyberpunk mix');
  const [searchInput, setSearchInput] = useState('');
  const [activePreset, setActivePreset] = useState('synthwave');

  // Listen for voice action triggers (e.g. "play [track] on youtube")
  useEffect(() => {
    const handleVoicePlay = (e: any) => {
      const query = e.detail?.query || 'Hans Zimmer Interstellar';
      setCurrentQuery(query);
      setSearchInput(query);
      setIsOpen(true);
      setIsMinimized(false);
      if (settings.soundEffects) audioService.playSuccessChime();
    };

    const handleTogglePlayer = (e: any) => {
      const state = e.detail?.state;
      if (state === 'open') setIsOpen(true);
      else if (state === 'close') setIsOpen(false);
      else setIsOpen((prev) => !prev);
    };

    window.addEventListener('ultron-play-youtube', handleVoicePlay);
    window.addEventListener('ultron-toggle-music-player', handleTogglePlayer);

    return () => {
      window.removeEventListener('ultron-play-youtube', handleVoicePlay);
      window.removeEventListener('ultron-toggle-music-player', handleTogglePlayer);
    };
  }, [settings.soundEffects]);

  if (!isOpen) return null;

  const embedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(
    currentQuery
  )}&autoplay=1`;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    if (settings.soundEffects) audioService.playClickSound();
    setCurrentQuery(searchInput.trim());
    setActivePreset('');
  };

  const handleSelectPreset = (preset: MusicPreset) => {
    if (settings.soundEffects) audioService.playClickSound();
    setActivePreset(preset.id);
    setCurrentQuery(preset.query);
    setSearchInput(preset.title);
  };

  const openInYouTubeTab = () => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(currentQuery)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      className={`fixed z-40 transition-all duration-300 font-mono ${
        isMinimized
          ? 'bottom-20 right-6 w-72'
          : 'bottom-20 right-6 w-[360px] md:w-[420px] max-w-[92vw]'
      } rounded-2xl bg-zinc-950/95 border backdrop-blur-xl shadow-2xl overflow-hidden`}
      style={{
        borderColor: themeConfig.cssPrimary,
        boxShadow: `0 0 30px ${themeConfig.cssGlow}`,
      }}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-red-500" />
          <span className="text-xs font-bold tracking-wider text-white">
            YOUTUBE CYBER-DOCK
          </span>
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        </div>

        <div className="flex items-center gap-1.5 text-zinc-400">
          <button
            onClick={openInYouTubeTab}
            title="Open in YouTube.com Tab"
            className="p-1 hover:text-white hover:bg-zinc-800 rounded transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMinimized((prev) => !prev)}
            title={isMinimized ? 'Expand Player' : 'Minimize Player'}
            className="p-1 hover:text-white hover:bg-zinc-800 rounded transition-all"
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            title="Close Player"
            className="p-1 hover:text-red-400 hover:bg-zinc-800 rounded transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Player Content (Hidden when minimized) */}
      {!isMinimized && (
        <div className="p-3 space-y-3">
          {/* Search Input Form */}
          <form onSubmit={handleSearchSubmit} className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search any song, artist, video on YouTube..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition-all"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>PLAY</span>
            </button>
          </form>

          {/* YouTube Video / Music Embed */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800 shadow-inner">
            <iframe
              key={currentQuery}
              src={embedUrl}
              title="YouTube Cyber Player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>

          {/* Curated Presets Bar */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center justify-between">
              <span>Quick Audio Matrix Presets</span>
              <span className="text-zinc-400">1-Click Stream</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {MUSIC_PRESETS.slice(0, 4).map((p) => {
                const isSelected = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p)}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-zinc-800 text-white border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                        : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-base">{p.icon}</span>
                    <div className="truncate">
                      <div className="text-[11px] font-bold truncate text-white">{p.genre}</div>
                      <div className="text-[9px] text-zinc-400 truncate">{p.title}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Minimized Dock Footer */}
      {isMinimized && (
        <div className="p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate pr-2">
            <Radio className="w-3.5 h-3.5 text-red-400 animate-spin" />
            <span className="text-[11px] font-bold text-white truncate font-mono">
              {currentQuery}
            </span>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-[10px] font-bold hover:bg-zinc-700"
          >
            RESTORE
          </button>
        </div>
      )}
    </div>
  );
};
