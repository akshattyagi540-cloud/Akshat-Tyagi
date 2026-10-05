import { arrayBufferToBase64, floatTo16BitPCM, LiveAudioPlayer } from "./audioUtils";

export type LiveSessionStatus =
  | "disconnected"
  | "connecting"
  | "ready"
  | "listening"
  | "speaking"
  | "error";

export interface LiveClientCallbacks {
  onStatusChange: (status: LiveSessionStatus, message?: string) => void;
  onTranscript: (text: string, isModel: boolean) => void;
  onInterrupted: () => void;
  onAudioDataReceived: () => void;
}

export class MyraLiveClient {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private player: LiveAudioPlayer;
  private callbacks: LiveClientCallbacks;
  private isMuted: boolean = false;
  private active: boolean = false;

  constructor(callbacks: LiveClientCallbacks) {
    this.callbacks = callbacks;
    this.player = new LiveAudioPlayer();
  }

  public getPlayer(): LiveAudioPlayer {
    return this.player;
  }

  public async startSession() {
    this.active = true;
    this.callbacks.onStatusChange("connecting", "Connecting to Myra voice channel...");

    // 1. Establish WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/live-ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = async () => {
        console.log("[MyraLiveClient] WS opened");
        // Start microphone
        try {
          await this.initMicrophone();
          this.callbacks.onStatusChange("listening", "Listening... Speak naturally to Myra");
        } catch (micErr: any) {
          console.warn("[MyraLiveClient] Mic access error:", micErr);
          this.callbacks.onStatusChange(
            "ready",
            "Connected! (Mic permission needed to talk)"
          );
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "status") {
            if (data.status === "ready") {
              this.callbacks.onStatusChange("listening", "Myra is listening! ✨");
            }
          } else if (data.type === "audio") {
            this.callbacks.onStatusChange("speaking", "Myra is speaking...");
            this.callbacks.onAudioDataReceived();
            this.player.playPcmChunk(data.audio);
          } else if (data.type === "transcript") {
            this.callbacks.onTranscript(data.text, true);
          } else if (data.type === "interrupted") {
            console.log("[MyraLiveClient] Interrupted by user");
            this.player.stopAll();
            this.callbacks.onInterrupted();
            this.callbacks.onStatusChange("listening", "Listening to you...");
          } else if (data.type === "turnComplete") {
            if (!this.player.getIsPlaying()) {
              this.callbacks.onStatusChange("listening", "Listening to you...");
            }
          } else if (data.type === "error") {
            this.callbacks.onStatusChange("error", data.error);
          }
        } catch (err) {
          console.warn("[MyraLiveClient] Parse message error:", err);
        }
      };

      this.ws.onclose = () => {
        console.log("[MyraLiveClient] WS closed");
        if (this.active) {
          this.callbacks.onStatusChange("disconnected", "Voice session ended");
        }
      };

      this.ws.onerror = (err) => {
        console.warn("[MyraLiveClient] WS error:", err);
        this.callbacks.onStatusChange("error", "Voice server connection unavailable");
      };
    } catch (e: any) {
      this.callbacks.onStatusChange("error", e?.message || "Failed to start live call");
    }
  }

  private async initMicrophone() {
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.inputAudioCtx = new AudioCtx({ sampleRate: 16000 });

    const source = this.inputAudioCtx.createMediaStreamSource(this.micStream);
    // 4096 frames = ~256ms buffer at 16kHz
    this.processor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

    source.connect(this.processor);
    this.processor.connect(this.inputAudioCtx.destination);

    this.processor.onaudioprocess = (e) => {
      if (!this.active || this.isMuted || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      const inputData = e.inputBuffer.getChannelData(0);

      // Simple silence filter
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += Math.abs(inputData[i]);
      }
      const avg = sum / inputData.length;
      if (avg < 0.005) {
        // quiet ambient background, don't flood
        return;
      }

      // Convert float32 to 16kHz 16-bit PCM and send to Gemini Live
      const pcmBuffer = floatTo16BitPCM(inputData);
      const base64Audio = arrayBufferToBase64(pcmBuffer);

      this.ws.send(
        JSON.stringify({
          type: "audio",
          audio: base64Audio,
        })
      );
    };
  }

  public sendTextMessage(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "text", text }));
      this.callbacks.onTranscript(text, false);
      this.callbacks.onStatusChange("speaking", "Myra is thinking...");
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public stopSession() {
    this.active = false;
    if (this.processor) {
      try {
        this.processor.disconnect();
      } catch (_) {}
      this.processor = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.inputAudioCtx && this.inputAudioCtx.state !== "closed") {
      this.inputAudioCtx.close();
      this.inputAudioCtx = null;
    }
    this.player.stopAll();
    this.player.close();

    if (this.ws) {
      try {
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }

    this.callbacks.onStatusChange("disconnected", "Call ended");
  }
}
