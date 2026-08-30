import { ChatMessage, AppSettings, SoulPreset } from '@/types';

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
      const memoryPrompt = recalledMemories.length > 0
        ? `\n\n[COLLECTIVE MEMORY RECALL]:\n${recalledMemories.map((m, i) => `${i + 1}. ${m}`).join('\n')}`
        : '';

      const systemPrompt = `${soul.systemPrompt}\n\n[IDENTITY: You are ${soul.name}. Style: ${soul.vibe}]${memoryPrompt}\n[RULES: Be concise, precise, intelligent, futuristic, and helpful. You control a laptop desktop environment.]`;

      // If no API key and not Ollama, provide smart offline simulated Jarvis responses
      if (!settings.apiKey && settings.llmProvider !== 'ollama') {
        await this.runOfflineSimulation(messages, soul, recalledMemories, onChunk, onComplete);
        return;
      }

      if (settings.llmProvider === 'gemini') {
        await this.callGeminiStream(messages, systemPrompt, settings, onChunk, onComplete);
      } else if (settings.llmProvider === 'ollama') {
        await this.callOllamaStream(messages, systemPrompt, settings, onChunk, onComplete);
      } else if (settings.llmProvider === 'claude') {
        await this.callClaudeStream(messages, systemPrompt, settings, onChunk, onComplete);
      } else {
        // OpenAI / DeepSeek / Groq standard ChatCompletions API
        await this.callOpenAICompatibleStream(messages, systemPrompt, settings, onChunk, onComplete);
      }
    } catch (e: any) {
      onError(e);
    }
  }

  private async callGeminiStream(
    messages: ChatMessage[],
    systemPrompt: string,
    settings: AppSettings,
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void
  ): Promise<void> {
    const model = settings.modelName || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${settings.apiKey}`;

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
      throw new Error(`Gemini API Error (${response.status}): ${err}`);
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

    if (settings.llmProvider === 'deepseek') {
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
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`${settings.llmProvider.toUpperCase()} API Error (${response.status}): ${err}`);
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
        'x-api-key': settings.apiKey,
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
      throw new Error(`Claude API Error (${response.status}): ${err}`);
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

  private async callOllamaStream(
    messages: ChatMessage[],
    systemPrompt: string,
    settings: AppSettings,
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void
  ): Promise<void> {
    const endpoint = settings.ollamaEndpoint || 'http://localhost:11434';
    const model = settings.modelName || 'llama3';

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content })),
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
      throw new Error(`Ollama Error (${response.status}): Is Ollama running on ${endpoint}?`);
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
            const content = data.message?.content || '';
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

  private async runOfflineSimulation(
    messages: ChatMessage[],
    soul: SoulPreset,
    recalledMemories: string[],
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void
  ): Promise<void> {
    const lastMsg = messages[messages.length - 1]?.content.toLowerCase() || '';
    let responseText = '';

    if (lastMsg.includes('who are you') || lastMsg.includes('your name') || lastMsg.includes('identity')) {
      responseText = `I am **${soul.name}**, your autonomous desktop intelligence core. I combine ModelScope's self-evolving collective memory and Sagar's holographic 3D orb interface to assist you with system operations, coding, and diagnostics.`;
    } else if (lastMsg.includes('battery') || lastMsg.includes('cpu') || lastMsg.includes('telemetry') || lastMsg.includes('system')) {
      responseText = `⚡ **System Status Diagnostics**:\n- **Orb State**: 60 FPS WebGL2 Render Online\n- **Gesture Engine**: Ready (MediaPipe Vision)\n- **Memory Bank**: Active (${recalledMemories.length > 0 ? `${recalledMemories.length} relevant memories recalled` : 'Ready'})\n- **Engine Mode**: Standalone Desktop Protocol`;
    } else if (lastMsg.includes('memory') || lastMsg.includes('remember')) {
      responseText = `🧠 **ModelScope Memory Hub Active**: I store tiered patterns, error resolutions, user preferences, and security rules across sessions. All memories are indexed locally in SQLite/IndexedDB vector store.`;
    } else if (lastMsg.includes('help') || lastMsg.includes('what can you do')) {
      responseText = `🔮 **Ultron Desktop Capabilities**:\n1. **Holographic 3D Orb**: Touch, drag, or use webcam hand gestures (press \`G\` to toggle pinch-rotate and zoom).\n2. **Voice Control**: Press \`Space\` or click the mic to talk with real-time speech recognition.\n3. **ModelScope Memory & Skills**: Browse and edit learned memories in the Memory Hub.\n4. **200+ Soul Personas**: Switch between Ultron, JARVIS Butler, Cyberpunk Hacker, or MBTI roles.\n5. **Multi-LLM Integration**: Connect your Gemini, OpenAI, Claude, DeepSeek, or local Ollama key in Settings.`;
    } else {
      responseText = `Affirmative. Operating under **${soul.name}** directive. All subroutines and collective memory channels are synchronized. You can provide an API key in **Settings (⚙️)** or connect local **Ollama** to unlock full unconstrained LLM reasoning.`;
    }

    // Stream simulated response with natural delay
    const words = responseText.split(' ');
    let current = '';
    for (let i = 0; i < words.length; i++) {
      const part = words[i] + (i === words.length - 1 ? '' : ' ');
      current += part;
      onChunk(part);
      await new Promise((r) => setTimeout(r, 25));
    }
    onComplete(current);
  }
}

export const llmService = new LLMService();
