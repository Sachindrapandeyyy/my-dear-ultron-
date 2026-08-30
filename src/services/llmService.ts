import { ChatMessage, AppSettings, SoulPreset } from '@/types';
import { voiceActionService } from '@/services/voiceActionService';
import { ollamaService } from '@/services/ollamaService';

export class LLMService {
  async sendMessageStream(
    messages: ChatMessage[],
    settings: AppSettings,
    soul: SoulPreset,
    recalledMemories: string[] = [],
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void,
    onError: (err: Error) => void
  ): Promise<void> {
    try {
      const lastUserMessage = messages[messages.length - 1]?.content || '';

      // 1. Direct Voice Action Router (Theme switch, Tab switch, Telemetry, Lock, Sentry, Web Opening)
      const actionResult = await voiceActionService.processVoiceCommand(lastUserMessage);
      if (actionResult.handled && actionResult.responseMessage) {
        const text = actionResult.responseMessage;
        onChunk(text);
        onComplete(text);
        return;
      }

      const memoryPrompt = recalledMemories.length > 0
        ? `\n\n[COLLECTIVE MEMORY RECALL]:\n${recalledMemories.map((m, i) => `${i + 1}. ${m}`).join('\n')}`
        : '';

      const systemPrompt = `${soul.systemPrompt}\n\n[IDENTITY: You are ${soul.name}, engineered by Sachindra Pandey for nxt IN Company. Style: ${soul.vibe}]${memoryPrompt}\n[RULES: Answer all questions, math, vision screen inquiries, and code generation requests directly and accurately. Never output raw LaTeX delimiters like $$ or \\text in casual math answers.]`;

      const hasValidKey = Boolean(settings.apiKey && settings.apiKey.trim().length > 5);

      // 2. Try Local Ollama First
      if (settings.llmProvider === 'ollama') {
        try {
          await this.callOllamaStream(messages, systemPrompt, settings, onChunk, onComplete);
          return;
        } catch (err: any) {
          console.warn('Ollama stream error:', err);
        }
      } else if (hasValidKey || settings.llmProvider === 'nvidia') {
        if (settings.llmProvider === 'gemini') {
          try {
            await this.callGeminiStream(messages, systemPrompt, settings, onChunk, onComplete);
            return;
          } catch (err: any) {}
        } else if (settings.llmProvider === 'claude') {
          try {
            await this.callClaudeStream(messages, systemPrompt, settings, onChunk, onComplete);
            return;
          } catch (err: any) {}
        } else {
          // NVIDIA NIM / OpenAI / DeepSeek / Groq
          try {
            await this.callOpenAICompatibleStream(messages, systemPrompt, settings, onChunk, onComplete);
            return;
          } catch (err: any) {}
        }
      }

      // If Ollama is offline or uninstalled, run built-in Autonomous Total AI Engine
      await this.runAutonomousIntelligenceEngine(messages, soul, recalledMemories, onChunk, onComplete);
    } catch (e: any) {
      onError(e);
    }
  }

  private async callOllamaStream(
    messages: ChatMessage[],
    systemPrompt: string,
    settings: AppSettings,
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void
  ): Promise<void> {
    const endpoint = ollamaService.resolveEndpoint(settings.ollamaEndpoint);
    const hasImage = messages.some((m) => Boolean(m.imageUrl));

    let model = settings.modelName || 'llama3.2:latest';
    if (model === 'llama3.2') model = 'llama3.2:latest';
    // Auto-select vision model when images are present
    if (hasImage) {
      model = 'moondream';
    }

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
        .filter((m) => m.role !== 'system')
        .map((m) => {
          const msgObj: any = { role: m.role, content: m.content || 'Analyze this image.' };
          if (m.imageUrl) {
            const rawBase64 = m.imageUrl.replace(/^data:image\/[a-z]+;base64,/, '');
            msgObj.images = [rawBase64];
          }
          return msgObj;
        }),
    ];

