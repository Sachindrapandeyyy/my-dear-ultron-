import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { securityService } from '@/services/securityService';
import { audioService } from '@/services/audioService';
import { voiceService } from '@/services/voiceService';
import { Camera, Check, X, User, Key, Sparkles, Shield } from 'lucide-react';

export const FaceEnrollModal: React.FC = () => {
  const { isEnrollModalOpen, setIsEnrollModalOpen, settings } = useAppStore();

  const [userName, setUserName] = useState('Sachindra Pandey');
  const [pin, setPin] = useState('1234');
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [capturedFeatures, setCapturedFeatures] = useState<number[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [step, setStep] = useState<'camera' | 'review' | 'success'>('camera');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isEnrollModalOpen) {
      setStep('camera');
      setCapturedSnapshot(null);
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isEnrollModalOpen]);

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
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const { features, snapshot } = securityService.extractFrameFeatures(videoRef.current);
    if (!snapshot) return;

    if (settings.soundEffects) audioService.playClickSound();
    setCapturedSnapshot(snapshot);
    setCapturedFeatures(features);
    setStep('review');
    stopCamera();
  };

  const handleSaveEnrollment = () => {
    if (!capturedSnapshot || !capturedFeatures.length) return;

    securityService.enrollFace(userName, capturedSnapshot, pin, capturedFeatures);
    if (settings.soundEffects) audioService.playSuccessChime();

    voiceService.speak(`Biometric Face ID registered successfully for ${userName}. Security protocol active.`, {
      preset: 'jarvis',
    });

    setStep('success');
    setTimeout(() => {
      setIsEnrollModalOpen(false);
    }, 1500);
  };

  if (!isEnrollModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono select-none">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
        <button
          onClick={() => {
            stopCamera();
            setIsEnrollModalOpen(false);
          }}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-cyan-400" />
          <h2 className="text-base font-bold tracking-wider text-white">FACE ID BIOMETRIC ENROLLMENT</h2>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Position your face in front of the camera and click Capture to register your Face Password.
        </p>

        {/* Viewfinder / Preview */}
        <div className="relative w-full h-56 rounded-xl overflow-hidden border border-zinc-800 bg-black flex items-center justify-center">
          {step === 'camera' ? (
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <img
              src={capturedSnapshot || ''}
              alt="Face Snapshot"
              className="w-full h-full object-cover scale-x-[-1]"
            />
          )}

          {step === 'camera' && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-32 h-44 border-2 border-dashed border-cyan-400/60 rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-zinc-400 block mb-1">AUTHORIZED USER NAME</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Sachindra Pandey"
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 block mb-1">EMERGENCY BACKUP PIN</label>
            <div className="relative">
              <Key className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="1234"
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {step === 'camera' ? (
            <button
              type="button"
              onClick={handleCapture}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            >
              <Camera className="w-4 h-4" />
              <span>CAPTURE FACE PASSWORD</span>
            </button>
          ) : step === 'review' ? (
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setStep('camera');
                  startCamera();
                }}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-colors"
              >
                RETAKE
              </button>
              <button
                type="button"
                onClick={handleSaveEnrollment}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>SAVE PROFILE</span>
              </button>
            </div>
          ) : (
            <div className="w-full py-2 bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 text-xs font-bold rounded-lg flex items-center justify-center gap-2 animate-pulse">
              <Check className="w-4 h-4" />
              <span>ENROLLMENT COMPLETE</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
