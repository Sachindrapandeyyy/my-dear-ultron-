import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ORB_THEMES } from '@/lib/orb/theme';
import {
  Settings,
  Key,
  Cpu,
  Volume2,
  Sliders,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { voiceService, VoiceOption } from '@/services/voiceService';
import { audioService } from '@/services/audioService';

export const SettingsModal: React.FC = () => {
  const { theme, settings, updateSettings } = useAppStore();

  const [provider, setProvider] = useState(settings.llmProvider);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [modelName, setModelName] = useState(settings.modelName);
  const [ollamaEndpoint, setOllamaEndpoint] = useState(settings.ollamaEndpoint);
  const [voiceSpeed, setVoiceSpeed] = useState(settings.voiceSpeed);
  const [voicePitch, setVoicePitch] = useState(settings.voicePitch);
  const [selectedVoice, setSelectedVoice] = useState(settings.selectedVoice);
  const [autoRead, setAutoRead] = useState(settings.autoReadResponses);
  const [soundFx, setSoundFx] = useState(settings.soundEffects);
  const [showKey, setShowKey] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [voices, setVoices] = useState<VoiceOption[]>([]);

  const themeConfig = ORB_THEMES[theme];

  useEffect(() => {
    const list = voiceService.getVoices();
    setVoices(list);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (soundFx) audioService.playSuccessChime();

    updateSettings({
      llmProvider: provider,
      apiKey: apiKey.trim(),
      modelName: modelName.trim(),
      ollamaEndpoint: ollamaEndpoint.trim(),
      voiceSpeed,
      voicePitch,
      selectedVoice,
      autoReadResponses: autoRead,
      soundEffects: soundFx,
    });

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleProviderChange = (newProv: any) => {
    setProvider(newProv);
    if (newProv === 'gemini') setModelName('gemini-2.0-flash');
    else if (newProv === 'openai') setModelName('gpt-4o-mini');
    else if (newProv === 'claude') setModelName('claude-3-5-sonnet-20241022');
    else if (newProv === 'deepseek') setModelName('deepseek-chat');
    else if (newProv === 'groq') setModelName('llama-3.3-70b-versatile');
    else if (newProv === 'ollama') setModelName('llama3');
  };

  return (
    <div className="pt-16 pb-24 px-4 max-w-4xl mx-auto min-h-screen font-mono select-text">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6" style={{ color: themeConfig.cssPrimary }} />
            <h1 className="text-xl font-bold tracking-widest text-white">SYSTEM & NEURAL CONFIGURATION</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Configure LLM providers, local Ollama endpoints, audio synthesizer rates, and hardware shortcuts.
          </p>
        </div>

        {savedToast && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 text-xs font-bold animate-pulse">
            <Check className="w-4 h-4" />
            <span>CONFIG SAVED</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: AI Provider & Engine */}
        <div className="p-5 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-200">
            <Cpu className="w-4 h-4" style={{ color: themeConfig.cssPrimary }} />
            <span>NEURAL REASONING ENGINE (LLM)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { id: 'gemini', name: 'Google Gemini' },
              { id: 'openai', name: 'OpenAI GPT-4o' },
              { id: 'claude', name: 'Anthropic Claude' },
              { id: 'deepseek', name: 'DeepSeek' },
              { id: 'groq', name: 'Groq Cloud' },
              { id: 'ollama', name: 'Local Ollama' },
            ].map((p) => {
              const isSelected = provider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProviderChange(p.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-center ${
                    isSelected
                      ? 'bg-zinc-800 text-white'
                      : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                  style={{
                    borderColor: isSelected ? themeConfig.cssPrimary : undefined,
                    boxShadow: isSelected ? `0 0 10px ${themeConfig.cssGlow}` : 'none',
                  }}
                >
                  {p.name}
                </button>
              );
            })}
          </div>

          {provider !== 'ollama' ? (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs text-zinc-400 block mb-1 flex items-center justify-between">
                  <span>{provider.toUpperCase()} API KEY</span>
                  <span className="text-[11px] text-zinc-500">Stored locally in your browser/desktop</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Enter your ${provider} API Key...`}
                    className="w-full pl-9 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">MODEL IDENTIFIER</label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g. gemini-2.0-flash, gpt-4o, claude-3-5-sonnet-20241022"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">OLLAMA HOST ENDPOINT</label>
                <input
                  type="text"
                  value={ollamaEndpoint}
                  onChange={(e) => setOllamaEndpoint(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">LOCAL MODEL NAME</label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="llama3, mistral, deepseek-r1, qwen"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Voice & Audio Synthesizer */}
        <div className="p-5 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-200">
            <Volume2 className="w-4 h-4" style={{ color: themeConfig.cssPrimary }} />
            <span>VOICE SYNTHESIS & REAL-TIME AUDIO</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">SYNTHESIZER VOICE</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-zinc-600"
              >
                <option value="">Default AI Voice (Auto English)</option>
                {voices.map((v, i) => (
                  <option key={i} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>SPEECH SPEED RATE ({voiceSpeed.toFixed(1)}x)</span>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.1"
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                  className="w-36 accent-red-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>SPEECH PITCH ({voicePitch.toFixed(2)})</span>
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.05"
                  value={voicePitch}
                  onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                  className="w-36 accent-red-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-zinc-900">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={autoRead}
                onChange={(e) => setAutoRead(e.target.checked)}
                className="rounded accent-red-500"
              />
              <span>Auto-speak assistant responses through synthesizer</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={soundFx}
                onChange={(e) => setSoundFx(e.target.checked)}
                className="rounded accent-red-500"
              />
              <span>Enable Sci-Fi Audio Synthesizer UI Clicks</span>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg font-bold text-xs transition-all flex items-center gap-2"
            style={{
              backgroundColor: themeConfig.cssPrimary,
              color: '#000',
              boxShadow: `0 0 15px ${themeConfig.cssGlow}`,
            }}
          >
            <Check className="w-4 h-4" />
            <span>SAVE CONFIGURATION</span>
          </button>
        </div>
      </form>
    </div>
  );
};
