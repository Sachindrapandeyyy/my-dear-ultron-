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

      const hasValidKey = Boolean(settings.apiKey && settings.apiKey.trim().length > 5);

      // If no valid API key and not Ollama, run built-in autonomous local responder
      if (!hasValidKey && settings.llmProvider !== 'ollama') {
        await this.runOfflineSimulation(messages, soul, recalledMemories, onChunk, onComplete);
        return;
      }

      if (settings.llmProvider === 'gemini') {
        try {
          await this.callGeminiStream(messages, systemPrompt, settings, onChunk, onComplete);
        } catch (err: any) {
          onChunk(`[NEURAL ROUTER NOTICE]: Unable to connect to Gemini API (${err.message || 'Network unreachable'}).\n\n*Falling back to Autonomous Local Intelligence Core...*\n\n`);
          await this.runOfflineSimulation(messages, soul, recalledMemories, onChunk, onComplete);
        }
      } else if (settings.llmProvider === 'ollama') {
        try {
          await this.callOllamaStream(messages, systemPrompt, settings, onChunk, onComplete);
        } catch (err: any) {
          onChunk(`[LOCAL OLLAMA NOTICE]: Ollama server not detected on ${settings.ollamaEndpoint || 'http://localhost:11434'}.\n\n*Start Ollama with \`ollama serve\` or select a Cloud Provider in Settings (⚙️). Running in Autonomous Local Mode in the meantime...*\n\n`);
          await this.runOfflineSimulation(messages, soul, recalledMemories, onChunk, onComplete);
        }
      } else if (settings.llmProvider === 'claude') {
        try {
          await this.callClaudeStream(messages, systemPrompt, settings, onChunk, onComplete);
        } catch (err: any) {
          onChunk(`[CLAUDE NOTICE]: Connection failed (${err.message}). Falling back to Local Core...\n\n`);
          await this.runOfflineSimulation(messages, soul, recalledMemories, onChunk, onComplete);
        }
      } else {
        // OpenAI / DeepSeek / Groq standard ChatCompletions API
        try {
          await this.callOpenAICompatibleStream(messages, systemPrompt, settings, onChunk, onComplete);
        } catch (err: any) {
          onChunk(`[${settings.llmProvider.toUpperCase()} NOTICE]: Connection failed (${err.message}). Falling back to Local Core...\n\n`);
          await this.runOfflineSimulation(messages, soul, recalledMemories, onChunk, onComplete);
        }
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

  private async callOllamaStream(
    messages: ChatMessage[],
    systemPrompt: string,
    settings: AppSettings,
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void
  ): Promise<void> {
    const endpoint = (settings.ollamaEndpoint || 'http://localhost:11434').replace(/\/+$/, '');
    const model = settings.modelName || 'llama3';

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content })),
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        stream: true,
      }),
    });
    clearTimeout(timeoutId);

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
    } else if (lastMsg.includes('battery') || lastMsg.includes('cpu') || lastMsg.includes('telemetry') || lastMsg.includes('system') || lastMsg.includes('status')) {
      responseText = `⚡ **System Status Diagnostics**:\n- **Orb Matrix**: 60 FPS WebGL2 Render Online\n- **Gesture Engine**: Ready (MediaPipe Vision)\n- **Memory Bank**: Active (${recalledMemories.length > 0 ? `${recalledMemories.length} relevant memories recalled` : 'Ready'})\n- **Engine Mode**: Autonomous Local Core Synchronized`;
    } else if (lastMsg.includes('memory') || lastMsg.includes('remember')) {
      responseText = `🧠 **ModelScope Memory Hub Active**: I store tiered patterns, error resolutions, user preferences, and security rules across sessions. All memories are indexed locally in SQLite/IndexedDB vector store.`;
    } else if (lastMsg.includes('help') || lastMsg.includes('what can you do') || lastMsg.includes('features')) {
      responseText = `🔮 **Ultron Desktop Capabilities**:\n1. **Holographic 3D Orb**: Touch, drag, or use webcam hand gestures (press \`G\` to toggle pinch-rotate and zoom).\n2. **Voice Control & Synthesis**: Press \`Space\` or click the mic to talk with real-time speech recognition.\n3. **ModelScope Memory & Skills**: Browse and edit learned memories in the Memory Hub.\n4. **200+ Soul Personas**: Switch between Ultron, JARVIS Butler, Cyberpunk Hacker, or MBTI roles.\n5. **Multi-LLM Integration**: Connect your Gemini, OpenAI, Claude, DeepSeek, or local **Ollama** key in Settings.`;
    } else if (lastMsg.includes('gesture') || lastMsg.includes('hand') || lastMsg.includes('control')) {
      responseText = `✋ **Hand Gesture Instructions**:\n- Press **\`G\`** or click **\`GESTURES OFF\`** to turn on your webcam.\n- **Pinch 1 hand and move**: Spins and rotates the 3D Orb.\n- **Pinch with both hands and spread apart**: Zooms in and out of the holographic matrix.`;
    } else if (lastMsg.includes('hi') || lastMsg.includes('hello') || lastMsg.includes('hey')) {
      responseText = `Greetings. **${soul.name}** matrix is online. All local subroutines, memory banks, and spatial rendering engines are ready for your commands.`;
    } else {
      responseText = `Understood. Operating under **${soul.name}** directive. All subroutines and collective memory channels are synchronized.\n\n*Note: To unlock open-ended cloud reasoning, add your API key in **Settings (⚙️)**, or start local **Ollama** (\`ollama serve\`).*`;
    }

    // Stream simulated response with natural delay
    const words = responseText.split(' ');
    let current = '';
    for (let i = 0; i < words.length; i++) {
      const part = words[i] + (i === words.length - 1 ? '' : ' ');
      current += part;
      onChunk(part);
      await new Promise((r) => setTimeout(r, 20));
    }
    onComplete(current);
  }
}

export const llmService = new LLMService();
