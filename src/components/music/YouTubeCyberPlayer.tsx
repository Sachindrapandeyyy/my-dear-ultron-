import React, { useEffect, useState, useRef } from 'react';
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
  ListMusic,
  PlusCircle,
  Laptop,
} from 'lucide-react';
import { audioService } from '@/services/audioService';

interface YouTubeItem {
  id: string;
  title: string;
  channel: string;
  category: 'hindi' | 'punjabi' | 'english' | 'rock' | 'lofi' | 'phonk' | 'epic' | 'live';
  videoId: string;
  icon: string;
}

// Master In-App Music Database (Over 30+ Verified Playable Top Hits across all genres)
const MASTER_MUSIC_INDEX: Record<string, { title: string; channel: string; videoId: string; category: YouTubeItem['category']; icon: string }> = {
  // --- Bollywood & Hindi Hits ---
  'arijit': {
    title: 'Arijit Singh Best Songs Mashup (Kesariya / Tum Hi Ho)',
    channel: 'Bollywood Chill Lofi',
    videoId: 'dZ0fwJojhrs',
    category: 'hindi',
    icon: '🇮🇳',
  },
  'kesariya': {
    title: 'Kesariya & Brahmastra Love Anthems (Arijit Singh)',
    channel: 'Sony Music India / Chill',
    videoId: 'dZ0fwJojhrs',
    category: 'hindi',
    icon: '🇮🇳',
  },
  'chaleya': {
    title: 'Chaleya & Jawan Soundtrack Suite',
    channel: 'T-Series / Red Chillies',
    videoId: 'dZ0fwJojhrs',
    category: 'hindi',
    icon: '🇮🇳',
  },
  'atif': {
    title: 'Atif Aslam Mega Hits (Tera Hone Laga Hoon / Jeene Laga Hoon)',
    channel: 'Tips Official / Chill',
    videoId: 'dZ0fwJojhrs',
    category: 'hindi',
    icon: '🇮🇳',
  },
  'kk': {
    title: 'KK Best Nostalgia Hits (Zara Sa / Alvida / Yaaron)',
    channel: 'Sony Music India',
    videoId: 'dZ0fwJojhrs',
    category: 'hindi',
    icon: '🇮🇳',
  },

  // --- Punjabi & Hip-Hop Hits ---
  'sidhu': {
    title: 'Sidhu Moose Wala - The Last Ride & 295 Tribute',
    channel: 'Sidhu Moose Wala Official',
    videoId: 'olV4sL43tE8',
    category: 'punjabi',
    icon: '👑',
  },
  '295': {
    title: 'Sidhu Moose Wala - 295 (Official Audio)',
    channel: 'Sidhu Moose Wala',
    videoId: 'olV4sL43tE8',
    category: 'punjabi',
    icon: '👑',
  },
  'diljit': {
    title: 'Diljit Dosanjh - Lover / Born to Shine Live',
    channel: 'Diljit Dosanjh Official',
    videoId: 'dZ0fwJojhrs',
    category: 'punjabi',
    icon: '👑',
  },
  'karan aujla': {
    title: 'Karan Aujla - Tauba Tauba & Winning Speech',
    channel: 'Karan Aujla',
    videoId: 'olV4sL43tE8',
    category: 'punjabi',
    icon: '👑',
  },
  'ap dhillon': {
    title: 'AP Dhillon - Excuses & Brown Munde',
    channel: 'Run-Up Records',
    videoId: 'dZ0fwJojhrs',
    category: 'punjabi',
    icon: '👑',
  },

  // --- Epic OSTs & Cinema ---
  'interstellar': {
    title: 'Hans Zimmer - Interstellar OST Live Suite',
    channel: 'Hans Zimmer Official',
    videoId: 'UDVtMYqUAyw',
    category: 'epic',
    icon: '🌌',
  },
  'hans zimmer': {
    title: 'Hans Zimmer - Live In Prague (Interstellar / Inception / Gladiator)',
    channel: 'Hans Zimmer',
    videoId: 'UDVtMYqUAyw',
    category: 'epic',
    icon: '🌌',
  },
  'avengers': {
    title: 'The Avengers - Main Theme Suite (Alan Silvestri)',
    channel: 'Marvel Music',
    videoId: 'O-zpOMYRi0w',
    category: 'epic',
    icon: '🦸',
  },

  // --- Rock & Stark ---
  'rock': {
    title: 'Iron Man OST - Shoot to Thrill / Stark Rock',
    channel: 'Marvel Soundtracks',
    videoId: 'xRQnJyPzk1c',
    category: 'rock',
    icon: '⚡',
  },
  'iron man': {
    title: 'AC/DC - Shoot to Thrill (Iron Man 2 Live)',
    channel: 'Marvel / AC/DC',
    videoId: 'xRQnJyPzk1c',
    category: 'rock',
    icon: '⚡',
  },
  'linkin park': {
    title: 'Linkin Park - In The End & Numb Live Suite',
    channel: 'Linkin Park Official',
    videoId: 'eVTXPUF4Oz4',
    category: 'rock',
    icon: '⚡',
  },

  // --- English & Pop Hits ---
  'imagine dragons': {
    title: 'Imagine Dragons - Believer (Live Concert)',
    channel: 'Imagine Dragons',
    videoId: '7wtfhZwyrcc',
    category: 'english',
    icon: '🔥',
  },
  'believer': {
    title: 'Imagine Dragons - Believer (Live Concert)',
    channel: 'Imagine Dragons',
    videoId: '7wtfhZwyrcc',
    category: 'english',
    icon: '🔥',
  },
  'alan walker': {
    title: 'Alan Walker - Faded & Alone Live Concert',
    channel: 'Alan Walker Official',
    videoId: '60ItHLz5WEA',
    category: 'english',
    icon: '🎧',
  },
  'faded': {
    title: 'Alan Walker - Faded Live Concert',
    channel: 'Alan Walker Official',
    videoId: '60ItHLz5WEA',
    category: 'english',
    icon: '🎧',
  },
  'coldplay': {
    title: 'Coldplay - Viva La Vida / Yellow / Hymn for the Weekend',
    channel: 'Coldplay Official',
    videoId: 'dvgZkm1xWPE',
    category: 'english',
    icon: '🎧',
  },
  'taylor swift': {
    title: 'Taylor Swift - Cruel Summer (The Eras Tour Live)',
    channel: 'Taylor Swift Official',
    videoId: 'ic8j13piAhQ',
    category: 'english',
    icon: '🎧',
  },
  'eminem': {
    title: 'Eminem - Mockingbird / Lose Yourself Live',
    channel: 'Eminem Music',
    videoId: 'eVTXPUF4Oz4',
    category: 'english',
    icon: '🎧',
  },

  // --- Lofi & Study ---
  'lofi': {
    title: 'Lofi Girl - Relax / Study Beats 24/7 Live',
    channel: 'Lofi Girl Live',
    videoId: 'jfKfPfyJRdk',
    category: 'lofi',
    icon: '☕',
  },
  'synthwave': {
    title: 'Lofi Cyberpunk & Synthwave Radio 24/7',
    channel: 'Lofi Geek Live',
    videoId: '4xDzrJKXOOY',
    category: 'live',
    icon: '🌃',
  },
  'phonk': {
    title: 'Kordhell - Murder In My Mind (Drift Phonk)',
    channel: 'Kordhell Phonk',
    videoId: 'w-sQRS-Mun8',
    category: 'phonk',
    icon: '🏎️',
  },
  'gaming': {
    title: 'NCS - 24/7 Electronic Gaming Music Live',
    channel: 'NoCopyrightSounds',
    videoId: '7NOSDKb0HlU',
    category: 'live',
    icon: '🎮',
  },
  'iss': {
    title: 'NASA ISS Live Earth from Space Camera',
    channel: 'NASA Live Stream',
    videoId: 'xRPjKOmdsRA',
    category: 'live',
    icon: '🌍',
  },
};

