import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { securityService, FaceDescriptor } from '@/services/securityService';
import { audioService } from '@/services/audioService';
import { voiceService } from '@/services/voiceService';
import { JarvisOrb } from '@/components/orb/JarvisOrb';
import {
  ShieldCheck,
  Lock,
  Camera,
  UserCheck,
  Sparkles,
  Zap,
  Check,
  User,
  Shield,
} from 'lucide-react';

export const FaceLockScreen: React.FC = () => {
  const { setIsLocked, settings, setTheme } = useAppStore();

  const [profile, setProfile] = useState<FaceDescriptor | null>(null);
  const [userNameInput, setUserNameInput] = useState('Sachindra Pandey');
  const [scanStatus, setScanStatus] = useState<'scanning' | 'granted' | 'enrolling'>('scanning');
  const [matchScore, setMatchScore] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [isEnrolledJustNow, setIsEnrolledJustNow] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<any>(null);
  const consecutiveMatchesRef = useRef<number>(0);

  useEffect(() => {
    const prof = securityService.getEnrolledProfile();
    setProfile(prof);

    if (!prof) {
      setScanStatus('enrolling');
    } else {
      setScanStatus('scanning');
    }

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

  // Continuous Biometric Face Scan Loop
  useEffect(() => {
    if (!cameraActive || !profile || scanStatus === 'enrolling' || scanStatus === 'granted') return;

    intervalRef.current = setInterval(() => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      const { features } = securityService.extractFrameFeatures(videoRef.current);
      if (!features.length) return;

      const score = securityService.calculateFaceMatch(features, profile.faceEmbeddingHash);
      const scorePct = Math.round(score * 100);
      setMatchScore(scorePct);

      // Fast, reliable facial biometric unlock threshold: >= 58%
      if (score >= 0.58) {
        consecutiveMatchesRef.current += 1;
        if (consecutiveMatchesRef.current >= 2) {
          handleAccessGranted();
        }
      } else {
        consecutiveMatchesRef.current = 0;
      }
    }, 350);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cameraActive, profile, scanStatus]);

  const handleAccessGranted = () => {
    setScanStatus('granted');
    setTheme('matrix'); // Turn Orb to Emerald Matrix Green on unlock

    if (settings.soundEffects) audioService.playSuccessChime();

    voiceService.speak(`Biometric identity confirmed. Welcome back, ${profile?.userName || 'Sachindra Pandey'}.`, {
      preset: 'jarvis',
    });

    setTimeout(() => {
      stopCamera();
      setIsLocked(false);
    }, 1000);
  };

  const handleCaptureEnrollment = () => {
    if (!videoRef.current) return;
    const { features, snapshot } = securityService.extractFrameFeatures(videoRef.current);
    if (!snapshot || !features.length) return;

    if (settings.soundEffects) audioService.playSuccessChime();

    const newProfile = securityService.enrollFace(userNameInput, snapshot, features);
    setProfile(newProfile);
    setIsEnrolledJustNow(true);

    voiceService.speak(`Face Password registered for ${userNameInput}. Biometric lock armed.`, {
      preset: 'jarvis',
    });

    setTimeout(() => {
      setIsEnrolledJustNow(false);
      setScanStatus('scanning');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none font-mono bg-black overflow-hidden animate-fadeIn">
      {/* 1. Live 3D Holographic Orb Rendering in the Lock Screen Background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none scale-110 blur-sm">
        <JarvisOrb />
      </div>

      {/* Background Cyber Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#00f3ff_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

      {/* Main Holographic Lock Glass Panel */}
      <div className="relative z-20 max-w-lg w-full bg-zinc-950/90 border-2 border-cyan-500/60 p-6 md:p-8 rounded-3xl shadow-[0_0_50px_rgba(0,243,255,0.25)] backdrop-blur-2xl flex flex-col items-center text-center space-y-5">
        {/* Top Security Emblem */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-500/80 shadow-[0_0_15px_rgba(0,243,255,0.4)]">
            {scanStatus === 'granted' ? (
              <ShieldCheck className="w-8 h-8 text-emerald-400 animate-bounce" />
            ) : (
              <Shield className="w-8 h-8 text-cyan-400 animate-pulse" />
            )}
          </div>
          <div className="text-left">
            <h1 className="text-base md:text-lg font-bold tracking-[0.25em] text-white">
              {scanStatus === 'granted'
                ? 'ACCESS AUTHORIZED'
                : scanStatus === 'enrolling'
                ? 'INITIALIZE FACE PASSWORD'
                : 'BIOMETRIC FACE ID BARRIER'}
            </h1>
            <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
              nxt IN Company • Sachindra Pandey Protocol
            </p>
          </div>
        </div>

        {/* Live Camera Scanner HUD */}
        <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-2xl overflow-hidden border-2 bg-black shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] flex items-center justify-center border-cyan-500/80">
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
                className={`w-8 h-8 border-t-2 border-l-2 transition-all duration-300 ${
                  scanStatus === 'granted' ? 'border-emerald-400 shadow-[0_0_10px_#34d399]' : 'border-cyan-400 shadow-[0_0_10px_#22d3ee]'
                }`}
              />
              <div
                className={`w-8 h-8 border-t-2 border-r-2 transition-all duration-300 ${
                  scanStatus === 'granted' ? 'border-emerald-400 shadow-[0_0_10px_#34d399]' : 'border-cyan-400 shadow-[0_0_10px_#22d3ee]'
                }`}
              />
            </div>

            {/* Scanning Laser Line */}
            {cameraActive && scanStatus !== 'granted' && (
              <div className="w-full h-1 bg-cyan-400 shadow-[0_0_16px_#22d3ee] animate-pulse" />
            )}

            {/* Target Face Oval */}
            <div
              className={`w-36 h-48 border-2 border-dashed rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
                scanStatus === 'granted'
                  ? 'border-emerald-400 shadow-[0_0_20px_#34d399] bg-emerald-950/20'
                  : 'border-cyan-400/60 bg-cyan-950/10'
              }`}
            >
              <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-black/60">
                {scanStatus === 'granted'
                  ? 'VERIFIED'
                  : scanStatus === 'enrolling'
                  ? 'ALIGN YOUR FACE'
                  : matchScore >= 58
                  ? 'MATCH DETECTED'
                  : 'LOOK AT CAMERA'}
              </span>
            </div>

            <div className="w-full flex justify-between">
              <div
                className={`w-8 h-8 border-b-2 border-l-2 transition-all duration-300 ${
                  scanStatus === 'granted' ? 'border-emerald-400 shadow-[0_0_10px_#34d399]' : 'border-cyan-400 shadow-[0_0_10px_#22d3ee]'
                }`}
              />
              <div
                className={`w-8 h-8 border-b-2 border-r-2 transition-all duration-300 ${
                  scanStatus === 'granted' ? 'border-emerald-400 shadow-[0_0_10px_#34d399]' : 'border-cyan-400 shadow-[0_0_10px_#22d3ee]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Mode 1: First-Time Face Enrollment Mode */}
        {scanStatus === 'enrolling' && (
          <div className="w-full space-y-3">
            <div className="space-y-1 text-left">
              <label className="text-[11px] text-zinc-400 font-bold">CREATOR / AUTHORIZED NAME:</label>
              <div className="flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                <User className="w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  value={userNameInput}
                  onChange={(e) => setUserNameInput(e.target.value)}
                  placeholder="Sachindra Pandey"
                  className="bg-transparent text-xs text-white focus:outline-none flex-1 font-mono font-bold"
                />
              </div>
            </div>

            <button
              onClick={handleCaptureEnrollment}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,243,255,0.4)] tracking-wider"
            >
              <Camera className="w-4 h-4" />
              <span>CAPTURE & ENROLL FACE PASSWORD</span>
            </button>
          </div>
        )}

        {/* Mode 2: Real-time Scanning Feed */}
        {scanStatus !== 'enrolling' && profile && (
          <div className="w-full space-y-3">
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs flex items-center justify-between">
              <span className="text-zinc-400">AUTHORIZED USER:</span>
              <span className="text-cyan-400 font-bold">{profile.userName}</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                <span>FACIAL RECOGNITION CONFIDENCE:</span>
                <span
                  className={`font-bold ${
                    matchScore >= 58 ? 'text-emerald-400' : 'text-cyan-400'
                  }`}
                >
                  {matchScore}%
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    matchScore >= 58 ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${Math.min(100, matchScore)}%` }}
                />
              </div>
            </div>

            {/* Re-enroll Face Button */}
            <div className="pt-2">
              <button
                onClick={() => setScanStatus('enrolling')}
                className="text-[11px] text-zinc-400 hover:text-cyan-300 flex items-center justify-center gap-1 mx-auto"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Re-Capture Face Password</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
