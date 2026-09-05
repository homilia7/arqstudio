import "dotenv/config";
import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";
import { app, initServerDatabase } from "./server/apiApp";

export * from "./server/apiApp";

const PORT = 3000;

async function startServer() {
  // --- VITE / FRONTEND SERVING ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    initServerDatabase().catch((err) => {
      console.warn("[Storage] Inicialización en segundo plano:", err.message);
    });
  });
}

startServer();
