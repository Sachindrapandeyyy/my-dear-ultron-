import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ORB_THEMES } from '@/lib/orb/theme';
import {
  FREE_OLLAMA_MODELS,
  FreeCuratedModel,
  ollamaService,
  OllamaStatus,
} from '@/services/ollamaService';
import { audioService } from '@/services/audioService';
import {
  Cpu,
  Download,
  Check,
  Zap,
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Activity,
  Layers,
  Flame,
} from 'lucide-react';

export const FreeModelsMatrix: React.FC = () => {
  const { theme, settings, updateSettings, addMessage } = useAppStore();
  const themeConfig = ORB_THEMES[theme];

  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({
    isOnline: false,
    endpoint: 'http://localhost:11434',
    models: [],
    activeModel: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [pullStatus, setPullStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customModelTag, setCustomModelTag] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    const status = await ollamaService.checkStatus();
    setOllamaStatus(status);
    setIsLoading(false);
  };

  useEffect(() => {
    void fetchStatus();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isModelInstalled = (tag: string) => {
    return ollamaStatus.models.some(
      (m) => m === tag || m.startsWith(`${tag}:`) || tag.startsWith(`${m}:`)
    );
  };

  const isModelActive = (tag: string) => {
    const current = settings.modelName || 'llama3.2:latest';
    return (
      settings.llmProvider === 'ollama' &&
      (current === tag || current.startsWith(`${tag}:`) || tag.startsWith(`${current}:`))
    );
  };

  const handleSwitchModel = (model: FreeCuratedModel) => {
    if (settings.soundEffects) audioService.playSuccessChime();

    updateSettings({
      llmProvider: 'ollama',
      modelName: model.tag,
    });

    showToast(`Brain Switched to ${model.name} (${model.tag})`);

    addMessage({
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `⚡ **NEURAL MATRIX SHIFT**: Switched active local intelligence to **${model.name}** (\`${model.tag}\`).\n*Engineered by ${model.company} | ${model.size} footprint*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  const handlePullModel = async (tag: string, name: string) => {
    if (settings.soundEffects) audioService.playClickSound();
    setPullingModel(tag);
    setPullStatus('Connecting to Ollama registry...');

    const success = await ollamaService.pullModel(tag, (status) => {
      setPullStatus(status);
    });

    setPullingModel(null);
    setPullStatus('');

    if (success) {
      if (settings.soundEffects) audioService.playSuccessChime();
      await fetchStatus();
      updateSettings({
        llmProvider: 'ollama',
        modelName: tag,
      });
      showToast(`${name} downloaded and activated!`);
    } else {
      showToast(`Failed to pull ${name}. Check connection.`);
    }
  };

  const handlePullCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customModelTag.trim()) return;
    const tag = customModelTag.trim().toLowerCase();
    void handlePullModel(tag, tag);
    setCustomModelTag('');
  };

  const categories = [
    { id: 'all', label: 'All Models' },
    { id: 'reasoning', label: '🧠 Deep Reasoning' },
    { id: 'coding', label: '⚡ Coding & Dev' },
    { id: 'speed', label: '🚀 Speed & SLM' },
    { id: 'vision', label: '👁️ Multimodal Vision' },
    { id: 'agent', label: '🦅 Agentic' },
  ];

  const filteredModels = FREE_OLLAMA_MODELS.filter((m) => {
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="p-3 rounded-lg bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Ollama Status Hero Beacon */}
      <div className="p-5 rounded-xl bg-zinc-950/90 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center border"
            style={{
              borderColor: themeConfig.cssPrimary,
              backgroundColor: `${themeConfig.cssPrimary}15`,
            }}
          >
            <Cpu className="w-6 h-6" style={{ color: themeConfig.cssPrimary }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                LOCAL OLLAMA INFERENCE CORE
              </h2>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  ollamaStatus.isOnline
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-red-950 text-red-400 border border-red-800'
                }`}
              >
                {ollamaStatus.isOnline ? '🟢 ACTIVE & ONLINE' : '🔴 OFFLINE'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              100% Free, Unlimited Local Models from NVIDIA, Meta, DeepSeek, Alibaba & Vikhyat.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Active Model</div>
            <div className="text-xs font-bold text-cyan-400 font-mono">
              {settings.llmProvider === 'ollama' ? settings.modelName : 'External API'}
            </div>
          </div>

          <button
            onClick={() => void fetchStatus()}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 font-bold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Scan Models</span>
          </button>
        </div>
      </div>

      {/* Pull Progress Banner */}
      {pullingModel && (
        <div className="p-4 rounded-xl bg-cyan-950/70 border border-cyan-500/80 text-cyan-200 text-xs space-y-2 animate-pulse">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              Downloading Model: <span className="font-mono text-white">{pullingModel}</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-cyan-300">In Progress</span>
          </div>
          <p className="text-xs text-zinc-300 font-mono">{pullStatus || 'Fetching model layers...'}</p>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search free models (NVIDIA, DeepSeek, Llama, Qwen, Vision)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-all font-mono"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? 'bg-zinc-800 text-white border-cyan-500 shadow-[0_0_10px_rgba(0,243,255,0.2)]'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredModels.map((model) => {
          const installed = isModelInstalled(model.tag);
          const active = isModelActive(model.tag);
          const isDownloading = pullingModel === model.tag;

          return (
            <div
              key={model.id}
              className={`p-5 rounded-xl border transition-all relative flex flex-col justify-between ${
                active
                  ? 'bg-zinc-900/90 border-cyan-400 shadow-[0_0_20px_rgba(0,243,255,0.25)]'
                  : installed
                  ? 'bg-zinc-950/80 border-zinc-700 hover:border-zinc-500'
                  : 'bg-zinc-950/40 border-zinc-800/80 opacity-80 hover:opacity-100 hover:border-zinc-700'
              }`}
            >
              {/* Active / Badge indicator */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{model.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white tracking-wide">{model.name}</h3>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700">
                        {model.company}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-cyan-400">{model.tag}</span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    active
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500'
                      : installed
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {active ? '⚡ ACTIVE BRAIN' : installed ? '🟢 READY' : '⬇️ AVAILABLE'}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-zinc-300 leading-relaxed mb-4">{model.description}</p>

              {/* Specs & Action Row */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
                  <span>
                    Size: <strong className="text-zinc-200">{model.size}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    RAM: <strong className="text-zinc-200">{model.ram}</strong>
                  </span>
                </div>

                {active ? (
                  <div className="flex items-center gap-1 text-xs text-cyan-400 font-bold">
                    <Check className="w-4 h-4" />
                    <span>RUNNING</span>
                  </div>
                ) : installed ? (
                  <button
                    onClick={() => handleSwitchModel(model)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>SWITCH TO BRAIN</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handlePullModel(model.tag, model.name)}
                    disabled={Boolean(pullingModel)}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloading ? 'DOWNLOADING...' : '1-CLICK PULL'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Model Direct Puller */}
      <div className="p-5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-zinc-200">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>PULL ANY CUSTOM OLLAMA / HUGGINGFACE MODEL</span>
        </div>
        <p className="text-xs text-zinc-400">
          Type any valid Ollama model tag (e.g.{' '}
          <code className="text-cyan-400">gemma2:2b</code>,{' '}
          <code className="text-cyan-400">starcoder2:3b</code>,{' '}
          <code className="text-cyan-400">wizard-math</code>) to download and switch automatically.
        </p>

        <form onSubmit={handlePullCustom} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter model tag (e.g. gemma2:2b, starcoder2:3b)..."
            value={customModelTag}
            onChange={(e) => setCustomModelTag(e.target.value)}
            className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
          <button
            type="submit"
            disabled={!customModelTag.trim() || Boolean(pullingModel)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold text-xs rounded-lg flex items-center gap-2 transition-all font-mono"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PULL & ACTIVATE</span>
          </button>
        </form>
      </div>
    </div>
  );
};
