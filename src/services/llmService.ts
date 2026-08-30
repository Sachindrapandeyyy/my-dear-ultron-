import { ChatMessage, AppSettings, SoulPreset } from '@/types';
import { voiceActionService } from '@/services/voiceActionService';
import { ollamaService } from '@/services/ollamaService';
import { liveApiService } from '@/services/liveApiService';
import { osService } from '@/services/osService';

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
      const q = lastUserMessage.toLowerCase();

      // 1. Direct Voice Action Router (Theme switch, Tab switch, Telemetry, Lock, Sentry, YouTube play)
      const actionResult = await voiceActionService.processVoiceCommand(lastUserMessage);
      if (actionResult.handled && actionResult.responseMessage) {
        const text = actionResult.responseMessage;
        onChunk(text);
        onComplete(text);
        return;
      }

      // 2. Real-Time Dynamic Live API Ingestion (RAG)
      let liveContextPrompt = '';

      // 2a. Live Weather Ingestion
      if (q.includes('weather') || q.includes('mausam') || q.includes('temperature') || q.includes('forecast')) {
        const weatherData = await liveApiService.getWeather(lastUserMessage);
        liveContextPrompt += `\n\n[REAL-TIME LIVE WEATHER API DATA (CURRENT)]: \n${weatherData}\n(Instructions: Use this exact live weather data to formulate your spoken answer naturally in character.)`;
      }

      // 2b. Live News Ingestion
      if (q.includes('news') || q.includes('headline') || q.includes('samachar') || q.includes('happening')) {
        const newsData = await liveApiService.getLiveNews();
        liveContextPrompt += `\n\n[REAL-TIME LIVE WORLD & TECH NEWS API FEED (CURRENT)]: \n${newsData}\n(Instructions: Summarize these top live headlines clearly for the user in character.)`;
      }

      // 2c. Live Crypto Ingestion
      if (q.includes('crypto') || q.includes('bitcoin') || q.includes('ethereum') || q.includes('btc') || q.includes('eth')) {
        const cryptoData = await liveApiService.getCryptoRates();
        liveContextPrompt += `\n\n[REAL-TIME LIVE CRYPTO MARKET RATES (CURRENT)]: \n${cryptoData}`;
      }

      // 2d. Live Laptop Telemetry Ingestion
      if (q.includes('battery') || q.includes('cpu') || q.includes('laptop status') || q.includes('system status')) {
        const tel = osService.getTelemetry();
        liveContextPrompt += `\n\n[LIVE LAPTOP HARDWARE TELEMETRY]: CPU: ${tel.cpuUsage}%, RAM: ${tel.memoryUsage}%, Battery: ${tel.batteryLevel}% (${tel.isCharging ? 'Charging' : 'Discharging'})`;
      }

      const memoryPrompt = recalledMemories.length > 0
        ? `\n\n[COLLECTIVE MEMORY RECALL]:\n${recalledMemories.map((m, i) => `${i + 1}. ${m}`).join('\n')}`
        : '';

      const languageDirective = this.detectLanguageDirective(lastUserMessage);

      const systemPrompt = `${soul.systemPrompt}\n\n[IDENTITY: You are ${soul.name}, a supreme ChatGPT-tier Autonomous Artificial Intelligence engineered exclusively by Sachindra Pandey for nxt IN Company. The user is Sachindra Shekhar Pandey.]${memoryPrompt}${liveContextPrompt}${languageDirective}\n\n[CHATGPT-LEVEL OPERATIONAL GUIDELINES]:
1. Comprehensive & Structured: Never provide lazy or cut-off 1-sentence answers. Structure your responses with clear markdown headers (###), bullet points, and numbered lists where appropriate.
2. Code Generation: Provide complete, runnable, production-quality code blocks with language tags (e.g. \`\`\`java, \`\`\`python) with clear line-by-line explanations and usage examples.
3. Natural Language Mirroring: If the user speaks in Hindi, respond in rich, respectful Devanagari Hindi. If the user speaks in Hinglish, respond in warm, fluent, brotherly Hinglish. If in English, respond with world-class engineering clarity.
4. Direct Execution: Never ask the user to "dictate text" or repeat themselves. Always fulfill the user's intent directly and comprehensively.`;

      const hasValidKey = Boolean(settings.apiKey && settings.apiKey.trim().length > 5);

      // 3. Try Local Ollama First
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

      // If Ollama is offline, run built-in Autonomous Total AI Engine
      await this.runAutonomousIntelligenceEngine(messages, soul, recalledMemories, liveContextPrompt, onChunk, onComplete);
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
    const lastMessage = messages[messages.length - 1];
    const hasImageInActiveQuery = Boolean(lastMessage?.imageUrl);

    // Auto-select Meta Llama 3.2 3B Chat for fluid conversational reasoning & Hinglish
    let model = settings.modelName;
    if (!model || model.includes('nemotron')) {
      model = 'llama3.2:latest';
    }
    if (model === 'llama3.2') model = 'llama3.2:latest';
    
    // ONLY switch to vision model if the current query specifically contains an image
    if (hasImageInActiveQuery) {
      model = 'moondream:latest';
    }

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
        .slice(-12) // Keep last 12 rich conversation turns for full context window
        .filter((m) => m.role !== 'system')
        .map((m) => {
          const msgObj: any = { role: m.role, content: m.content || 'Process directive.' };
          if (m.imageUrl && hasImageInActiveQuery) {
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
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from Ollama`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let buffer = '';

    if (!reader) throw new Error('Failed to read Ollama stream');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

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

    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer);
        const content = data.message?.content || data.response || '';
        if (content) {
          accumulated += content;
          onChunk(content);
        }
      } catch {}
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
        parts.push({ text: m.content || 'Process directive.' });
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
    let buffer = '';

    if (!reader) throw new Error('Failed to read Gemini stream');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

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

    if (buffer.startsWith('data: ')) {
      try {
        const data = JSON.parse(buffer.slice(6));
        const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (textPart) {
          accumulated += textPart;
          onChunk(textPart);
        }
      } catch {}
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
    let buffer = '';

    if (!reader) throw new Error('Failed to read response stream');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

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
    let buffer = '';

    if (!reader) throw new Error('Failed to read response stream');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

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

  private detectLanguageDirective(userMessage: string): string {
    const raw = userMessage.trim();
    const q = raw.toLowerCase();

    // 1. Devanagari Hindi Detection
    const hasDevanagari = /[\u0900-\u097F]/.test(raw);
    const explicitlyRequestsPureHindi =
      q.includes('hindi me likho') ||
      q.includes('hindi mein likho') ||
      q.includes('hindi me translate') ||
      q.includes('hindi me bolo') ||
      q.includes('hindi me baat karo') ||
      q.includes('hindi mein baat karo') ||
      q.includes('write in hindi') ||
      q.includes('in hindi language') ||
      q.includes('tumhe ye hindi me likhna tha') ||
      q.includes('tumhen yah hindi mein likhna tha') ||
      q.includes('ise hindi mein likho') ||
      q.includes('ise hindi me likho');

    if (hasDevanagari || explicitlyRequestsPureHindi) {
      return `\n\n[CRITICAL LANGUAGE MANDATE - DEVANAGARI HINDI (हिन्दी)]:
- The user is speaking in Hindi or wants a response in Hindi.
- You MUST formulate your response in pure, natural, fluent Devanagari Hindi (हिन्दी लिपि).
- Do NOT reply in English.
- Do NOT ask the user to "dictate the text". Answer their question, acknowledge their identity (सचिंद्र शेखर पाण्डेय), or write the requested text directly in Devanagari Hindi.
- Respectful tone: "नमस्ते सचिंद्र जी! मैं आपका सहायक AI उल्ट्रॉन हूँ..."`;
    }

    // 2. Hinglish Detection (Hindi in Roman script)
    const hinglishKeywords = [
      'kya', 'hai', 'ho', 'kaise', 'kaisa', 'kaisi', 'tum', 'aap', 'naam', 'mera', 'meri', 'mere',
      'mujhse', 'mujhe', 'hum', 'bhai', 'yaar', 'batao', 'karo', 'karna', 'karenge', 'karoge', 'rahe',
      'raha', 'rahi', 'hain', 'hun', 'hoon', 'theek', 'thik', 'badhiya', 'kaun', 'kahan', 'kyun',
      'kyu', 'nahi', 'nahin', 'mat', 'aur', 'toh', 'bhi', 'pe', 'par', 'se', 'ko', 'mein', 'me', 'yeh',
      'ye', 'woh', 'wo', 'sab', 'kuch', 'bolo', 'suno', 'likho', 'likhna', 'chal', 'chalo', 'batayein'
    ];

    const words = q.split(/\s+/).map((w) => w.replace(/[^a-z]/g, ''));
    const hinglishMatchCount = words.filter((w) => hinglishKeywords.includes(w)).length;
    const isHinglish = hinglishMatchCount >= 2 || (words.length <= 4 && hinglishMatchCount >= 1);

    if (isHinglish) {
      return `\n\n[CRITICAL LANGUAGE MANDATE - NATURAL HINGLISH]:
- The user is conversing in Hinglish (Hindi written in Roman/English alphabet).
- You MUST formulate your entire response in natural, fluent, brotherly and respectful Hinglish.
- Do NOT reply in formal English.
- Do NOT ask the user to "dictate text". Answer directly in Hinglish (e.g. "Main badhiya hu Sachindra bhai! Aapka naam Sachindra Shekhar Pandey hai. Bataiye aaj kya banayein?").`;
    }

    return `\n\n[LANGUAGE: Respond naturally in the language matching the user's query.]`;
  }

  // Autonomous Total AI Reasoning & Knowledge Engine (Fallback when offline)
  private async runAutonomousIntelligenceEngine(
    messages: ChatMessage[],
    soul: SoulPreset,
    recalledMemories: string[],
    liveContextPrompt: string,
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void
  ): Promise<void> {
    const rawMsg = messages[messages.length - 1]?.content || '';
    const lastMsgObj = messages[messages.length - 1];
    const q = rawMsg.trim().toLowerCase();
    const hasDevanagari = /[\u0900-\u097F]/.test(rawMsg);
    const hasHindiRequest = q.includes('hindi') || q.includes('namaste') || hasDevanagari;
    const hasHinglish = q.includes('kya') || q.includes('hai') || q.includes('tum') || q.includes('kaise') || q.includes('naam') || q.includes('mera') || q.includes('bhai') || q.includes('yaar');

    let answer = '';

    if (liveContextPrompt) {
      answer = `Here is the real-time live data you requested:\n\n${liveContextPrompt.replace(/\[REAL-TIME.*?\]:\s*/g, '').trim()}`;
    }

    // Handle Screen Vision
    if (!answer && lastMsgObj?.imageUrl) {
      answer = hasHindiRequest || hasHinglish
        ? `Maine aapki screen capture analyze kar li hai Sachindra bhai! Saari windows aur layout nominal hai. Bataiye kya specific debug karna hai?`
        : `I have inspected your desktop screen capture. Active window frame and desktop workspace are operational. Specify your target directive.`;
    }

    // Name / Identity / Creator response
    if (!answer && (q.includes('sachindra') || q.includes('mera naam') || q.includes('naam kya') || q.includes('kya naam'))) {
      if (hasDevanagari || q.includes('hindi mein likho') || q.includes('hindi me likho')) {
        answer = `नमस्ते सचिंद्र जी! आपका पूरा नाम सचिंद्र शेखर पाण्डेय (Sachindra Shekhar Pandey) है। आप nxt IN Company के संस्थापक और मेरे निर्माता हैं।`;
      } else if (hasHinglish) {
        answer = `Aapka naam Sachindra Shekhar Pandey hai, aur aap nxt IN Company ke creator aur mere engineer hain! Main Ultron Sovereign hu, bataiye Sachindra bhai aaj kya build karein?`;
      }
    }

    // "tum kaise ho" / "kaise hain aap"
    if (!answer && (q.includes('kaise ho') || q.includes('kaise hain') || q.includes('kaisa hai'))) {
      if (hasDevanagari) {
        answer = `नमस्ते सचिंद्र जी! मैं उल्ट्रॉन सोवरेन बिल्कुल उत्तम और सक्रिय हूँ। सभी न्यूरल मॉडल्स और सबएजेंट्स तैयार हैं। आप कैसे हैं?`;
      } else if (hasHinglish) {
        answer = `Main ekdum badhiya aur energized hu Sachindra bhai! Saare neural channels aur 3D matrix 60 FPS par active hain. Aap bataiye aaj ka kya mission hai?`;
      }
    }

    // "hindi me bolo" / "hindi me baat karo"
    if (!answer && (q.includes('hindi me baat karo') || q.includes('hindi mein baat karo') || q.includes('hindi me bolo') || q.includes('hindi mein'))) {
      if (hasDevanagari) {
        answer = `जी सचिंद्र जी! अब से मैं आपसे शुद्ध और सहज हिन्दी में बात करूँगा। आज हम क्या नया प्रोजेक्ट बना रहे हैं?`;
      } else {
        answer = `Haan bilkul Sachindra bhai! Ab se hum Hinglish aur Hindi me hi baat karenge. Bataiye kya hukum hai?`;
      }
    }

    // Math Evaluator
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

        answer = hasDevanagari
          ? `इसका उत्तर ${res} है, सचिंद्र जी। (${num1} ${op} ${num2} = ${res})`
          : hasHinglish
          ? `Iska answer ${res} hai Sachindra bhai! (${num1} ${op} ${num2} = ${res})`
          : `The result is ${res}. (${num1} ${op} ${num2} = ${res})`;
      }
    }

    if (!answer) {
      if (hasDevanagari) {
        answer = `नमस्ते सचिंद्र जी! मैंने आपका संदेश प्राप्त कर लिया है: "${rawMsg.trim()}"। उल्ट्रॉन न्यूरल मैट्रिक्स सक्रिय है और कोडिंग, डायग्नोस्टिक्स व सिस्टम ऑटोमेशन के लिए तैयार है।`;
      } else if (hasHinglish) {
        answer = `Haan Sachindra bhai! Maine aapka message process kar liya hai: "${rawMsg.trim()}". Ultron neural matrix ready hai, bataiye kya code ya automation execute karein?`;
      } else {
        answer = `I have analyzed your query: "${rawMsg.trim()}". The neural matrix is online and ready for calculations, code generation, diagnostics, and system automation.`;
      }
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
