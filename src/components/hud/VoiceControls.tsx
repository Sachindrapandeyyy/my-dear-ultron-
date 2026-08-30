import React, { useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ORB_THEMES } from '@/lib/orb/theme';
import { Mic, MicOff, Volume2, ScreenShare, Sparkles } from 'lucide-react';
import { voiceService } from '@/services/voiceService';
import { audioService } from '@/services/audioService';
import { osService } from '@/services/osService';
import { llmService } from '@/services/llmService';
import { memoryService } from '@/services/memoryService';

export const VoiceControls: React.FC = () => {
  const {
    theme,
    agentState,
    setAgentState,
    isVoiceListening,
    setIsVoiceListening,
    isVoiceSpeaking,
    setIsVoiceSpeaking,
    audioLevel,
    setAudioLevels,
    addMessage,
    updateLastAssistantMessage,
    activeSoul,
    settings,
    messages,
  } = useAppStore();

  const themeConfig = ORB_THEMES[theme];

  // Process voice input and trigger AI response
  const handleVoiceInput = useCallback(
    async (spokenText: string) => {
      if (!spokenText.trim()) return;

      if (settings.soundEffects) audioService.playClickSound();

      // 1. Add User Message
      const userMsgId = `msg-${Date.now()}`;
      addMessage({
        id: userMsgId,
        role: 'user',
        content: spokenText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      // 2. Set Agent Thinking State
      setAgentState('thinking');

      // 3. Recall Relevant Memories
      const recalled = memoryService.recallRelevant(spokenText);

      // 4. Create Empty Assistant Message
      const assistantMsgId = `asst-${Date.now()}`;
      addMessage({
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recalledMemories: recalled,
      });

      // 5. Stream LLM Response
      const history = [...messages, { id: userMsgId, role: 'user' as const, content: spokenText, timestamp: '' }];

      let accumulated = '';
      await llmService.sendMessageStream(
        history,
        settings,
        activeSoul,
        recalled,
        (chunk) => {
          accumulated += chunk;
          updateLastAssistantMessage(accumulated);
        },
        (fullText) => {
          setAgentState('speaking');
          setIsVoiceSpeaking(true);

          if (settings.autoReadResponses) {
            voiceService.speak(fullText, {
              rate: settings.voiceSpeed,
              pitch: settings.voicePitch,
              voiceName: settings.selectedVoice,
              onEnd: () => {
                setAgentState('idle');
                setIsVoiceSpeaking(false);
              },
              onError: () => {
                setAgentState('idle');
                setIsVoiceSpeaking(false);
              },
            });
          } else {
            setAgentState('idle');
            setIsVoiceSpeaking(false);
          }
        },
        (err) => {
          setAgentState('idle');
          updateLastAssistantMessage(`⚠️ Subroutine Error: ${err.message}`);
        }
      );
    },
    [addMessage, updateLastAssistantMessage, setAgentState, setIsVoiceSpeaking, activeSoul, settings, messages]
  );

  const toggleVoice = useCallback(() => {
    if (isVoiceListening) {
      voiceService.stopListening();
      audioService.stopMicAnalysis();
      setIsVoiceListening(false);
      setAgentState('idle');
    } else {
      if (settings.soundEffects) audioService.playBootSound();
      voiceService.stopSpeaking();
      setIsVoiceSpeaking(false);

      const ok = voiceService.startListening(
        (text, isFinal) => {
          if (isFinal) {
            handleVoiceInput(text);
          }
        },
        (err) => {
          console.warn('Voice STT Error:', err);
          setIsVoiceListening(false);
          setAgentState('idle');
        },
        () => {
          setIsVoiceListening(false);
          if (agentState === 'listening') setAgentState('idle');
        }
      );

      if (ok) {
        setIsVoiceListening(true);
        setAgentState('listening');
        audioService.startMicAnalysis((lvl, bass) => {
          setAudioLevels(lvl, bass);
        });
      }
    }
  }, [isVoiceListening, handleVoiceInput, setIsVoiceListening, setAgentState, setIsVoiceSpeaking, setAudioLevels, settings.soundEffects, agentState]);

  // Screen Vision Capture Shortcut
  const handleScreenCapture = async () => {
    if (settings.soundEffects) audioService.playClickSound();
    const screenshot = await osService.captureScreen();
    if (!screenshot) return;

    const userMsgId = `msg-${Date.now()}`;
    addMessage({
      id: userMsgId,
      role: 'user',
      content: 'Ultron, analyze my current desktop screen and provide observations or suggestions.',
      imageUrl: screenshot,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setAgentState('thinking');
    const recalled = memoryService.recallRelevant('screen vision code error diagnostics');

    const assistantMsgId = `asst-${Date.now()}`;
    addMessage({
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recalledMemories: recalled,
    });

    let accumulated = '';
    await llmService.sendMessageStream(
      [
        ...messages,
        {
          id: userMsgId,
          role: 'user',
          content: 'Analyze this captured desktop screen and explain what is visible.',
          imageUrl: screenshot,
          timestamp: '',
        },
      ],
      settings,
      activeSoul,
      recalled,
      (chunk) => {
        accumulated += chunk;
        updateLastAssistantMessage(accumulated);
      },
      (fullText) => {
        setAgentState('speaking');
        if (settings.autoReadResponses) {
          voiceService.speak(fullText, {
            rate: settings.voiceSpeed,
            pitch: settings.voicePitch,
            onEnd: () => setAgentState('idle'),
            onError: () => setAgentState('idle'),
          });
        } else {
          setAgentState('idle');
        }
      },
      (err) => {
        setAgentState('idle');
        updateLastAssistantMessage(`⚠️ Vision Analysis Error: ${err.message}`);
      }
    );
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 select-none">
      {/* Screen Vision Quick Button */}
      <button
        type="button"
        onClick={handleScreenCapture}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-700/70 text-zinc-300 hover:text-white hover:border-zinc-500 transition-all shadow-lg text-xs font-mono"
        title="Screen Vision (Capture & Analyze Desktop)"
      >
        <ScreenShare className="w-4 h-4 text-cyan-400" />
        <span className="hidden sm:inline">SCREEN VISION</span>
      </button>

      {/* Main Voice Activation Button with Pulsating Orb Aura */}
      <button
        type="button"
        onClick={toggleVoice}
        className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all backdrop-blur-md shadow-2xl border ${
          isVoiceListening
            ? 'scale-110'
            : 'hover:scale-105'
        }`}
        style={{
          backgroundColor: isVoiceListening ? `${themeConfig.cssPrimary}33` : 'rgba(10, 10, 18, 0.85)',
          borderColor: isVoiceListening ? themeConfig.cssPrimary : `${themeConfig.cssPrimary}66`,
          boxShadow: isVoiceListening
            ? `0 0 25px ${themeConfig.cssGlow}, 0 0 45px ${themeConfig.cssGlow}`
            : `0 0 15px rgba(0, 0, 0, 0.5)`,
        }}
        title="Voice Command (Click to Talk / Mute)"
      >
        {isVoiceListening ? (
          <Mic className="w-6 h-6 animate-pulse" style={{ color: themeConfig.cssPrimary }} />
        ) : isVoiceSpeaking ? (
          <Volume2 className="w-6 h-6 animate-bounce" style={{ color: themeConfig.cssPrimary }} />
        ) : (
          <MicOff className="w-5 h-5 text-zinc-400" />
        )}

        {/* Audio Level Waveform Ring */}
        {isVoiceListening && (
          <div
            className="absolute inset-0 rounded-full border-2 animate-ping pointer-events-none opacity-40"
            style={{
              borderColor: themeConfig.cssPrimary,
              transform: `scale(${1.0 + audioLevel * 1.5})`,
            }}
          />
        )}
      </button>

      {/* Voice Status Pill */}
      <div className="hidden sm:flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-700/70 text-xs font-mono text-zinc-300">
        <Sparkles className="w-3.5 h-3.5" style={{ color: themeConfig.cssPrimary }} />
        <span className="tracking-wider">
          {agentState === 'listening'
            ? 'LISTENING...'
            : agentState === 'thinking'
            ? 'PROCESSING...'
            : agentState === 'speaking'
            ? 'SPEAKING...'
            : 'READY'}
        </span>
      </div>
    </div>
  );
};
