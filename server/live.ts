import { LiveServerMessage, Modality } from "@google/genai";
import { WebSocket, WebSocketServer } from "ws";
import { ai } from "./gemini.js";
import { MYRA_SYSTEM_PROMPT } from "./systemPrompt.js";

export function setupLiveWebSocket(wss: WebSocketServer) {
  wss.on("connection", async (clientWs: WebSocket) => {
    console.log("[LiveWS] Client connected to Myra Live voice session");

    if (!process.env.GEMINI_API_KEY) {
      clientWs.send(
        JSON.stringify({
          type: "error",
          error: "GEMINI_API_KEY is not configured on the server.",
        })
      );
      clientWs.close();
      return;
    }

    let session: any = null;
    let isClosed = false;

    // Send status connecting
    clientWs.send(JSON.stringify({ type: "status", status: "connecting" }));

    try {
      session = await ai.live.connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              // Prebuilt voices: Aoede (cute, bubbly), Kore (warm, gentle), Puck, Zephyr
              prebuiltVoiceConfig: { voiceName: "Aoede" },
            },
          },
          systemInstruction:
            MYRA_SYSTEM_PROMPT +
            `\nYou are currently in a real-time LIVE VOICE CALL with the user.
Speak with a warm, natural, cheerful, human female cadence.
Keep spoken responses punchy, conversational, and comfortable to listen to.
Do not speak long lists or code blocks in voice calls unless specifically asked.
Greet warmly: "Hey! 😊 I'm Myra. Kaise ho? It's so nice to talk to you!"`,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;

            // Model audio response
            const audioData =
              message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              clientWs.send(JSON.stringify({ type: "audio", audio: audioData }));
            }

            // Text / transcripts
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.text) {
                  clientWs.send(JSON.stringify({ type: "transcript", text: part.text }));
                }
              }
            }

            // User interrupted model speaking
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: "interrupted" }));
            }

            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: "turnComplete" }));
            }
          },
          onclose: () => {
            console.log("[LiveWS] Gemini Live session closed");
            if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "closed" }));
            }
          },
          onerror: (err: any) => {
            console.error("[LiveWS] Gemini Live session error:", err);
            if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: "error",
                  error: err?.message || "Live session error occurred",
                })
              );
            }
          },
        },
      });

      clientWs.send(JSON.stringify({ type: "status", status: "ready" }));
    } catch (err: any) {
      console.error("[LiveWS] Failed to connect to Gemini Live:", err);
      clientWs.send(
        JSON.stringify({
          type: "error",
          error:
            err?.message ||
            "Unable to connect to Gemini Live audio server. Voice fallback is ready.",
        })
      );
      return;
    }

    clientWs.on("message", (raw: any) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (!session) return;

        if (msg.type === "audio" && msg.audio) {
          // Client sends 16kHz PCM audio chunk (base64)
          session.sendRealtimeInput({
            audio: {
              data: msg.audio,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        } else if (msg.type === "text" && msg.text) {
          session.sendClientContent({
            turns: [
              {
                role: "user",
                parts: [{ text: msg.text }],
              },
            ],
            turnComplete: true,
          });
        }
      } catch (e) {
        console.warn("[LiveWS] Message processing error:", e);
      }
    });

    const cleanup = () => {
      isClosed = true;
      if (session) {
        try {
          session.close();
        } catch (_) {}
      }
    };

    clientWs.on("close", cleanup);
    clientWs.on("error", cleanup);
  });
}
