import { create } from 'zustand';
import {
  OrbTheme,
  AgentState,
  SoulPreset,
  MemoryItem,
  SkillItem,
  ChatMessage,
  AppSettings,
  SystemTelemetry,
} from '@/types';
import { CORE_SOUL_PRESETS } from '@/services/soulService';
import { memoryService } from '@/services/memoryService';
import { BUILTIN_SKILLS, osService } from '@/services/osService';

export type ActiveTab = 'orb' | 'chat' | 'terminal' | 'memory' | 'skills' | 'harness' | 'settings';

interface AppState {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  theme: OrbTheme;
  setTheme: (theme: OrbTheme) => void;

  agentState: AgentState;
  setAgentState: (state: AgentState) => void;

  activeSoul: SoulPreset;
  setActiveSoul: (soul: SoulPreset) => void;

  cameraState: 'off' | 'starting' | 'on' | 'error';
  setCameraState: (state: 'off' | 'starting' | 'on' | 'error') => void;

  gestureStatus: { hands: number; mode: 'idle' | 'spin' | 'zoom' };
  setGestureStatus: (status: { hands: number; mode: 'idle' | 'spin' | 'zoom' }) => void;

  audioLevel: number;
  bassLevel: number;
  setAudioLevels: (level: number, bassLevel: number) => void;

  isVoiceListening: boolean;
  setIsVoiceListening: (listening: boolean) => void;

  isVoiceSpeaking: boolean;
  setIsVoiceSpeaking: (speaking: boolean) => void;

  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  clearMessages: () => void;

  memories: MemoryItem[];
  refreshMemories: () => void;
  addMemory: (item: Omit<MemoryItem, 'id' | 'hitCount' | 'createdAt' | 'updatedAt'>) => void;
  deleteMemory: (id: string) => void;

  skills: SkillItem[];
  toggleSkill: (id: string) => void;

  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;

  isSentryActive: boolean;
  setIsSentryActive: (active: boolean) => void;

  isEnrollModalOpen: boolean;
  setIsEnrollModalOpen: (open: boolean) => void;

  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;

  telemetry: SystemTelemetry;
  refreshTelemetry: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: 'orb',
  setActiveTab: (tab) => set({ activeTab: tab }),

  theme: 'ultron',
  setTheme: (theme) => {
    set({ theme });
    const current = get().settings;
    get().updateSettings({ theme });
  },

  agentState: 'idle',
  setAgentState: (agentState) => set({ agentState }),

  activeSoul: CORE_SOUL_PRESETS[0],
  setActiveSoul: (activeSoul) => set({ activeSoul }),

  cameraState: 'off',
  setCameraState: (cameraState) => set({ cameraState }),

  gestureStatus: { hands: 0, mode: 'idle' },
  setGestureStatus: (gestureStatus) => set({ gestureStatus }),

  audioLevel: 0,
  bassLevel: 0,
  setAudioLevels: (audioLevel, bassLevel) => set({ audioLevel, bassLevel }),

  isVoiceListening: false,
  setIsVoiceListening: (isVoiceListening) => set({ isVoiceListening }),

  isVoiceSpeaking: false,
  setIsVoiceSpeaking: (isVoiceSpeaking) => set({ isVoiceSpeaking }),

  messages: [
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        '**ULTRON ONLINE**. Holographic matrix initialized. All neural channels, collective memory banks, and gesture tracking subroutines are primed. Speak, type, or use hand gestures to command.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  updateLastAssistantMessage: (content) =>
    set((state) => {
      const msgs = [...state.messages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant') {
          msgs[i] = { ...msgs[i], content };
          break;
        }
      }
      return { messages: msgs };
    }),
  clearMessages: () => set({ messages: [] }),

  memories: memoryService.getAll(),
  refreshMemories: () => set({ memories: memoryService.getAll() }),
  addMemory: (item) => {
    memoryService.add(item);
    set({ memories: memoryService.getAll() });
  },
  deleteMemory: (id) => {
    memoryService.delete(id);
    set({ memories: memoryService.getAll() });
  },

  skills: BUILTIN_SKILLS,
  toggleSkill: (id) =>
    set((state) => ({
      skills: state.skills.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    })),

  isLocked: false,
  setIsLocked: (locked) => set({ isLocked: locked }),

  isSentryActive: false,
  setIsSentryActive: (active) => set({ isSentryActive: active }),

  isEnrollModalOpen: false,
  setIsEnrollModalOpen: (open) => set({ isEnrollModalOpen: open }),

  settings: {
    llmProvider: 'ollama',
    apiKey: '',
    modelName: 'nemotron-mini:latest',
    ollamaEndpoint: 'http://localhost:11434',
    voiceEnabled: true,
    voiceSpeed: 1.05,
    voicePitch: 0.88,
    selectedVoice: '',
    theme: 'ultron',
    globalHotkey: 'Ctrl+Space',
    autoReadResponses: true,
    soundEffects: true,
  },
  updateSettings: (newSettings) =>
    set((state) => {
      const updated = { ...state.settings, ...newSettings };
      try {
        localStorage.setItem('ultron_settings_v1', JSON.stringify(updated));
      } catch {}
      return { settings: updated };
    }),

  telemetry: osService.getTelemetry(),
  refreshTelemetry: () => set({ telemetry: osService.getTelemetry() }),
}));
