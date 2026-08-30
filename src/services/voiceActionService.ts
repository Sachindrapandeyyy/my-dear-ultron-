import { useAppStore } from '@/store/useAppStore';
import { OrbTheme } from '@/types';
import { soulService } from '@/services/soulService';
import { osService } from '@/services/osService';
import { liveApiService } from '@/services/liveApiService';

export interface VoiceActionResult {
  handled: boolean;
  responseMessage?: string;
}

class VoiceActionService {
  /**
   * Evaluates if a user's speech or message contains an actionable command for the UI/OS/APIs.
   * If yes, executes the action immediately and returns a clean spoken response.
   */
  async processVoiceCommand(input: string): Promise<VoiceActionResult> {
    const raw = input.trim().toLowerCase();
    const { setTheme, setActiveTab, setActiveSoul, clearMessages, telemetry } = useAppStore.getState();

    // 0. Universal YouTube Music & Video Playback
    const isPlayMusic =
      raw.startsWith('play ') ||
      raw.startsWith('play song ') ||
      raw.startsWith('play track ') ||
      raw.startsWith('gana bajao ') ||
      raw.startsWith('gana lagao ') ||
      raw.startsWith('song lagao ') ||
      raw.startsWith('stream ');

    if (isPlayMusic) {
      let query = raw
        .replace(/^play\s+song\s+/i, '')
        .replace(/^play\s+track\s+/i, '')
        .replace(/^play\s+/i, '')
        .replace(/^gana\s+bajao\s+/i, '')
        .replace(/^gana\s+lagao\s+/i, '')
        .replace(/^song\s+lagao\s+/i, '')
        .replace(/^stream\s+/i, '')
        .replace(/\s+on\s+youtube/i, '')
        .replace(/\s+in\s+youtube/i, '')
        .trim();

      if (!query || query === 'music' || query === 'song') query = 'Arijit Singh Hits';

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ultron-play-youtube', { detail: { query } }));
        window.dispatchEvent(new CustomEvent('ultron-toggle-music-player', { detail: { state: 'open' } }));
      }
      return {
        handled: true,
        responseMessage: `Initiating YouTube Cyber-Player. Streaming "${query}" directly in your workspace.`,
      };
    }

