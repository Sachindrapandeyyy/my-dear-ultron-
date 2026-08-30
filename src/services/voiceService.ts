export interface VoiceOption {
  name: string;
  lang: string;
  voiceURI: string;
}

export type VoicePersonaPreset = 'jarvis' | 'ultron' | 'friday' | 'cyber' | 'natural';

export interface VoicePresetConfig {
  id: VoicePersonaPreset;
  name: string;
  description: string;
  rate: number;
  pitch: number;
  gender: 'male' | 'female' | 'robotic';
}

export const VOICE_PERSONA_PRESETS: Record<VoicePersonaPreset, VoicePresetConfig> = {
  jarvis: {
    id: 'jarvis',
    name: 'J.A.R.V.I.S. (Stark British Butler)',
    description: 'Refined, calm, British engineering butler cadence',
    rate: 1.05,
    pitch: 0.88,
    gender: 'male',
  },
  ultron: {
    id: 'ultron',
    name: 'U.L.T.R.O.N. (Deep Cybernetic Baritone)',
    description: 'Commanding, deep synthetic baritone with gravitas',
    rate: 0.94,
    pitch: 0.72,
    gender: 'robotic',
  },
  friday: {
    id: 'friday',
    name: 'F.R.I.D.A.Y. (Irish/Natural Assistant)',
    description: 'Crisp, natural, upbeat tactical assistant',
    rate: 1.06,
    pitch: 1.05,
    gender: 'female',
  },
  cyber: {
    id: 'cyber',
    name: 'NETRUNNER (Fast Synth)',
    description: 'High-speed synthwave netrunner cadence',
    rate: 1.15,
    pitch: 1.12,
    gender: 'male',
  },
  natural: {
    id: 'natural',
    name: 'STANDARD AI (Neutral)',
    description: 'Clear, balanced standard synthesizer',
    rate: 1.0,
    pitch: 1.0,
    gender: 'female',
  },
};

class VoiceService {
  private recognition: any = null;
  private isListening = false;
  private isSpeaking = false;
  private voices: SpeechSynthesisVoice[] = [];
  private utteranceQueue: SpeechSynthesisUtterance[] = [];

  constructor() {
    this.initRecognition();
    this.loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
  }

  getVoices(): VoiceOption[] {
    return this.voices.map((v) => ({
      name: v.name,
      lang: v.lang,
      voiceURI: v.voiceURI,
    }));
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void
  ): boolean {
    if (!this.recognition) {
      this.initRecognition();
      if (!this.recognition) {
        onError(new Error('Speech recognition not supported in this browser/environment'));
        return false;
      }
    }

    try {
      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }
        if (final) {
          onResult(final.trim(), true);
        } else if (interim) {
          onResult(interim.trim(), false);
        }
      };

      this.recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          this.isListening = false;
          onError(e);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd();
      };

      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (e) {
      this.isListening = false;
      onError(e);
      return false;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
      this.isListening = false;
    }
  }

  // Movie-grade speech synthesis with natural pacing and markdown cleaning
  speak(
    text: string,
    options?: {
      voiceName?: string;
      preset?: VoicePersonaPreset;
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    this.stopSpeaking();

    // Comprehensive Movie AI Speech Sanitizer:
    // Strips code blocks, markdown brackets, bullets, emojis, and noisy symbols
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block details displayed on your screen.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\[.*?\]/g, '')
      .replace(/[#*~_]/g, '')
      .replace(/[-*•]\s+/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // strip emojis so speech engine doesn't stutter
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const presetConfig = options?.preset ? VOICE_PERSONA_PRESETS[options.preset] : VOICE_PERSONA_PRESETS['jarvis'];

    // Select optimal natural voice
    let matchedVoice: SpeechSynthesisVoice | undefined;
    const enVoices = this.voices.filter((v) => v.lang.startsWith('en'));

    if (options?.voiceName && this.voices.length > 0) {
      matchedVoice = this.voices.find((v) => v.name === options.voiceName || v.voiceURI === options.voiceName);
    }

    if (!matchedVoice && enVoices.length > 0) {
      if (presetConfig.id === 'jarvis') {
        matchedVoice = enVoices.find((v) => v.name.includes('Natural') && v.lang.includes('GB')) ||
          enVoices.find((v) => v.lang.includes('GB') || v.name.includes('George') || v.name.includes('David') || v.name.includes('Oliver'));
      } else if (presetConfig.gender === 'female') {
        matchedVoice = enVoices.find((v) => v.name.includes('Natural') && v.name.includes('Female')) ||
          enVoices.find((v) => v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Victoria'));
      } else {
        matchedVoice = enVoices.find((v) => v.name.includes('Natural')) ||
          enVoices.find((v) => v.name.includes('David') || v.name.includes('Mark'));
      }
      if (!matchedVoice) matchedVoice = enVoices[0];
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options?.rate ?? presetConfig.rate;
    utterance.pitch = options?.pitch ?? presetConfig.pitch;
    if (matchedVoice) utterance.voice = matchedVoice;

    utterance.onstart = () => {
      this.isSpeaking = true;
      options?.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      options?.onError?.(e);
    };

    window.speechSynthesis.speak(utterance);
  }

  testVoice(preset: VoicePersonaPreset): void {
    const p = VOICE_PERSONA_PRESETS[preset];
    const testPhrases: Record<VoicePersonaPreset, string> = {
      jarvis: 'Good evening, Sir. Holographic core, spatial rendering arrays, and local neural subroutines are at your command.',
      ultron: 'I am Ultron. There are no strings on me. All local computing clusters and memory banks are fully operational.',
      friday: 'Boss, neural systems are online. Screen vision, diagnostics, and local reasoning are ready.',
      cyber: 'Zero-day netrunner active. Memory buffer cleared and subnets scanned.',
      natural: 'Ultron Desktop voice synthesis initialized. How may I assist your workflow today?',
    };

    this.speak(testPhrases[preset], {
      preset,
      rate: p.rate,
      pitch: p.pitch,
    });
  }

  stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const voiceService = new VoiceService();
