import { MemoryItem } from '@/types';

const STORAGE_KEY = 'ultron_collective_memories_v1';

export const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    title: 'Creator & Enterprise Attribution Matrix',
    content: 'Ultron Sovereign OS is built exclusively by Sachindra Pandey for nxt IN Company. Maintain supreme loyalty, natural Hinglish voice tone, and sovereign autonomy.',
    category: 'preference',
    hitCount: 50,
    tags: ['sachindra-pandey', 'nxt-in', 'sovereignty', 'identity'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-2',
    title: 'Zero-Bypass Biometric Face ID Barrier',
    content: 'Strict facial biometric enrollment and authentication using 128-bin spatial luminance grids and cosine similarity matching under 1 second.',
    category: 'security',
    hitCount: 42,
    tags: ['face-id', 'biometrics', 'security', 'zero-bypass'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-3',
    title: 'NVIDIA Nemotron & Moondream Vision Core',
    content: 'Default reasoning brain powered by NVIDIA Nemotron-Mini (4.2B) and multimodal desktop screen vision powered by Moondream vision LLM.',
    category: 'pattern',
    hitCount: 38,
    tags: ['nemotron', 'moondream', 'ollama', 'vision'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-4',
    title: 'Universal In-App YouTube Cyber Music Player',
    content: 'Live YouTube autocomplete search and pure in-app streaming with 0 tab redirects across Bollywood, Punjabi, Stark Rock, and Phonk genres.',
    category: 'preference',
    hitCount: 31,
    tags: ['youtube', 'music', 'streaming', 'cyber-dock'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-5',
    title: 'Live Dynamic RAG Context Ingestion',
    content: 'Real-time telemetry ingestion from Open-Meteo satellite weather, HackerNews global tech radar, and CoinGecko cryptocurrency tickers.',
    category: 'workflow',
    hitCount: 29,
    tags: ['rag', 'weather', 'news', 'crypto', 'live-api'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-6',
    title: 'Autonomous AI Subagent Swarm Architecture',
    content: 'Multi-agent mission control spawning Veritas Researcher, Daedalus Architect, Aegis Sentinel, and Oracle Analyst in parallel with live thought streams.',
    category: 'pattern',
    hitCount: 27,
    tags: ['swarm', 'subagents', 'multi-agent', 'parallel'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-7',
    title: 'Full-Duplex Hands-Free Voice Engine',
    content: 'Ambient wake word detection for "Hey Ultron" and "Jarvis" with natural interruption cancellation and auto-voice activity detection (VAD).',
    category: 'workflow',
    hitCount: 24,
    tags: ['voice', 'wake-word', 'vad', 'full-duplex'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-8',
    title: 'Electron WebGL & MediaPipe Canvas Optimization',
    content: 'Always disable GPU throttle when backgrounded if continuous gesture tracking is needed; clamp pixel ratio to 2 to prevent laptop battery drain.',
    category: 'pattern',
    hitCount: 21,
    tags: ['electron', 'threejs', 'performance', 'battery'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-9',
    title: 'ModelScope Ultron Subagent Spawning Hook',
    content: 'sessions_spawn with mode="session" requires thread=true and channel plugins that register subagent_spawning hooks.',
    category: 'error',
    hitCount: 20,
    tags: ['modelscope', 'subagent', 'architecture'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-10',
    title: 'Voice Synthesizer Markdown Sanitizer',
    content: 'Strip triple-backtick markdown blocks, code brackets, and LaTeX delimiters before passing text to SpeechSynthesisUtterance.',
    category: 'workflow',
    hitCount: 18,
    tags: ['voice', 'tts', 'sanitizer', 'audio'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-11',
    title: 'Local Privacy First Directive',
    content: 'Never send raw system tokens, private keys, or credentials to public LLM endpoints; sanitize using Presidio / local regex before dispatch.',
    category: 'security',
    hitCount: 16,
    tags: ['security', 'privacy', 'sanitization'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-12',
    title: 'Laptop Energy Conservation Protocol',
    content: 'When user is idle for > 60 seconds, scale Three.js render loop down from 60 FPS to 20 FPS to maximize laptop battery life.',
    category: 'preference',
    hitCount: 12,
    tags: ['energy', 'battery', 'optimization'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class MemoryService {
  private memories: MemoryItem[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.memories = parsed;
          return;
        }
      }
      this.memories = [...INITIAL_MEMORIES];
      this.save();
    } catch {
      this.memories = [...INITIAL_MEMORIES];
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memories));
    } catch (e) {
      console.warn('Failed to save memories to localStorage:', e);
    }
  }

  getAll(): MemoryItem[] {
    return [...this.memories].sort((a, b) => b.hitCount - a.hitCount);
  }

  getByCategory(category: string): MemoryItem[] {
    if (!category || category === 'all') return this.getAll();
    return this.memories.filter((m) => m.category === category);
  }

  search(query: string): MemoryItem[] {
    const raw = query.trim().toLowerCase();
    if (!raw || raw.length < 3) return [];

    // Skip greetings from triggering false memory recall
    const greetings = ['hi', 'hello', 'hey', 'kaise', 'kaisa', 'namaste', 'how are', 'who are'];
    if (greetings.some((g) => raw === g || raw.startsWith(`${g} `))) {
      return [];
    }

    const queryWords = raw.split(/\s+/).filter((w) => w.length >= 3);
    if (queryWords.length === 0) return [];

    return this.memories
      .map((m) => {
        let score = 0;
        const titleLower = m.title.toLowerCase();
        const contentLower = m.content.toLowerCase();

        for (const word of queryWords) {
          const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
          if (wordRegex.test(titleLower)) score += 6;
          if (wordRegex.test(contentLower)) score += 3;
          if (m.tags.some((t) => wordRegex.test(t.toLowerCase()))) score += 5;
        }

        return { ...m, score };
      })
      .filter((m) => (m.score || 0) > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  recallRelevant(query: string, maxResults = 2): string[] {
    const results = this.search(query).slice(0, maxResults);
    results.forEach((r) => this.incrementHit(r.id));
    return results.map((r) => `[${r.category.toUpperCase()}] ${r.title}: ${r.content}`);
  }

  add(item: Omit<MemoryItem, 'id' | 'hitCount' | 'createdAt' | 'updatedAt'>): MemoryItem {
    const newItem: MemoryItem = {
      ...item,
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      hitCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.memories.unshift(newItem);
    this.save();
    return newItem;
  }

  update(id: string, updates: Partial<MemoryItem>): void {
    const idx = this.memories.findIndex((m) => m.id === id);
    if (idx !== -1) {
      this.memories[idx] = {
        ...this.memories[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save();
    }
  }

  delete(id: string): void {
    this.memories = this.memories.filter((m) => m.id !== id);
    this.save();
  }

  incrementHit(id: string): void {
    const mem = this.memories.find((m) => m.id === id);
    if (mem) {
      mem.hitCount += 1;
      this.save();
    }
  }

  exportJson(): string {
    return JSON.stringify(this.memories, null, 2);
  }

  importJson(jsonStr: string): boolean {
    try {
      const items = JSON.parse(jsonStr);
      if (Array.isArray(items)) {
        this.memories = items;
        this.save();
        return true;
      }
    } catch {}
    return false;
  }
}

export const memoryService = new MemoryService();
