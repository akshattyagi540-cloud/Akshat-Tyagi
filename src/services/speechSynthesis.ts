/**
 * Speech synthesis & audio effects for Myra.
 * Provides instant cute female voice playback via Gemini TTS with Web Speech API fallback,
 * plus synthesized audio chimes for call connect / disconnect / message sounds.
 */

class MyraAudioEffects {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Play a pleasant uplifting chord chime when Myra connects
   */
  public playConnectChime() {
    try {
      const ctx = this.getContext();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.45);
      });
    } catch (_) {}
  }

  /**
   * Play gentle soft chime when call ends
   */
  public playDisconnectChime() {
    try {
      const ctx = this.getContext();
      const notes = [783.99, 659.25, 523.25]; // G5, E5, C5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

        gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.1 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.4);
      });
    } catch (_) {}
  }

  /**
   * Play a cute message received ping
   */
  public playMessagePing() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.26);
    } catch (_) {}
  }
}

export const audioEffects = new MyraAudioEffects();

/**
 * Play audio from base64 WAV or fall back to browser Web Speech API
 */
let currentAudioElement: HTMLAudioElement | null = null;

export function stopAnySpeakingAudio() {
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement.currentTime = 0;
    currentAudioElement = null;
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function playBase64Audio(
  base64Audio: string,
  onEnd?: () => void
): HTMLAudioElement {
  stopAnySpeakingAudio();
  const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
  currentAudioElement = audio;

  audio.onended = () => {
    if (currentAudioElement === audio) {
      currentAudioElement = null;
    }
    if (onEnd) onEnd();
  };

  audio.onerror = () => {
    if (currentAudioElement === audio) {
      currentAudioElement = null;
    }
    if (onEnd) onEnd();
  };

  audio.play().catch((err) => {
    console.warn("Audio autoplay blocked or failed:", err);
    if (onEnd) onEnd();
  });

  return audio;
}

/**
 * Fallback cute girl speech synthesis using Web Speech API
 */
export function speakWithWebSpeech(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
) {
  if (!("speechSynthesis" in window)) {
    if (onEnd) onEnd();
    return;
  }

  stopAnySpeakingAudio();

  // Clean text from markdown
  const clean = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_#~`]/g, "")
    .slice(0, 400);

  const utterance = new SpeechSynthesisUtterance(clean);

  // Find a sweet, high quality female voice
  const voices = window.speechSynthesis.getVoices();
  const femaleVoice = voices.find(
    (v) =>
      /female|girl|samantha|zira|karen|victoria|google uk english female|google हिन्दी|priya|moira/i.test(
        v.name
      ) ||
      (v.lang.startsWith("hi") && /female/i.test(v.name))
  ) || voices.find((v) => v.lang.startsWith("en-US") || v.lang.startsWith("en-GB"));

  if (femaleVoice) {
    utterance.voice = femaleVoice;
  }

  // Cute, friendly girl voice modulation: slightly higher pitch, friendly speed
  utterance.pitch = 1.18;
  utterance.rate = 1.05;

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}
