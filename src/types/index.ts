export type OrbTheme = 'ultron' | 'jarvis' | 'arc' | 'matrix' | 'void' | 'pink';

export interface ThemeColors {
  name: string;
  id: OrbTheme;
  bright: number;
  mid: number;
  dim: number;
  faint: number;
  hot: number;
  cssPrimary: string;
  cssSecondary: string;
  cssGlow: string;
  badge: string;
}

export type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'executing';

export interface MemoryItem {
  id: string;
  title: string;
  content: string;
  category: 'pattern' | 'error' | 'correction' | 'preference' | 'security' | 'workflow';
  hitCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  score?: number;
}

export interface SkillItem {
  id: string;
  name: string;
  description: string;
  category: string;
  commandPattern?: string;
  parameters?: Record<string, any>;
  enabled: boolean;
  isBuiltin: boolean;
}

export interface SoulPreset {
  id: string;
  name: string;
  category: string;
  emoji: string;
  description: string;
  vibe: string;
  systemPrompt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  imageUrl?: string;
  toolCall?: {
    name: string;
    args: any;
    result?: any;
    status: 'running' | 'success' | 'error';
  };
  recalledMemories?: string[];
}

export interface AppSettings {
  llmProvider: 'gemini' | 'openai' | 'claude' | 'deepseek' | 'groq' | 'ollama' | 'nvidia';
  apiKey: string;
  modelName: string;
  ollamaEndpoint: string;
  voiceEnabled: boolean;
  voiceSpeed: number;
  voicePitch: number;
  selectedVoice: string;
  theme: OrbTheme;
  globalHotkey: string;
  autoReadResponses: boolean;
  soundEffects: boolean;
}

export interface SystemTelemetry {
  cpuUsage: number;
  memoryUsage: number;
  batteryLevel: number;
  isCharging: boolean;
  latencyMs: number;
  platform: string;
  osVersion: string;
  activeWindow?: string;
}
