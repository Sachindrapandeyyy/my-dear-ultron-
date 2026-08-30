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
  Headphones,
  Compass,
  Disc,
} from 'lucide-react';
import { audioService } from '@/services/audioService';

interface YouTubeItem {
  id: string;
  title: string;
  channel: string;
  category: 'music' | 'hindi' | 'rock' | 'lofi' | 'phonk' | 'live' | 'epic';
  videoId: string;
  icon: string;
}

const SEARCH_DATABASE: Record<string, { title: string; channel: string; videoId: string }> = {
  'arijit': { title: 'Arijit Singh Mega Hits (Tum Hi Ho / Kesariya)', channel: 'Arijit Singh', videoId: 'dZ0fwJojhrs' },
  'arijit singh': { title: 'Arijit Singh Mega Hits (Tum Hi Ho / Kesariya)', channel: 'Arijit Singh', videoId: 'dZ0fwJojhrs' },
  'sidhu': { title: 'Sidhu Moose Wala - 295 / The Last Ride', channel: 'Sidhu Moose Wala', videoId: 'olV4sL43tE8' },
  'sidhu moose wala': { title: 'Sidhu Moose Wala - 295 / The Last Ride', channel: 'Sidhu Moose Wala', videoId: 'olV4sL43tE8' },
  'interstellar': { title: 'Hans Zimmer - Interstellar OST Live Suite', channel: 'Hans Zimmer Official', videoId: 'UDVtMYqUAyw' },
  'hans zimmer': { title: 'Hans Zimmer - Interstellar OST Live Suite', channel: 'Hans Zimmer Official', videoId: 'UDVtMYqUAyw' },
  'iron man': { title: 'AC/DC - Back in Black (Official)', channel: 'AC/DC', videoId: 'pAgnJDJN4VA' },
  'ac dc': { title: 'AC/DC - Back in Black (Official)', channel: 'AC/DC', videoId: 'pAgnJDJN4VA' },
  'back in black': { title: 'AC/DC - Back in Black (Official)', channel: 'AC/DC', videoId: 'pAgnJDJN4VA' },
  'lofi': { title: 'Lofi Girl - Relax / Study Beats Live', channel: 'Lofi Girl', videoId: 'jfKfPfyJRdk' },
  'lofi girl': { title: 'Lofi Girl - Relax / Study Beats Live', channel: 'Lofi Girl', videoId: 'jfKfPfyJRdk' },
  'phonk': { title: 'Kordhell - Murder In My Mind (Drift Phonk)', channel: 'Kordhell', videoId: 'w-sQRS-Mun8' },
  'believer': { title: 'Imagine Dragons - Believer (Official Music Video)', channel: 'Imagine Dragons', videoId: '7wtfhZwyrcc' },
  'imagine dragons': { title: 'Imagine Dragons - Believer (Official Music Video)', channel: 'Imagine Dragons', videoId: '7wtfhZwyrcc' },
  'alan walker': { title: 'Alan Walker - Faded (Official Video)', channel: 'Alan Walker', videoId: '60ItHLz5WEA' },
  'faded': { title: 'Alan Walker - Faded (Official Video)', channel: 'Alan Walker', videoId: '60ItHLz5WEA' },
  'coldplay': { title: 'Coldplay - Viva La Vida / Hymn for the Weekend', channel: 'Coldplay', videoId: 'dvgZkm1xWPE' },
  'taylor swift': { title: 'Taylor Swift - Cruel Summer / Anti-Hero', channel: 'Taylor Swift', videoId: 'ic8j13piAhQ' },
  'linkin park': { title: 'Linkin Park - In The End / Numb Live', channel: 'Linkin Park', videoId: 'eVTXPUF4Oz4' },
  'avengers': { title: 'The Avengers - Main Theme Suite', channel: 'Marvel Music', videoId: 'O-zpOMYRi0w' },
  'bollywood': { title: 'Bollywood Romantic Lofi Chill Hits', channel: 'T-Series / Chill', videoId: 'dZ0fwJojhrs' },
  'synthwave': { title: 'Lofi Cyberpunk & Synthwave Radio 24/7', channel: 'Lofi Geek Live', videoId: '4xDzrJKXOOY' },
};

