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
  Sparkles,
  Volume2,
} from 'lucide-react';
import { audioService } from '@/services/audioService';

interface MusicPreset {
  id: string;
  title: string;
  genre: string;
  videoId: string;
  icon: string;
}

const MUSIC_PRESETS: MusicPreset[] = [
  {
    id: 'synthwave',
    title: 'Cyberpunk & Synthwave Radio',
    genre: '🌃 Retrowave',
    videoId: '4xDzrJKXOOY',
    icon: '🌃',
  },
  {
    id: 'iron-man',
    title: 'AC/DC - Back in Black (Official)',
    genre: '⚡ Stark Rock',
    videoId: 'pAgnJDJN4VA',
    icon: '⚡',
  },
  {
    id: 'interstellar',
    title: 'Hans Zimmer - Interstellar Live Suite',
    genre: '🌌 Epic Cinema',
    videoId: 'UDVtMYqUAyw',
    icon: '🌌',
  },
  {
    id: 'lofi',
    title: 'Lofi Girl - Chill Beats Radio',
    genre: '☕ Chill Focus',
    videoId: 'jfKfPfyJRdk',
    icon: '☕',
  },
  {
    id: 'phonk',
    title: 'Kordhell - Murder In My Mind',
    genre: '🏎️ Drift Phonk',
    videoId: 'w-sQRS-Mun8',
    icon: '🏎️',
  },
  {
    id: 'marvel',
    title: 'The Avengers - Main Theme Suite',
    genre: '🦸 Marvel Epic',
    videoId: 'O-zpOMYRi0w',
    icon: '🦸',
  },
];

// Helper to extract YouTube Video ID from any URL or query
function parseYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  // 1. Direct ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  // 2. youtube.com/watch?v=...
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  // 3. youtu.be/...
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  // 4. youtube.com/embed/...
  const embedMatch = trimmed.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  return null;
}

export const YouTubeCyberPlayer: React.FC = () => {
  const { theme, settings } = useAppStore();
  const themeConfig = ORB_THEMES[theme];

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState('4xDzrJKXOOY'); // Default Synthwave
  const [currentTitle, setCurrentTitle] = useState('Cyberpunk & Synthwave Radio');
  const [searchInput, setSearchInput] = useState('');
  const [activePreset, setActivePreset] = useState('synthwave');

  // Listen for voice action triggers
  useEffect(() => {
    const handleVoicePlay = (e: any) => {
      const rawQuery = (e.detail?.query || '').trim().toLowerCase();
      setIsOpen(true);
      setIsMinimized(false);

      if (settings.soundEffects) audioService.playSuccessChime();

      // Check if matches known preset keywords
      if (rawQuery.includes('iron man') || rawQuery.includes('back in black') || rawQuery.includes('ac dc')) {
        handleSelectPreset(MUSIC_PRESETS[1]);
      } else if (rawQuery.includes('interstellar') || rawQuery.includes('hans zimmer')) {
        handleSelectPreset(MUSIC_PRESETS[2]);
      } else if (rawQuery.includes('lofi') || rawQuery.includes('chill') || rawQuery.includes('study')) {
        handleSelectPreset(MUSIC_PRESETS[3]);
      } else if (rawQuery.includes('phonk') || rawQuery.includes('drift')) {
        handleSelectPreset(MUSIC_PRESETS[4]);
      } else if (rawQuery.includes('avengers') || rawQuery.includes('marvel')) {
        handleSelectPreset(MUSIC_PRESETS[5]);
      } else {
        // Try parsing video ID or open search
        const parsed = parseYouTubeVideoId(rawQuery);
        if (parsed) {
          setCurrentVideoId(parsed);
          setCurrentTitle(rawQuery);
        } else {
          // Open YouTube search directly in pop-up or window
          window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(rawQuery)}`, '_blank');
        }
      }
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

  const handleSelectPreset = (preset: MusicPreset) => {
    if (settings.soundEffects) audioService.playClickSound();
    setActivePreset(preset.id);
    setCurrentVideoId(preset.videoId);
    setCurrentTitle(preset.title);
    setSearchInput(preset.title);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    if (settings.soundEffects) audioService.playClickSound();

    const parsedId = parseYouTubeVideoId(searchInput);
    if (parsedId) {
      setCurrentVideoId(parsedId);
      setCurrentTitle(searchInput);
      setActivePreset('');
    } else {
      // Open search in YouTube
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchInput.trim())}`;
      window.open(url, '_blank');
    }
  };

  const openInYouTubeTab = () => {
    const url = `https://www.youtube.com/watch?v=${currentVideoId}`;
    window.open(url, '_blank');
  };

  const embedSrc = `https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1&enablejsapi=1&rel=0`;

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
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 select-none">
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
            title="Open in Full YouTube Tab"
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
          {/* Search or Video URL Input */}
          <form onSubmit={handleSearchSubmit} className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Enter YouTube Link, Video ID, or Search..."
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
              <span>STREAM</span>
            </button>
          </form>

          {/* YouTube Video / Music Embed */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800 shadow-inner">
            <iframe
              key={currentVideoId}
              src={embedSrc}
              title="YouTube Cyber Player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>

          {/* Curated 1-Click Presets Bar */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center justify-between select-none">
              <span>Cyberpunk Audio Matrix</span>
              <span className="text-zinc-400">1-Click Direct Play</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {MUSIC_PRESETS.map((p) => {
                const isSelected = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p)}
                    className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all select-none ${
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
              {currentTitle}
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
