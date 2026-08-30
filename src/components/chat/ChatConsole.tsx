import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ORB_THEMES } from '@/lib/orb/theme';
import {
  Send,
  Trash2,
  Volume2,
  ScreenShare,
  Sparkles,
  Bot,
  User,
  Database,
  Terminal,
} from 'lucide-react';
import { llmService } from '@/services/llmService';
import { memoryService } from '@/services/memoryService';
import { voiceService } from '@/services/voiceService';
import { audioService } from '@/services/audioService';
import { osService } from '@/services/osService';

export const ChatConsole: React.FC = () => {
  const {
    theme,
    messages,
    addMessage,
    updateLastAssistantMessage,
    clearMessages,
    activeSoul,
    settings,
    setAgentState,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const themeConfig = ORB_THEMES[theme];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend && !selectedImage) return;

    if (settings.soundEffects) audioService.playClickSound();

    const userMsgId = `msg-${Date.now()}`;
    const newMsg = {
      id: userMsgId,
      role: 'user' as const,
      content: textToSend,
      imageUrl: selectedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    addMessage(newMsg);
    setInput('');
    setSelectedImage(null);
    setIsStreaming(true);
    setAgentState('thinking');

    // Recall relevant memories
    const recalled = memoryService.recallRelevant(textToSend);

    const asstMsgId = `asst-${Date.now()}`;
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
        setIsStreaming(false);
        setAgentState('idle');
        if (settings.soundEffects) audioService.playSuccessChime();

        if (settings.autoReadResponses) {
          voiceService.speak(fullText, {
            rate: settings.voiceSpeed,
            pitch: settings.voicePitch,
            voiceName: settings.selectedVoice,
          });
        }
      },
      (err) => {
        setIsStreaming(false);
        setAgentState('idle');
        updateLastAssistantMessage(`⚠️ Subroutine Error: ${err.message}`);
      }
    );
  };

  const handleScreenAttach = async () => {
    if (settings.soundEffects) audioService.playClickSound();
    const screenshot = await osService.captureScreen();
    if (screenshot) {
      setSelectedImage(screenshot);
    }
  };

  const handlePlayVoice = (text: string) => {
    voiceService.speak(text, {
      rate: settings.voiceSpeed,
      pitch: settings.voicePitch,
      voiceName: settings.selectedVoice,
    });
  };

  const quickPrompts = [
    '⚡ System Telemetry Scan',
    '🧠 Recall ModelScope error patterns',
    '🔮 How do I use hand gestures to control the orb?',
    '💻 Write an optimized Three.js shader snippet',
  ];

  return (
    <div className="pt-16 pb-24 px-4 max-w-5xl mx-auto h-screen flex flex-col justify-between select-text">
      {/* Top Bar inside Chat */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" style={{ color: themeConfig.cssPrimary }} />
          <span className="font-mono text-sm font-bold text-zinc-200 tracking-wider">
            NEURAL CONSOLE — {activeSoul.name}
          </span>
        </div>
        <button
          onClick={() => {
            if (settings.soundEffects) audioService.playClickSound();
            clearMessages();
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 hover:text-red-400 transition-colors"
          title="Clear Chat History"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>PURGE LOGS</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-mono text-sm">
        {messages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistant && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center border shrink-0 mt-1"
                  style={{
                    backgroundColor: `${themeConfig.cssPrimary}15`,
                    borderColor: `${themeConfig.cssPrimary}55`,
                  }}
                >
                  <Bot className="w-4 h-4" style={{ color: themeConfig.cssPrimary }} />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-lg p-3.5 border ${
                  isAssistant
                    ? 'bg-zinc-950/80 border-zinc-800/90 text-zinc-200'
                    : 'bg-zinc-900 border-zinc-700 text-white'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-zinc-800/60 text-[11px] text-zinc-400">
                  <span className="font-bold tracking-wider">
                    {isAssistant ? activeSoul.name : 'USER'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Attached Screen Image */}
                {msg.imageUrl && (
                  <div className="mb-3 rounded overflow-hidden border border-zinc-700 max-w-sm">
                    <img src={msg.imageUrl} alt="Screen capture" className="w-full h-auto object-cover" />
                  </div>
                )}

                {/* Message Content */}
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.content || (isStreaming ? <span className="animate-pulse">Thinking...</span> : '')}
                </div>

                {/* Recalled Memories Badges */}
                {msg.recalledMemories && msg.recalledMemories.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-zinc-800/80 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Database className="w-3 h-3 text-cyan-400" />
                      RECALLED:
                    </span>
                    {msg.recalledMemories.map((m, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 px-2 py-0.5 rounded truncate max-w-xs"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}

                {/* Voice Replay Button */}
                {isAssistant && msg.content && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => handlePlayVoice(msg.content)}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                      title="Read aloud with synthesizer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {!isAssistant && (
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-zinc-300" />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2 py-2 select-none">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp)}
            className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 hover:border-zinc-600 text-zinc-300 transition-all hover:scale-105"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="pt-2 border-t border-zinc-800/80 select-none">
        {selectedImage && (
          <div className="mb-2 flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-700 rounded max-w-xs">
            <img src={selectedImage} alt="Attachment" className="w-12 h-8 object-cover rounded" />
            <span className="text-xs text-zinc-300 truncate">Screen Vision Captured</span>
            <button
              onClick={() => setSelectedImage(null)}
              className="text-xs text-red-400 hover:underline ml-auto"
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleScreenAttach}
            className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-cyan-500 text-zinc-300 hover:text-cyan-400 transition-all"
            title="Attach Screen Vision"
          >
            <ScreenShare className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Command ${activeSoul.name}... (Press Enter)`}
            className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-950/90 border border-zinc-800 text-white font-mono text-sm focus:outline-none transition-all placeholder:text-zinc-600"
            style={{
              borderColor: input ? themeConfig.cssPrimary : undefined,
              boxShadow: input ? `0 0 10px ${themeConfig.cssGlow}` : 'none',
            }}
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={(!input.trim() && !selectedImage) || isStreaming}
            className="p-2.5 rounded-lg font-mono text-sm font-bold flex items-center justify-center transition-all disabled:opacity-40"
            style={{
              backgroundColor: themeConfig.cssPrimary,
              color: '#000',
              boxShadow: `0 0 15px ${themeConfig.cssGlow}`,
            }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
