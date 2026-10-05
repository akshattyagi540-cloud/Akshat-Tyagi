import React from "react";
import { Sparkles, Heart, Coffee, BookOpen, Clock, Code2, Globe, Music, Search } from "lucide-react";

interface QuickPromptsProps {
  onSelect: (prompt: string) => void;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelect }) => {
  const prompts = [
    {
      label: "Hi Myra! 😊 Kaise ho aap?",
      icon: Heart,
      color: "text-rose-400",
      query: "Hi Myra! Kaise ho aap?",
    },
    {
      label: "Myra, YouTube kholo 🌐",
      icon: Globe,
      color: "text-red-400",
      query: "Myra, YouTube kholo.",
    },
    {
      label: "Play a relaxing song 🎵",
      icon: Music,
      color: "text-pink-400",
      query: "Myra, play a relaxing chill song.",
    },
    {
      label: "Search Google for Minecraft news 🔍",
      icon: Search,
      color: "text-cyan-400",
      query: "Search Google for latest Minecraft update news.",
    },
    {
      label: "Say something sweet to cheer me up ❤️",
      icon: Sparkles,
      color: "text-amber-400",
      query: "Say something sweet and cute to cheer me up today! 😊",
    },
    {
      label: "Chai break short story (Hinglish) ☕",
      icon: Coffee,
      color: "text-orange-400",
      query: "Ek mast short chai break story sunao in natural Hinglish!",
    },
  ];

  return (
    <div className="p-4 sm:p-6 text-center max-w-2xl mx-auto space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-200">
          Talk to Myra or give a command
        </h3>
        <p className="text-xs text-slate-400">
          She has real connected computer tools: browser control, music player, notes, and reminders!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
        {prompts.map((p, idx) => {
          const Icon = p.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelect(p.query)}
              className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/70 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-200 transition-all text-xs group cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-slate-800/80 group-hover:bg-rose-500/10">
                <Icon className={`w-4 h-4 ${p.color}`} />
              </div>
              <span className="font-medium line-clamp-1">{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
