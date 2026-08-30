import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { securityService, FaceDescriptor } from '@/services/securityService';
import { audioService } from '@/services/audioService';
import { voiceService } from '@/services/voiceService';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Camera,
  AlertTriangle,
  UserCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

export const FaceLockScreen: React.FC = () => {
  const { setIsLocked, setIsEnrollModalOpen, settings } = useAppStore();

  const [profile, setProfile] = useState<FaceDescriptor | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [scanStatus, setScanStatus] = useState<'scanning' | 'verifying' | 'granted' | 'denied'>('scanning');
  const [matchScore, setMatchScore] = useState(0);
  const [intruderAlert, setIntruderAlert] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    const prof = securityService.getEnrolledProfile();
    setProfile(prof);
    startCamera();

    return () => {
      stopCamera();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch {
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Continuous Face Scan Loop
  useEffect(() => {
    if (!cameraActive || !profile) return;

    intervalRef.current = setInterval(() => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      const { features, snapshot } = securityService.extractFrameFeatures(videoRef.current);
      if (!features.length) return;

      const score = securityService.calculateFaceMatch(features, profile.faceEmbeddingHash);
      setMatchScore(Math.round(score * 100));

      // Match threshold: > 0.82
      if (score >= 0.82 && scanStatus !== 'granted') {
        handleAccessGranted();
      } else if (score < 0.45 && score > 0.1) {
        // Intruder risk
        if (Math.random() < 0.05 && !intruderAlert) {
          handleIntruderDetected(snapshot, score);
        }
      }
    }, 800);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cameraActive, profile, scanStatus, intruderAlert]);

  const handleAccessGranted = () => {
    setScanStatus('granted');
    if (settings.soundEffects) audioService.playSuccessChime();

    voiceService.speak(`Identity verified. Welcome back, ${profile?.userName || 'Sachindra'}.`, {
      preset: 'jarvis',
    });

    setTimeout(() => {
      stopCamera();
      setIsLocked(false);
    }, 1200);
  };

  const handleIntruderDetected = (snapshot: string, score: number) => {
    setIntruderAlert(true);
    securityService.logIntruder(snapshot, score, 'Unauthorized face biometric mismatch');

    voiceService.speak('Warning! Unauthorized face detected. Access Denied.', {
      preset: 'ultron',
    });

    setTimeout(() => setIntruderAlert(false), 3000);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityService.verifyPin(pinInput)) {
      if (settings.soundEffects) audioService.playSuccessChime();
      voiceService.speak('PIN verified. Access granted.', { preset: 'jarvis' });
      stopCamera();
      setIsLocked(false);
    } else {
      setPinError(true);
      if (settings.soundEffects) audioService.playWarningSiren();
      setTimeout(() => setPinError(false), 2000);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 select-none font-mono transition-all duration-300 ${
      intruderAlert ? 'bg-red-950/95' : 'bg-black/95 backdrop-blur-xl'
    }`}>
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e1e24_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-zinc-950/90 border border-zinc-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center text-center space-y-5">
        {/* Top Security Badge */}
        <div className="flex items-center gap-2">
          {scanStatus === 'granted' ? (
            <ShieldCheck className="w-8 h-8 text-emerald-400 animate-bounce" />
          ) : intruderAlert ? (
            <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
          ) : (
            <Lock className="w-8 h-8 text-red-500" />
          )}
          <div>
            <h1 className="text-base font-bold tracking-[0.2em] text-white">
              {scanStatus === 'granted'
                ? 'ACCESS GRANTED'
                : intruderAlert
                ? 'INTRUDER ALERT'
                : 'BIOMETRIC FACE ID BARRIER'}
            </h1>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
              U.L.T.R.O.N. Sentry Security Protocol
            </p>
          </div>
        </div>

        {/* Live Camera Scanner HUD */}
        <div className="relative w-64 h-64 rounded-2xl overflow-hidden border-2 bg-black shadow-inner flex items-center justify-center border-zinc-800">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />

          {/* Futuristic Target Reticle & Laser Sweep */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4">
            {/* Target Brackets */}
            <div className="w-full flex justify-between">
              <div className={`w-6 h-6 border-t-2 border-l-2 ${scanStatus === 'granted' ? 'border-emerald-400' : intruderAlert ? 'border-red-500' : 'border-cyan-400'}`} />
              <div className={`w-6 h-6 border-t-2 border-r-2 ${scanStatus === 'granted' ? 'border-emerald-400' : intruderAlert ? 'border-red-500' : 'border-cyan-400'}`} />
            </div>

            {/* Scanning Laser Line */}
            {cameraActive && scanStatus !== 'granted' && (
              <div className="w-full h-0.5 bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-pulse" />
            )}

            {/* Target Oval */}
            <div className="w-32 h-40 border border-dashed border-cyan-400/40 rounded-full flex items-center justify-center">
              <span className="text-[9px] text-cyan-400/70 tracking-widest uppercase">
                {profile ? 'Align Face' : 'No Profile'}
              </span>
            </div>

            <div className="w-full flex justify-between">
              <div className={`w-6 h-6 border-b-2 border-l-2 ${scanStatus === 'granted' ? 'border-emerald-400' : intruderAlert ? 'border-red-500' : 'border-cyan-400'}`} />
              <div className={`w-6 h-6 border-b-2 border-r-2 ${scanStatus === 'granted' ? 'border-emerald-400' : intruderAlert ? 'border-red-500' : 'border-cyan-400'}`} />
            </div>
          </div>
        </div>

        {/* Biometric Status Feed */}
        <div className="w-full space-y-2">
          {profile ? (
            <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs flex items-center justify-between">
              <span className="text-zinc-400">AUTHORIZED USER:</span>
              <span className="text-emerald-400 font-bold">{profile.userName}</span>
            </div>
          ) : (
            <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-lg text-xs text-amber-300 text-left">
              💡 No Face ID profile enrolled yet. Click below to register your face password!
            </div>
          )}

          {profile && (
            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
              <span>BIOMETRIC MATCH:</span>
              <span className={`font-bold ${matchScore > 80 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                {matchScore}%
              </span>
            </div>
          )}
        </div>

        {/* PIN Bypass Form */}
        <form onSubmit={handlePinSubmit} className="w-full space-y-2 pt-2 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Or enter Security PIN (e.g. 0000)..."
                className={`w-full pl-9 pr-3 py-2 bg-zinc-900 border rounded-lg text-xs text-white focus:outline-none ${
                  pinError ? 'border-red-500 ring-1 ring-red-500' : 'border-zinc-700 focus:border-cyan-400'
                }`}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              UNLOCK
            </button>
          </div>
          {pinError && <p className="text-[10px] text-red-400">Invalid PIN code. Try again.</p>}
        </form>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between w-full pt-1">
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{profile ? 'Re-Enroll Face ID' : 'Enroll Face ID'}</span>
          </button>

          <button
            onClick={() => {
              stopCamera();
              setIsLocked(false);
            }}
            className="text-[11px] text-zinc-500 hover:text-zinc-300"
          >
            Emergency Bypass
          </button>
        </div>
      </div>
    </div>
  );
};
