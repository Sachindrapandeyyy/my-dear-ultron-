export interface FaceDescriptor {
  enrolledAt: string;
  userName: string;
  faceEmbeddingHash: number[];
  faceSnapshotDataUrl: string;
  securityPin?: string;
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
  enrollFace(userName: string, faceSnapshot: string, features: number[]): FaceDescriptor {
    const profile: FaceDescriptor = {
      enrolledAt: new Date().toISOString(),
      userName: userName || 'Sachindra Pandey',
      faceEmbeddingHash: features,
      faceSnapshotDataUrl: faceSnapshot,
    };
    localStorage.setItem(this.storageKey, JSON.stringify(profile));
    return profile;
  }

  // Clear Face ID enrollment
  resetProfile(): void {
    localStorage.removeItem(this.storageKey);
  }

  // Extract high-dimensional 128-bin spatial luminance & facial contrast descriptor
  extractFrameFeatures(videoEl: HTMLVideoElement): { features: number[]; snapshot: string } {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { features: [], snapshot: '' };

      ctx.drawImage(videoEl, 0, 0, 160, 160);
      const imgData = ctx.getImageData(0, 0, 160, 160);
      const data = imgData.data;

      // 4x4 Spatial Grid with 8 luminance bins per quadrant = 128 feature vector
      const bins = new Array(128).fill(0);
      const blockSize = 40; // 160 / 4

      for (let y = 0; y < 160; y++) {
        const blockY = Math.min(3, Math.floor(y / blockSize));
        for (let x = 0; x < 160; x++) {
          const blockX = Math.min(3, Math.floor(x / blockSize));
          const gridIndex = blockY * 4 + blockX; // 0..15

          const idx = (y * 160 + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const lum = Math.floor((r * 0.299 + g * 0.587 + b * 0.114) / 32); // 0..7
          const binIdx = gridIndex * 8 + Math.min(7, Math.max(0, lum));
          bins[binIdx] += 1;
        }
      }

      // L2 Normalization
      let sumSq = 0;
      for (let i = 0; i < bins.length; i++) {
        sumSq += bins[i] * bins[i];
      }
      const norm = Math.sqrt(sumSq) || 1;
      const normalized = bins.map((b) => b / norm);

      const snapshot = canvas.toDataURL('image/jpeg', 0.8);
      return { features: normalized, snapshot };
    } catch {
      return { features: [], snapshot: '' };
    }
  }

  // Calculate Cosine Similarity
  calculateFaceMatch(currentFeatures: number[], enrolledFeatures: number[]): number {
    if (!currentFeatures.length || !enrolledFeatures.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;

    const len = Math.min(currentFeatures.length, enrolledFeatures.length);
    for (let i = 0; i < len; i++) {
      dot += currentFeatures[i] * enrolledFeatures[i];
      normA += currentFeatures[i] * currentFeatures[i];
      normB += enrolledFeatures[i] * enrolledFeatures[i];
    }

    const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
    return Math.max(0, Math.min(1, similarity));
  }

  // Log unauthorized intruder
  logIntruder(snapshot: string, confidence: number, reason: string): void {
    try {
      const logs = this.getIntruderLogs();
      const newLog: IntruderLog = {
        id: `intruder-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        snapshotDataUrl: snapshot,
        confidenceScore: Math.round(confidence * 100),
        reason,
      };
      logs.unshift(newLog);
      localStorage.setItem(this.logsKey, JSON.stringify(logs.slice(0, 20)));
    } catch {}
  }

  getIntruderLogs(): IntruderLog[] {
    try {
      const saved = localStorage.getItem(this.logsKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }
}

export const securityService = new SecurityService();
