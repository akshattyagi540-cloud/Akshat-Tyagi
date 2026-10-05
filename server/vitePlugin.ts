import type { Plugin } from "vite";
import express from "express";
import { createApiRouter, attachLiveWebSocketServer } from "./apiRouter.js";

export function myraDevServerPlugin(): Plugin {
  return {
    name: "myra-dev-backend",
    configureServer(server) {
      const app = express();
      app.use(express.json({ limit: "15mb" }));
      app.use("/api", createApiRouter());

      // Mount Express app onto Vite's Connect middleware
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith("/api")) {
          app(req as any, res as any, next);
        } else {
          next();
        }
      });

      if (server.httpServer) {
        attachLiveWebSocketServer(server.httpServer as any);
      }
    },
  };
}
