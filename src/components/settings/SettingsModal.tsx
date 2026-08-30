import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ORB_THEMES } from '@/lib/orb/theme';
import {
  Settings,
  Key,
  Cpu,
  Volume2,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  Play,
  Server,
  Zap,
} from 'lucide-react';
import { voiceService, VoiceOption, VOICE_PERSONA_PRESETS, VoicePersonaPreset } from '@/services/voiceService';
import { audioService } from '@/services/audioService';
import { ollamaService, OllamaStatus } from '@/services/ollamaService';

export const SettingsModal: React.FC = () => {
  const { theme, settings, updateSettings } = useAppStore();

  const [provider, setProvider] = useState(settings.llmProvider);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [modelName, setModelName] = useState(settings.modelName);
  const [ollamaEndpoint, setOllamaEndpoint] = useState(settings.ollamaEndpoint);
  const [voiceSpeed, setVoiceSpeed] = useState(settings.voiceSpeed);
  const [voicePitch, setVoicePitch] = useState(settings.voicePitch);
  const [selectedVoice, setSelectedVoice] = useState(settings.selectedVoice);
  const [selectedVoicePreset, setSelectedVoicePreset] = useState<VoicePersonaPreset>('jarvis');
  const [autoRead, setAutoRead] = useState(settings.autoReadResponses);
  const [soundFx, setSoundFx] = useState(settings.soundEffects);
  const [showKey, setShowKey] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({
    isOnline: false,
    endpoint: settings.ollamaEndpoint || 'http://localhost:11434',
    models: [],
    activeModel: '',
  });
  const [isScanningOllama, setIsScanningOllama] = useState(false);

  const themeConfig = ORB_THEMES[theme];

  useEffect(() => {
    const list = voiceService.getVoices();
    setVoices(list);
    handleScanOllama();
  }, []);

  const handleScanOllama = async () => {
    setIsScanningOllama(true);
    const status = await ollamaService.checkStatus(ollamaEndpoint);
    setOllamaStatus(status);
    setIsScanningOllama(false);
    if (status.isOnline && status.models.length > 0 && provider === 'ollama') {
      if (!modelName || !status.models.includes(modelName)) {
        setModelName(status.models[0]);
      }
    }
  };

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
    else if (newProv === 'ollama') {
      handleScanOllama();
      setModelName(ollamaStatus.models[0] || 'llama3');
    }
  };

  const handleTestVoice = (presetKey: VoicePersonaPreset) => {
    setSelectedVoicePreset(presetKey);
    const p = VOICE_PERSONA_PRESETS[presetKey];
    setVoiceSpeed(p.rate);
    setVoicePitch(p.pitch);
    voiceService.testVoice(presetKey);
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
            Connect local Ollama models directly, configure natural voice generation, and manage AI gateways.
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-200">
              <Cpu className="w-4 h-4" style={{ color: themeConfig.cssPrimary }} />
              <span>NEURAL REASONING ENGINE (LLM)</span>
            </div>

            {/* Ollama Live Status Pill */}
            <div className="flex items-center gap-2 text-xs">
              <span className="flex h-2 w-2 rounded-full" style={{ backgroundColor: ollamaStatus.isOnline ? '#10b981' : '#ef4444' }} />
              <span className="text-zinc-400">
                Local Ollama: <span className={ollamaStatus.isOnline ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>{ollamaStatus.isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { id: 'ollama', name: '⚡ Local Ollama' },
              { id: 'gemini', name: 'Google Gemini' },
              { id: 'openai', name: 'OpenAI GPT-4o' },
              { id: 'claude', name: 'Anthropic Claude' },
              { id: 'deepseek', name: 'DeepSeek' },
              { id: 'groq', name: 'Groq Cloud' },
            ].map((p) => {
              const isSelected = provider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProviderChange(p.id)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? 'bg-zinc-800 text-white'
                      : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                  style={{
                    borderColor: isSelected ? themeConfig.cssPrimary : undefined,
                    boxShadow: isSelected ? `0 0 10px ${themeConfig.cssGlow}` : 'none',
                  }}
                >
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>

          {provider === 'ollama' ? (
            /* Dedicated Local Ollama Panel */
            <div className="space-y-4 pt-2 p-4 bg-zinc-900/80 border border-zinc-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Server className="w-4 h-4" />
                  <span>DIRECT LOCAL OLLAMA CONNECTION</span>
                </div>
                <button
                  type="button"
                  onClick={handleScanOllama}
                  disabled={isScanningOllama}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white bg-zinc-800 px-2 py-1 rounded"
                >
                  <RefreshCw className={`w-3 h-3 ${isScanningOllama ? 'animate-spin' : ''}`} />
                  <span>Scan Models</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">OLLAMA HOST URL</label>
                  <input
                    type="text"
                    value={ollamaEndpoint}
                    onChange={(e) => setOllamaEndpoint(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">ACTIVE LOCAL MODEL</label>
                  {ollamaStatus.models.length > 0 ? (
                    <select
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {ollamaStatus.models.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="e.g. llama3, mistral, deepseek-r1, qwen2.5"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  )}
                </div>
              </div>

              {ollamaStatus.isOnline ? (
                <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Connected to Ollama! Found {ollamaStatus.models.length} model(s): {ollamaStatus.models.join(', ')}</span>
                </div>
              ) : (
                <div className="text-[11px] text-amber-400 bg-amber-950/40 p-2 rounded border border-amber-800/40 leading-relaxed">
                  💡 Start Ollama on your computer (`ollama serve` or open the Ollama app). Ultron will connect automatically with zero setup!
                </div>
              )}
            </div>
          ) : (
            /* Cloud API Keys */
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
          )}
        </div>

        {/* Section 2: Real-Time Voice Generation Studio */}
        <div className="p-5 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-200">
              <Volume2 className="w-4 h-4" style={{ color: themeConfig.cssPrimary }} />
              <span>VOICE GENERATION & SYNTHESIS STUDIO</span>
            </div>
            <span className="text-[11px] text-zinc-400">Click any preset to test generation live</span>
          </div>

          {/* Voice Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {(Object.keys(VOICE_PERSONA_PRESETS) as VoicePersonaPreset[]).map((pKey) => {
              const p = VOICE_PERSONA_PRESETS[pKey];
              const isSelected = selectedVoicePreset === pKey;
              return (
                <div
                  key={pKey}
                  className={`p-3 rounded-lg border transition-all flex flex-col justify-between ${
                    isSelected ? 'bg-zinc-900 border-zinc-600 shadow-md' : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                  style={{
                    borderColor: isSelected ? themeConfig.cssPrimary : undefined,
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{p.name}</span>
                      <span className="text-[10px] uppercase text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                        {p.gender}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug mb-2">{p.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestVoice(pKey)}
                    className="w-full py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-all bg-zinc-800 hover:bg-zinc-700 text-white"
                  >
                    <Play className="w-3 h-3 text-emerald-400" />
                    <span>TEST GENERATION</span>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">SPECIFIC SYSTEM SYNTHESIZER VOICE</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-zinc-600"
              >
                <option value="">Default AI Voice (Auto English Matching)</option>
                {voices.map((v, i) => (
                  <option key={i} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>SPEECH RATE ({voiceSpeed.toFixed(2)}x)</span>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.05"
                  value={voiceSpeed}
                  onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                  className="w-36 accent-red-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>SPEECH PITCH ({voicePitch.toFixed(2)})</span>
                <input
                  type="range"
                  min="0.6"
                  max="1.4"
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
              <span>Auto-generate and speak responses aloud</span>
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
