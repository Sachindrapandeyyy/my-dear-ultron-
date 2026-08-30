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
}

export const ollamaService = new OllamaService();
