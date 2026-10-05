import { ChatMessage, NoteItem, ReminderItem, TaskItem, ToolExecution } from "../types";

export interface ChatResponsePayload {
  reply: string;
  executedTools?: ToolExecution[];
  audio?: string;
  error?: string;
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === "ok";
  } catch (e) {
    return false;
  }
}

export async function sendChatMessage(
  messages: Array<{ role: "user" | "model"; content: string }>,
  userFacts: Record<string, string>,
  voice: string = "Aoede",
  withAudio: boolean = false
): Promise<ChatResponsePayload> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      userFacts,
      voice,
      withAudio,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(errData.error || `Server returned ${res.status}`);
  }

  return res.json();
}

export async function synthesizeSpeech(
  text: string,
  voice: string = "Aoede"
): Promise<{ audio: string | null; mimeType?: string; useWebSpeech?: boolean }> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      voice,
    }),
  });

  if (!res.ok) {
    return { audio: null, useWebSpeech: true };
  }

  return res.json();
}
