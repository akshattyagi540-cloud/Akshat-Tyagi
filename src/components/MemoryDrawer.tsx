import React, { useState } from "react";
import {
  X,
  FileText,
  CheckSquare,
  Bookmark,
  Settings,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Volume2,
  Check,
} from "lucide-react";
import { NoteItem, TaskItem, ReminderItem, VoiceSettings } from "../types";

interface MemoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteItem[];
  onAddNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onAddTask: (task: TaskItem) => void;
  onDeleteTask: (id: string) => void;
  reminders: ReminderItem[];
  onDeleteReminder: (id: string) => void;
  userFacts: Record<string, string>;
  onUpdateFact: (key: string, value: string) => void;
  onDeleteFact: (key: string) => void;
  voiceSettings: VoiceSettings;
  onUpdateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
}

export const MemoryDrawer: React.FC<MemoryDrawerProps> = ({
  isOpen,
  onClose,
  notes,
  onAddNote,
  onDeleteNote,
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  reminders,
  onDeleteReminder,
  userFacts,
  onUpdateFact,
  onDeleteFact,
  voiceSettings,
  onUpdateVoiceSettings,
}) => {
  const [activeTab, setActiveTab] = useState<"notes" | "tasks" | "memory" | "voice">("notes");

  // New Note Form
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState("General");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // New Task Form
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");

  // New Fact Form
  const [newFactKey, setNewFactKey] = useState("");
  const [newFactVal, setNewFactVal] = useState("");

  if (!isOpen) return null;

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    onAddNote({
      id: "note_" + Date.now(),
      title: newNoteTitle.trim(),
      content: newNoteContent.trim(),
      category: newNoteCategory,
      createdAt: new Date().toLocaleDateString(),
    });

    setNewNoteTitle("");
    setNewNoteContent("");
    setIsAddingNote(false);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    onAddTask({
      id: "task_" + Date.now(),
      text: newTaskText.trim(),
      priority: newTaskPriority,
      completed: false,
      createdAt: new Date().toLocaleDateString(),
    });

    setNewTaskText("");
  };

  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactKey.trim() || !newFactVal.trim()) return;

    onUpdateFact(newFactKey.trim(), newFactVal.trim());
    setNewFactKey("");
    setNewFactVal("");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100 text-sm">Myra's Workspace & Memory</h2>
              <p className="text-xs text-slate-400">Notes, reminders, and your preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-4 pt-3 border-b border-slate-800 gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: "notes", label: `Notes (${notes.length})`, icon: FileText },
            { id: "tasks", label: `Tasks & Reminders`, icon: CheckSquare },
            { id: "memory", label: `Memory`, icon: Bookmark },
            { id: "voice", label: `Voice & Tone`, icon: Volume2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                  isActive
                    ? "text-rose-300 border-rose-500 bg-rose-500/10"
                    : "text-slate-400 border-transparent hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: NOTES */}
          {activeTab === "notes" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Saved by Myra or you</span>
                <button
                  onClick={() => setIsAddingNote(!isAddingNote)}
                  className="flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingNote ? "Cancel" : "Add Note"}</span>
                </button>
              </div>

              {isAddingNote && (
                <form
                  onSubmit={handleCreateNote}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-rose-500/30 space-y-2.5 animate-in fade-in"
                >
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Note title..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Note content..."
                    rows={3}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-500 text-white"
                    >
                      Save Note
                    </button>
                  </div>
                </form>
              )}

              {notes.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p>No notes saved yet.</p>
                  <p className="mt-1 text-slate-600">Tell Myra: "Save a note about my weekend plans"</p>
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-xs text-rose-200">{note.title}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {note.category}
                        </span>
                      </div>
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                    <span className="mt-2 block text-[10px] text-slate-500">{note.createdAt}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: TASKS & REMINDERS */}
          {activeTab === "tasks" && (
            <div className="space-y-4">
              {/* Task input */}
              <form onSubmit={handleCreateTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Add a new task..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 text-xs font-medium rounded-xl bg-rose-600 hover:bg-rose-500 text-white shrink-0"
                >
                  Add
                </button>
              </form>

              {/* Tasks List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Checklist ({tasks.filter((t) => !t.completed).length} pending)
                </span>
                {tasks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">No tasks added yet.</p>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 group"
                    >
                      <button
                        onClick={() => onToggleTask(task.id)}
                        className="flex items-center gap-2.5 text-left text-xs"
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            task.completed
                              ? "bg-emerald-500 border-emerald-500 text-slate-950"
                              : "border-slate-600 hover:border-rose-400"
                          }`}
                        >
                          {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span
                          className={`${
                            task.completed ? "line-through text-slate-500" : "text-slate-200"
                          }`}
                        >
                          {task.text}
                        </span>
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Reminders List */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Active Reminders
                </span>
                {reminders.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    No reminders set. Tell Myra: "Remind me to drink water in 20 minutes".
                  </p>
                ) : (
                  reminders.map((rem) => (
                    <div
                      key={rem.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-200"
                    >
                      <div>
                        <p className="font-medium text-cyan-200">{rem.text}</p>
                        <p className="text-[10px] text-cyan-400/80">⏰ {rem.time}</p>
                      </div>
                      <button
                        onClick={() => onDeleteReminder(rem.id)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MYRA'S MEMORY */}
          {activeTab === "memory" && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200 leading-relaxed">
                ✨ <strong>What Myra knows about you:</strong> Myra uses this context naturally in conversation so you never have to repeat yourself!
              </div>

              {/* Add Fact Form */}
              <form onSubmit={handleAddFact} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFactKey}
                    onChange={(e) => setNewFactKey(e.target.value)}
                    placeholder="Key (e.g. My Name, Goal)"
                    className="w-1/2 px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500"
                  />
                  <input
                    type="text"
                    value={newFactVal}
                    onChange={(e) => setNewFactVal(e.target.value)}
                    placeholder="Value (e.g. Alex, Learn AI)"
                    className="w-1/2 px-2.5 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 text-xs font-medium rounded-lg bg-purple-600 hover:bg-purple-500 text-white"
                >
                  Teach Myra
                </button>
              </form>

              {/* Memory List */}
              <div className="space-y-2">
                {Object.keys(userFacts).length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-4">
                    Myra hasn't learned any personal facts yet. Tell her your name or interests!
                  </p>
                ) : (
                  Object.entries(userFacts).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 group"
                    >
                      <div className="text-xs">
                        <span className="font-semibold text-rose-300 capitalize">{key}: </span>
                        <span className="text-slate-200">{val}</span>
                      </div>
                      <button
                        onClick={() => onDeleteFact(key)}
                        className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: VOICE & TONE SETTINGS */}
          {activeTab === "voice" && (
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-slate-300 block">
                  Select Cute Girl Voice
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "Aoede", name: "Aoede", desc: "Cute & Bubbly (Recommended)" },
                    { id: "Kore", name: "Kore", desc: "Warm & Gentle" },
                    { id: "Zephyr", name: "Zephyr", desc: "Soft & Calm" },
                    { id: "Puck", name: "Puck", desc: "Playful & Upbeat" },
                  ].map((voice) => {
                    const isSelected = voiceSettings.voiceName === voice.id;
                    return (
                      <button
                        key={voice.id}
                        onClick={() =>
                          onUpdateVoiceSettings({ voiceName: voice.id as any })
                        }
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? "bg-rose-500/20 border-rose-500 text-rose-200 shadow-md shadow-rose-950/30"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <p className="font-semibold text-slate-200">{voice.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{voice.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Mode */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-300 block">
                  Language Preference
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "auto", label: "Auto Match (Hinglish/Eng/Hindi)" },
                    { id: "hinglish", label: "Hinglish Focus" },
                    { id: "english", label: "English Only" },
                    { id: "hindi", label: "Hindi (हिंदी)" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() =>
                        onUpdateVoiceSettings({ languageMode: mode.id as any })
                      }
                      className={`p-2.5 rounded-xl border text-left ${
                        voiceSettings.languageMode === mode.id
                          ? "bg-rose-500/20 border-rose-500 text-rose-200"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto speak */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <p className="font-medium text-slate-200">Auto-Speak Replies</p>
                  <p className="text-[10px] text-slate-400">Play voice automatically in text chat</p>
                </div>
                <input
                  type="checkbox"
                  checked={voiceSettings.autoSpeakReplies}
                  onChange={(e) =>
                    onUpdateVoiceSettings({ autoSpeakReplies: e.target.checked })
                  }
                  className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>Myra AI Companion</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
