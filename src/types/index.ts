export type Role = "user" | "model";

export interface ToolExecution {
  name: string;
  args: any;
  result: any;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: string;
  audioUrl?: string; // base64 or object url
  language?: "Hinglish" | "Hindi" | "English" | "Mixed";
  toolsExecuted?: ToolExecution[];
  isSpeaking?: boolean;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  text: string;
  priority: "low" | "medium" | "high";
  dueDate?: string | null;
  completed: boolean;
  createdAt: string;
}

export interface ReminderItem {
  id: string;
  text: string;
  time: string;
  status: "active" | "completed";
  createdAt: string;
}

export interface UserMemory {
  [key: string]: string;
}

export type MyraEmotion =
  | "happy"
  | "excited"
  | "curious"
  | "calm"
  | "playful"
  | "surprised";

export interface ConnectedBrowserTab {
  id: string;
  url: string;
  title: string;
  isOpen: boolean;
}

export interface ActiveMedia {
  id: string;
  title: string;
  songOrQuery: string;
  source: string;
  isPlaying: boolean;
  type: "audio" | "youtube";
  embedUrl?: string;
}

export interface VoiceSettings {
  voiceName: "Aoede" | "Kore" | "Zephyr" | "Puck";
  voiceStyle: string;
  languageMode: "auto" | "hinglish" | "hindi" | "english";
  toneWarmth: "warm" | "sweet" | "playful" | "gentle";
  autoSpeakReplies: boolean;
}
