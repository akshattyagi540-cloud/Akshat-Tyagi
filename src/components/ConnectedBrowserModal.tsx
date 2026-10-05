import React, { useState, useEffect } from "react";
import {
  Globe,
  X,
  ExternalLink,
  RotateCw,
  Search,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { ConnectedBrowserTab } from "../types";

interface ConnectedBrowserModalProps {
  browserTab: ConnectedBrowserTab | null;
  onClose: () => void;
  onNavigate: (url: string, title?: string) => void;
}

export const ConnectedBrowserModal: React.FC<ConnectedBrowserModalProps> = ({
  browserTab,
  onClose,
  onNavigate,
}) => {
  const initialUrl = browserTab?.url || "";
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [isIframeBlocked, setIsIframeBlocked] = useState(() =>
    /google\.com|youtube\.com|twitter\.com|x\.com|github\.com|spotify\.com/i.test(initialUrl)
  );
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (browserTab && browserTab.url) {
      setCurrentUrl(browserTab.url);
      setInputUrl(browserTab.url);
      // Certain major domains restrict iframe embedding via X-Frame-Options
      const blocked =
        /google\.com|youtube\.com|twitter\.com|x\.com|github\.com|spotify\.com/i.test(
          browserTab.url
        );
      setIsIframeBlocked(blocked);
    }
  }, [browserTab]);

  if (!browserTab || !browserTab.isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let url = inputUrl.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      if (url.includes(".")) {
        url = `https://${url}`;
      } else {
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
    }
    setCurrentUrl(url);
    onNavigate(url);
  };

  const quickLinks = [
    { title: "YouTube", url: "https://www.youtube.com" },
    { title: "Google", url: "https://www.google.com" },
    { title: "Wikipedia", url: "https://en.wikipedia.org" },
    { title: "GitHub", url: "https://github.com" },
    { title: "Spotify", url: "https://open.spotify.com" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative flex flex-col rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-rose-950/30 overflow-hidden transition-all duration-300 ${
          isExpanded ? "w-full h-full max-w-6xl max-h-[96vh]" : "w-full max-w-4xl h-[85vh] max-h-[700px]"
        }`}
      >
        {/* Browser Top Navigation Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Myra Connected Browser</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title={isExpanded ? "Restore" : "Expand"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Address Bar & Controls */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-1 text-slate-400">
            <button
              onClick={() => onNavigate(currentUrl)}
              className="p-1.5 rounded-lg hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Refresh"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* URL Input Form */}
          <form onSubmit={handleSubmit} className="flex-1 relative flex items-center">
            <div className="absolute left-3 text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Search or enter URL..."
              className="w-full pl-9 pr-24 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700/80 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                title="Open in new window"
                className="p-1 text-slate-400 hover:text-rose-300"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="submit"
                className="px-2.5 py-0.5 text-[11px] font-medium rounded-lg bg-rose-600 hover:bg-rose-500 text-white"
              >
                Go
              </button>
            </div>
          </form>
        </div>

        {/* Quick Bookmarks Bar */}
        <div className="flex items-center gap-1.5 px-4 py-1.5 border-b border-slate-800/80 bg-slate-950/40 text-xs overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-slate-500 font-medium mr-1">Quick:</span>
          {quickLinks.map((ql, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentUrl(ql.url);
                setInputUrl(ql.url);
                onNavigate(ql.url, ql.title);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-rose-200 transition-colors whitespace-nowrap text-[11px]"
            >
              {ql.title}
            </button>
          ))}
        </div>

        {/* Main View Area */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center p-4">
          {isIframeBlocked ? (
            <div className="text-center max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 animate-in fade-in">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center shadow-lg shadow-rose-500/25">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-slate-100 text-base">
                  {browserTab.title || "Website Opened by Myra"}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-mono truncate px-4">
                  {currentUrl}
                </p>
                <p className="text-xs text-slate-400">
                  Myra successfully controlled the browser to open this service. Because major websites (YouTube, Google) restrict framing, click below to interact directly!
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-medium text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Launch {browserTab.title || "Site"}</span>
                </a>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Back to Myra
                </button>
              </div>
            </div>
          ) : currentUrl ? (
            <iframe
              src={currentUrl}
              title={browserTab.title || "Web Browser"}
              className="w-full h-full border-none rounded-xl bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs">
              Enter a website URL above to browse
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
