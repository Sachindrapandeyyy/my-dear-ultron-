import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';

function osTelemetryPlugin(): Plugin {
  let prevCpuTimes = getCpuTimes();

  function getCpuTimes() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        total += (cpu.times as any)[type];
      }
      idle += cpu.times.idle;
    }
    return { idle, total };
  }

  function getCpuUsage(): number {
    const curr = getCpuTimes();
    const idleDiff = curr.idle - prevCpuTimes.idle;
    const totalDiff = curr.total - prevCpuTimes.total;
    prevCpuTimes = curr;
    return totalDiff <= 0 ? 15 : Math.min(100, Math.max(1, Math.round(100 - (100 * idleDiff) / totalDiff)));
  }

  return {
    name: 'vite-plugin-os-telemetry',
    configureServer(server) {
      server.middlewares.use('/api/telemetry', (req, res) => {
        const cpuUsage = getCpuUsage();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memoryUsage = Math.round((usedMem / totalMem) * 100);

        // Windows 11 Real Battery Fetch
        exec(
          'powershell -NoProfile -Command "Get-CimInstance Win32_Battery | Select-Object -ExpandProperty EstimatedChargeRemaining, BatteryStatus"',
          { timeout: 1200 },
          (err, stdout) => {
            let batteryLevel = 30;
            let isCharging = false;

            if (!err && stdout) {
              const parts = stdout.trim().split(/\s+/);
              if (parts[0] && !isNaN(parseInt(parts[0], 10))) {
                batteryLevel = parseInt(parts[0], 10);
              }
              if (parts[1]) {
                const status = parseInt(parts[1], 10);
                isCharging = status === 2 || status === 6 || status === 7 || status === 8;
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-store');
            res.end(
              JSON.stringify({
                cpuUsage,
                memoryUsage,
                batteryLevel,
                isCharging,
                totalRamGb: Number((totalMem / (1024 * 1024 * 1024)).toFixed(1)),
                usedRamGb: Number((usedMem / (1024 * 1024 * 1024)).toFixed(1)),
                platform: 'Windows 11',
                osVersion: `x64 Desktop (${os.release()})`,
                cpuCores: os.cpus().length,
                cpuModel: os.cpus()[0]?.model || 'Core Processor',
              })
            );
          }
        );
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), osTelemetryPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/ollama': {
        target: 'http://127.0.0.1:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ollama/, ''),
      },
    },
  },
});
