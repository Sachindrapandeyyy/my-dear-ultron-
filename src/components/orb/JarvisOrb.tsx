import React, { useCallback, useEffect, useRef } from 'react';
import { createOrbScene, OrbSceneApi } from '@/lib/orb/OrbScene';
import { HandTracker, TrackerStatus } from '@/lib/orb/HandTracker';
import { useAppStore } from '@/store/useAppStore';
import { ORB_THEMES } from '@/lib/orb/theme';
import { Camera, CameraOff, Plus, Minus, RotateCcw, Hand, Volume2 } from 'lucide-react';
import { audioService } from '@/services/audioService';

const MODE_LABEL: Record<TrackerStatus['mode'], string> = {
  idle: 'STANDBY',
  spin: 'SPINNING ORB',
  zoom: 'ZOOMING ORB',
};

export const JarvisOrb: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<OrbSceneApi | null>(null);
  const trackerRef = useRef<HandTracker | null>(null);

  const {
    theme,
    agentState,
    cameraState,
    setCameraState,
    gestureStatus,
    setGestureStatus,
    audioLevel,
    bassLevel,
    settings,
  } = useAppStore();

  const themeConfig = ORB_THEMES[theme];

  // Initialize Three.js Orb Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = createOrbScene(container, theme);
    sceneRef.current = scene;

    return () => {
      trackerRef.current?.stop();
      trackerRef.current = null;
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Sync theme changes
  useEffect(() => {
    sceneRef.current?.setTheme(theme);
  }, [theme]);

  // Sync audio levels to Orb
  useEffect(() => {
    sceneRef.current?.setAudioLevel(audioLevel, bassLevel);
  }, [audioLevel, bassLevel]);

  // Sync agent state
  useEffect(() => {
    sceneRef.current?.setAgentState(agentState);
  }, [agentState]);

  const stopGestures = useCallback(() => {
    trackerRef.current?.stop();
    trackerRef.current = null;
    setCameraState('off');
    setGestureStatus({ hands: 0, mode: 'idle' });
  }, [setCameraState, setGestureStatus]);

  const startGestures = useCallback(async () => {
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay || trackerRef.current) return;

    setCameraState('starting');

    const tracker = new HandTracker(video, overlay, {
      onRotate: (dt, dp) => sceneRef.current?.rotateBy(dt, dp),
      onZoom: (factor) => sceneRef.current?.zoomBy(factor),
      onStatus: setGestureStatus,
    });
    trackerRef.current = tracker;

    try {
      await tracker.start();
      setCameraState('on');
      if (settings.soundEffects) audioService.playSuccessChime();
    } catch (err) {
      trackerRef.current = null;
      tracker.stop();
      setCameraState('error');
    }
  }, [setCameraState, setGestureStatus, settings.soundEffects]);

  const toggleGestures = useCallback(() => {
    if (settings.soundEffects) audioService.playClickSound();
    if (trackerRef.current) stopGestures();
    else void startGestures();
  }, [startGestures, stopGestures, settings.soundEffects]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key) {
        case '+':
        case '=':
          sceneRef.current?.zoomIn();
          break;
        case '-':
        case '_':
          sceneRef.current?.zoomOut();
          break;
        case 'r':
        case 'R':
          sceneRef.current?.resetView();
          break;
        case 'g':
        case 'G':
          toggleGestures();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleGestures]);

  const cameraOn = cameraState === 'on';

  return (
    <div className="relative w-full h-full min-h-screen bg-black overflow-hidden select-none">
      {/* Three.js Container */}
      <div ref={containerRef} className="orb-root absolute inset-0 z-0" />

      {/* Atmospheric Overlays */}
      <div className="overlay-vignette" />
      <div className="overlay-grain" />
      <div className="overlay-scanlines" />

      {/* Futuristic Center Radar Rings when listening */}
      {agentState !== 'idle' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10 opacity-30">
          <div
            className="w-[450px] h-[450px] rounded-full border border-dashed animate-spin-slow"
            style={{ borderColor: themeConfig.cssPrimary }}
          />
          <div
            className="absolute w-[600px] h-[600px] rounded-full border border-dotted animate-pulse-glow"
            style={{ borderColor: themeConfig.cssSecondary }}
          />
        </div>
      )}

      {/* Controls HUD */}
      <div className="hud hud-controls z-20">
        {/* Camera Webcam Preview Panel */}
        <div
          className={`camera-panel ${cameraOn ? 'visible' : ''}`}
          style={{ borderColor: `${themeConfig.cssPrimary}77` }}
        >
          <video ref={videoRef} muted playsInline className="camera-video" />
          <canvas ref={overlayRef} width={208} height={156} className="camera-overlay" />
          <div className="camera-status flex items-center justify-between">
            <span>
              {gestureStatus.hands > 0
                ? `${gestureStatus.hands} HAND${gestureStatus.hands > 1 ? 'S' : ''} · ${MODE_LABEL[gestureStatus.mode]}`
                : 'WAITING FOR HANDS...'}
            </span>
            <Hand className="w-3 h-3 text-amber-400 animate-pulse" />
          </div>
        </div>

        {cameraState === 'error' && (
          <div className="hud-error bg-red-950/80 px-3 py-1.5 rounded border border-red-500/50 text-xs">
            CAMERA / WEBCAM INITIALIZATION FAILED
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="hud-row flex items-center gap-2">
          <button
            type="button"
            className={`hud-btn flex items-center gap-2 px-3 py-2 rounded text-xs font-mono tracking-wider transition-all`}
            style={{
              borderColor: cameraOn ? themeConfig.cssPrimary : `${themeConfig.cssPrimary}55`,
              color: themeConfig.cssPrimary,
              boxShadow: cameraOn ? `0 0 15px ${themeConfig.cssGlow}` : 'none',
            }}
            onClick={toggleGestures}
            disabled={cameraState === 'starting'}
          >
            {cameraOn ? <Camera className="w-3.5 h-3.5" /> : <CameraOff className="w-3.5 h-3.5 opacity-60" />}
            <span>{cameraState === 'starting' ? 'SYNCING...' : cameraOn ? 'GESTURES ACTIVE' : 'GESTURES OFF (G)'}</span>
          </button>
        </div>

        <div className="hud-row flex items-center gap-1.5">
          <button
            type="button"
            className="hud-btn p-2 rounded text-xs"
            onClick={() => {
              if (settings.soundEffects) audioService.playClickSound();
              sceneRef.current?.zoomIn();
            }}
            title="Zoom In (+)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="hud-btn p-2 rounded text-xs"
            onClick={() => {
              if (settings.soundEffects) audioService.playClickSound();
              sceneRef.current?.zoomOut();
            }}
            title="Zoom Out (-)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="hud-btn px-2.5 py-1.5 rounded text-[11px] flex items-center gap-1"
            onClick={() => {
              if (settings.soundEffects) audioService.playClickSound();
              sceneRef.current?.resetView();
            }}
            title="Reset View (R)"
          >
            <RotateCcw className="w-3 h-3" />
            RESET
          </button>
        </div>
      </div>

      {/* Bottom-Left Gesture & Mouse Instructions */}
      <div className="hud hud-hint z-20">
        <div>
          <span className="key">DRAG</span> rotate viewport&nbsp;&nbsp;
          <span className="key">SCROLL</span> zoom
        </div>
        {cameraOn ? (
          <div>
            <span className="key">PINCH + DRAG</span> rotate orb&nbsp;&nbsp;
            <span className="key">PINCH BOTH HANDS ± SPREAD</span> zoom
          </div>
        ) : (
          <div>
            <span className="key">G</span> toggle webcam gestures&nbsp;&nbsp;
            <span className="key">R</span> reset matrix
          </div>
        )}
      </div>
    </div>
  );
};
