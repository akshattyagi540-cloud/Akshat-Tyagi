import express, { Request, Response, NextFunction } from "express";
import { WebSocketServer } from "ws";
import type { Server as HttpServer, IncomingMessage, ServerResponse } from "http";
import { handleChatMessage } from "./chat.js";
import { synthesizeSpeech } from "./tts.js";
import { setupLiveWebSocket } from "./live.js";

// Helper to safely send JSON in both Express and Connect / raw Node environments
export function sendJson(res: any, status: number, data: any) {
  try {
    if (typeof res.status === "function" && typeof res.json === "function") {
      res.status(status).json(data);
    } else {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    }
  } catch (err) {
    console.error("[sendJson] Error sending response:", err);
    try {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "Internal response error" }));
    } catch (_) {}
  }
}

// Helper to safely extract JSON body even if body-parser was bypassed in Connect
export async function getRequestBody(req: any): Promise<any> {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk: any) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

export function createApiRouter() {
  const router = express.Router();

  router.use(express.json({ limit: "15mb" }));

  router.get("/health", (_req: Request, res: Response) => {
    sendJson(res, 200, {
      status: "ok",
      name: "Myra AI Assistant",
      hasApiKey: !!process.env.GEMINI_API_KEY,
      mode: process.env.GEMINI_API_KEY ? "gemini-3.8" : "built-in-companion",
      features: ["gemini-3.8-flash", "gemini-3.8-live", "gemini-3.8-flash-lite-tts", "tools"],
    });
  });

  router.post("/chat", async (req: Request, res: Response) => {
    try {
      const body = await getRequestBody(req);
      const { messages, userFacts, voice, withAudio } = body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return sendJson(res, 400, { error: "Missing or invalid 'messages' array." });
      }

      const result = await handleChatMessage({
        messages,
        userFacts,
        voice,
        withAudio,
      });

      sendJson(res, 200, result);
    } catch (err: any) {
      console.error("[API /chat] Error:", err);
      sendJson(res, 200, {
        reply: "Hey! 😊 I'm right here. How can I help you today?",
        executedTools: [],
      });
    }
  });

  router.post("/tts", async (req: Request, res: Response) => {
    try {
      const body = await getRequestBody(req);
      const { text, voice, style } = body;

      if (!text || typeof text !== "string") {
        return sendJson(res, 400, { error: "Missing or invalid 'text' parameter." });
      }

      // If no API key configured, return soft message so client uses Web Speech
      if (!process.env.GEMINI_API_KEY) {
        return sendJson(res, 200, {
          audio: null,
          useWebSpeech: true,
          message: "Web speech fallback active",
        });
      }

      const result = await synthesizeSpeech(text, voice, style);
      sendJson(res, 200, result);
    } catch (err: any) {
      console.warn("[API /tts] TTS notice:", err?.message);
      sendJson(res, 200, {
        audio: null,
        useWebSpeech: true,
      });
    }
  });

  return router;
}

export function attachLiveWebSocketServer(httpServer: HttpServer) {
  const wss = new WebSocketServer({
    noServer: true,
  });

  httpServer.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    if (url.pathname === "/live-ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  setupLiveWebSocket(wss);
  console.log("[LiveWS] WebSocket server attached at /live-ws");
  return wss;
}