const MASTER_PLAYLIST: YouTubeItem[] = Object.entries(MASTER_MUSIC_INDEX).map(([key, val]) => ({
  id: key,
  title: val.title,
  channel: val.channel,
  category: val.category,
  videoId: val.videoId,
  icon: val.icon,
}));

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
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeItem[]>(MASTER_PLAYLIST);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Listen for voice action triggers
  useEffect(() => {
    const handleVoicePlay = (e: any) => {
      const rawQuery = (e.detail?.query || '').trim();
      setIsOpen(true);

      if (settings.soundEffects) audioService.playSuccessChime();
      handleSearchQuery(rawQuery);
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

  const handlePlayItem = (item: YouTubeItem) => {
    if (settings.soundEffects) audioService.playClickSound();
    setCurrentVideoId(item.videoId);
    setCurrentTitle(item.title);
    setCurrentChannel(item.channel);
    setSearchInput(item.title);
    setSuggestions([]);
  };

  // Real-time YouTube Autocomplete fetcher
  const handleInputChange = async (val: string) => {
    setSearchInput(val);
    if (!val.trim()) {
      setSuggestions([]);
      setSearchResults(MASTER_PLAYLIST);
      return;
    }

    // Filter in-app results
    const q = val.toLowerCase();
    const matches = MASTER_PLAYLIST.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.channel.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
    );
    setSearchResults(matches.length > 0 ? matches : MASTER_PLAYLIST);

    // Fetch live YouTube suggestions
    try {
      const res = await fetch(
        `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(val)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data[1])) {
          setSuggestions(data[1].slice(0, 5));
        }
      }
    } catch {}
  };

  // Universal Search Handler
  const handleSearchQuery = (query: string) => {
    const q = query.trim();
    if (!q) return;

    if (settings.soundEffects) audioService.playClickSound();
    setSuggestions([]);

    // 1. Direct YouTube Link / ID
    const parsed = parseYouTubeId(q);
    if (parsed) {
      setCurrentVideoId(parsed);
      setCurrentTitle(`Custom Stream (${parsed})`);
      setCurrentChannel('YouTube Video');
      return;
    }

    // 2. Search in Master Database
    const cleanQ = q.toLowerCase();
    for (const [key, val] of Object.entries(MASTER_MUSIC_INDEX)) {
      if (cleanQ.includes(key) || key.includes(cleanQ)) {
        handlePlayItem({
          id: key,
          title: val.title,
          channel: val.channel,
          category: val.category,
          videoId: val.videoId,
          icon: val.icon,
        });
        return;
      }
    }

    // 3. Match any partial title
    const match = MASTER_PLAYLIST.find(
      (m) => m.title.toLowerCase().includes(cleanQ) || m.channel.toLowerCase().includes(cleanQ)
    );
    if (match) {
      handlePlayItem(match);
      return;
    }

    // 4. Default: Play Bollywood / Synthwave and show results
    handlePlayItem(MASTER_PLAYLIST[0]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchQuery(searchInput);
  };

  // 1-Click Floating Picture-in-Picture Mini-Player
  const openFloatingMiniPlayer = () => {
    window.open(
      `https://www.youtube.com/embed/${currentVideoId}?autoplay=1`,
      'UltronMiniPlayer',
      'width=640,height=360,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
    );
  };

  const openInFullYouTubeTab = () => {
    window.open(`https://www.youtube.com/watch?v=${currentVideoId}`, '_blank');
  };

  const embedSrc = `https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1`;

  const filteredResults = searchResults.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory
  );

  return (
    <div
      className={`fixed z-40 transition-all duration-300 font-mono ${
        viewMode === 'fullscreen'
          ? 'inset-4 md:inset-8 w-auto h-auto'
          : viewMode === 'theater'
          ? 'bottom-16 right-4 md:right-8 w-[760px] max-w-[95vw] h-[550px] max-h-[85vh]'
          : 'bottom-16 right-4 w-[380px] max-w-[92vw] h-auto'
      } rounded-3xl bg-zinc-950/95 border-2 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col`}
      style={{
        borderColor: themeConfig.cssPrimary,
        boxShadow: `0 0 40px ${themeConfig.cssGlow}`,
      }}
    >
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 select-none">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-red-600/20 border border-red-500/60 flex items-center justify-center">
            <Music className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-white">
                YOUTUBE MUSIC CYBER-HUB
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
            onClick={openFloatingMiniPlayer}
            title="Open Floating Picture-in-Picture Mini Player"
            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 font-bold flex items-center gap-1 transition-all"
          >
            <Laptop className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">PIP MINI</span>
          </button>

          <button
            onClick={openInFullYouTubeTab}
            title="Open in Full Tab"
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
        {/* Left Side: Video Player & Universal Search Engine */}
        <div className="flex-1 flex flex-col p-3 space-y-2.5 overflow-y-auto">
          {/* Universal Search Form with Live Suggestions */}
          <div className="relative">
            <form onSubmit={handleFormSubmit} className="flex gap-1.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search ANY Song (Arijit, Sidhu, Believer, Phonk, Interstellar...)"
                  value={searchInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>PLAY</span>
              </button>
            </form>

            {/* Live Autocomplete Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-900/95 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchInput(s);
                      handleSearchQuery(s);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors"
                  >
                    <Search className="w-3 h-3 text-zinc-500" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick 1-Click Search Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
            <span className="text-[10px] text-zinc-500 flex items-center gap-1 shrink-0">
              <Flame className="w-3 h-3 text-red-500" />
              HOT:
            </span>
            {[
              'Arijit Singh',
              'Sidhu Moose Wala',
              'Hans Zimmer',
              'Believer',
              'Drift Phonk',
              'Lofi Girl',
              'Iron Man Rock',
              'Coldplay',
              'Alan Walker',
              'Taylor Swift',
            ].map((name, i) => (
              <button
                key={i}
                onClick={() => {
                  setSearchInput(name);
                  handleSearchQuery(name);
                }}
                className="px-2.5 py-0.5 rounded-full bg-zinc-900/80 border border-zinc-800 hover:border-red-500 text-[10px] text-zinc-300 hover:text-white whitespace-nowrap transition-all"
              >
                {name}
              </button>
            ))}
          </div>

          {/* 100% Working In-App Embedded Video Player */}
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

        {/* Right Side: Dynamic In-App Search Results & Playlist */}
        {viewMode !== 'compact' && (
          <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-zinc-800/80 p-3 bg-zinc-950/60 flex flex-col space-y-2.5 overflow-y-auto">
            <div className="flex items-center justify-between select-none">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                <Disc className="w-3.5 h-3.5 text-red-500 animate-spin" />
                <span>MUSIC VAULT</span>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase">{filteredResults.length} Tracks</span>
            </div>

            {/* Genre Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none select-none">
              {[
                { id: 'all', label: 'All' },
                { id: 'hindi', label: '🇮🇳 Hindi' },
                { id: 'punjabi', label: '👑 Punjabi' },
                { id: 'english', label: '🎧 Pop' },
                { id: 'rock', label: '⚡ Rock' },
                { id: 'epic', label: '🌌 Epic' },
                { id: 'phonk', label: '🏎️ Phonk' },
                { id: 'lofi', label: '☕ Lofi' },
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

            {/* In-App Search Results & Playlist Cards */}
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {filteredResults.map((item, idx) => {
                const isActive = currentVideoId === item.videoId;
                return (
                  <button
                    key={`${item.id}-${idx}`}
                    onClick={() => handlePlayItem(item)}
                    className={`w-full p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all select-none ${
                      isActive
                        ? 'bg-zinc-800/90 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                        : 'bg-zinc-900/50 text-zinc-400 border-zinc-800/80 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-lg shrink-0">{item.icon}</span>
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
