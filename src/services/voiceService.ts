export interface VoiceOption {
  name: string;
  lang: string;
  voiceURI: string;
}

class VoiceService {
  private recognition: any = null;
  private isListening = false;
  private isSpeaking = false;
  private voices: SpeechSynthesisVoice[] = [];

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
      this.recognition.continuous = false;
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
        this.isListening = false;
        onError(e);
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
      this.recognition.stop();
      this.isListening = false;
    }
  }

  speak(
    text: string,
    options?: {
      voiceName?: string;
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    this.stopSpeaking();

    // Clean markdown code blocks from speech output
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#_~]/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 0.95;

    if (options?.voiceName && this.voices.length > 0) {
      const match = this.voices.find((v) => v.name === options.voiceName || v.voiceURI === options.voiceName);
      if (match) utterance.voice = match;
    } else {
      // Default to Jarvis-like / natural English voice
      const preferred = this.voices.find(
        (v) =>
          (v.lang.startsWith('en') && (v.name.includes('David') || v.name.includes('George') || v.name.includes('Natural') || v.name.includes('Male')))
      ) || this.voices.find((v) => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;
    }

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
