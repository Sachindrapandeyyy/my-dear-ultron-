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
  Film,
  Tv,
  Layers,
  Flame,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { audioService } from '@/services/audioService';

interface YouTubeItem {
  id: string;
  title: string;
  channel: string;
  category: 'music' | 'tech' | 'live' | 'epic';
  videoId: string;
  icon: string;
}

const YOUTUBE_CURATED_FEED: YouTubeItem[] = [
  // 1. Music & Soundtracks
  {
    id: 'synthwave-radio',
    title: 'Lofi Cyberpunk & Synthwave Radio 24/7',
    channel: 'Lofi Geek Live',
    category: 'live',
    videoId: '4xDzrJKXOOY',
    icon: '🌃',
  },
  {
    id: 'lofi-girl',
    title: 'Lofi Girl - Relax / Study Beats Live',
    channel: 'Lofi Girl',
    category: 'live',
    videoId: 'jfKfPfyJRdk',
    icon: '☕',
  },
  {
    id: 'iss-earth',
    title: 'NASA ISS Live Earth from Space Camera',
    channel: 'NASA Stream',
    category: 'live',
    videoId: 'xRPjKOmdsRA',
    icon: '🌍',
  },
  {
    id: 'iron-man-rock',
    title: 'AC/DC - Back in Black (Iron Man Theme)',
    channel: 'AC/DC Official',
    category: 'music',
    videoId: 'pAgnJDJN4VA',
    icon: '⚡',
  },
  {
    id: 'interstellar-suite',
    title: 'Hans Zimmer - Interstellar OST Live Suite',
    channel: 'Hans Zimmer Official',
    category: 'epic',
    videoId: 'UDVtMYqUAyw',
    icon: '🌌',
  },
  {
    id: 'avengers-theme',
    title: 'The Avengers - Main Theme Suite',
    channel: 'Marvel Music',
    category: 'epic',
    videoId: 'O-zpOMYRi0w',
    icon: '🦸',
  },
  {
    id: 'phonk-murder',
    title: 'Kordhell - Murder In My Mind (Drift Phonk)',
    channel: 'Kordhell',
    category: 'music',
    videoId: 'w-sQRS-Mun8',
    icon: '🏎️',
  },
  {
    id: 'fireship-tech',
    title: 'Fireship - 100+ Computer Science Concepts',
    channel: 'Fireship',
    category: 'tech',
    videoId: 'vLnPwxZdW4Y',
    icon: '💻',
  },
];

// Helper to extract YouTube Video ID from any input or URL
function parseYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  const embedMatch = trimmed.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  const shortsMatch = trimmed.match(/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  return null;
}

