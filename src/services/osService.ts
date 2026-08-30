import { SystemTelemetry, SkillItem } from '@/types';

export const BUILTIN_SKILLS: SkillItem[] = [
  {
    id: 'skill-sys-diag',
    name: 'System Telemetry Diagnostics',
    description: 'Inspect live CPU, RAM, battery percentage, and network latency.',
    category: 'System',
    enabled: true,
    isBuiltin: true,
  },
  {
    id: 'skill-screen-vision',
    name: 'Screen Vision OCR & Analysis',
    description: 'Capture the active laptop screen or window and send to multimodal LLM.',
    category: 'Vision',
    enabled: true,
    isBuiltin: true,
  },
  {
    id: 'skill-terminal-exec',
    name: 'PowerShell / Bash Automation',
    description: 'Execute local terminal commands and scripts with output formatting.',
    category: 'Automation',
    enabled: true,
    isBuiltin: true,
  },
  {
    id: 'skill-clipboard',
    name: 'Clipboard Sync & Transformer',
    description: 'Read, format, summarize, or paste active clipboard text.',
    category: 'Productivity',
    enabled: true,
    isBuiltin: true,
  },
  {
    id: 'skill-browser-open',
    name: 'Browser URL Navigation',
    description: 'Open web URLs, documentation, or search queries in default browser.',
    category: 'Web',
    enabled: true,
    isBuiltin: true,
  },
];

class OSService {
  private telemetry: SystemTelemetry = {
    cpuUsage: 18,
    memoryUsage: 38,
    batteryLevel: 30,
    isCharging: false,
    latencyMs: 12,
    platform: 'Windows 11',
    osVersion: 'x64 Desktop',
  };

  constructor() {
    this.fetchRealTelemetry();
    this.initBattery();
    this.initPlatform();
    this.startTelemetryLoop();
  }

  private async fetchRealTelemetry() {
    try {
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const data = await res.json();
        this.telemetry.cpuUsage = data.cpuUsage ?? this.telemetry.cpuUsage;
        this.telemetry.memoryUsage = data.memoryUsage ?? this.telemetry.memoryUsage;
        this.telemetry.batteryLevel = data.batteryLevel ?? this.telemetry.batteryLevel;
        this.telemetry.isCharging = data.isCharging ?? this.telemetry.isCharging;
        this.telemetry.platform = data.platform ?? this.telemetry.platform;
        this.telemetry.osVersion = data.osVersion ?? this.telemetry.osVersion;
      }
    } catch {}
  }

  private async initBattery() {
    try {
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        const battery: any = await (navigator as any).getBattery();
        this.updateBattery(battery);
        battery.addEventListener('levelchange', () => this.updateBattery(battery));
        battery.addEventListener('chargingchange', () => this.updateBattery(battery));
      }
    } catch {}
  }

  private updateBattery(battery: any) {
    this.telemetry.batteryLevel = Math.round(battery.level * 100);
    this.telemetry.isCharging = battery.charging;
  }

  private initPlatform() {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      if (ua.includes('Windows')) this.telemetry.platform = 'Windows 11';
      else if (ua.includes('Mac')) this.telemetry.platform = 'macOS';
      else if (ua.includes('Linux')) this.telemetry.platform = 'Linux';
    }
  }

  private startTelemetryLoop() {
    // Poll real Windows hardware telemetry every 2.5 seconds
    setInterval(async () => {
      await this.fetchRealTelemetry();

      const start = performance.now();
      try {
        await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
        this.telemetry.latencyMs = Math.round(performance.now() - start);
      } catch {
        this.telemetry.latencyMs = 14;
      }
    }, 2500);
  }

  getTelemetry(): SystemTelemetry {
    return { ...this.telemetry };
  }

  async captureScreen(): Promise<string | null> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: false,
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      stream.getTracks().forEach((t) => t.stop());
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch (e) {
      console.warn('Screen capture cancelled or not allowed:', e);
      return null;
    }
  }

  async readClipboard(): Promise<string> {
    try {
      return await navigator.clipboard.readText();
    } catch {
      return '';
    }
  }

  async writeClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  openUrl(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export const osService = new OSService();
