import React, { useState, useEffect, useRef } from "react";
import {
  Music,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  ExternalLink,
  Sparkles,
  Youtube,
  Radio,
} from "lucide-react";
import { ActiveMedia } from "../types";

interface ActiveMediaPlayerProps {
  media: ActiveMedia | null;
  onClose: () => void;
  onTogglePlay: () => void;
}

export const ActiveMediaPlayer: React.FC<ActiveMediaPlayerProps> = ({
  media,
  onClose,
  onTogglePlay,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Curated copyright-free high quality chill streams & lofi tracks
  const sampleTracks = [
    {
      title: "Lofi Study & Chill Beats",
      artist: "ChilledCow / Ambient Lofi",
      url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
    },
    {
      title: "Gentle Acoustic Sunset",
      artist: "Acoustic Cafe",
      url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=acoustic-guitars-ambient-uplifting-10820.mp3",
    },
    {
      title: "Midnight Rain & Piano",
      artist: "Peaceful Sleep",
      url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=relaxed-vlog-night-street-131746.mp3",
    },
  ];

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  useEffect(() => {
    if (media) {
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [media]);

  if (!media) return null;

  const currentTrack = sampleTracks[currentTrackIndex % sampleTracks.length];
  const displayTitle = media.title || currentTrack.title;
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    media.songOrQuery || "relaxing music"
  )}`;

  const handleNextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % sampleTracks.length);
    setIsPlaying(true);
  };

  const handlePlayToggle = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
    }
    setIsPlaying(!isPlaying);
    onTogglePlay();
  };

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-40 w-80 sm:w-96 rounded-3xl bg-slate-900/95 border border-rose-500/30 p-4 shadow-2xl shadow-rose-950/40 backdrop-blur-xl animate-in slide-in-from-bottom-4">
      {/* Hidden audio element for chill music playback */}
      {currentTrack?.url && (
        <audio
          ref={audioRef}
          src={currentTrack.url}
          autoPlay
          loop
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-rose-500/20 text-rose-300">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-[11px] font-semibold text-rose-300 tracking-wide uppercase">
            Myra Media Player
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Track Info & Visualizer */}
      <div className="flex items-center gap-3">
        {/* Animated Vinyl Disc */}
        <div
          className={`relative w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 via-slate-900 to-amber-500 flex items-center justify-center border-2 border-slate-700 shadow-md ${
            isPlaying ? "animate-spin [animation-duration:5s]" : ""
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          </div>
        </div>

        {/* Title & Artist */}
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-slate-100 truncate">{displayTitle}</h4>
          <p className="text-[10px] text-slate-400 truncate">
            {media.songOrQuery ? `Query: ${media.songOrQuery}` : currentTrack.artist}
          </p>

          {/* Animated audio wave bars */}
          <div className="flex items-center gap-0.5 mt-1.5">
            {[4, 10, 7, 14, 8, 12, 5, 11].map((h, i) => (
              <span
                key={i}
                style={{ height: isPlaying ? `${h}px` : "3px" }}
                className="w-1 bg-gradient-to-t from-rose-500 to-pink-400 rounded-full transition-all duration-150"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
        <a
          href={youtubeSearchUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-medium"
          title="Watch on YouTube"
        >
          <Youtube className="w-3.5 h-3.5 text-red-500" />
          <span>YouTube Video</span>
        </a>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayToggle}
            className="p-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition-transform active:scale-95"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>
          <button
            onClick={handleNextTrack}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Next Track"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
