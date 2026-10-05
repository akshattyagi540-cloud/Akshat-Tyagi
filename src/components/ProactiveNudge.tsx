import React from "react";
import { Sparkles, X, MessageCircle } from "lucide-react";

interface ProactiveNudgeProps {
  nudge: { text: string; actionText: string } | null;
  onAccept: (text: string) => void;
  onDismiss: () => void;
}

export const ProactiveNudge: React.FC<ProactiveNudgeProps> = ({
  nudge,
  onAccept,
  onDismiss,
}) => {
  if (!nudge) return null;

  return (
    <div className="mx-4 my-2 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900 border border-rose-500/25 shadow-lg shadow-rose-950/20 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <div className="p-1.5 rounded-xl bg-rose-500/20 text-rose-300 shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <p className="text-xs text-rose-100 font-medium truncate">
          <span className="font-semibold text-rose-300 mr-1.5">Myra:</span>
          {nudge.text}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onAccept(nudge.actionText)}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Reply</span>
        </button>
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
