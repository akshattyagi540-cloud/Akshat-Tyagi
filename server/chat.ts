import { ai } from "./gemini.js";
import { MYRA_SYSTEM_PROMPT } from "./systemPrompt.js";
import { toolsDeclarations } from "./tools.js";
import { synthesizeSpeech } from "./tts.js";
import { generateFallbackResponse } from "./fallbackEngine.js";

export interface ChatMessagePayload {
  role: "user" | "model";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessagePayload[];
  userFacts?: Record<string, string>;
  voice?: string;
  withAudio?: boolean;
}

export async function handleChatMessage(reqData: ChatRequest) {
  const { messages, userFacts = {}, voice = "Aoede", withAudio = false } = reqData;

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "Hi";

  // If GEMINI_API_KEY is not configured, seamlessly use local fallback engine
  if (!process.env.GEMINI_API_KEY) {
    console.log("[Myra Chat] Running with built-in companion engine (no GEMINI_API_KEY configured)");
    const fallback = generateFallbackResponse(lastUserMessage, userFacts);
    return {
      reply: fallback.reply,
      executedTools: fallback.executedTools,
      audio: undefined,
    };
  }

  try {
    // Build dynamic system instructions including known user facts and current time
    let dynamicInstructions = MYRA_SYSTEM_PROMPT;
    const now = new Date();
    dynamicInstructions += `\nCURRENT CONTEXT:
- Current timestamp: ${now.toISOString()}
- Friendly local time: ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
`;

    if (userFacts && Object.keys(userFacts).length > 0) {
      dynamicInstructions += `\nWHAT YOU REMEMBER ABOUT THE USER:\n`;
      for (const [k, v] of Object.entries(userFacts)) {
        dynamicInstructions += `- ${k}: ${v}\n`;
      }
    }

    // Format messages for gemini generateContent
    const formattedContents = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    // Call Gemini 3.8 Flash with tools
    const response1 = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: formattedContents,
      config: {
        systemInstruction: dynamicInstructions,
        tools: [{ functionDeclarations: toolsDeclarations }],
      },
    });

    const executedTools: Array<{ name: string; args: any; result: any }> = [];
    let replyText = response1.text || "";

    // Check if Gemini invoked function calls
    const functionCalls = response1.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const toolCallParts: any[] = [];
      const toolResponseParts: any[] = [];

      for (const fc of functionCalls) {
        const toolName = fc.name || "unknown_tool";
        const toolArgs = fc.args as any;
        let toolResult: any = { status: "success" };

        if (toolName === "open_website") {
          const url = toolArgs.url.startsWith("http") ? toolArgs.url : `https://${toolArgs.url}`;
          toolResult = {
            success: true,
            action: "open_website",
            browser: {
              id: "web_" + Date.now(),
              url,
              title: toolArgs.title || "Website",
            },
          };
        } else if (toolName === "play_media") {
          toolResult = {
            success: true,
            action: "play_media",
            media: {
              id: "media_" + Date.now(),
              songOrQuery: toolArgs.songOrQuery,
              source: toolArgs.source || "youtube",
              title: toolArgs.songOrQuery,
            },
          };
        } else if (toolName === "search_web") {
          toolResult = {
            success: true,
            action: "search_web",
            query: toolArgs.query,
            url: `https://www.google.com/search?q=${encodeURIComponent(toolArgs.query)}`,
          };
        } else if (toolName === "save_note") {
          toolResult = {
            success: true,
            message: `Note '${toolArgs.title}' saved to notebook.`,
            note: {
              id: "note_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
              title: toolArgs.title,
              content: toolArgs.content,
              category: toolArgs.category || "General",
              createdAt: new Date().toLocaleDateString(),
            },
          };
        } else if (toolName === "manage_task") {
          toolResult = {
            success: true,
            message: `Task '${toolArgs.taskText}' added to checklist.`,
            task: {
              id: "task_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
              text: toolArgs.taskText,
              priority: toolArgs.priority || "medium",
              dueDate: toolArgs.dueDate || null,
              completed: false,
              createdAt: new Date().toLocaleDateString(),
            },
          };
        } else if (toolName === "set_reminder") {
          toolResult = {
            success: true,
            message: `Reminder set for '${toolArgs.reminderText}' (${toolArgs.time}).`,
            reminder: {
              id: "rem_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
              text: toolArgs.reminderText,
              time: toolArgs.time,
              status: "active",
              createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          };
        } else if (toolName === "remember_fact") {
          toolResult = {
            success: true,
            message: `Remembered: ${toolArgs.key} = ${toolArgs.value}`,
            fact: {
              key: toolArgs.key,
              value: toolArgs.value,
            },
          };
        }

        executedTools.push({
          name: toolName,
          args: toolArgs,
          result: toolResult,
        });

        toolCallParts.push({
          functionCall: {
            name: toolName,
            args: toolArgs,
          },
        });

        toolResponseParts.push({
          functionResponse: {
            name: toolName,
            response: toolResult,
          },
        });
      }

      // Send function responses back to Gemini
      const followUpContents = [
        ...formattedContents,
        {
          role: "model",
          parts: toolCallParts,
        },
        {
          role: "user",
          parts: toolResponseParts,
        },
      ];

      const response2 = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: followUpContents,
        config: {
          systemInstruction: dynamicInstructions,
        },
      });

      replyText = response2.text || "Maine ye note kar liya! Anything else I can do for you? 😊";
    }

    // Synthesize audio if requested
    let audioBase64: string | undefined = undefined;
    if (withAudio && replyText) {
      try {
        const ttsRes = await synthesizeSpeech(replyText, voice);
        audioBase64 = ttsRes.audio;
      } catch (err) {
        console.warn("TTS synthesis error:", err);
      }
    }

    return {
      reply: replyText,
      executedTools,
      audio: audioBase64,
    };
  } catch (err: any) {
    console.warn("[Myra Chat] Gemini call failed, falling back to companion engine:", err?.message);
    const fallback = generateFallbackResponse(lastUserMessage, userFacts);
    return {
      reply: fallback.reply,
      executedTools: fallback.executedTools,
      audio: undefined,
    };
  }
}