export const YouTubeCyberPlayer: React.FC = () => {
  const { theme, settings } = useAppStore();
  const themeConfig = ORB_THEMES[theme];

  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'compact' | 'theater' | 'fullscreen'>('theater');
  const [currentVideoId, setCurrentVideoId] = useState('4xDzrJKXOOY');
  const [currentTitle, setCurrentTitle] = useState('Lofi Cyberpunk & Synthwave Radio 24/7');
  const [currentChannel, setCurrentChannel] = useState('Lofi Geek Live');
  const [urlOrSearchInput, setUrlOrSearchInput] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Listen for voice action triggers
  useEffect(() => {
    const handleVoicePlay = (e: any) => {
      const rawQuery = (e.detail?.query || '').trim().toLowerCase();
      setIsOpen(true);

      if (settings.soundEffects) audioService.playSuccessChime();

      // Find best match in curated feed
      const matched = YOUTUBE_CURATED_FEED.find((item) =>
        item.title.toLowerCase().includes(rawQuery) ||
        item.channel.toLowerCase().includes(rawQuery) ||
        rawQuery.includes(item.id)
      );

      if (matched) {
        handlePlayVideo(matched);
      } else {
        const parsed = parseYouTubeId(rawQuery);
        if (parsed) {
          setCurrentVideoId(parsed);
          setCurrentTitle(`YouTube Stream (${parsed})`);
          setCurrentChannel('Custom Stream');
        } else {
          // Open direct YouTube Search
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

  const handlePlayVideo = (item: YouTubeItem) => {
    if (settings.soundEffects) audioService.playClickSound();
    setCurrentVideoId(item.videoId);
    setCurrentTitle(item.title);
    setCurrentChannel(item.channel);
    setUrlOrSearchInput(`https://www.youtube.com/watch?v=${item.videoId}`);
  };

  const handleSearchOrUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlOrSearchInput.trim()) return;
    if (settings.soundEffects) audioService.playClickSound();

    const parsedId = parseYouTubeId(urlOrSearchInput);
    if (parsedId) {
      setCurrentVideoId(parsedId);
      setCurrentTitle(`YouTube Stream (${parsedId})`);
      setCurrentChannel('Direct Link');
    } else {
      // General search: opens full search in a new window
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(urlOrSearchInput.trim())}`;
      window.open(searchUrl, '_blank');
    }
  };

  const openInFullYouTubeTab = () => {
    window.open(`https://www.youtube.com/watch?v=${currentVideoId}`, '_blank');
  };

  const openYouTubeHome = () => {
    window.open('https://www.youtube.com', '_blank');
  };

  const embedSrc = `https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1`;

  const filteredFeed = YOUTUBE_CURATED_FEED.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory
  );

  return (
    <div
      className={`fixed z-40 transition-all duration-300 font-mono ${
        viewMode === 'fullscreen'
          ? 'inset-4 md:inset-8 w-auto h-auto'
          : viewMode === 'theater'
          ? 'bottom-16 right-4 md:right-8 w-[720px] max-w-[95vw] h-[520px] max-h-[85vh]'
          : 'bottom-16 right-4 w-[380px] max-w-[92vw] h-auto'
      } rounded-3xl bg-zinc-950/95 border-2 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col`}
      style={{
        borderColor: themeConfig.cssPrimary,
        boxShadow: `0 0 40px ${themeConfig.cssGlow}`,
      }}
    >
      {/* Top Holographic Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 select-none">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-red-600/20 border border-red-500/60 flex items-center justify-center">
            <Film className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-white">
                YOUTUBE CYBER-HUB
              </span>
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            </div>
            <span className="text-[10px] text-zinc-400 truncate max-w-xs block font-bold">
              {currentChannel} • {currentTitle}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 text-zinc-400">
          <button
            onClick={openYouTubeHome}
            title="Open YouTube.com Main Portal"
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 font-bold flex items-center gap-1 transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">YOUTUBE.COM</span>
          </button>

          <button
            onClick={openInFullYouTubeTab}
            title="Open Current Video in Tab"
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
          >
            <Tv className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (viewMode === 'compact') setViewMode('theater');
              else if (viewMode === 'theater') setViewMode('fullscreen');
              else setViewMode('compact');
            }}
            title="Cycle View Size (Compact / Theater / Fullscreen)"
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
          >
            {viewMode === 'fullscreen' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsOpen(false)}
            title="Close Player"
            className="p-1.5 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Video Player & Address Bar */}
        <div className="flex-1 flex flex-col p-3 space-y-3 overflow-y-auto">
          {/* Universal Address & Search Bar */}
          <form onSubmit={handleSearchOrUrlSubmit} className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Paste ANY YouTube Link (watch?v=, youtu.be, shorts) or search..."
                value={urlOrSearchInput}
                onChange={(e) => setUrlOrSearchInput(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all shadow-md"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>LOAD</span>
            </button>
          </form>

          {/* Full Embedded YouTube Player */}
          <div className="relative w-full flex-1 min-h-[220px] rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl">
            <iframe
              key={currentVideoId}
              src={embedSrc}
              title="YouTube Cyber Hub"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0 absolute inset-0"
            />
          </div>
        </div>

        {/* Right Side: Curated Cyber Feed (Hidden in compact mode) */}
        {viewMode !== 'compact' && (
          <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-zinc-800/80 p-3 bg-zinc-950/60 flex flex-col space-y-2.5 overflow-y-auto">
            <div className="flex items-center justify-between select-none">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>CYBER FEED</span>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase">1-Click Play</span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none select-none">
              {[
                { id: 'all', label: 'All' },
                { id: 'live', label: '🔴 Live' },
                { id: 'music', label: '🎵 Music' },
                { id: 'epic', label: '🌌 Epic' },
                { id: 'tech', label: '💻 Tech' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all whitespace-nowrap ${
                    activeCategory === cat.id
                      ? 'bg-zinc-800 text-white border-red-500'
                      : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Video List */}
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {filteredFeed.map((item) => {
                const isActive = currentVideoId === item.videoId;
                return (
                  <button
                    key={item.id}
                    onClick={() => handlePlayVideo(item)}
                    className={`w-full p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all select-none ${
                      isActive
                        ? 'bg-zinc-800/90 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                        : 'bg-zinc-900/50 text-zinc-400 border-zinc-800/80 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div className="truncate flex-1">
                      <div className="text-[11px] font-bold truncate text-white leading-tight">
                        {item.title}
                      </div>
                      <div className="text-[9px] text-zinc-400 truncate mt-0.5">{item.channel}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