const QUICK_MUSIC_SEARCH_PROMPTS = [
  'Arijit Singh Best Songs',
  'Hans Zimmer Interstellar OST',
  'AC/DC Back in Black Iron Man',
  'Lofi Girl Chill Coding Beats',
  'Drift Phonk Workout Mix',
  'Bollywood Romantic Hits',
  'Imagine Dragons Believer',
  'Alan Walker Faded Live',
  'Coldplay Viva La Vida',
  'Cyberpunk 2077 Radio Mix',
];

const YOUTUBE_CURATED_FEED: YouTubeItem[] = [
  {
    id: 'synthwave-radio',
    title: 'Lofi Cyberpunk & Synthwave Radio 24/7',
    channel: 'Lofi Geek Live',
    category: 'live',
    videoId: '4xDzrJKXOOY',
    icon: '🌃',
  },
  {
    id: 'hindi-chill',
    title: 'Arijit Singh & Bollywood Chill Lofi Hits',
    channel: 'Arijit Singh / T-Series',
    category: 'hindi',
    videoId: 'dZ0fwJojhrs',
    icon: '🇮🇳',
  },
  {
    id: 'lofi-girl',
    title: 'Lofi Girl - Relax / Study Beats Live',
    channel: 'Lofi Girl',
    category: 'lofi',
    videoId: 'jfKfPfyJRdk',
    icon: '☕',
  },
  {
    id: 'iron-man-rock',
    title: 'AC/DC - Back in Black (Iron Man Theme)',
    channel: 'AC/DC Official',
    category: 'rock',
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
    category: 'phonk',
    videoId: 'w-sQRS-Mun8',
    icon: '🏎️',
  },
  {
    id: 'believer-dragons',
    title: 'Imagine Dragons - Believer (Official)',
    channel: 'Imagine Dragons',
    category: 'rock',
    videoId: '7wtfhZwyrcc',
    icon: '🔥',
  },
  {
    id: 'alan-walker-faded',
    title: 'Alan Walker - Faded Live Concert',
    channel: 'Alan Walker',
    category: 'music',
    videoId: '60ItHLz5WEA',
    icon: '🎧',
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
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string | null>(null);
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

      handleDirectSearchAndPlay(rawQuery);
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
    setCurrentSearchQuery(null);
    setCurrentVideoId(item.videoId);
    setCurrentTitle(item.title);
    setCurrentChannel(item.channel);
    setUrlOrSearchInput(item.title);
  };

  // Direct In-App Search and Play - NEVER redirects to external tabs!
  const handleDirectSearchAndPlay = (query: string) => {
    const cleanQ = query.trim().toLowerCase();
    if (!cleanQ) return;

    // 1. Direct YouTube Video ID or URL
    const parsedId = parseYouTubeId(query);
    if (parsedId) {
      setCurrentSearchQuery(null);
      setCurrentVideoId(parsedId);
      setCurrentTitle(`Direct Stream (${parsedId})`);
      setCurrentChannel('YouTube Video');
      return;
    }

    // 2. In-App Direct Artist / Query Match
    for (const [key, val] of Object.entries(SEARCH_DATABASE)) {
      if (cleanQ.includes(key) || key.includes(cleanQ)) {
        setCurrentSearchQuery(null);
        setCurrentVideoId(val.videoId);
        setCurrentTitle(val.title);
        setCurrentChannel(val.channel);
        return;
      }
    }

    // 3. Fallback: Direct YouTube In-App Search Embed List
    setCurrentSearchQuery(query);
    setCurrentTitle(`Search: "${query}"`);
    setCurrentChannel('YouTube Search Results');
  };

  const handleSearchOrUrlSubmit = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = (customQuery || urlOrSearchInput).trim();
    if (!query) return;

    if (settings.soundEffects) audioService.playClickSound();
    handleDirectSearchAndPlay(query);
  };

  const openInFullYouTubeTab = () => {
    const url = currentSearchQuery
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(currentSearchQuery)}`
      : `https://www.youtube.com/watch?v=${currentVideoId}`;
    window.open(url, '_blank');
  };

  // Direct Embed URL: Search List or Direct Video ID
  const embedSrc = currentSearchQuery
    ? `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(currentSearchQuery)}&autoplay=1&enablejsapi=1`
    : `https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1`;

  const filteredFeed = YOUTUBE_CURATED_FEED.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory
  );

  return (
    <div
      className={`fixed z-40 transition-all duration-300 font-mono ${
        viewMode === 'fullscreen'
          ? 'inset-4 md:inset-8 w-auto h-auto'
          : viewMode === 'theater'
          ? 'bottom-16 right-4 md:right-8 w-[740px] max-w-[95vw] h-[540px] max-h-[85vh]'
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
            <Music className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-white">
                YOUTUBE MUSIC CYBER-DOCK
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
            onClick={openInFullYouTubeTab}
            title="Pop-out to Full Tab"
            className="p-1.5 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (viewMode === 'compact') setViewMode('theater');
              else if (viewMode === 'theater') setViewMode('fullscreen');
              else setViewMode('compact');
            }}
            title="Toggle View Mode"
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
        {/* Left Side: Video Player & Direct Search Bar */}
        <div className="flex-1 flex flex-col p-3 space-y-2.5 overflow-y-auto">
          {/* Universal In-App Search Bar */}
          <form onSubmit={handleSearchOrUrlSubmit} className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search any Song or Artist (Plays Directly In-Window)..."
                value={urlOrSearchInput}
                onChange={(e) => setUrlOrSearchInput(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>PLAY IN-APP</span>
            </button>
          </form>

          {/* Quick 1-Click Search Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
            <span className="text-[10px] text-zinc-500 flex items-center gap-1 shrink-0">
              <Flame className="w-3 h-3 text-red-500" />
              POPULAR:
            </span>
            {QUICK_MUSIC_SEARCH_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => {
                  setUrlOrSearchInput(prompt);
                  handleSearchOrUrlSubmit(undefined, prompt);
                }}
                className="px-2.5 py-0.5 rounded-full bg-zinc-900/80 border border-zinc-800 hover:border-red-500 text-[10px] text-zinc-300 hover:text-white whitespace-nowrap transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* In-App YouTube Player (Never redirects to external tab) */}
          <div className="relative w-full flex-1 min-h-[220px] rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl">
            <iframe
              key={embedSrc}
              src={embedSrc}
              title="YouTube In-App Cyber Player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0 absolute inset-0"
            />
          </div>
        </div>

        {/* Right Side: Curated Music Feed Tray */}
        {viewMode !== 'compact' && (
          <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-zinc-800/80 p-3 bg-zinc-950/60 flex flex-col space-y-2.5 overflow-y-auto">
            <div className="flex items-center justify-between select-none">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                <Disc className="w-3.5 h-3.5 text-red-500 animate-spin" />
                <span>IN-APP PLAYLIST</span>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase">1-Click Play</span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none select-none">
              {[
                { id: 'all', label: 'All' },
                { id: 'hindi', label: '🇮🇳 Hindi' },
                { id: 'rock', label: '⚡ Rock' },
                { id: 'lofi', label: '☕ Lofi' },
                { id: 'epic', label: '🌌 Epic' },
                { id: 'phonk', label: '🏎️ Phonk' },
                { id: 'live', label: '🔴 Live' },
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
                const isActive = currentVideoId === item.videoId && !currentSearchQuery;
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
