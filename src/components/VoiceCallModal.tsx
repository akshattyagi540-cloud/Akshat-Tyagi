import React, { useState, useEffect, useRef } from "react";
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Heart,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Send,
} from "lucide-react";
import { AudioVisualizerOrb } from "./AudioVisualizerOrb";
import { MyraLiveClient, LiveSessionStatus } from "../services/liveClient";
import { audioEffects, speakWithWebSpeech, stopAnySpeakingAudio } from "../services/speechSynthesis";
import { sendChatMessage, synthesizeSpeech } from "../services/api";

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userFacts: Record<string, string>;
  selectedVoice: string;
  onNewToolExecuted?: (tools: any[]) => void;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  isOpen,
  onClose,
  userFacts,
  selectedVoice,
  onNewToolExecuted,
}) => {
  const [callDuration, setCallDuration] = useState<number>(0);
  const [status, setStatus] = useState<LiveSessionStatus>("connecting");
  const [statusText, setStatusText] = useState<string>("Connecting to Myra...");
  const [currentEmotion, setCurrentEmotion] = useState<"happy" | "excited" | "curious" | "calm" | "playful" | "surprised">("happy");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speakerEnabled, setSpeakerEnabled] = useState<boolean>(true);
  const [transcripts, setTranscripts] = useState<Array<{ sender: "user" | "myra"; text: string }>>([
    {
      sender: "myra",
      text: "Hey! 😊 I'm Myra. Kaise ho? It's so nice to talk to you! Haan, bolo.",
    },
  ]);
  const [quickInput, setQuickInput] = useState<string>("");
  const [useFallbackMode, setUseFallbackMode] = useState<boolean>(false);
  const [isProcessingFallback, setIsProcessingFallback] = useState<boolean>(false);

  const liveClientRef = useRef<MyraLiveClient | null>(null);
  const timerRef = useRef<any>(null);
  const speechRecognitionRef = useRef<any>(null);
  const transcriptsEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll transcripts
  useEffect(() => {
    transcriptsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  // Start call session on open
  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    audioEffects.playConnectChime();
    startSession();

    return () => {
      cleanup();
    };
  }, [isOpen]);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (liveClientRef.current) {
      liveClientRef.current.stopSession();
      liveClientRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_) {}
      speechRecognitionRef.current = null;
    }
    stopAnySpeakingAudio();
  };

  const startSession = async () => {
    setStatus("connecting");
    setStatusText("Connecting to Myra's Live Voice channel...");

    const client = new MyraLiveClient({
      onStatusChange: (newStatus, msg) => {
        setStatus(newStatus);
        if (msg) setStatusText(msg);

        // If Live API WebSocket encounters an issue, activate seamless fallback
        if (newStatus === "error") {
          console.warn("[VoiceCall] Live WebSocket reported error, enabling WebSpeech/TTS voice fallback");
          setUseFallbackMode(true);
          initFallbackVoiceMode();
        }
      },
      onTranscript: (text, isModel) => {
        setTranscripts((prev) => [
          ...prev.slice(-15),
          { sender: isModel ? "myra" : "user", text },
        ]);
      },
      onInterrupted: () => {
        setStatusText("Listening to you...");
      },
      onAudioDataReceived: () => {
        // Audio chunk arrived
      },
    });

    liveClientRef.current = client;
    await client.startSession();
  };

  // Fallback voice mode if Gemini Live WS is unavailable
  const initFallbackVoiceMode = () => {
    setStatus("listening");
    setStatusText("Voice mode ready (Voice Assistant Engine active)");

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "en-IN"; // Good for English, Hindi, and Hinglish!

      rec.onresult = async (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const userSpoken = lastResult[0].transcript.trim();
          if (userSpoken) {
            handleUserVoiceUtterance(userSpoken);
          }
        }
      };

      rec.onerror = (e: any) => {
        console.warn("SpeechRec error:", e);
      };

      try {
        rec.start();
        speechRecognitionRef.current = rec;
      } catch (e) {
        console.warn("Could not start SpeechRec:", e);
      }
    }
  };

  const handleUserVoiceUtterance = async (userText: string) => {
    if (isProcessingFallback) return;
    setIsProcessingFallback(true);
    setStatus("speaking");
    setStatusText("Myra is thinking...");

    setTranscripts((prev) => [...prev, { sender: "user", text: userText }]);

    try {
      const history = transcripts.slice(-6).map((t) => ({
        role: (t.sender === "myra" ? "model" : "user") as "user" | "model",
        content: t.text,
      }));
      history.push({ role: "user", content: userText });

      const res = await sendChatMessage(history, userFacts, selectedVoice, true);
      const myraReply = res.reply || "Haan, bilkul! I'm here.";

      if (res.executedTools && res.executedTools.length > 0 && onNewToolExecuted) {
        onNewToolExecuted(res.executedTools);
      }

      setTranscripts((prev) => [...prev, { sender: "myra", text: myraReply }]);
      setStatusText("Myra is speaking...");

      if (res.audio && speakerEnabled) {
        // Play audio from Gemini TTS
        const audio = new Audio(`data:audio/wav;base64,${res.audio}`);
        audio.onended = () => {
          setStatus("listening");
          setStatusText("Listening... (speak anytime)");
          setIsProcessingFallback(false);
        };
        audio.play().catch(() => {
          speakWithWebSpeech(myraReply, undefined, () => {
            setStatus("listening");
            setStatusText("Listening... (speak anytime)");
            setIsProcessingFallback(false);
          });
        });
      } else if (speakerEnabled) {
        speakWithWebSpeech(myraReply, undefined, () => {
          setStatus("listening");
          setStatusText("Listening... (speak anytime)");
          setIsProcessingFallback(false);
        });
      } else {
        setStatus("listening");
        setStatusText("Listening... (speak anytime)");
        setIsProcessingFallback(false);
      }
    } catch (err: any) {
      console.warn("Voice utterance processing failed:", err);
      setStatus("listening");
      setStatusText("Listening to you...");
      setIsProcessingFallback(false);
    }
  };

  const handleToggleMute = () => {
    if (liveClientRef.current) {
      const muted = liveClientRef.current.toggleMute();
      setIsMuted(muted);
    } else {
      setIsMuted((prev) => !prev);
    }
  };

  const handleToggleSpeaker = () => {
    setSpeakerEnabled((prev) => !prev);
    if (speakerEnabled) {
      stopAnySpeakingAudio();
    }
  };

  const handleEndCall = () => {
    audioEffects.playDisconnectChime();
    cleanup();
    onClose();
  };

  const handleSendQuickText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    const txt = quickInput.trim();
    setQuickInput("");

    if (useFallbackMode || status === "error") {
      handleUserVoiceUtterance(txt);
    } else if (liveClientRef.current) {
      liveClientRef.current.sendTextMessage(txt);
    }
  };

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const analyser = liveClientRef.current?.getPlayer()?.getAnalyser() || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl h-[92vh] max-h-[750px] flex flex-col justify-between rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950 border border-rose-500/20 shadow-2xl shadow-rose-950/40 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-rose-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-pink-400 shadow-md shadow-rose-500/30">
              <Sparkles className="w-5 h-5 text-white" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-base tracking-tight">Myra</h3>
                <span className="px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {selectedVoice} • Cute Girl Voice
                </span>
              </div>
              <p className="text-xs text-rose-300/80 font-mono tracking-wider">
                Live Voice Call • {formatTimer(callDuration)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSpeaker}
              title={speakerEnabled ? "Mute Output" : "Unmute Output"}
              className={`p-2.5 rounded-full transition-colors ${
                speakerEnabled
                  ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
            >
              {speakerEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Center Visualizer & Status */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-2">
          {/* Status Badge */}
          <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 backdrop-blur-md">
            <span
              className={`w-2 h-2 rounded-full ${
                status === "speaking"
                  ? "bg-rose-400 animate-ping"
                  : status === "listening"
                  ? "bg-cyan-400 animate-pulse"
                  : "bg-amber-400"
              }`}
            />
            <span className="text-xs font-medium text-slate-300 tracking-wide">
              {statusText}
            </span>
          </div>

          {/* 3D Glowing Audio Visualizer Orb with dynamic emotion */}
          <AudioVisualizerOrb
            analyser={analyser}
            isActive={status === "speaking" || status === "listening"}
            status={status}
            emotion={currentEmotion}
          />

          {/* Subtitles / Live Transcript Area */}
          <div className="w-full max-w-lg mt-2 px-4 py-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 max-h-28 overflow-y-auto shadow-inner text-center">
            {transcripts.length > 0 ? (
              <p className="text-sm font-medium text-slate-200 leading-relaxed transition-all">
                <span className="text-rose-400 font-semibold mr-1.5">
                  {transcripts[transcripts.length - 1].sender === "myra" ? "Myra:" : "You:"}
                </span>
                "{transcripts[transcripts.length - 1].text}"
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic">Say anything to Myra in Hinglish, English or Hindi...</p>
            )}
            <div ref={transcriptsEndRef} />
          </div>
        </div>

        {/* Quick voice command pills */}
        <div className="relative z-10 px-6 py-2 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
          {[
            "Kaise ho Myra? 😊",
            "YouTube kholo 🌐",
            "Play a relaxing song 🎵",
            "Tell me something cute!",
            "Chai break story ☕",
            "Remind me to drink water ⏰",
          ].map((promptText, i) => (
            <button
              key={i}
              onClick={() => {
                if (promptText.includes("Play")) setCurrentEmotion("excited");
                else if (promptText.includes("story")) setCurrentEmotion("playful");
                else if (promptText.includes("cute")) setCurrentEmotion("calm");

                if (useFallbackMode) {
                  handleUserVoiceUtterance(promptText);
                } else if (liveClientRef.current) {
                  liveClientRef.current.sendTextMessage(promptText);
                }
              }}
              className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-800/70 hover:bg-rose-500/20 hover:text-rose-200 hover:border-rose-500/30 text-slate-300 border border-slate-700/60 transition-all cursor-pointer"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Text backup input during call */}
        <form onSubmit={handleSendQuickText} className="relative z-10 px-6 pb-2">
          <div className="relative flex items-center">
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="Or type to Myra during voice call..."
              className="w-full px-4 py-2.5 pr-11 text-xs rounded-xl bg-slate-800/50 border border-slate-700/70 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all"
            />
            <button
              type="submit"
              disabled={!quickInput.trim()}
              className="absolute right-2 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 disabled:opacity-30 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Bottom Control Bar */}
        <div className="relative z-10 flex items-center justify-around px-8 py-5 border-t border-slate-800/60 bg-slate-900/60 backdrop-blur-md">
          {/* Mute button */}
          <button
            onClick={handleToggleMute}
            className={`flex flex-col items-center gap-1.5 transition-transform active:scale-95`}
          >
            <div
              className={`p-3.5 rounded-full shadow-lg ${
                isMuted
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              {isMuted ? "Unmute" : "Mute"}
            </span>
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="flex flex-col items-center gap-1.5 group transition-transform active:scale-95"
          >
            <div className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/40 group-hover:scale-105 transition-all">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-rose-300">End Call</span>
          </button>

          {/* Engine indicator */}
          <button
            onClick={() => {
              if (!useFallbackMode) {
                setUseFallbackMode(true);
                initFallbackVoiceMode();
              }
            }}
            className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
            title="Switch Voice Engine"
          >
            <div className="p-3.5 rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700">
              <Sparkles className="w-5 h-5 text-rose-400" />
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              {useFallbackMode ? "Gemini TTS" : "Live 3.8"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
