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

  async checkStatus(endpoint = this.defaultEndpoint): Promise<OllamaStatus> {
    try {
      const cleanEndpoint = endpoint.replace(/\/+$/, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${cleanEndpoint}/api/tags`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const models = (data.models || []).map((m: OllamaModelInfo) => m.name || m.model);
        return {
          isOnline: true,
          endpoint: cleanEndpoint,
          models,
          activeModel: models[0] || 'llama3',
        };
      } else {
        return {
          isOnline: false,
          endpoint: cleanEndpoint,
          models: [],
          activeModel: '',
          error: `HTTP ${res.status}`,
        };
      }
    } catch (e: any) {
      return {
        isOnline: false,
        endpoint,
        models: [],
        activeModel: '',
        error: e.message || 'Connection refused',
      };
    }
  }

  async testPrompt(modelName: string, prompt: string, endpoint = this.defaultEndpoint): Promise<string> {
    const cleanEndpoint = endpoint.replace(/\/+$/, '');
    const res = await fetch(`${cleanEndpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelName,
        prompt,
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama generate error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.response || '';
  }
}

export const ollamaService = new OllamaService();
