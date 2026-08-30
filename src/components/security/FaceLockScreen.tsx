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
  Check,
  X,
} from 'lucide-react';

export const FaceLockScreen: React.FC = () => {
  const { setIsLocked, setIsEnrollModalOpen, settings } = useAppStore();

  const [profile, setProfile] = useState<FaceDescriptor | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [scanStatus, setScanStatus] = useState<'scanning' | 'granted' | 'denied'>('scanning');
  const [matchScore, setMatchScore] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<any>(null);
  const consecutiveMatchesRef = useRef<number>(0);

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

      const { features } = securityService.extractFrameFeatures(videoRef.current);
      if (!features.length) return;

      const score = securityService.calculateFaceMatch(features, profile.faceEmbeddingHash);
      const scorePct = Math.round(score * 100);
      setMatchScore(scorePct);

      // Fast, reliable unlock threshold: >= 60%
      if (score >= 0.60 && scanStatus !== 'granted') {
        consecutiveMatchesRef.current += 1;
        if (consecutiveMatchesRef.current >= 2) {
          handleAccessGranted();
        }
      } else {
        consecutiveMatchesRef.current = 0;
      }
    }, 400);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cameraActive, profile, scanStatus]);

  const handleAccessGranted = () => {
    setScanStatus('granted');
    if (settings.soundEffects) audioService.playSuccessChime();

    voiceService.speak(`Identity verified. Welcome back, ${profile?.userName || 'Sachindra'}.`, {
      preset: 'jarvis',
    });

    setTimeout(() => {
      stopCamera();
      setIsLocked(false);
    }, 800);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityService.verifyPin(pinInput)) {
      if (settings.soundEffects) audioService.playSuccessChime();
      voiceService.speak('Access granted via security PIN.', { preset: 'jarvis' });
      stopCamera();
      setIsLocked(false);
    } else {
      setPinError(true);
      if (settings.soundEffects) audioService.playWarningSiren();
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const handleQuickBypass = () => {
    if (settings.soundEffects) audioService.playClickSound();
    stopCamera();
    setIsLocked(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 select-none font-mono bg-black/95 backdrop-blur-xl animate-fadeIn">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e1e24_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-zinc-950/95 border border-zinc-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center text-center space-y-4">
        {/* Top Security Badge */}
        <div className="flex items-center gap-2">
          {scanStatus === 'granted' ? (
            <ShieldCheck className="w-8 h-8 text-emerald-400 animate-bounce" />
          ) : (
            <Lock className="w-8 h-8 text-cyan-400" />
          )}
          <div>
            <h1 className="text-base font-bold tracking-[0.2em] text-white">
              {scanStatus === 'granted' ? 'IDENTITY VERIFIED' : 'BIOMETRIC FACE ID BARRIER'}
            </h1>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
              Sachindra Pandey Security System
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
              <div
                className={`w-6 h-6 border-t-2 border-l-2 ${
                  scanStatus === 'granted' ? 'border-emerald-400' : 'border-cyan-400'
                }`}
              />
              <div
                className={`w-6 h-6 border-t-2 border-r-2 ${
                  scanStatus === 'granted' ? 'border-emerald-400' : 'border-cyan-400'
                }`}
              />
            </div>

            {/* Scanning Laser Line */}
            {cameraActive && scanStatus !== 'granted' && (
              <div className="w-full h-0.5 bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-pulse" />
            )}

            {/* Target Oval */}
            <div className="w-32 h-40 border border-dashed border-cyan-400/40 rounded-full flex items-center justify-center">
              <span className="text-[9px] text-cyan-400/80 tracking-widest uppercase font-bold">
                {profile ? (matchScore >= 60 ? 'MATCH VERIFIED' : 'ALIGN FACE') : 'NO ENROLLMENT'}
              </span>
            </div>

            <div className="w-full flex justify-between">
              <div
                className={`w-6 h-6 border-b-2 border-l-2 ${
                  scanStatus === 'granted' ? 'border-emerald-400' : 'border-cyan-400'
                }`}
              />
              <div
                className={`w-6 h-6 border-b-2 border-r-2 ${
                  scanStatus === 'granted' ? 'border-emerald-400' : 'border-cyan-400'
                }`}
              />
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
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs text-amber-300 flex items-center justify-between">
              <span>No Face ID profile enrolled yet.</span>
              <button
                onClick={() => setIsEnrollModalOpen(true)}
                className="px-2 py-1 bg-amber-500 text-black font-bold rounded text-[10px]"
              >
                SETUP NOW
              </button>
            </div>
          )}

          {profile && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                <span>FACIAL MATCH CONFIDENCE:</span>
                <span className={`font-bold ${matchScore >= 60 ? 'text-emerald-400' : 'text-cyan-400'}`}>
                  {matchScore}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    matchScore >= 60 ? 'bg-emerald-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.min(100, matchScore)}%` }}
                />
              </div>
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
                placeholder="Enter PIN (Default: 1234)..."
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
          {pinError && <p className="text-[10px] text-red-400 font-bold">Invalid PIN code. Try 1234.</p>}
        </form>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between w-full pt-1">
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{profile ? 'Re-Enroll Face ID' : 'Enroll Face ID'}</span>
          </button>

          <button
            onClick={handleQuickBypass}
            className="text-[11px] text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all font-bold"
          >
            Instant Bypass ✕
          </button>
        </div>
      </div>
    </div>
  );
};