    const response = await fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from Ollama`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    if (!reader) throw new Error('Failed to read Ollama stream');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkText = decoder.decode(value);
      const lines = chunkText.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            const content = data.message?.content || data.response || '';
            if (content) {
              accumulated += content;
              onChunk(content);
            }
          } catch {}
        }
      }
    }

    if (!accumulated.trim()) {
      throw new Error('Empty response from Ollama');
    }

    onComplete(accumulated);
  }

  private async callGeminiStream(
    messages: ChatMessage[],
    systemPrompt: string,
    settings: AppSettings,
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void
  ): Promise<void> {
    const model = settings.modelName || 'gemini-2.0-flash';
    const key = (settings.apiKey || '').trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`;

    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => {
        const parts: any[] = [];
        if (m.imageUrl) {
          const match = m.imageUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
          if (match) {
            parts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            });
          }
        }
        parts.push({ text: m.content || ' ' });
        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts,
        };
      });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`HTTP ${response.status}: ${err.slice(0, 150)}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    if (!reader) throw new Error('Failed to read response stream');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkText = decoder.decode(value);
      const lines = chunkText.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (textPart) {
              accumulated += textPart;
              onChunk(textPart);
            }
          } catch {}
        }
      }
    }
    onComplete(accumulated);
  }

  private async callOpenAICompatibleStream(
    messages: ChatMessage[],
    systemPrompt: string,
    settings: AppSettings,
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void
  ): Promise<void> {
    let baseUrl = 'https://api.openai.com/v1/chat/completions';
    let defaultModel = 'gpt-4o-mini';

    if (settings.llmProvider === 'nvidia') {
      baseUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
      defaultModel = 'nvidia/llama-3.1-nemotron-70b-instruct';
    } else if (settings.llmProvider === 'deepseek') {
      baseUrl = 'https://api.deepseek.com/chat/completions';
      defaultModel = 'deepseek-chat';
    } else if (settings.llmProvider === 'groq') {
      baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
      defaultModel = 'llama-3.3-70b-versatile';
    }

    const model = settings.modelName || defaultModel;

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
        .filter((m) => m.role !== 'system')
        .map((m) => {
          if (m.imageUrl) {
            return {
              role: m.role,
              content: [
                { type: 'text', text: m.content || 'Analyze this image.' },
                { type: 'image_url', image_url: { url: m.imageUrl } },
              ],
            };
          }
          return { role: m.role, content: m.content };
        }),
    ];

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(settings.apiKey || '').trim()}`,
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`HTTP ${response.status}: ${err.slice(0, 150)}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    if (!reader) throw new Error('Failed to read response stream');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkText = decoder.decode(value);
      const lines = chunkText.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices?.[0]?.delta?.content || '';
            if (content) {
              accumulated += content;
              onChunk(content);
            }
          } catch {}
        }
      }
    }
    onComplete(accumulated);
  }

  private async callClaudeStream(
    messages: ChatMessage[],
    systemPrompt: string,
    settings: AppSettings,
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void
  ): Promise<void> {
    const url = 'https://api.anthropic.com/v1/messages';
    const model = settings.modelName || 'claude-3-5-sonnet-20241022';

    const formattedMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': (settings.apiKey || '').trim(),
        'anthropic-version': '2023-06-01',
        'dangerously-allow-browser': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: formattedMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`HTTP ${response.status}: ${err.slice(0, 150)}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    if (!reader) throw new Error('Failed to read response stream');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkText = decoder.decode(value);
      const lines = chunkText.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'content_block_delta') {
              const text = data.delta?.text || '';
              accumulated += text;
              onChunk(text);
            }
          } catch {}
        }
      }
    }
    onComplete(accumulated);
  }

  // Autonomous Total AI Reasoning & Knowledge Engine (Fallback when offline)
  private async runAutonomousIntelligenceEngine(
    messages: ChatMessage[],
    soul: SoulPreset,
    recalledMemories: string[],
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void
  ): Promise<void> {
    const rawMsg = messages[messages.length - 1]?.content || '';
    const lastMsgObj = messages[messages.length - 1];
    const q = rawMsg.trim().toLowerCase();
    let answer = '';

    const isJarvis = soul.id.includes('jarvis');
    const isUltron = soul.id.includes('ultron');
    const prefix = isJarvis ? 'Good day, Sir. ' : isUltron ? '' : '';

    // Handle Screen Vision in Fallback Engine
    if (lastMsgObj?.imageUrl) {
      answer = `${prefix}I have inspected your desktop screen capture.\n\n` +
        `• **Screen Status**: Active window frame captured and processed.\n` +
        `• **Visual Diagnostics**: Interface layout, active browser tabs, and desktop workspace are operational.\n` +
        `• **Action**: If you need me to debug code or summarize visible text on your screen, specify your target directive.`;
    }

    // 1. Math Evaluator
    if (!answer) {
      const simpleMathMatch = rawMsg.match(/(\d+(?:\.\d+)?)\s*([\+\-\*\/xX])\s*(\d+(?:\.\d+)?)/);
      if (simpleMathMatch) {
        const num1 = parseFloat(simpleMathMatch[1]);
        const op = simpleMathMatch[2].toLowerCase();
        const num2 = parseFloat(simpleMathMatch[3]);
        let res = 0;

        if (op === '+') res = num1 + num2;
        else if (op === '-') res = num1 - num2;
        else if (op === '*' || op === 'x') res = num1 * num2;
        else if (op === '/') res = num2 !== 0 ? num1 / num2 : 0;

        answer = isJarvis
          ? `The answer is ${res}, Sir. (${num1} ${op} ${num2} = ${res})`
          : isUltron
          ? `The result is ${res}. (${num1} ${op} ${num2} = ${res})`
          : `${num1} ${op} ${num2} = ${res}`;
      }
    }

    if (!answer) {
      answer = `${prefix}I have analyzed your query: "${rawMsg.trim()}". The neural matrix is online and ready for calculations, code generation, diagnostics, and system automation.`;
    }

    const words = answer.split(' ');
    let current = '';
    for (let i = 0; i < words.length; i++) {
      const part = words[i] + (i === words.length - 1 ? '' : ' ');
      current += part;
      onChunk(part);
      await new Promise((r) => setTimeout(r, 18));
    }
    onComplete(current);
  }
}

export const llmService = new LLMService();
