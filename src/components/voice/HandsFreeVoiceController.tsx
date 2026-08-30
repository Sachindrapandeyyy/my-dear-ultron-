import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ORB_THEMES } from '@/lib/orb/theme';
import { voiceService } from '@/services/voiceService';
import { audioService } from '@/services/audioService';
import { llmService } from '@/services/llmService';
import { memoryService } from '@/services/memoryService';
import { Mic, MicOff, Volume2, Sparkles, Radio, Zap, VolumeX } from 'lucide-react';

export const HandsFreeVoiceController: React.FC = () => {
  const {
    isHandsFreeActive,
    setIsHandsFreeActive,
    theme,
    settings,
    activeSoul,
    messages,
    addMessage,
    updateLastAssistantMessage,
    setAgentState,
  } = useAppStore();

  const themeConfig = ORB_THEMES[theme];

  const [wakeState, setWakeState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const silenceTimerRef = useRef<any>(null);
  const isEngagedRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    if (isHandsFreeActive) {
      initSpeechRecognition();
    } else {
      stopRecognition();
    }

    return () => {
      isMountedRef.current = false;
      stopRecognition();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [isHandsFreeActive]);

  const initSpeechRecognition = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += t;
          else interim += t;
        }

        const currentText = (final || interim).trim();
        if (!currentText) return;

        handleSpokenInput(currentText, Boolean(final));
      };

      rec.onerror = (e: any) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('Speech recognition error:', e.error);
        }
      };

      rec.onend = () => {
        // Auto-restart continuous loop if hands-free is enabled
        if (isMountedRef.current && isHandsFreeActive && !recognitionRef.current?.manuallyStopped) {
          setTimeout(() => {
            try {
              rec.start();
            } catch {}
          }, 300);
        }
      };

      rec.start();
      recognitionRef.current = rec;
      setWakeState('idle');
    } catch (e) {
      console.warn('Speech init failed:', e);
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.manuallyStopped = true;
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setWakeState('idle');
    setLiveTranscript('');
  };

  const handleSpokenInput = (text: string, isFinal: boolean) => {
    const lower = text.toLowerCase();

    // 1. Check for wake word trigger
    const wakeWords = ['hey ultron', 'ultron', 'hey jarvis', 'jarvis', 'friday', 'sentry'];
    const hasWakeWord = wakeWords.some((w) => lower.includes(w));

    if (!isEngagedRef.current && hasWakeWord) {
      // Wake Word Triggered!
      isEngagedRef.current = true;
      voiceService.stopSpeaking(); // Interrupt immediately
      if (settings.soundEffects) audioService.playClickSound();

      // Clean off wake word from text
      let cleaned = text;
      wakeWords.forEach((w) => {
        const regex = new RegExp(`^.*?${w}\\s*,?\\s*`, 'i');
        cleaned = cleaned.replace(regex, '');
      });

      setWakeState('listening');
      setLiveTranscript(cleaned);

      if (cleaned.trim().length > 3) {
        scheduleQueryDispatch(cleaned);
      }
      return;
    }

    if (isEngagedRef.current) {
      setLiveTranscript(text);

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      if (isFinal || text.trim().length > 5) {
        silenceTimerRef.current = setTimeout(() => {
          dispatchUserVoiceQuery(text);
        }, 1400);
      }
    }
  };

  const scheduleQueryDispatch = (query: string) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      dispatchUserVoiceQuery(query);
    }, 1400);
  };

  const dispatchUserVoiceQuery = async (rawQuery: string) => {
    const query = rawQuery.trim();
    if (!query) {
      isEngagedRef.current = false;
      setWakeState('idle');
      return;
    }

    isEngagedRef.current = false;
    setWakeState('processing');
    setAgentState('thinking');
    if (settings.soundEffects) audioService.playSuccessChime();

    const userMsgId = `voice-user-${Date.now()}`;
    const newMsg = {
      id: userMsgId,
      role: 'user' as const,
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    addMessage(newMsg);
    setLiveTranscript('');

    const recalled = memoryService.recallRelevant(query);
    const asstMsgId = `voice-asst-${Date.now()}`;
    addMessage({
      id: asstMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recalledMemories: recalled,
    });

    const conversationHistory = [...messages, newMsg];
    let accumulated = '';

    await llmService.sendMessageStream(
      conversationHistory,
      settings,
      activeSoul,
      recalled,
      (chunk) => {
        accumulated += chunk;
        updateLastAssistantMessage(accumulated);
      },
      (fullText) => {
        setWakeState('speaking');
        setAgentState('speaking');

        voiceService.speak(fullText, {
          rate: settings.voiceSpeed,
          pitch: settings.voicePitch,
          voiceName: settings.selectedVoice,
          onEnd: () => {
            setWakeState('idle');
            setAgentState('idle');
          },
          onError: () => {
            setWakeState('idle');
            setAgentState('idle');
          },
        });
      },
      (err) => {
        setWakeState('idle');
        setAgentState('idle');
        updateLastAssistantMessage(`⚠️ Subroutine Error: ${err.message}`);
      }
    );
  };

  if (!isHandsFreeActive) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-lg w-full px-4 pointer-events-none select-none font-mono animate-fadeIn">
      <div
        className="pointer-events-auto bg-zinc-950/95 border-2 rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 transition-all duration-300"
        style={{
          borderColor:
            wakeState === 'listening'
              ? '#ef4444'
              : wakeState === 'speaking'
              ? '#10b981'
              : themeConfig.cssPrimary,
          boxShadow: `0 0 30px ${
            wakeState === 'listening'
              ? 'rgba(239,68,68,0.4)'
              : wakeState === 'speaking'
              ? 'rgba(16,185,129,0.4)'
              : themeConfig.cssGlow
          }`,
        }}
      >
        {/* Left Pulse Icon */}
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl flex items-center justify-center transition-all ${
              wakeState === 'listening'
                ? 'bg-red-950/80 border border-red-500 animate-pulse'
                : wakeState === 'speaking'
                ? 'bg-emerald-950/80 border border-emerald-500'
                : 'bg-cyan-950/80 border border-cyan-500'
            }`}
          >
            {wakeState === 'listening' ? (
              <Radio className="w-4 h-4 text-red-400 animate-spin" />
            ) : wakeState === 'speaking' ? (
              <Volume2 className="w-4 h-4 text-emerald-400 animate-bounce" />
            ) : (
              <Mic className="w-4 h-4 text-cyan-400 animate-pulse" />
            )}
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold tracking-wider text-white">
                {wakeState === 'listening'
                  ? '🎙️ LISTENING TO USER...'
                  : wakeState === 'processing'
                  ? '⚡ NEURAL REASONING...'
                  : wakeState === 'speaking'
                  ? '🔊 ULTRON SPEAKING...'
                  : '🎙️ HANDS-FREE WAKE WORD ARMED'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  wakeState === 'listening'
                    ? 'bg-red-500 animate-ping'
                    : wakeState === 'speaking'
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-cyan-400 animate-pulse'
                }`}
              />
            </div>
            <p className="text-[10px] text-zinc-400 truncate max-w-xs">
              {liveTranscript
                ? `"${liveTranscript}"`
                : 'Say "Hey Ultron" or "Jarvis" anywhere in the room'}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              voiceService.stopSpeaking();
              setWakeState('idle');
            }}
            title="Interrupt / Stop Speaking"
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:text-red-400 text-zinc-400 transition-all text-xs"
          >
            <VolumeX className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsHandsFreeActive(false)}
            title="Turn Off Hands-Free Mode"
            className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-red-500 text-[10px] text-zinc-300 font-bold hover:text-red-400 transition-all"
          >
            DISARM
          </button>
        </div>
      </div>
    </div>
  );
};