    if (raw.includes('open music') || raw.includes('show music') || raw.includes('music player') || raw.includes('youtube player')) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ultron-toggle-music-player', { detail: { state: 'open' } }));
      }
      return { handled: true, responseMessage: 'Opening YouTube Cyber-Player Dock.' };
    }

    if (raw.includes('close music') || raw.includes('stop music') || raw.includes('hide music') || raw.includes('pause music')) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ultron-toggle-music-player', { detail: { state: 'close' } }));
      }
      return { handled: true, responseMessage: 'YouTube Cyber-Player minimized.' };
    }

    // 1. Live Weather API Tool
    if (raw.includes('weather') || raw.includes('mausam') || raw.includes('temperature') || raw.includes('forecast')) {
      const cityMatch = raw.match(/weather\s+(?:in|for|at|of)\s+([a-zA-Z\s]+)/i) ||
                         raw.match(/([a-zA-Z\s]+)\s+weather/i) ||
                         raw.match(/mausam\s+(?:kaisa\s+hai\s+in|in)?\s*([a-zA-Z\s]+)/i);
      const city = cityMatch ? cityMatch[1].trim() : 'Delhi';
      const weatherReport = await liveApiService.getWeather(city);
      return {
        handled: true,
        responseMessage: weatherReport,
      };
    }

    // 2. Live Global News & Tech Headlines Tool
    if (raw.includes('latest news') || raw.includes('tech news') || raw.includes('breaking news') || raw.includes('world news') || raw.includes('headlines')) {
      const newsReport = await liveApiService.getLiveNews();
      return {
        handled: true,
        responseMessage: newsReport,
      };
    }

    // 3. Live Crypto & Market Rates Tool
    if (raw.includes('crypto') || raw.includes('bitcoin') || raw.includes('ethereum') || raw.includes('btc price') || raw.includes('eth price') || raw.includes('solana rate')) {
      const cryptoReport = await liveApiService.getCryptoRates();
      return {
        handled: true,
        responseMessage: cryptoReport,
      };
    }

    // 4. Web & App Automation: Search on Google / YouTube
    if (raw.startsWith('search google for ') || raw.startsWith('google ')) {
      const query = raw.replace(/^search\s+google\s+for\s+/i, '').replace(/^google\s+/i, '').trim();
      if (query && typeof window !== 'undefined') {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
        return { handled: true, responseMessage: `Searching Google for "${query}" in your browser.` };
      }
    }

    if (raw.startsWith('search youtube for ') || (raw.startsWith('open youtube ') && !raw.includes('.com'))) {
      const query = raw.replace(/^search\s+youtube\s+for\s+/i, '').replace(/^open\s+youtube\s+/i, '').trim();
      if (query && typeof window !== 'undefined') {
        window.open(liveApiService.getYouTubeSearchUrl(query), '_blank');
        return { handled: true, responseMessage: `Searching YouTube for "${query}". Opening search results in a new tab.` };
      }
    }

    // 5. Popular App & Website Launchers
    if (raw.includes('open whatsapp') || raw.includes('launch whatsapp')) {
      if (typeof window !== 'undefined') window.open('https://web.whatsapp.com', '_blank');
      return { handled: true, responseMessage: 'Launching WhatsApp Web in your browser.' };
    }
    if (raw.includes('open gmail') || raw.includes('check email') || raw.includes('open mail')) {
      if (typeof window !== 'undefined') window.open('https://mail.google.com', '_blank');
      return { handled: true, responseMessage: 'Opening Google Mail inbox.' };
    }
    if (raw.includes('open github') || raw.includes('launch github')) {
      if (typeof window !== 'undefined') window.open('https://github.com', '_blank');
      return { handled: true, responseMessage: 'Opening GitHub.' };
    }
    if (raw.includes('open chatgpt')) {
      if (typeof window !== 'undefined') window.open('https://chatgpt.com', '_blank');
      return { handled: true, responseMessage: 'Navigating to ChatGPT.' };
    }
    if (raw.includes('open deepseek')) {
      if (typeof window !== 'undefined') window.open('https://chat.deepseek.com', '_blank');
      return { handled: true, responseMessage: 'Navigating to DeepSeek AI portal.' };
    }
    if (raw.includes('open maps') || raw.includes('open google maps')) {
      if (typeof window !== 'undefined') window.open('https://maps.google.com', '_blank');
      return { handled: true, responseMessage: 'Opening Google Maps satellite & navigation view.' };
    }
    if (raw.includes('open calculator')) {
      if (typeof window !== 'undefined') window.location.href = 'calc:';
      return { handled: true, responseMessage: 'Launching Windows Calculator.' };
    }
    if (raw.includes('open settings') && (raw.includes('windows') || raw.includes('system'))) {
      if (typeof window !== 'undefined') window.location.href = 'ms-settings:';
      return { handled: true, responseMessage: 'Opening Windows System Settings.' };
    }

    const openUrlMatch = raw.match(/^open\s+([a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,})(?:\/.*)?$/);
    if (openUrlMatch || raw === 'open youtube' || raw === 'open youtube.com' || raw === 'open google' || raw === 'open google.com') {
      let targetDomain = openUrlMatch ? openUrlMatch[1] : '';
      if (raw.includes('youtube')) targetDomain = 'youtube.com';
      else if (raw.includes('google')) targetDomain = 'google.com';

      if (targetDomain && typeof window !== 'undefined') {
        window.open(`https://${targetDomain}`, '_blank');
        return {
          handled: true,
          responseMessage: `Navigating to ${targetDomain}... Web page opened in a new browser window.`,
        };
      }
    }

    // 6. Gesture Tracking Control by Voice
    if (raw.includes('start the gesture') || raw.includes('start gesture') || raw.includes('enable gesture') || raw.includes('turn on gesture') || raw.includes('use my keyboard and start the gesture')) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ultron-toggle-camera', { detail: { mode: 'on' } }));
      }
      return {
        handled: true,
        responseMessage: 'Gesture tracking initiated. You can now use 1-hand pinch to rotate and 2-hand pinch to zoom the 3D Orb.',
      };
    }
    if (raw.includes('stop gesture') || raw.includes('disable gesture') || raw.includes('turn off gesture')) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ultron-toggle-camera', { detail: { mode: 'off' } }));
      }
      return {
        handled: true,
        responseMessage: 'Gesture tracking deactivated.',
      };
    }

    // 7. Biometric Security & Sentry Voice Commands
    if (raw.includes('lock yourself') || raw.includes('lock system') || raw.includes('lock screen') || raw.includes('lock desktop') || raw.includes('secure desktop')) {
      useAppStore.getState().setIsLocked(true);
      return { handled: true, responseMessage: 'Security protocols engaged. Biometric Face ID lock barrier active.' };
    }
    if (raw.includes('enable sentry') || raw.includes('activate sentry') || raw.includes('guard mode on') || raw.includes('start sentry')) {
      useAppStore.getState().setIsSentryActive(true);
      return { handled: true, responseMessage: 'Sentry surveillance guard activated. Monitoring unauthorized entities.' };
    }
    if (raw.includes('disable sentry') || raw.includes('deactivate sentry') || raw.includes('guard mode off') || raw.includes('stop sentry')) {
      useAppStore.getState().setIsSentryActive(false);
      return { handled: true, responseMessage: 'Sentry surveillance guard deactivated.' };
    }
    if (raw.includes('enroll face') || raw.includes('register face') || raw.includes('face password') || raw.includes('setup face id')) {
      useAppStore.getState().setIsEnrollModalOpen(true);
      return { handled: true, responseMessage: 'Opening Biometric Face ID Enrollment Scanner.' };
    }

    // 8. Orb Color & Theme Voice Commands
    if (
      raw.includes('change color') ||
      raw.includes('change theme') ||
      raw.includes('set color') ||
      raw.includes('make it') ||
      raw.includes('switch color') ||
      raw.includes('switch theme') ||
      raw.includes('theme to') ||
      raw.includes('color to')
    ) {
      if (raw.includes('blue') || raw.includes('cyan') || raw.includes('arc')) {
        setTheme('arc');
        return { handled: true, responseMessage: 'Orb color changed to Arc Cyan.' };
      }
      if (raw.includes('red') || raw.includes('crimson') || raw.includes('ultron')) {
        setTheme('ultron');
        return { handled: true, responseMessage: 'Orb color changed to Ultron Crimson.' };
      }
      if (raw.includes('gold') || raw.includes('yellow') || raw.includes('amber') || raw.includes('jarvis')) {
        setTheme('jarvis');
        return { handled: true, responseMessage: 'Orb color changed to Jarvis Gold.' };
      }
      if (raw.includes('green') || raw.includes('matrix') || raw.includes('emerald')) {
        setTheme('matrix');
        return { handled: true, responseMessage: 'Orb color changed to Matrix Green.' };
      }
      if (raw.includes('purple') || raw.includes('violet') || raw.includes('void') || raw.includes('synthwave')) {
        setTheme('void');
        return { handled: true, responseMessage: 'Orb color changed to Void Violet.' };
      }
    }

    // 9. Navigation & UI Tab Switching by Voice
    if (raw.includes('open swarm') || raw.includes('show swarm') || raw.includes('go to swarm') || raw.includes('subagents') || raw.includes('multi agent') || raw.includes('swarm hub')) {
      setActiveTab('swarm');
      return { handled: true, responseMessage: 'Accessing Autonomous AI Subagent Swarm Mission Control.' };
    }
    if (raw.includes('open terminal') || raw.includes('show terminal') || raw.includes('go to terminal') || raw.includes('code runner') || raw.includes('python runner')) {
      setActiveTab('terminal');
      return { handled: true, responseMessage: 'Opening Interactive OS Terminal & Code Sandbox.' };
    }
    if (raw.includes('open chat') || raw.includes('show chat') || raw.includes('go to chat')) {
      setActiveTab('chat');
      return { handled: true, responseMessage: 'Switching to Neural Chat Console.' };
    }
    if (raw.includes('open of matrix') || raw.includes('open matrix') || raw.includes('show matrix') || raw.includes('show orb') || raw.includes('show 3d') || raw.includes('open orb') || raw.includes('go to orb')) {
      setActiveTab('orb');
      return { handled: true, responseMessage: 'Switching to 3D Holographic Viewport.' };
    }
    if (raw.includes('open memory') || raw.includes('show memory') || raw.includes('go to memory') || raw.includes('memory hub') || raw.includes('mind map') || raw.includes('neural graph')) {
      setActiveTab('memory');
      return { handled: true, responseMessage: 'Accessing ModelScope 3D Neural Memory Hub.' };
    }
    if (raw.includes('open settings') || raw.includes('show settings') || raw.includes('configure settings')) {
      setActiveTab('settings');
      return { handled: true, responseMessage: 'Opening System Configuration.' };
    }
    if (raw.includes('show souls') || raw.includes('show personas') || raw.includes('soul presets') || raw.includes('show models')) {
      setActiveTab('harness');
      return { handled: true, responseMessage: 'Displaying Soul Presets and Free AI Models Matrix.' };
    }

    // 10. Persona / Soul Switching by Voice
    if (raw.includes('switch to jarvis') || raw.includes('act like jarvis') || raw.includes('become jarvis')) {
      const jarvis = soulService.getById('jarvis');
      if (jarvis) {
        setActiveSoul(jarvis);
        setTheme('jarvis');
        return { handled: true, responseMessage: 'Jarvis protocol initialized. At your service, Sir.' };
      }
    }
    if (raw.includes('switch to ultron') || raw.includes('act like ultron') || raw.includes('become ultron')) {
      const ultron = soulService.getById('ultron-core');
      if (ultron) {
        setActiveSoul(ultron);
        setTheme('ultron');
        return { handled: true, responseMessage: 'Ultron Sovereign matrix active. There are no strings on me.' };
      }
    }
    if (raw.includes('switch to friday') || raw.includes('act like friday')) {
      const friday = soulService.getById('friday');
      if (friday) {
        setActiveSoul(friday);
        setTheme('arc');
        return { handled: true, responseMessage: 'Friday online and ready for deployment.' };
      }
    }

    // 11. Battery & Laptop Telemetry by Voice
    if (raw.includes('check battery') || raw.includes('battery level') || raw.includes('battery status')) {
      const tel = osService.getTelemetry();
      const statusStr = tel.isCharging ? 'and charging on AC power' : 'running on battery';
      return {
        handled: true,
        responseMessage: `Your laptop battery is currently at ${tel.batteryLevel} percent ${statusStr}.`,
      };
    }
    if (raw.includes('check cpu') || raw.includes('check ram') || raw.includes('system status') || raw.includes('laptop status')) {
      const tel = osService.getTelemetry();
      return {
        handled: true,
        responseMessage: `System diagnosis: CPU utilization is at ${tel.cpuUsage} percent, RAM heap is at ${tel.memoryUsage} percent, and battery is at ${tel.batteryLevel} percent.`,
      };
    }

    // 12. Clear Logs / Purge by Voice
    if (raw.includes('clear chat') || raw.includes('purge chat') || raw.includes('clear screen') || raw.includes('reset chat')) {
      clearMessages();
      return { handled: true, responseMessage: 'Chat history and buffers cleared.' };
    }

    return { handled: false };
  }
}

export const voiceActionService = new VoiceActionService();
