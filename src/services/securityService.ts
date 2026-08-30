export interface FaceDescriptor {
  enrolledAt: string;
  userName: string;
  faceEmbeddingHash: number[];
  faceSnapshotDataUrl: string;
  securityPin: string;
}

export interface IntruderLog {
  id: string;
  timestamp: string;
  snapshotDataUrl: string;
  confidenceScore: number;
  reason: string;
}

class SecurityService {
  private storageKey = 'ultron_face_id_profile_v1';
  private logsKey = 'ultron_intruder_logs_v1';

  // Get enrolled face ID profile
  getEnrolledProfile(): FaceDescriptor | null {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  // Save new Face ID profile
  enrollFace(userName: string, faceSnapshot: string, pin: string, features: number[]): FaceDescriptor {
    const profile: FaceDescriptor = {
      enrolledAt: new Date().toISOString(),
      userName: userName || 'Sachindra Pandey',
      faceEmbeddingHash: features,
      faceSnapshotDataUrl: faceSnapshot,
      securityPin: pin || '0000',
    };
    localStorage.setItem(this.storageKey, JSON.stringify(profile));
    return profile;
  }

  // Clear Face ID enrollment
  resetProfile(): void {
    localStorage.removeItem(this.storageKey);
  }

  // Verify PIN
  verifyPin(pin: string): boolean {
    const profile = this.getEnrolledProfile();
    if (!profile) return pin === '0000' || pin === '1234';
    return profile.securityPin === pin;
  }

  // Extract simple histogram/luminance feature vector from video frame for face comparison
  extractFrameFeatures(videoEl: HTMLVideoElement): { features: number[]; snapshot: string } {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { features: [], snapshot: '' };

    ctx.drawImage(videoEl, 0, 0, 120, 120);
    const imgData = ctx.getImageData(0, 0, 120, 120);
    const data = imgData.data;

    // Generate 32-bin luminance/edge histogram
    const bins = new Array(32).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = Math.floor((r * 0.299 + g * 0.587 + b * 0.114) / 8);
      const binIdx = Math.min(31, Math.max(0, brightness));
      bins[binIdx] += 1;
    }

    // Normalize
    const total = data.length / 4;
    const normalized = bins.map((b) => b / total);

    const snapshot = canvas.toDataURL('image/jpeg', 0.6);
    return { features: normalized, snapshot };
  }

  // Calculate Euclidean / Cosine similarity between current frame and enrolled profile
  calculateFaceMatch(currentFeatures: number[], enrolledFeatures: number[]): number {
    if (!currentFeatures.length || !enrolledFeatures.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < Math.min(currentFeatures.length, enrolledFeatures.length); i++) {
      dot += currentFeatures[i] * enrolledFeatures[i];
      normA += currentFeatures[i] * currentFeatures[i];
      normB += enrolledFeatures[i] * enrolledFeatures[i];
    }

    if (normA === 0 || normB === 0) return 0;
    const cosine = dot / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(0, Math.min(1, cosine));
  }

  // Intruder logs
  getIntruderLogs(): IntruderLog[] {
    try {
      const logs = localStorage.getItem(this.logsKey);
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  logIntruder(snapshot: string, score: number, reason: string): IntruderLog {
    const log: IntruderLog = {
      id: `intruder-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      snapshotDataUrl: snapshot,
      confidenceScore: score,
      reason,
    };
    const logs = [log, ...this.getIntruderLogs().slice(0, 19)];
    localStorage.setItem(this.logsKey, JSON.stringify(logs));
    return log;
  }

  clearIntruderLogs(): void {
    localStorage.removeItem(this.logsKey);
  }
}

export const securityService = new SecurityService();
