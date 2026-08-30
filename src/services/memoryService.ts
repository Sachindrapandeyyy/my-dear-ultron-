import { MemoryItem } from '@/types';

const STORAGE_KEY = 'ultron_collective_memories_v1';

const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    title: 'Electron WebGL & MediaPipe Canvas Optimization',
    content: 'Always disable GPU throttle when backgrounded if continuous gesture tracking is needed; clamp pixel ratio to 2 to prevent laptop battery drain.',
    category: 'pattern',
    hitCount: 14,
    tags: ['electron', 'threejs', 'performance', 'battery'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-2',
    title: 'ModelScope Ultron Subagent Spawning Hook',
    content: 'sessions_spawn with mode="session" requires thread=true and channel plugins that register subagent_spawning hooks.',
    category: 'error',
    hitCount: 28,
    tags: ['modelscope', 'subagent', 'architecture'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-3',
    title: 'Voice Synthesizer Markdown Sanitizer',
    content: 'Strip triple-backtick markdown blocks and special asterisks before passing text to SpeechSynthesisUtterance to avoid noisy vocal glitches.',
    category: 'workflow',
    hitCount: 19,
    tags: ['voice', 'tts', 'audio'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-4',
    title: 'Local Privacy First Rule',
    content: 'Never send raw system tokens, private keys, or credentials to public LLM endpoints; sanitize using Presidio / local regex before dispatch.',
    category: 'security',
    hitCount: 35,
    tags: ['security', 'privacy', 'sanitization'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mem-5',
    title: 'Laptop Energy Conservation Protocol',
    content: 'When user is idle for > 60 seconds, scale Three.js render loop down from 60 FPS to 20 FPS to maximize laptop battery life.',
    category: 'preference',
    hitCount: 9,
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
        this.memories = JSON.parse(data);
      } else {
        this.memories = [...INITIAL_MEMORIES];
        this.save();
      }
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
    if (!query.trim()) return this.getAll();
    const q = query.toLowerCase();
    return this.memories
      .map((m) => {
        let score = 0;
        if (m.title.toLowerCase().includes(q)) score += 5;
        if (m.content.toLowerCase().includes(q)) score += 3;
        if (m.tags.some((t) => t.toLowerCase().includes(q))) score += 4;
        return { ...m, score };
      })
      .filter((m) => (m.score || 0) > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  recallRelevant(query: string, maxResults = 3): string[] {
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
