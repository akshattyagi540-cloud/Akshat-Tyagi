import React from "react";
import {
  PhoneCall,
  Sparkles,
  FolderHeart,
  Globe,
  Music,
} from "lucide-react";
import { MyraEmotion } from "../types";

interface HeaderProps {
  onStartVoiceCall: () => void;
  onOpenDrawer: () => void;
  onOpenBrowser: () => void;
  onOpenMedia: () => void;
  totalNotesAndTasks: number;
  voiceName: string;
  currentEmotion?: MyraEmotion;
}

export const Header: React.FC<HeaderProps> = ({
  onStartVoiceCall,
  onOpenDrawer,
  onOpenBrowser,
  onOpenMedia,
  totalNotesAndTasks,
  voiceName,
  currentEmotion = "happy",
}) => {
  const emotionConfig: Record<MyraEmotion, { label: string; badgeClass: string }> = {
    happy: { label: "😊 Happy & Cheerful", badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
    excited: { label: "✨ Excited", badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
    curious: { label: "🤔 Curious", badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    calm: { label: "🌸 Calm & Gentle", badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
    playful: { label: "💖 Playful", badgeClass: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
    surprised: { label: "😲 Surprised", badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  };

  const emotionInfo = emotionConfig[currentEmotion] || emotionConfig.happy;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Myra Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 shadow-md shadow-rose-500/25">
            <span className="font-bold text-white text-lg font-serif">M</span>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-slate-100 tracking-tight">Myra</h1>
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${emotionInfo.badgeClass}`}>
                {emotionInfo.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Hinglish, Hindi & English • {voiceName}</span>
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Connected Browser Tool */}
          <button
            onClick={onOpenBrowser}
            title="Connected Browser Tool"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 transition-all text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Browser</span>
          </button>

          {/* Media Player Tool */}
          <button
            onClick={onOpenMedia}
            title="Connected Media Player"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-rose-300 border border-slate-800 transition-all text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Music className="w-4 h-4 text-rose-400" />
            <span className="hidden md:inline">Player</span>
          </button>

          {/* Workspace / Notes Drawer Toggle */}
          <button
            onClick={onOpenDrawer}
            title="Open Notes, Tasks & Memory"
            className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 transition-all text-xs font-medium cursor-pointer"
          >
            <FolderHeart className="w-4 h-4 text-pink-400" />
            <span className="hidden sm:inline">Workspace</span>
            {totalNotesAndTasks > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500/30 text-rose-300">
                {totalNotesAndTasks}
              </span>
            )}
          </button>

          {/* Voice Call Button */}
          <button
            onClick={onStartVoiceCall}
            className="group relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg shadow-rose-600/30 text-xs font-semibold transition-all transform active:scale-95 cursor-pointer"
          >
            <div className="relative">
              <PhoneCall className="w-4 h-4 group-hover:animate-bounce" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
            </div>
            <span>Voice Call</span>
          </button>
        </div>
      </div>
    </header>
  );
};
