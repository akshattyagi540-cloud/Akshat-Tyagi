import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createApiRouter, attachLiveWebSocketServer } from "./server/apiRouter.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Mount API routes
app.use("/api", createApiRouter());

// Attach WebSocket for Gemini Live
attachLiveWebSocketServer(server);

// Serve static frontend files from dist
const distPath = path.resolve(__dirname, "dist");
app.use(express.static(distPath));

// Fallback to index.html for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[Myra Server] Running on http://0.0.0.0:${PORT}`);
});
