import { useAppStore } from '@/store/useAppStore';
import { OrbTheme } from '@/types';
import { soulService } from '@/services/soulService';
import { osService } from '@/services/osService';

export interface VoiceActionResult {
  handled: boolean;
  responseMessage?: string;
}

class VoiceActionService {
  /**
   * Evaluates if a user's speech or message contains an actionable command for the UI/OS.
   * If yes, executes the action immediately in the app state and returns a clean spoken response.
   */
  async processVoiceCommand(input: string): Promise<VoiceActionResult> {
    const raw = input.trim().toLowerCase();
    const { setTheme, setActiveTab, setActiveSoul, clearMessages, telemetry } = useAppStore.getState();

    // 0. Biometric Security & Sentry Voice Commands
    if (raw.includes('lock system') || raw.includes('lock screen') || raw.includes('lock desktop') || raw.includes('secure desktop')) {
      useAppStore.getState().setIsLocked(true);
      return { handled: true, responseMessage: 'Biometric Face ID lock matrix engaged. Desktop secured.' };
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

    // 1. Orb Color & Theme Voice Commands
    if (
      raw.includes('change color') ||
      raw.includes('change theme') ||
      raw.includes('set color') ||
      raw.includes('make it') ||
      raw.includes('switch color') ||
      raw.includes('switch theme') ||
      raw.includes('theme to')
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

    // 2. Navigation & UI Tab Switching by Voice
    if (raw.includes('open terminal') || raw.includes('show terminal') || raw.includes('go to terminal')) {
      setActiveTab('terminal');
      return { handled: true, responseMessage: 'Opening Interactive OS Terminal.' };
    }
    if (raw.includes('open chat') || raw.includes('show chat') || raw.includes('go to chat')) {
      setActiveTab('chat');
      return { handled: true, responseMessage: 'Switching to Neural Chat Console.' };
    }
    if (raw.includes('show orb') || raw.includes('show 3d') || raw.includes('open orb') || raw.includes('go to orb') || raw.includes('show matrix')) {
      setActiveTab('orb');
      return { handled: true, responseMessage: 'Switching to 3D Holographic Viewport.' };
    }
    if (raw.includes('open memory') || raw.includes('show memory') || raw.includes('go to memory') || raw.includes('memory hub')) {
      setActiveTab('memory');
      return { handled: true, responseMessage: 'Accessing ModelScope Memory Hub.' };
    }
    if (raw.includes('open settings') || raw.includes('show settings') || raw.includes('configure settings')) {
      setActiveTab('settings');
      return { handled: true, responseMessage: 'Opening System Configuration.' };
    }
    if (raw.includes('show souls') || raw.includes('show personas') || raw.includes('soul presets')) {
      setActiveTab('harness');
      return { handled: true, responseMessage: 'Displaying Soul Presets and Personas.' };
    }

    // 3. Persona / Soul Switching by Voice
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

    // 4. Screen Capture Vision by Voice
    if (raw.includes('take screenshot') || raw.includes('capture screen') || raw.includes('look at my screen') || raw.includes('see my screen')) {
      const shot = await osService.captureScreen();
      if (shot) {
        return {
          handled: true,
          responseMessage: 'Screen captured successfully. Neural vision analyzer is inspecting your desktop.',
        };
      } else {
        return { handled: true, responseMessage: 'Screen capture was cancelled.' };
      }
    }

    // 5. Battery & Laptop Telemetry by Voice
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

    // 6. Clear Logs / Purge by Voice
    if (raw.includes('clear chat') || raw.includes('purge chat') || raw.includes('clear screen') || raw.includes('reset chat')) {
      clearMessages();
      return { handled: true, responseMessage: 'Chat history and buffers cleared.' };
    }

    return { handled: false };
  }
}

export const voiceActionService = new VoiceActionService();
