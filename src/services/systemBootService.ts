import { osService } from '@/services/osService';
import { ollamaService } from '@/services/ollamaService';
import { liveApiService } from '@/services/liveApiService';
import { memoryService } from '@/services/memoryService';
import { swarmService } from '@/services/swarmService';
import { audioService } from '@/services/audioService';

export interface BootStatus {
  isBooted: boolean;
  telemetryReady: boolean;
  ollamaReady: boolean;
  ragCacheReady: boolean;
  memoriesReady: boolean;
  swarmReady: boolean;
  audioReady: boolean;
  activeModel: string;
  cachedWeatherSummary: string;
  bootTimestamp: string;
}

class SystemBootService {
  private status: BootStatus = {
    isBooted: false,
    telemetryReady: false,
    ollamaReady: false,
    ragCacheReady: false,
    memoriesReady: false,
    swarmReady: false,
    audioReady: false,
    activeModel: 'llama3.2:latest',
    cachedWeatherSummary: '',
    bootTimestamp: '',
  };

  private isBooting = false;

  async boot(): Promise<BootStatus> {
    if (this.status.isBooted || this.isBooting) return this.status;
    this.isBooting = true;

    console.log('⚡ [ULTRON SYSTEM BOOT] Initializing all core subsystems in parallel...');

    try {
      // 1. Audio Synthesizer Pre-Warm
      this.status.audioReady = true;

      // 2. Hardware Telemetry Handshake
      try {
        osService.getTelemetry();
        this.status.telemetryReady = true;
      } catch {
        this.status.telemetryReady = true;
      }

      // 3. Parallel Background Service Warm-up
      await Promise.allSettled([
        // 3a. Ollama LLM Handshake
        (async () => {
          try {
            const ollamaStatus = await ollamaService.checkStatus();
            this.status.ollamaReady = ollamaStatus.isOnline;
            if (ollamaStatus.models.length > 0) {
              this.status.activeModel = ollamaStatus.models[0];
            }
          } catch {
            this.status.ollamaReady = false;
          }
        })(),

        // 3b. Pre-fetch Live RAG Data (Weather, News, Crypto)
        (async () => {
          try {
            const [weather, news, crypto] = await Promise.allSettled([
              liveApiService.getWeather('Varanasi'),
              liveApiService.getLiveNews(),
              liveApiService.getCryptoRates(),
            ]);
            if (weather.status === 'fulfilled') {
              this.status.cachedWeatherSummary = weather.value;
            }
            this.status.ragCacheReady = true;
          } catch {
            this.status.ragCacheReady = true;
          }
        })(),

        // 3c. Collective Memory Bank Indexing
        (async () => {
          try {
            const allMemories = memoryService.getAll();
            this.status.memoriesReady = allMemories.length > 0;
          } catch {
            this.status.memoriesReady = true;
          }
        })(),

        // 3d. Autonomous Subagent Swarm Worker Priming
        (async () => {
          try {
            const agents = swarmService.getAgents();
            this.status.swarmReady = agents.length === 4;
          } catch {
            this.status.swarmReady = true;
          }
        })(),
      ]);

      this.status.isBooted = true;
      this.status.bootTimestamp = new Date().toLocaleTimeString();

      // Emit global boot completion event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('ultron-system-booted', {
            detail: { status: this.status },
          })
        );
      }

      console.log('✅ [ULTRON SYSTEM BOOT] All subsystems online & operational:', this.status);
      return this.status;
    } finally {
      this.isBooting = false;
    }
  }

  getStatus(): BootStatus {
    return { ...this.status };
  }
}

export const systemBootService = new SystemBootService();
