import { app, initServerDatabase } from "./apiApp";

// Inicializar conexión con base de datos en segundo plano
initServerDatabase().catch((err) => {
  console.warn("[Vercel API] Error inicializando base de datos:", err);
});

export default app;
