export interface OllamaModelInfo {
  name: string;
  model: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaStatus {
  isOnline: boolean;
  endpoint: string;
  models: string[];
  activeModel: string;
  error?: string;
}

export interface FreeCuratedModel {
  id: string;
  tag: string;
  name: string;
  company: string;
  size: string;
  ram: string;
  category: 'speed' | 'reasoning' | 'coding' | 'vision' | 'agent';
  description: string;
  badge: string;
  icon: string;
}

export const FREE_OLLAMA_MODELS: FreeCuratedModel[] = [
  {
    id: 'nvidia-nemotron',
    tag: 'nemotron-mini',
    name: 'NVIDIA Nemotron Mini',
    company: 'NVIDIA',
    size: '2.7 GB',
    ram: '4.0 GB',
    category: 'reasoning',
    description: 'NVIDIA optimized 4B reasoning and instruction following SLM for high-speed local inference.',
    badge: 'NVIDIA NEURAL',
    icon: '💚',
  },
  {
    id: 'meta-llama-3-2',
    tag: 'llama3.2:latest',
    name: 'Meta Llama 3.2',
    company: 'Meta AI',
    size: '2.0 GB',
    ram: '3.0 GB',
    category: 'speed',
    description: 'Compact, lightning-fast 3B model ideal for instantaneous everyday chat, math, and tools.',
    badge: 'DEFAULT CORE',
    icon: '🦙',
  },
  {
    id: 'moondream-vision',
    tag: 'moondream',
    name: 'Moondream 2 Vision',
    company: 'Vikhyat',
    size: '828 MB',
    ram: '1.5 GB',
    category: 'vision',
    description: 'Ultra-lightweight multimodal vision model for desktop screenshot inspection and visual Q&A.',
    badge: 'VISION CAPABLE',
    icon: '👁️',
  },
  {
    id: 'deepseek-r1-1-5b',
    tag: 'deepseek-r1:1.5b',
    name: 'DeepSeek R1 (1.5B)',
    company: 'DeepSeek AI',
    size: '1.1 GB',
    ram: '2.0 GB',
    category: 'reasoning',
    description: 'World-class reasoning model with step-by-step thinking chain for complex logic and math.',
    badge: 'DEEP THINKING',
    icon: '🧠',
  },
  {
    id: 'qwen2-5-coder',
    tag: 'qwen2.5-coder:3b',
    name: 'Qwen 2.5 Coder',
    company: 'Alibaba Cloud',
    size: '1.9 GB',
    ram: '3.0 GB',
    category: 'coding',
    description: 'State of the art code synthesis, debugging, and multi-language software architecture.',
    badge: 'CODE SPECIALIST',
    icon: '⚡',
  },
  {
    id: 'nous-hermes-3',
    tag: 'hermes3:8b',
    name: 'Nous Hermes 3 (8B)',
    company: 'Nous Research',
    size: '4.7 GB',
    ram: '6.0 GB',
    category: 'agent',
    description: 'Advanced agentic roleplay, system steering, and unrestricted autonomous problem solving.',
    badge: 'AUTONOMOUS AGENT',
    icon: '🦅',
  },
  {
    id: 'mistral-7b',
    tag: 'mistral:latest',
    name: 'Mistral 7B',
    company: 'Mistral AI',
    size: '4.1 GB',
    ram: '5.5 GB',
    category: 'reasoning',
    description: 'Premier European open-weight powerhouse known for natural conversational reasoning.',
    badge: 'HIGH CAPACITY',
    icon: '🌪️',
  },
  {
    id: 'phi3-5-mini',
    tag: 'phi3.5:3.8b',
    name: 'Microsoft Phi 3.5 Mini',
    company: 'Microsoft',
    size: '2.2 GB',
    ram: '3.5 GB',
    category: 'speed',
    description: 'Highly trained synthetic reasoning SLM with exceptional performance per parameter.',
    badge: 'MICROSOFT SLM',
    icon: '🚀',
  },
];

class OllamaService {
  private defaultEndpoint = 'http://localhost:11434';

  resolveEndpoint(endpoint?: string): string {
    const ep = endpoint || this.defaultEndpoint;
    if (typeof window !== 'undefined' && (ep.includes('localhost:11434') || ep.includes('127.0.0.1:11434'))) {
      return '/ollama';
    }
    return ep.replace(/\/+$/, '');
  }

  async checkStatus(endpoint = this.defaultEndpoint): Promise<OllamaStatus> {
    const urlsToTry = [this.resolveEndpoint(endpoint), endpoint.replace(/\/+$/, '')];

    for (const url of urlsToTry) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${url}/api/tags`, {
          method: 'GET',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const models = (data.models || []).map((m: OllamaModelInfo) => m.name || m.model);
          return {
            isOnline: true,
            endpoint: url,
            models,
            activeModel: models[0] || 'llama3.2:latest',
          };
        }
      } catch {}
    }

    return {
      isOnline: false,
      endpoint,
      models: [],
      activeModel: '',
      error: 'Connection refused',
    };
  }

  async pullModel(modelName: string, onProgress?: (status: string) => void): Promise<boolean> {
    const endpoint = this.resolveEndpoint();
    try {
      const response = await fetch(`${endpoint}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: true }),
      });

      if (!response.ok) return false;
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (onProgress && data.status) {
                onProgress(data.status);
              }
            } catch {}
          }
        }
      }
      return true;
    } catch {
      return false;
    }
  }
}

export const ollamaService = new OllamaService();
