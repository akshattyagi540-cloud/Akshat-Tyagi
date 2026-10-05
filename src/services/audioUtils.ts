/**
 * Audio utilities for converting Float32Array microphone buffers to 16kHz PCM 16-bit Base64,
 * and playing back incoming 24kHz PCM chunks with AudioContext.
 */

export function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export class LiveAudioPlayer {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;
  private activeSourceNodes: AudioBufferSourceNode[] = [];

  constructor() {
    // Lazily initialize AudioContext on user gesture
  }

  private initContext() {
    if (!this.ctx || this.ctx.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx({ sampleRate: 24000 });
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.connect(this.ctx.destination);
      this.nextPlayTime = this.ctx.currentTime;
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public playPcmChunk(base64Data: string) {
    this.initContext();
    if (!this.ctx) return;

    try {
      const arrayBuffer = base64ToArrayBuffer(base64Data);
      // Check if it's a WAV file (starts with 'RIFF') or raw PCM (int16)
      const u8 = new Uint8Array(arrayBuffer);
      const isWav =
        u8.length > 12 &&
        String.fromCharCode(u8[0], u8[1], u8[2], u8[3]) === "RIFF";

      if (isWav) {
        // Decode WAV using native decodeAudioData
        this.ctx.decodeAudioData(arrayBuffer.slice(0), (audioBuffer) => {
          this.scheduleAudioBuffer(audioBuffer);
        });
      } else {
        // Raw PCM 16-bit mono @ 24kHz
        const int16Array = new Int16Array(arrayBuffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0;
        }

        const audioBuffer = this.ctx.createBuffer(1, float32Array.length, 24000);
        audioBuffer.copyToChannel(float32Array, 0);
        this.scheduleAudioBuffer(audioBuffer);
      }
    } catch (err) {
      console.warn("Failed to play PCM chunk:", err);
    }
  }

  private scheduleAudioBuffer(audioBuffer: AudioBuffer) {
    if (!this.ctx || !this.analyser) return;

    const source = this.ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.analyser);

    const currentTime = this.ctx.currentTime;
    if (this.nextPlayTime < currentTime) {
      this.nextPlayTime = currentTime;
    }

    source.start(this.nextPlayTime);
    this.nextPlayTime += audioBuffer.duration;
    this.isPlaying = true;
    this.activeSourceNodes.push(source);

    source.onended = () => {
      const idx = this.activeSourceNodes.indexOf(source);
      if (idx !== -1) this.activeSourceNodes.splice(idx, 1);
      if (this.activeSourceNodes.length === 0) {
        this.isPlaying = false;
      }
    };
  }

  public stopAll() {
    for (const src of this.activeSourceNodes) {
      try {
        src.stop();
        src.disconnect();
      } catch (_) {}
    }
    this.activeSourceNodes = [];
    if (this.ctx) {
      this.nextPlayTime = this.ctx.currentTime;
    }
    this.isPlaying = false;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public close() {
    this.stopAll();
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
