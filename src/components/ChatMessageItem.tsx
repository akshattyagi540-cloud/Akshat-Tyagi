import React, { useState } from "react";
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  Sparkles,
  FileText,
  CheckSquare,
  Clock,
  Bookmark,
  User,
  Globe,
  Music,
  Search,
  ExternalLink,
} from "lucide-react";
import { ChatMessage } from "../types";
import { playBase64Audio, speakWithWebSpeech, stopAnySpeakingAudio } from "../services/speechSynthesis";
import { synthesizeSpeech } from "../services/api";

interface ChatMessageItemProps {
  message: ChatMessage;
  selectedVoice: string;
  onOpenBrowser?: (url: string, title?: string) => void;
  onOpenMedia?: (songOrQuery: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  selectedVoice,
  onOpenBrowser,
  onOpenMedia,
}) => {
  const isModel = message.role === "model";
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePlayAudio = async () => {
    if (isPlayingAudio) {
      stopAnySpeakingAudio();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);

    // If message already has cached audio
    if (message.audioUrl) {
      playBase64Audio(message.audioUrl, () => setIsPlayingAudio(false));
      return;
    }

    // Otherwise, generate audio from /api/tts
    setIsLoadingAudio(true);
    try {
      const ttsResult = await synthesizeSpeech(message.content, selectedVoice);
      setIsLoadingAudio(false);
      if (ttsResult.audio) {
        message.audioUrl = ttsResult.audio;
        playBase64Audio(ttsResult.audio, () => setIsPlayingAudio(false));
      } else {
        speakWithWebSpeech(
          message.content,
          () => setIsPlayingAudio(true),
          () => setIsPlayingAudio(false)
        );
      }
    } catch (err) {
      console.warn("Server TTS failed, falling back to Web Speech:", err);
      setIsLoadingAudio(false);
      speakWithWebSpeech(
        message.content,
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false)
      );
    }
  };

  // Helper to format simple markdown (bold, lists, code)
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-200 my-1">
            {formatInlineStyles(line.trim().substring(2))}
          </li>
        );
      }
      return (
        <p key={idx} className={idx > 0 ? "mt-2 leading-relaxed" : "leading-relaxed"}>
          {formatInlineStyles(line)}
        </p>
      );
    });
  };

  const formatInlineStyles = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-rose-200">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div
      className={`flex gap-3 my-4 group ${
        isModel ? "justify-start" : "justify-end flex-row-reverse"
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isModel ? (
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 shadow-md shadow-rose-500/20 text-white font-medium text-xs">
            <span>M</span>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900" />
          </div>
        ) : (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            <User className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Bubble Content */}
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm text-sm transition-all ${
          isModel
            ? "bg-slate-900/90 text-slate-100 border border-slate-800/80 shadow-rose-950/20"
            : "bg-gradient-to-br from-rose-600 to-rose-700 text-white rounded-tr-none shadow-md shadow-rose-900/30"
        }`}
      >
        {/* Header line for model */}
        {isModel && (
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs text-rose-300">Myra</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300/80 border border-rose-500/20">
                Cute & Expressive
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleTogglePlayAudio}
                disabled={isLoadingAudio}
                title={isPlayingAudio ? "Stop Voice" : "Listen in Cute Voice"}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[11px] ${
                  isPlayingAudio
                    ? "bg-rose-500/30 text-rose-200 border border-rose-500/40"
                    : "text-slate-400 hover:text-rose-300 hover:bg-slate-800"
                }`}
              >
                {isLoadingAudio ? (
                  <span className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                ) : isPlayingAudio ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Pause</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Listen</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCopy}
                title="Copy message"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Message Text */}
        <div className="text-slate-100">{renderFormattedContent(message.content)}</div>

        {/* Tool Execution Badges */}
        {message.toolsExecuted && message.toolsExecuted.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col gap-2">
            {message.toolsExecuted.map((tool, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300"
              >
                {/* 1. Open Website in Connected Browser */}
                {tool.name === "open_website" && (
                  <>
                    <div className="flex items-center gap-2 truncate mr-2">
                      <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate">
                        Opened: <strong>{tool.args.title || tool.result?.browser?.title || "Website"}</strong>
                      </span>
                    </div>
                    {onOpenBrowser && (
                      <button
                        onClick={() =>
                          onOpenBrowser(
                            tool.args.url || tool.result?.browser?.url,
                            tool.args.title || tool.result?.browser?.title
                          )
                        }
                        className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-[11px] font-medium shrink-0 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    )}
                  </>
                )}

                {/* 2. Play Media */}
                {tool.name === "play_media" && (
                  <>
                    <div className="flex items-center gap-2 truncate mr-2">
                      <Music className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                      <span className="truncate">
                        Playing: <strong>{tool.args.songOrQuery || tool.result?.media?.title}</strong>
                      </span>
                    </div>
                    {onOpenMedia && (
                      <button
                        onClick={() =>
                          onOpenMedia(tool.args.songOrQuery || tool.result?.media?.songOrQuery)
                        }
                        className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[11px] font-medium shrink-0"
                      >
                        Player
                      </button>
                    )}
                  </>
                )}

                {/* 3. Search Web */}
                {tool.name === "search_web" && (
                  <>
                    <div className="flex items-center gap-2 truncate mr-2">
                      <Search className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate">
                        Search: <strong>{tool.args.query}</strong>
                      </span>
                    </div>
                    {onOpenBrowser && (
                      <button
                        onClick={() =>
                          onOpenBrowser(
                            `https://www.google.com/search?q=${encodeURIComponent(tool.args.query)}`,
                            `Search: ${tool.args.query}`
                          )
                        }
                        className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-medium shrink-0"
                      >
                        Results
                      </button>
                    )}
                  </>
                )}

                {/* 4. Save Note */}
                {tool.name === "save_note" && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Saved note: <strong>{tool.args.title}</strong></span>
                  </div>
                )}

                {/* 5. Manage Task */}
                {tool.name === "manage_task" && (
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Task added: <strong>{tool.args.taskText}</strong></span>
                  </div>
                )}

                {/* 6. Set Reminder */}
                {tool.name === "set_reminder" && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Reminder set: <strong>{tool.args.reminderText}</strong> ({tool.args.time})</span>
                  </div>
                )}

                {/* 7. Remember Fact */}
                {tool.name === "remember_fact" && (
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-3.5 h-3.5 text-purple-400" />
                    <span>Remembered: <strong>{tool.args.key}</strong></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer timestamp */}
        <div
          className={`mt-1.5 text-[10px] flex items-center gap-1 ${
            isModel ? "text-slate-500" : "text-rose-200/70 justify-end"
          }`}
        >
          <span>{message.timestamp}</span>
        </div>
      </div>
    </div>
  );
};
