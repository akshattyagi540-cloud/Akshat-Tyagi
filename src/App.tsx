import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  PhoneCall,
  Volume2,
  VolumeX,
  PlusCircle,
  FolderHeart,
  RotateCcw,
  Globe,
  Music,
} from "lucide-react";
import { Header } from "./components/Header";
import { ChatMessageItem } from "./components/ChatMessageItem";
import { VoiceCallModal } from "./components/VoiceCallModal";
import { MemoryDrawer } from "./components/MemoryDrawer";
import { ConnectedBrowserModal } from "./components/ConnectedBrowserModal";
import { ActiveMediaPlayer } from "./components/ActiveMediaPlayer";
import { QuickPrompts } from "./components/QuickPrompts";
import { ProactiveNudge } from "./components/ProactiveNudge";
import {
  ChatMessage,
  NoteItem,
  TaskItem,
  ReminderItem,
  VoiceSettings,
  ToolExecution,
  ConnectedBrowserTab,
  ActiveMedia,
  MyraEmotion,
} from "./types";
import { sendChatMessage, synthesizeSpeech } from "./services/api";
import {
  audioEffects,
  playBase64Audio,
  speakWithWebSpeech,
  stopAnySpeakingAudio,
} from "./services/speechSynthesis";

const INITIAL_GREETING: ChatMessage = {
  id: "msg_init",
  role: "model",
  content:
    "Hey! 😊 I'm Myra. Haan, bolo! Kaise ho aap? I'm your cute, friendly, and emotionally expressive voice assistant. You can chat with me in English, Hindi, or Hinglish, start a real-time **Voice Call**, or ask me to open websites like YouTube, play relaxing music, and manage your notes & reminders!",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

export default function App() {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("myra_messages");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [INITIAL_GREETING];
  });

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isListeningInputMic, setIsListeningInputMic] = useState(false);

  // Dynamic emotional state
  const [currentEmotion, setCurrentEmotion] = useState<MyraEmotion>("happy");

  // Connected Browser state
  const [browserTab, setBrowserTab] = useState<ConnectedBrowserTab | null>(null);

  // Connected Media Player state
  const [activeMedia, setActiveMedia] = useState<ActiveMedia | null>(null);

  // Proactive nudge state
  const [activeNudge, setActiveNudge] = useState<{ text: string; actionText: string } | null>(null);

  // Notes, Tasks, Reminders, and User Facts
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    const saved = localStorage.getItem("myra_notes");
    return saved ? JSON.parse(saved) : [];
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem("myra_tasks");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "task_1",
            text: "Try Voice Calling Myra 🎙️",
            priority: "high",
            completed: false,
            createdAt: new Date().toLocaleDateString(),
          },
          {
            id: "task_2",
            text: "Ask Myra to 'Open YouTube' or 'Play a song' 🌐",
            priority: "medium",
            completed: false,
            createdAt: new Date().toLocaleDateString(),
          },
        ];
  });

  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    const saved = localStorage.getItem("myra_reminders");
    return saved ? JSON.parse(saved) : [];
  });

  const [userFacts, setUserFacts] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("myra_facts");
    return saved ? JSON.parse(saved) : {};
  });

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    const saved = localStorage.getItem("myra_voice_settings");
    return saved
      ? JSON.parse(saved)
      : {
          voiceName: "Aoede",
          voiceStyle: "Cute & Bubbly",
          languageMode: "auto",
          toneWarmth: "sweet",
          autoSpeakReplies: false,
        };
  });

  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const inactivityTimerRef = useRef<any>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("myra_messages", JSON.stringify(messages.slice(-50)));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("myra_notes", JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem("myra_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("myra_reminders", JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem("myra_facts", JSON.stringify(userFacts));
  }, [userFacts]);

  useEffect(() => {
    localStorage.setItem("myra_voice_settings", JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Proactive check-in timer
  useEffect(() => {
    const triggerProactiveNudge = () => {
      const nudges = [
        {
          text: "Haan, bolo! Need me to open YouTube or play some relaxing study music? 😊",
          actionText: "Play some relaxing study music, Myra!",
        },
        {
          text: "How's your day going so far? Subah se kuch naya hua?",
          actionText: "Aap batao Myra, how's your day going?",
        },
        {
          text: "Chai break time! Want to hear a fun story or quick joke?",
          actionText: "Tell me a fun chai break story!",
        },
      ];
      const randomNudge = nudges[Math.floor(Math.random() * nudges.length)];
      setActiveNudge(randomNudge);
    };

    inactivityTimerRef.current = setTimeout(triggerProactiveNudge, 45000);

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [messages]);

  // Handle Tool Executions returned by backend
  const processToolExecutions = (tools: ToolExecution[]) => {
    for (const tool of tools) {
      if (tool.name === "open_website" && tool.result?.browser) {
        setBrowserTab({
          id: tool.result.browser.id,
          url: tool.result.browser.url,
          title: tool.result.browser.title,
          isOpen: true,
        });
        setCurrentEmotion("happy");
      } else if (tool.name === "play_media" && tool.result?.media) {
        setActiveMedia({
          id: tool.result.media.id,
          title: tool.result.media.title,
          songOrQuery: tool.result.media.songOrQuery,
          source: tool.result.media.source,
          isPlaying: true,
          type: "audio",
        });
        setCurrentEmotion("excited");
      } else if (tool.name === "search_web") {
        setBrowserTab({
          id: "search_" + Date.now(),
          url: `https://www.google.com/search?q=${encodeURIComponent(tool.args.query)}`,
          title: `Search: ${tool.args.query}`,
          isOpen: true,
        });
        setCurrentEmotion("curious");
      } else if (tool.name === "save_note" && tool.result?.note) {
        setNotes((prev) => [tool.result.note, ...prev]);
        setCurrentEmotion("calm");
      } else if (tool.name === "manage_task" && tool.result?.task) {
        setTasks((prev) => [tool.result.task, ...prev]);
        setCurrentEmotion("happy");
      } else if (tool.name === "set_reminder" && tool.result?.reminder) {
        setReminders((prev) => [tool.result.reminder, ...prev]);
        setCurrentEmotion("calm");
      } else if (tool.name === "remember_fact" && tool.result?.fact) {
        setUserFacts((prev) => ({
          ...prev,
          [tool.result.fact.key]: tool.result.fact.value,
        }));
        setCurrentEmotion("playful");
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText("");
    setActiveNudge(null);

    const userMessage: ChatMessage = {
      id: "msg_" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);

    // Infer emotion from user prompt
    const lower = text.toLowerCase();
    if (lower.includes("play") || lower.includes("song") || lower.includes("music")) {
      setCurrentEmotion("excited");
    } else if (lower.includes("sad") || lower.includes("cheer") || lower.includes("sweet")) {
      setCurrentEmotion("calm");
    } else if (lower.includes("story") || lower.includes("joke") || lower.includes("chai")) {
      setCurrentEmotion("playful");
    } else if (lower.includes("search") || lower.includes("code") || lower.includes("why")) {
      setCurrentEmotion("curious");
    } else {
      setCurrentEmotion("happy");
    }

    try {
      const apiHistory = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendChatMessage(
        apiHistory,
        userFacts,
        voiceSettings.voiceName,
        voiceSettings.autoSpeakReplies
      );

      audioEffects.playMessagePing();

      if (res.executedTools && res.executedTools.length > 0) {
        processToolExecutions(res.executedTools);
      }

      const modelMessage: ChatMessage = {
        id: "msg_" + (Date.now() + 1),
        role: "model",
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        toolsExecuted: res.executedTools,
        audioUrl: res.audio,
      };

      setMessages((prev) => [...prev, modelMessage]);

      if (voiceSettings.autoSpeakReplies) {
        if (res.audio) {
          playBase64Audio(res.audio);
        } else {
          speakWithWebSpeech(res.reply);
        }
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMessage: ChatMessage = {
        id: "msg_err_" + Date.now(),
        role: "model",
        content:
          "Arre, ek chota sa network issue hua! Main yahan hoon, can you say that again? 😊",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle dictation mic in input bar
  const handleToggleInputMic = () => {
    if (isListeningInputMic) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
      }
      setIsListeningInputMic(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-IN";

      rec.onstart = () => {
        setIsListeningInputMic(true);
      };

      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join("");
        setInputText(transcript);
      };

      rec.onerror = () => {
        setIsListeningInputMic(false);
      };

      rec.onend = () => {
        setIsListeningInputMic(false);
      };

      rec.start();
      speechRecognitionRef.current = rec;
    } catch (e) {
      setIsListeningInputMic(false);
    }
  };

  const handleClearChat = () => {
    if (confirm("Reset conversation with Myra?")) {
      setMessages([INITIAL_GREETING]);
      stopAnySpeakingAudio();
    }
  };

  const totalWorkspaceItems =
    notes.length + tasks.filter((t) => !t.completed).length + reminders.length;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Top Header */}
      <Header
        onStartVoiceCall={() => setIsVoiceCallOpen(true)}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenBrowser={() =>
          setBrowserTab({
            id: "web_default",
            url: "https://www.youtube.com",
            title: "YouTube",
            isOpen: true,
          })
        }
        onOpenMedia={() =>
          setActiveMedia({
            id: "media_default",
            title: "Lofi Study & Chill Beats",
            songOrQuery: "Lofi Chill",
            source: "lofi",
            isPlaying: true,
            type: "audio",
          })
        }
        totalNotesAndTasks={totalWorkspaceItems}
        voiceName={voiceSettings.voiceName}
        currentEmotion={currentEmotion}
      />

      {/* Main Chat Container */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto overflow-hidden relative">
        {/* Proactive Nudge Banner */}
        <ProactiveNudge
          nudge={activeNudge}
          onAccept={(prompt) => {
            setActiveNudge(null);
            handleSendMessage(prompt);
          }}
          onDismiss={() => setActiveNudge(null)}
        />

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              selectedVoice={voiceSettings.voiceName}
              onOpenBrowser={(url, title) =>
                setBrowserTab({
                  id: "web_" + Date.now(),
                  url,
                  title: title || "Website",
                  isOpen: true,
                })
              }
              onOpenMedia={(songOrQuery) =>
                setActiveMedia({
                  id: "media_" + Date.now(),
                  title: songOrQuery,
                  songOrQuery,
                  source: "youtube",
                  isPlaying: true,
                  type: "audio",
                })
              }
            />
          ))}

          {/* Quick Prompts shown if only initial greeting */}
          {messages.length === 1 && (
            <QuickPrompts onSelect={(prompt) => handleSendMessage(prompt)} />
          )}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 my-3 animate-in fade-in">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white text-xs font-semibold">
                M
              </div>
              <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-rose-300">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" />
                <span className="ml-2 font-medium">Myra is thinking...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <footer className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 max-w-4xl mx-auto"
          >
            {/* Clear chat button */}
            <button
              type="button"
              onClick={handleClearChat}
              title="Reset Chat"
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Input field */}
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Talk to Myra or say 'Open YouTube', 'Play a song'..."
                className="w-full px-4 py-3 pr-12 text-sm rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 transition-all shadow-inner"
              />

              {/* Dictation mic inside input */}
              <button
                type="button"
                onClick={handleToggleInputMic}
                title={isListeningInputMic ? "Stop Listening" : "Voice Dictation"}
                className={`absolute right-3 p-1.5 rounded-lg transition-colors ${
                  isListeningInputMic
                    ? "bg-rose-500 text-white animate-pulse"
                    : "text-slate-400 hover:text-rose-400"
                }`}
              >
                {isListeningInputMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-md shadow-rose-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Connected tool shortcuts */}
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  handleSendMessage("Myra, open YouTube.")
                }
                className="hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Globe className="w-3 h-3 text-red-400" />
                <span>Open YouTube</span>
              </button>
              <button
                onClick={() =>
                  handleSendMessage("Myra, play a relaxing lofi song.")
                }
                className="hover:text-pink-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Music className="w-3 h-3 text-pink-400" />
                <span>Play Song</span>
              </button>
            </div>

            <div>
              <span>
                Tip: Click{" "}
                <button
                  onClick={() => setIsVoiceCallOpen(true)}
                  className="text-rose-400 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <PhoneCall className="w-3 h-3" /> Voice Call
                </button>{" "}
                for live voice!
              </span>
            </div>
          </div>
        </footer>
      </main>

      {/* Voice Call Modal */}
      <VoiceCallModal
        isOpen={isVoiceCallOpen}
        onClose={() => setIsVoiceCallOpen(false)}
        userFacts={userFacts}
        selectedVoice={voiceSettings.voiceName}
        onNewToolExecuted={processToolExecutions}
      />

      {/* Connected Browser Modal */}
      <ConnectedBrowserModal
        browserTab={browserTab}
        onClose={() => setBrowserTab(null)}
        onNavigate={(url, title) =>
          setBrowserTab((prev) => (prev ? { ...prev, url, title: title || prev.title } : null))
        }
      />

      {/* Connected Media Player */}
      <ActiveMediaPlayer
        media={activeMedia}
        onClose={() => setActiveMedia(null)}
        onTogglePlay={() =>
          setActiveMedia((prev) => (prev ? { ...prev, isPlaying: !prev.isPlaying } : null))
        }
      />

      {/* Workspace & Memory Drawer */}
      <MemoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        notes={notes}
        onAddNote={(newNote) => setNotes((prev) => [newNote, ...prev])}
        onDeleteNote={(id) => setNotes((prev) => prev.filter((n) => n.id !== id))}
        tasks={tasks}
        onToggleTask={(id) =>
          setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
          )
        }
        onAddTask={(newTask) => setTasks((prev) => [newTask, ...prev])}
        onDeleteTask={(id) => setTasks((prev) => prev.filter((t) => t.id !== id))}
        reminders={reminders}
        onDeleteReminder={(id) => setReminders((prev) => prev.filter((r) => r.id !== id))}
        userFacts={userFacts}
        onUpdateFact={(key, val) => setUserFacts((prev) => ({ ...prev, [key]: val }))}
        onDeleteFact={(key) =>
          setUserFacts((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          })
        }
        voiceSettings={voiceSettings}
        onUpdateVoiceSettings={(settings) =>
          setVoiceSettings((prev) => ({ ...prev, ...settings }))
        }
      />
    </div>
  );
}
