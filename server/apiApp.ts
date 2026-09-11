import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import seedStore from "../data/store.json";
import {
  initNeonConnection,
  getNeonStatus,
  loadFromNeon,
  saveToNeon,
  testNeonQuery,
  querySQL,
  getNeonSecretKeys,
  recreateAllDatabaseTables,
  getProjectsSQL,
  createProjectSQL,
  updateProjectSQL,
  deleteProjectSQL,
  deleteAllProjectsSQL,
  getUsersSQL,
  findUserByNameSQL,
  findUserByPinSQL,
  findUsersByPinSQL,
  findUserByIdSQL,
  createUserSQL,
  updateUserEmailSQL,
} from "./neon";
import {
  generateBlueprintFromIdea,
  generateWorkPlanFromBlueprint,
  synthesizeBlueprintByDomain,
  synthesizeWorkPlanFromBlueprint,
} from "./blueprintEngine";
import {
  indexRagDocument,
  searchRag,
  getAgentRagContext,
} from "./ragEngine";

export interface ProjectScreen {
  id: string;
  name: string;
  path?: string;
  description?: string;
  features: string[];
}

export interface ProjectConnection {
  id?: string;
  name: string;
  purpose?: string;
  type?: "database" | "auth" | "api" | "storage" | "webhook" | "other";
  configDetails?: string;
}

export interface ProjectBlueprint {
  masterPrompt: string;
  generalFeatures: string[];
  screens: ProjectScreen[];
  connections: ProjectConnection[];
  architecturalNotes?: string;
  lastGeneratedPlanAt?: string;
}

export interface Project {
  id: string;
  userId?: string;
  name: string;
  mainUrl: string;
  description?: string;
  apiKey: string;
  blueprint?: ProjectBlueprint;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectModule {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  order: number;
  createdAt: string;
}

export interface ProjectStage {
  id: string;
  moduleId: string;
  projectId: string;
  title: string;
  description?: string;
  order: number;
  createdAt: string;
}

export interface SubTaskItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskContextMemory {
  technicalRequirements?: string[];
  affectedFiles?: string[];
  rulesConstraints?: string[];
  dependencies?: string[];
  requiredDependencies?: string[];
  notes?: string;
  persistentNotes?: string;
}

export type TaskStatus =
  | "pending" // Pendiente / Asignada
  | "in_progress" // En progreso por Antigravity
  | "ready_for_review" // Completada por IA, pendiente de revisión humana
  | "verified" // Verificada y Aprobada por humano (Bloqueada)
  | "needs_revision"; // Requiere ajustes / Rechazada tras revisión humana

export interface TaskItem {
  id: string;
  projectId: string;
  moduleId?: string;
  stageId?: string;
  title: string;
  instruction: string;
  status: TaskStatus;
  workUrl: string; // URL donde Antigravity trabajó / preview
  aiOutput?: string;
  aiNotes?: string;
  humanFeedback?: string;
  locked: boolean; // Si está aprobada, se bloquea para no tocarse
  assignedAgent?: string;
  subtasks?: SubTaskItem[];
  contextMemory?: TaskContextMemory;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  verifiedAt?: string;
  gitBranch?: string;
  gitCommit?: string;
  imageRefs?: string[];
}

export interface ChangeLogEntry {
  id: string;
  taskId: string;
  projectId: string;
  taskTitle: string;
  action: string;
  previousStatus?: TaskStatus;
  newStatus?: TaskStatus;
  details: string;
  workUrl?: string;
  author: "human" | "antigravity_ai" | "api" | "system";
  timestamp: string;
}

export interface AgentConnection {
  id: string;
  agentName: string;
  connectedAt: string;
}

interface DatabaseSchema {
  projects: Project[];
  modules: ProjectModule[];
  stages: ProjectStage[];
  tasks: TaskItem[];
  history: ChangeLogEntry[];
  agentConnections: AgentConnection[];
  blockedAgents?: any[];
  users: any[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "store.json");
const TMP_DATA_DIR = "/tmp/data";
const TMP_DB_FILE = path.join(TMP_DATA_DIR, "store.json");

function ensureDb(): DatabaseSchema {
  try {
    // Si estamos en entorno serverless (Vercel) y ya se escribió en /tmp, cargar de ahí
    if (fs.existsSync(TMP_DB_FILE)) {
      const raw = fs.readFileSync(TMP_DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        projects: parsed.projects || [],
        modules: parsed.modules || [],
        stages: parsed.stages || [],
        tasks: parsed.tasks || [],
        history: parsed.history || [],
        agentConnections: parsed.agentConnections || [],
        users: parsed.users || [],
      };
    }

    // De lo contrario cargar el archivo del repositorio data/store.json
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        projects: (parsed.projects || []).filter(
          (p: any) => p.name !== "Proyecto Antigravity Persistente" && p.id !== "proj-1788390562373"
        ),
        modules: parsed.modules || [],
        stages: parsed.stages || [],
        tasks: parsed.tasks || [],
        history: parsed.history || [],
        agentConnections: parsed.agentConnections || [],
        users: parsed.users || [],
      };
    }
  } catch (err) {
    console.error("Error reading db file, initializing default:", err);
  }

  const initialDb: DatabaseSchema = {
    projects: ((seedStore as any).projects || []).filter(
      (p: any) => p.name !== "Proyecto Antigravity Persistente" && p.id !== "proj-1788390562373"
    ),
    modules: (seedStore as any).modules || [],
    stages: (seedStore as any).stages || [],
    tasks: (seedStore as any).tasks || [],
    history: (seedStore as any).history || [],
    agentConnections: (seedStore as any).agentConnections || [],
    users: (seedStore as any).users || [],
  };

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8");
  } catch (err) {
    // En entornos con filesystem de solo lectura (Vercel), ignorar error de escritura
  }

  return initialDb;
}

let db: DatabaseSchema = ensureDb();

function saveDb() {
  // Intentar guardar en data/store.json local
  let written = false;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    written = true;
  } catch (err) {
    // Si el sistema de archivos es de solo lectura (Vercel Serverless)
  }

  // Si falló escribir en data/, intentar en /tmp para mantener estado en la instancia serverless
  if (!written) {
    try {
      if (!fs.existsSync(TMP_DATA_DIR)) {
        fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(TMP_DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    } catch (tmpErr) {
      console.error("Error persisting db to /tmp:", tmpErr);
    }
  }

  // Guardar de forma asíncrona en Neon PostgreSQL si está conectado
  saveToNeon(db).catch((err) => {
    console.warn("Neon sync background warning:", err);
  });
}

async function saveDbAsync(): Promise<void> {
  saveDb();
  if (getNeonStatus().isConnected) {
    await saveToNeon(db).catch((err) => {
      console.warn("Neon sync warning:", err);
    });
  }
}

function logChange(entry: Omit<ChangeLogEntry, "id" | "timestamp">) {
  const newEntry: ChangeLogEntry = {
    ...entry,
    id: "hist-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
  };
  db.history.unshift(newEntry);
  if (db.history.length > 500) {
    db.history = db.history.slice(0, 500);
  }
}

export const app = express();

app.use(express.json());

app.use(async (req, res, next) => {
  if (req.url.startsWith("/api/") || req.url.startsWith("/projects") || req.url.startsWith("/tasks") || req.url.startsWith("/modules") || req.url.startsWith("/stages") || req.url.startsWith("/users") || req.url.startsWith("/auth") || req.url.startsWith("/neon")) {
    try {
      await initServerDatabase();
    } catch (err) {
      console.warn("Background DB Init warning:", err);
    }
  }
  next();
});

// Normalizar solo endpoints de API si el host serverless elimina el prefijo /api
app.use(async (req, res, next) => {
  if (
    req.url.startsWith("/projects") ||
    req.url.startsWith("/tasks") ||
    req.url.startsWith("/modules") ||
    req.url.startsWith("/stages") ||
    req.url.startsWith("/history") ||
    req.url.startsWith("/antigravity") ||
    req.url.startsWith("/neon") ||
    req.url.startsWith("/auth") ||
    req.url.startsWith("/health")
  ) {
    req.url = "/api" + req.url;
  }
  next();
});

// CORS
  app.use(async (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key"
    );
    res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // --- AUTOMATIC AGENT CONNECTION TRACKING ---
  app.use(async (req, res, next) => {
    // Only track specific AI-related routes to avoid spamming the history with normal user traffic
    if (
      req.url.startsWith("/api/agent/") ||
      req.url.startsWith("/api/antigravity/") ||
      req.url.includes("/start-by-ai")
    ) {
      const agentName = (req.headers["x-agent-name"] as string) || req.body?.assignedAgent || "ANTIGRAVITY AI";
      
      if (!db.agentConnections) db.agentConnections = [];
      
      // Throttle exact same agent connections to once every 10 seconds to avoid spamming 
      // if they make multiple rapid requests (e.g., polling).
      const lastConn = db.agentConnections[db.agentConnections.length - 1];
      const now = Date.now();
      
      if (!lastConn || lastConn.agentName !== agentName || (now - new Date(lastConn.connectedAt).getTime() > 10000)) {
        db.agentConnections.push({
          id: "agent-conn-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
          agentName,
          connectedAt: new Date().toISOString(),
        });
        await saveDbAsync();
      }
    }
    next();
  });

  // --- HEALTH & STATS ---
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      projectsCount: db.projects.length,
      modulesCount: db.modules.length,
      stagesCount: db.stages.length,
      tasksCount: db.tasks.length,
      needsRevisionCount: db.tasks.filter((t) => t.status === "needs_revision").length,
      historyCount: db.history.length,
    });
  });

  // --- RAG ENDPOINTS (Vectorize + Workers AI / Local Semantic Engine) ---
  app.post("/api/rag/search", async (req, res) => {
    try {
      const { query = "", projectId, type = "all", topK = 5, threshold = 0.12 } = req.body;
      const results = await searchRag(query, { projectId, type, topK: Number(topK), threshold: Number(threshold) });
      res.json({ query, count: results.length, results });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/rag/context", async (req, res) => {
    try {
      const { projectId = "", taskTitle = "", taskInstruction = "" } = req.query as Record<string, string>;
      const contextData = await getAgentRagContext(projectId, taskTitle, taskInstruction);
      res.json(contextData);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/rag/reindex", async (req, res) => {
    try {
      const { projectId } = req.body;
      let tasksIndexed = 0;
      let historyIndexed = 0;

      const tasksToIndex = projectId ? db.tasks.filter((t) => t.projectId === projectId) : db.tasks;
      for (const t of tasksToIndex) {
        await indexRagDocument({
          projectId: t.projectId,
          type: "task",
          referenceId: t.id,
          title: t.title,
          content: `${t.instruction || ""} ${t.aiOutput || ""}`,
          metadata: { taskId: t.id },
        });
        tasksIndexed++;
      }

      const historyToIndex = projectId ? db.history.filter((h) => h.projectId === projectId) : db.history;
      for (const h of historyToIndex) {
        await indexRagDocument({
          projectId: h.projectId || projectId || "global",
          type: "history",
          referenceId: h.id,
          title: h.taskTitle || h.action,
          content: h.details || "",
          metadata: { historyId: h.id },
        });
        historyIndexed++;
      }

      res.json({
        success: true,
        message: "Reindexación de base vectorial RAG completada con éxito.",
        tasksIndexed,
        historyIndexed,
        totalIndexed: tasksIndexed + historyIndexed,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- AUTH & USERS (REAL SQL PERSISTENCE IN NEON POSTGRESQL) ---
  app.post("/api/auth/login", async (req, res) => {
    const { name, pin, email } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Ingresa tu nombre de usuario." });
    if (!pin || typeof pin !== "string" || pin.trim().length !== 4) {
      return res.status(400).json({ error: "Ingresa un PIN de 4 dígitos válido." });
    }
    if (!db.users) db.users = [];
    const cleanName = name.trim();
    const cleanPin = pin.trim();
    const cleanEmail = email ? email.trim() : "";
    const lowerName = cleanName.toLowerCase();

    let user: any = null;

    if (getNeonStatus().isConnected) {
      const sqlUser = await findUserByNameSQL(cleanName);
      if (sqlUser) {
        user = sqlUser;
      }
    }

    if (!user) {
      user = db.users.find((u) => u.name.toLowerCase() === lowerName);
    }

    // Auto-create ADMIN fallback if requested and doesn't exist
    if (!user && lowerName === "admin" && cleanPin === "1234") {
      user = {
        id: "usr-admin-" + Date.now(),
        name: "ADMIN",
        pin: "1234",
        email: "admin@antigravity.system",
        accessType: "Super Administrador",
        createdAt: new Date().toISOString()
      };
      
      // Save locally
      db.users.push(user);
      
      // Save to Neon if connected
      if (getNeonStatus().isConnected) {
        await createUserSQL(user).catch(err => console.error("Error auto-creating ADMIN:", err));
      }
      
      await saveDbAsync();
    }

    if (!user) {
      return res.status(404).json({
        error: `El usuario "${cleanName}" no está registrado. Si deseas crear una cuenta nueva independiente, haz clic en la pestaña "Crear Cuenta".`,
      });
    }

    if (user.pin !== cleanPin) {
      return res.status(401).json({
        error: `PIN incorrecto para el usuario "${user.name}". Verifica tu código de 4 dígitos.`,
      });
    }

    if (cleanEmail && !user.email) {
      user.email = cleanEmail;
      if (getNeonStatus().isConnected) {
        await updateUserEmailSQL(user.id, cleanEmail);
      }
      await saveDbAsync();
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        pin: user.pin,
        email: user.email,
        accessType: user.accessType,
        createdAt: user.createdAt,
      },
    });
  });

  // POST /api/users o /api/auth/register - Registrar o crear nuevo usuario
  const handleRegisterUser = async (req: any, res: any) => {
    const { name, pin, email, accessType } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "El nombre de usuario es obligatorio." });
    }
    if (!pin || typeof pin !== "string" || pin.trim().length !== 4) {
      return res.status(400).json({ error: "El PIN debe ser exactamente de 4 dígitos numéricos." });
    }

    if (!db.users) db.users = [];
    const cleanName = name.trim();
    const cleanPin = pin.trim();
    const cleanEmail = email ? email.trim() : "";
    const cleanAccess = accessType ? accessType.trim() : "Acceso Full";
    const lowerName = cleanName.toLowerCase();

    // Verificación previa de existencia: el NOMBRE debe ser diferente / único
    let existingUser: any = null;
    if (getNeonStatus().isConnected) {
      existingUser = await findUserByNameSQL(cleanName);
    }
    if (!existingUser) {
      existingUser = db.users.find((u) => u.name.toLowerCase() === lowerName);
    }

    if (existingUser) {
      return res.status(409).json({
        error: `El nombre de usuario "${cleanName}" ya existe. Dos usuarios pueden tener la misma contraseña pero deben tener diferente nombre. Por favor ingresa otro nombre o inicia sesión.`,
        user: existingUser,
      });
    }

    const newUser = {
      id: "usr-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: cleanName,
      pin: cleanPin,
      email: cleanEmail,
      apiKey: "ag_usr_" + Math.random().toString(36).substring(2, 12),
      accessType: cleanAccess,
      createdAt: new Date().toISOString(),
    };

    if (getNeonStatus().isConnected) {
      const sqlSuccess = await createUserSQL(newUser);
      if (!sqlSuccess) {
        console.warn("Fallo al guardar usuario en SQL direct, reintentando con saveDbAsync...");
      }
    }

    // Nota: Los usuarios nuevos inician con 0 proyectos para que creen su primer proyecto manualmente

    db.users.push(newUser);
    await saveDbAsync();

    res.status(201).json({
      success: true,
      user: newUser,
      isLocalFallback: !getNeonStatus().isConnected,
      message: getNeonStatus().isConnected 
        ? "Cuenta creada y guardada exitosamente en la base de datos Neon PostgreSQL."
        : "⚠️ ALERTA: Guardado solo en memoria temporal. Falta configurar DATABASE_URL en Vercel.",
    });
  };

  app.post("/api/users", handleRegisterUser);
  app.post("/api/auth/register", handleRegisterUser);

  app.delete("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "ID de usuario requerido" });

    try {
      if (getNeonStatus().isConnected) {
        await querySQL("DELETE FROM antigravity_users WHERE id = $1", [id]).catch(() => {});
      }
      if (db.users) {
        db.users = db.users.filter((u: any) => u.id !== id);
      }
      res.json({ success: true, message: "Usuario eliminado correctamente" });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Error al eliminar usuario" });
    }
  });

  app.post("/api/auth/login-pin", async (req, res) => {
    const { pin } = req.body;
    if (!pin || typeof pin !== "string" || pin.trim().length !== 4) {
      return res.status(400).json({ error: "Ingresa un PIN de 4 dígitos válido" });
    }
    const cleanPin = pin.trim();
    let matchingUsers: any[] = [];

    if (getNeonStatus().isConnected) {
      const sqlUsers = await findUsersByPinSQL(cleanPin);
      if (sqlUsers) matchingUsers = sqlUsers;
    }

    if (matchingUsers.length === 0 && db.users) {
      matchingUsers = db.users.filter((u) => u.pin === cleanPin);
    }

    if (matchingUsers.length === 0) {
      return res.status(401).json({
        error: "PIN no registrado. Si eres un usuario nuevo, regístrate con tu nombre en la pestaña correspondiente.",
      });
    }

    if (matchingUsers.length > 1) {
      return res.status(400).json({
        error: "Hay varios usuarios con este mismo PIN. Como cada cuenta es independiente, por favor inicia sesión ingresando tu Nombre de Usuario y PIN.",
      });
    }

    const user = matchingUsers[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        pin: user.pin,
        email: user.email,
        accessType: user.accessType,
        createdAt: user.createdAt,
      },
    });
  });

  app.get("/api/auth/user/:id", async (req, res) => {
    const { id } = req.params;
    let user: any = null;

    if (getNeonStatus().isConnected) {
      user = await findUserByIdSQL(id);
      if (!user) user = await findUserByPinSQL(id);
    }

    if (!user && db.users) {
      user = db.users.find((u) => u.id === id || u.pin === id);
    }

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        pin: user.pin,
        email: user.email,
        accessType: user.accessType,
        createdAt: user.createdAt,
      },
    });
  });

  app.patch("/api/auth/update", async (req, res) => {
    const { id, email } = req.body;
    if (!db.users) db.users = [];
    let user = db.users.find((u) => u.id === id);

    if (getNeonStatus().isConnected && id) {
      await updateUserEmailSQL(id, email || "");
    }

    if (user) {
      user.email = email;
      await saveDbAsync();
    } else {
      if (getNeonStatus().isConnected) {
        const sqlUsers = await getUsersSQL();
        if (sqlUsers) {
          db.users = sqlUsers;
          await saveDbAsync();
          user = db.users.find((u) => u.id === id);
        }
      }
    }

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        pin: user.pin,
        email: user.email,
        accessType: user.accessType,
        createdAt: user.createdAt,
      },
    });
  });

  app.get("/api/users", async (req, res) => {
    const requesterId = (req.headers["x-user-id"] as string) || (req.query.userId as string);
    const requesterPin = (req.headers["x-user-pin"] as string) || (req.query.userPin as string);

    if (!requesterId || !requesterPin) {
      res.status(401).json({ error: "Acceso no autorizado. Se requiere ID y PIN del usuario para autenticar la solicitud." });
      return;
    }

    let requester: any = null;
    if (getNeonStatus().isConnected) {
      requester = await findUserByIdSQL(requesterId);
    }
    if (!requester && db.users) {
      requester = db.users.find((u) => u.id === requesterId);
    }

    if (!requester || requester.pin !== requesterPin.trim()) {
      res.status(401).json({ error: "Autenticación fallida: PIN o credenciales de administrador inválidas." });
      return;
    }

    const isAdmin =
      requester &&
      (requester.accessType === "Super Administrador" ||
        requester.accessType === "Administrador" ||
        requester.name?.toUpperCase() === "ADMIN" ||
        requester.name?.toUpperCase() === "ADMINISTRADOR" ||
        requester.id?.startsWith("usr-admin"));

    if (!isAdmin) {
      res.status(403).json({ error: "Acceso denegado: Solo el administrador puede ver la lista de usuarios." });
      return;
    }

    let userList: any[] = [];
    if (getNeonStatus().isConnected) {
      const sqlUsers = await getUsersSQL();
      if (sqlUsers) {
        userList = sqlUsers;
      }
    }

    const userMap = new Map<string, any>();
    for (const u of userList) {
      if (u.id) userMap.set(u.id, u);
      if (u.name) userMap.set(`name:${u.name.toLowerCase()}`, u);
    }
    for (const u of (db.users || [])) {
      const existingById = u.id ? userMap.get(u.id) : null;
      const existingByName = u.name ? userMap.get(`name:${u.name.toLowerCase()}`) : null;
      if (!existingById && !existingByName) {
        if (u.id) userMap.set(u.id, u);
        if (u.name) userMap.set(`name:${u.name.toLowerCase()}`, u);
      }
    }

    const projects = db.projects || [];
    const projectKeyMap = new Map();
    projects.forEach((p: any) => {
      if (p.userId && p.apiKey) projectKeyMap.set(p.userId, p.apiKey);
    });

    const merged = Array.from(new Set(userMap.values()));
    const finalUsers = merged.map((u) => {
      const projKey = projectKeyMap.get(u.id);
      const defaultKey = `arqai_sec_${u.pin || "1234"}_${(u.id || "usr").slice(-4)}`;
      return {
        ...u,
        apiKey: u.apiKey || u.api_key || projKey || defaultKey,
      };
    });

    res.json(finalUsers);
  });


  // --- AGENT CONNECTIONS ---
  app.get("/api/agent-connections", (req, res) => {
    res.json(db.agentConnections || []);
  });

  app.post("/api/agent-connections", async (req, res) => {
    const { agentName } = req.body;
    if (!agentName) {
      res.status(400).json({ error: "El nombre del agente es obligatorio." });
      return;
    }
    
    if (!db.agentConnections) db.agentConnections = [];
    
    const newConnection: AgentConnection = {
      id: "agent-conn-" + Date.now(),
      agentName: agentName,
      connectedAt: new Date().toISOString(),
    };
    
    db.agentConnections.push(newConnection);
    await saveDbAsync();
    res.status(201).json(newConnection);
  });

  // --- BLOCKED AGENTS ---
  app.get("/api/blocked-agents", (req, res) => {
    res.json(db.blockedAgents || []);
  });

  app.post("/api/blocked-agents/toggle", async (req, res) => {
    const { agentName, reason } = req.body;
    if (!agentName) {
      return res.status(400).json({ error: "El nombre del agente es obligatorio." });
    }
    if (!db.blockedAgents) db.blockedAgents = [];

    const existingIndex = db.blockedAgents.findIndex(
      (b: any) => b.agentName?.toUpperCase() === agentName.toUpperCase()
    );

    let isBlocked = false;
    if (existingIndex >= 0) {
      db.blockedAgents.splice(existingIndex, 1);
      isBlocked = false;
    } else {
      db.blockedAgents.push({
        id: "block-" + Date.now(),
        agentName,
        blockedAt: new Date().toISOString(),
        reason: reason || "Bloqueado por el usuario",
      });
      isBlocked = true;
    }

    await saveDbAsync();
    res.json({
      success: true,
      agentName,
      isBlocked,
      message: isBlocked
        ? `El agente '${agentName}' ha sido bloqueado exitosamente.`
        : `El agente '${agentName}' ha sido desbloqueado.`,
    });
  });

  // --- NEON POSTGRESQL DATABASE API ---
  app.get("/api/neon/status", (req, res) => {
    const status = getNeonStatus();
    const secrets = getNeonSecretKeys();
    res.json({
      ...status,
      hasNeonApiKey: !!secrets.neonApiKey,
      hasDatabaseUrl: !!secrets.databaseUrl,
    });
  });

  app.post("/api/neon/reconnect", async (req, res) => {
    const status = await initNeonConnection();
    if (status.isConnected) {
      const remoteData = await loadFromNeon();
      if (remoteData && Array.isArray(remoteData.projects) && remoteData.projects.length > 0) {
        db = remoteData;
        await saveDbAsync();
      } else {
        await saveToNeon(db);
      }
    }
    res.json(status);
  });

  app.post("/api/neon/test", async (req, res) => {
    const result = await testNeonQuery();
    res.json(result);
  });

  app.post("/api/neon/sync", async (req, res) => {
    const { direction } = req.body || {};
    if (direction === "from_neon") {
      const remoteData = await loadFromNeon();
      if (remoteData && Array.isArray(remoteData.projects)) {
        db = remoteData;
        await saveDbAsync();
        res.json({
          success: true,
          message: "Datos descargados exitosamente desde Neon PostgreSQL",
          dbSummary: { projects: db.projects.length, tasks: db.tasks.length },
        });
        return;
      } else {
        res.status(404).json({
          success: false,
          error: "No se encontraron datos previos en Neon para descargar.",
        });
        return;
      }
    }

    const saved = await saveToNeon(db);
    if (!saved) {
      // Guardar localmente y notificar al usuario con claridad
      await saveDbAsync();
      res.json({
        success: true,
        isLocalFallback: true,
        message:
          "Datos guardados con éxito en almacenamiento local persistente (store.json). Cuando la base de datos Neon en la nube esté activa, se sincronizará automáticamente.",
      });
      return;
    }

    res.json({
      success: true,
      isLocalFallback: false,
      message: "Base de datos local sincronizada y respaldada exitosamente en Neon PostgreSQL",
    });
  });

  // Recrear tablas en Neon PostgreSQL
  app.post("/api/neon/recreate-all-tables", async (req, res) => {
    try {
      const result = await recreateAllDatabaseTables();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  });

  // Recrear TODA la base de datos desde cero (SaaS + Antigravity + Neon + Local Store)
  app.post("/api/database/recreate-from-scratch", async (req, res) => {
    try {
      const projId = "proj-" + Date.now();
      const mod1Id = "mod-auth-" + Date.now();
      const mod2Id = "mod-admin-" + Date.now();
      const mod3Id = "mod-contador-" + Date.now();

      const stage1Id = "stage-auth-1";
      const stage2Id = "stage-admin-1";
      const stage3Id = "stage-contador-1";
      const stage4Id = "stage-contador-2";

      const blueprint: ProjectBlueprint = {
        masterPrompt:
          "Construir una plataforma web SaaS modular para la gestión integral de despachos contables y contadores independientes. El sistema permite el control de acceso por roles (Administrador y Contador). El Administrador gestiona el CRUD de contadores, sus permisos y supervisa la actividad global. Cada Contador dispone de su propio panel privado para gestionar su cartera de clientes (CRUD de clientes con RUC/NIT, datos fiscales y balances), registrar facturas y comprobantes, y exportar reportes contables directamente a Excel (.xlsx). La persistencia se realiza con Neon PostgreSQL y Supabase con RLS.",
        generalFeatures: [
          "Autenticación y Control de Acceso basado en Roles (RBAC: Admin y Contador)",
          "Persistencia relacional de alta velocidad en Neon PostgreSQL con respaldo offline y Supabase",
          "Exportación de datos de clientes y comprobantes a hojas de cálculo Excel (.xlsx)",
          "Diseño de interfaz modular, responsivo y modo claro/oscuro con Tailwind CSS",
          "Validaciones estrictas de datos de entrada y formato de identificación tributaria (RUC/NIT)",
          "Registro de auditoría y bitácora de cambios para trazabilidad de operaciones",
        ],
        screens: [
          {
            id: "screen-auth",
            name: "Login & Autenticación de Usuarios",
            path: "/login",
            description: "Formulario de acceso para Administradores y Contadores con redirección condicional por rol.",
            features: [
              "Formulario de inicio de sesión con validación de credenciales",
              "Redirección inteligente por roles: Admin -> /admin, Contador -> /contador",
              "Manejo de sesión con Supabase Auth / Tokens JWT",
              "Cierre de sesión seguro y protección de rutas privadas",
            ],
          },
          {
            id: "screen-admin",
            name: "Panel de Administrador (Admin Dashboard)",
            path: "/admin",
            description: "Panel de control para supervisar la plataforma, métricas globales y administración de contadores.",
            features: [
              "Dashboard general con métricas de contadores y clientes",
              "CRUD completo de contadores (Crear, Listar, Editar, Desactivar)",
              "Asignación de permisos y estado de cuenta del contador",
              "Registro y visualización de bitácora de auditoría",
            ],
          },
          {
            id: "screen-contador",
            name: "Panel del Contador (Contador Dashboard)",
            path: "/contador",
            description: "Área de trabajo del contador para gestionar clientes, registrar comprobantes y exportar a Excel.",
            features: [
              "CRUD completo de clientes con RUC/NIT, razón social y datos fiscales",
              "Registro y listado de facturas y comprobantes por cliente",
              "Búsqueda dinámica y filtros avanzados por estado de cliente",
              "Exportación directa de la cartera de clientes a archivo Excel (.xlsx)",
            ],
          },
        ],
        connections: [
          {
            id: "conn-neon",
            name: "Neon PostgreSQL Database",
            type: "database",
            configDetails: "Tablas: usuarios, contadores, clientes, comprobantes, auditoria_logs",
          },
          {
            id: "conn-supabase",
            name: "Supabase Auth & Storage",
            type: "auth",
            configDetails: "JWT Session, Roles en user_metadata, RLS policies y buckets",
          },
        ],
        architecturalNotes:
          "Arquitectura SaaS estrictamente modular: index.html (UI), config.js (Supabase Client), auth.js (Auth/Roles), admin.js (Admin CRUD), contador.js (Clientes & Excel).",
        lastGeneratedPlanAt: new Date().toISOString(),
      };

      const newProject: Project = {
        id: projId,
        name: "SaaS Despacho Contable",
        mainUrl: "http://localhost:3000",
        description: blueprint.masterPrompt,
        apiKey: "ag_live_" + Math.random().toString(36).substring(2, 12),
        blueprint,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newModules: ProjectModule[] = [
        {
          id: mod1Id,
          projectId: projId,
          title: "Módulo 1: Autenticación & Control de Acceso (auth.js)",
          description: "Módulo de inicio de sesión con Supabase Auth, gestión de sesiones y redirección según rol de usuario.",
          order: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: mod2Id,
          projectId: projId,
          title: "Módulo 2: Panel de Administración & Contadores (admin.js)",
          description: "Módulo de supervisión general, métricas y operaciones CRUD para contadores registrados en el sistema.",
          order: 2,
          createdAt: new Date().toISOString(),
        },
        {
          id: mod3Id,
          projectId: projId,
          title: "Módulo 3: Panel del Contador & Clientes Excel (contador.js)",
          description: "Módulo privado del contador para gestionar clientes, registrar comprobantes y exportar carteras a Excel.",
          order: 3,
          createdAt: new Date().toISOString(),
        },
      ];

      const newStages: ProjectStage[] = [
        {
          id: stage1Id,
          moduleId: mod1Id,
          projectId: projId,
          title: "Etapa 1.1: Inicialización de Supabase & Login con Roles (config.js + auth.js)",
          description: "Configuración del cliente de Supabase y flujo de inicio de sesión con redirección automática.",
          order: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: stage2Id,
          moduleId: mod2Id,
          projectId: projId,
          title: "Etapa 2.1: Gestión de Contadores y Métricas Globales (admin.js)",
          description: "Tabla de contadores con modal de alta, edición y desactivación para el administrador.",
          order: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: stage3Id,
          moduleId: mod3Id,
          projectId: projId,
          title: "Etapa 3.1: CRUD de Clientes y Validación Tributaria (contador.js)",
          description: "Registro de clientes con RUC/NIT, teléfono, correo fiscal y saldo pendiente.",
          order: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: stage4Id,
          moduleId: mod3Id,
          projectId: projId,
          title: "Etapa 3.2: Registro de Comprobantes & Exportación Excel (contador.js)",
          description: "Facturación básica y exportación directa en formato .xlsx mediante SheetJS.",
          order: 2,
          createdAt: new Date().toISOString(),
        },
      ];

      const newTasks: TaskItem[] = [
        {
          id: "task-" + Date.now() + "-1",
          projectId: projId,
          moduleId: mod1Id,
          stageId: stage1Id,
          title: "Configurar inicialización de Supabase y autenticación modular (config.js + auth.js)",
          instruction:
            "Implementar config.js con la inicialización exclusiva de createClient() usando SUPABASE_URL y SUPABASE_ANON_KEY. En auth.js, desarrollar signIn(), signOut(), getCurrentUser(), y handleAuthRedirect() para dirigir administradores a /admin y contadores a /contador.",
          status: "pending",
          workUrl: "http://localhost:3000/login",
          aiOutput: "",
          aiNotes: "",
          humanFeedback: "",
          locked: false,
          assignedAgent: "Antigravity Agent",
          subtasks: [
            { id: "st-1-1", title: "Definir config.js con el cliente de Supabase", completed: false },
            { id: "st-1-2", title: "Implementar auth.js con login por email y contraseña", completed: false },
            { id: "st-1-3", title: "Configurar redirección inteligente según rol del usuario", completed: false },
            { id: "st-1-4", title: "Proteger rutas /admin y /contador ante accesos no autorizados", completed: false },
          ],
          contextMemory: {
            technicalRequirements: [
              "Mantener auth.js desacoplado de la vista",
              "Validar formato de email y contraseña no vacía",
              "Almacenar rol en user_metadata de Supabase",
            ],
            affectedFiles: ["config.js", "auth.js", "index.html"],
            rulesConstraints: [
              "No combinar lógica de auth en index.html",
              "Respetar la arquitectura modular del SaaS",
            ],
            dependencies: ["@supabase/supabase-js"],
            notes: "Base de la seguridad del sistema SaaS.",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "task-" + Date.now() + "-2",
          projectId: projId,
          moduleId: mod2Id,
          stageId: stage2Id,
          title: "Implementar panel de administrador y CRUD de contadores (admin.js)",
          instruction:
            "En admin.js, implementar las funciones loadContadores(), renderContadoresTable(), openContadorModal(), saveContador() y toggleContadorStatus(). Consumir la tabla 'contadores' de PostgreSQL/Supabase y presentar tarjetas con métricas generales en el panel.",
          status: "pending",
          workUrl: "http://localhost:3000/admin",
          aiOutput: "",
          aiNotes: "",
          humanFeedback: "",
          locked: false,
          assignedAgent: "Antigravity Agent",
          subtasks: [
            { id: "st-2-1", title: "Listar contadores en tabla responsiva con badges de estado", completed: false },
            { id: "st-2-2", title: "Formulario modal para registrar nuevo contador", completed: false },
            { id: "st-2-3", title: "Editar datos y suspender/activar cuenta de contador", completed: false },
            { id: "st-2-4", title: "Cálculo en tiempo real de contadores activos y clientes supervisados", completed: false },
          ],
          contextMemory: {
            technicalRequirements: [
              "Utilizar Tailwind CSS para el diseño visual limpio",
              "Paginación o scroll virtual en la lista de contadores",
              "Manejo de errores amigable ante fallas de red",
            ],
            affectedFiles: ["admin.js", "index.html"],
            rulesConstraints: [
              "El admin no puede modificar comprobantes directamente, solo supervisar",
              "Devolver código modular limpio",
            ],
            dependencies: ["@supabase/supabase-js"],
            notes: "Módulo administrativo central.",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "task-" + Date.now() + "-3",
          projectId: projId,
          moduleId: mod3Id,
          stageId: stage3Id,
          title: "Implementar panel del contador y CRUD de clientes con validación RUC/NIT (contador.js)",
          instruction:
            "En contador.js, desarrollar loadClientes(), renderClientesTable(), openClienteModal(), saveCliente(), deleteCliente() y searchClientes(). Filtrar exclusivamente por contador_id del usuario conectado y validar la estructura del RUC/NIT.",
          status: "pending",
          workUrl: "http://localhost:3000/contador",
          aiOutput: "",
          aiNotes: "",
          humanFeedback: "",
          locked: false,
          assignedAgent: "Antigravity Agent",
          subtasks: [
            { id: "st-3-1", title: "Tabla de clientes con búsqueda reactiva por nombre o RUC/NIT", completed: false },
            { id: "st-3-2", title: "Modal de creación y edición de cliente con validaciones", completed: false },
            { id: "st-3-3", title: "Filtros por estado (activo, inactivo, pendiente)", completed: false },
            { id: "st-3-4", title: "Aislamiento estricto por contador_id (multi-tenancy)", completed: false },
          ],
          contextMemory: {
            technicalRequirements: [
              "Filtrar clientes por el ID del contador en sesión",
              "Validar formato tributario numérico de RUC/NIT",
              "Soporte para edición rápida de teléfono y correo fiscal",
            ],
            affectedFiles: ["contador.js", "index.html"],
            rulesConstraints: [
              "Ningún contador puede ver los clientes de otro contador",
            ],
            dependencies: ["@supabase/supabase-js"],
            notes: "Gestión principal del usuario contador.",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "task-" + Date.now() + "-4",
          projectId: projId,
          moduleId: mod3Id,
          stageId: stage4Id,
          title: "Desarrollar registro de comprobantes y exportación a Excel (.xlsx) (contador.js)",
          instruction:
            "En contador.js, agregar la función exportClientesToExcel() usando SheetJS (XLSX) para descargar en un clic la lista de clientes con sus comprobantes y balances. Permitir también registrar comprobantes básicos vinculados a cada cliente.",
          status: "pending",
          workUrl: "http://localhost:3000/contador",
          aiOutput: "",
          aiNotes: "",
          humanFeedback: "",
          locked: false,
          assignedAgent: "Antigravity Agent",
          subtasks: [
            { id: "st-4-1", title: "Integrar biblioteca XLSX para generación en cliente", completed: false },
            { id: "st-4-2", title: "Formatear columnas de Excel con encabezados contables claros", completed: false },
            { id: "st-4-3", title: "Descarga instantánea con nombre de archivo dinámico con fecha", completed: false },
            { id: "st-4-4", title: "Registro y consulta de comprobantes asociados", completed: false },
          ],
          contextMemory: {
            technicalRequirements: [
              "Generar libro .xlsx con formato de números y fechas",
              "Incluir totales y balances consolidados en la exportación",
            ],
            affectedFiles: ["contador.js", "index.html"],
            rulesConstraints: [
              "No bloquear el hilo principal durante la generación del Excel",
            ],
            dependencies: ["xlsx", "@supabase/supabase-js"],
            notes: "Herramienta clave solicitada por los contadores.",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Preservar todos los proyectos existentes para evitar borrados no deseados
      const currentProjects = Array.isArray(db.projects) ? [...db.projects] : [];
      if (!currentProjects.some((p) => p.id === newProject.id)) {
        currentProjects.unshift(newProject);
      }

      db = {
        projects: currentProjects,
        modules: [...(db.modules || []), ...newModules],
        stages: [...(db.stages || []), ...newStages],
        tasks: [...(db.tasks || []), ...newTasks],
        agentConnections: db.agentConnections || [],
        users: db.users || [],
        history: [
          {
            id: "hist-" + Date.now(),
            taskId: "db-init",
            projectId: projId,
            taskTitle: "Inicialización de Base de Datos",
            action: "database_initialized",
            details:
              "Se verificó e inicializó la estructura de la base de datos conservando todos los proyectos existentes.",
            author: "human",
            timestamp: new Date().toISOString(),
          },
          ...(db.history || []),
        ],
      };

      // Ejecutar recreación de tablas en Neon PostgreSQL PRIMERO
      const neonResult = await recreateAllDatabaseTables();

      // Guardar base de datos (lo que invoca saveToNeon para insertar todo)
      await saveDbAsync();

      res.json({
        success: true,
        message: "Base de datos creada y configurada completamente desde cero.",
        neonResult,
        project: newProject,
        summary: {
          projects: db.projects.length,
          modules: db.modules.length,
          stages: db.stages.length,
          tasks: db.tasks.length,
        },
      });
    } catch (err: any) {
      console.error("Error al recrear base de datos:", err);
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  });

  // --- PROJECTS (REAL SQL PERSISTENCE IN NEON POSTGRESQL) ---
  app.get("/api/projects", async (req, res) => {
    const rawUserId = (req.query.userId as string) || (req.headers["x-user-id"] as string);
    const userId = rawUserId?.trim();

    if (getNeonStatus().isConnected) {
      const sqlProjects = await getProjectsSQL(userId);
      if (sqlProjects) {
        const filteredSql = sqlProjects.filter(
          (p) => p.name !== "Proyecto Antigravity Persistente" && p.id !== "proj-1788390562373"
        );
        // Fusionar proyectos SQL en db.projects sin borrar proyectos de otros usuarios en memoria
        const sqlMap = new Map(filteredSql.map((p) => [p.id, p]));
        for (const p of filteredSql) {
          const idx = db.projects.findIndex((item) => item.id === p.id);
          if (idx !== -1) {
            db.projects[idx] = { ...db.projects[idx], ...p };
          } else {
            db.projects.push(p);
          }
        }
        res.json(filteredSql);
        return;
      }
    }

    // Modo respaldo local (offline)
    const memProjects = (db.projects || []).filter((p) => {
      if (p.name === "Proyecto Antigravity Persistente" || p.id === "proj-1788390562373") {
        return false;
      }
      if (!userId) return true;
      if (userId === "usr-admin-01" || userId === "usr-admin-1") {
        return p.userId === "usr-admin-01" || p.userId === "usr-admin-1";
      }
      return p.userId === userId;
    });

    const result = memProjects.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    res.json(result);
  });

  app.post("/api/projects", async (req, res) => {
    const { name, mainUrl, description, userId } = req.body;
    const rawUser = userId || (req.headers["x-user-id"] as string);
    if (!rawUser || !rawUser.trim()) {
      res.status(400).json({ error: "El proyecto debe estar vinculado a un usuario autenticado." });
      return;
    }
    const effectiveUserId = rawUser === "usr-admin-1" ? "usr-admin-01" : rawUser.trim();

    if (!name || !name.trim()) {
      res.status(400).json({ error: "El nombre del proyecto es obligatorio." });
      return;
    }

    const newProject: Project = {
      id: "proj-" + Date.now() + Math.random().toString(36).substring(2, 6),
      userId: effectiveUserId,
      name: name.trim(),
      mainUrl: (mainUrl || "").trim(),
      description: (description || "").trim(),
      apiKey: "ag_live_" + Math.random().toString(36).substring(2, 12),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (getNeonStatus().isConnected) {
      await createProjectSQL(newProject);
    }

    if (!Array.isArray(db.projects)) {
      db.projects = [];
    }

    db.projects.unshift(newProject);

    logChange({
      taskId: "proj-created",
      projectId: newProject.id,
      taskTitle: `Creación de Proyecto: ${newProject.name}`,
      action: "project_created",
      details: `Proyecto "${newProject.name}" creado y guardado permanentemente en base de datos.`,
      author: "human",
    });

    await saveDbAsync();
    res.status(201).json(newProject);
  });

  app.post("/api/projects/:id/clone", async (req, res) => {
    const { id } = req.params;
    const { name } = req.body || {};
    const source = db.projects.find((p) => p.id === id);
    if (!source) {
      res.status(404).json({ error: "Proyecto original no encontrado" });
      return;
    }

    const newProject: Project = {
      id: "proj-" + Date.now() + Math.random().toString(36).substring(2, 6),
      userId: source.userId,
      name: name?.trim() || `${source.name} (Copia)`,
      mainUrl: source.mainUrl,
      description: source.description ? `Copia clonada de "${source.name}". ${source.description}` : `Copia clonada de "${source.name}".`,
      apiKey: "ag_live_" + Math.random().toString(36).substring(2, 12),
      blueprint: source.blueprint ? JSON.parse(JSON.stringify(source.blueprint)) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (getNeonStatus().isConnected) {
      await createProjectSQL(newProject);
    }

    if (!Array.isArray(db.projects)) {
      db.projects = [];
    }
    db.projects.unshift(newProject);

    logChange({
      taskId: "proj-cloned",
      projectId: newProject.id,
      taskTitle: `Clonación de Proyecto: ${newProject.name}`,
      action: "project_cloned",
      details: `Proyecto "${source.name}" clonado exitosamente como "${newProject.name}".`,
      author: "human",
    });

    await saveDbAsync();
    res.status(201).json(newProject);
  });

  app.patch("/api/projects/:id", async (req, res) => {
    const { id } = req.params;
    const { name, mainUrl, description } = req.body;

    const project = db.projects.find((p) => p.id === id);
    if (!project) {
      res.status(404).json({ error: "Proyecto no encontrado" });
      return;
    }

    const patchData: { name?: string; mainUrl?: string; description?: string } = {};
    if (name !== undefined) {
      project.name = name.trim();
      patchData.name = project.name;
    }
    if (mainUrl !== undefined) {
      project.mainUrl = mainUrl.trim();
      patchData.mainUrl = project.mainUrl;
    }
    if (description !== undefined) {
      project.description = description.trim();
      patchData.description = project.description;
    }
    project.updatedAt = new Date().toISOString();

    if (getNeonStatus().isConnected) {
      await updateProjectSQL(id, patchData);
    }

    await saveDbAsync();
    res.json(project);
  });

  // Eliminar un proyecto específico con sentencia DELETE SQL atómica
  app.delete("/api/projects/:id", async (req, res) => {
    const { id } = req.params;
    const rawUserId = (req.query.userId as string) || (req.headers["x-user-id"] as string);
    const userId = rawUserId?.trim();

    let deletedProjectName = "Proyecto";
    db.projects = (db.projects || []).filter((p) => {
      if (p.id === id) {
        deletedProjectName = p.name;
        return false;
      }
      return true;
    });

    // Eliminación en cascada de módulos, etapas y tareas del proyecto en memoria
    db.modules = (db.modules || []).filter((m) => m.projectId !== id);
    db.stages = (db.stages || []).filter((s) => s.projectId !== id);
    db.tasks = (db.tasks || []).filter((t) => t.projectId !== id);

    if (getNeonStatus().isConnected) {
      await deleteProjectSQL(id);
    }

    logChange({
      taskId: "proj-deleted",
      projectId: id,
      taskTitle: `Eliminación de Proyecto: ${deletedProjectName}`,
      action: "project_deleted",
      details: `El usuario eliminó el proyecto "${deletedProjectName}" y sus componentes asociados.`,
      author: "human",
    });

    await saveDbAsync();

    const normUserId = userId === "usr-admin-1" ? "usr-admin-01" : userId;

    let remainingProjects = (db.projects || []).filter((p) => {
      if (p.name === "Proyecto Antigravity Persistente" || p.id === "proj-1788390562373") return false;
      if (!normUserId) return true;
      const normPUser = p.userId === "usr-admin-1" ? "usr-admin-01" : p.userId;
      if (normUserId === "usr-admin-01") {
        return normPUser === "usr-admin-01" || !normPUser;
      }
      return normPUser === normUserId;
    });

    if (getNeonStatus().isConnected) {
      const sqlProjects = await getProjectsSQL(userId);
      if (sqlProjects) {
        remainingProjects = sqlProjects.filter(
          (p) => p.name !== "Proyecto Antigravity Persistente" && p.id !== "proj-1788390562373"
        );
      }
    }

    res.json({
      success: true,
      deletedProjectId: id,
      deletedProjectName: deletedProjectName,
      projects: remainingProjects,
    });
  });

  // Eliminar proyectos (Requiere confirmación explícita ?confirm=true)
  app.delete("/api/projects", async (req, res) => {
    const { confirm } = req.query;
    const rawUserId = (req.query.userId as string) || (req.headers["x-user-id"] as string);
    const userId = rawUserId?.trim();

    if (confirm !== "true") {
      res.status(400).json({
        error: "Se requiere confirmación explícita (?confirm=true) para vaciar los proyectos.",
      });
      return;
    }

    const normUserId = userId === "usr-admin-1" ? "usr-admin-01" : userId;

    if (userId) {
      const userProjects = (db.projects || []).filter((p) => {
        const normPUser = p.userId === "usr-admin-1" ? "usr-admin-01" : p.userId;
        if (normUserId === "usr-admin-01") {
          return normPUser === "usr-admin-01" || !normPUser;
        }
        return normPUser === normUserId;
      });
      const toDeleteIds = new Set(userProjects.map((p) => p.id));

      db.projects = (db.projects || []).filter((p) => !toDeleteIds.has(p.id));
      db.modules = (db.modules || []).filter((m) => !toDeleteIds.has(m.projectId));
      db.stages = (db.stages || []).filter((s) => !toDeleteIds.has(s.projectId));
      db.tasks = (db.tasks || []).filter((t) => !toDeleteIds.has(t.projectId));

      if (getNeonStatus().isConnected) {
        await deleteAllProjectsSQL(userId);
      }
    } else {
      db.projects = [];
      db.modules = [];
      db.stages = [];
      db.tasks = [];
      db.history = [];

      if (getNeonStatus().isConnected) {
        await deleteAllProjectsSQL();
      }
    }

    await saveDbAsync();
    res.json({
      success: true,
      message: "Todos los proyectos y tareas han sido eliminados por acción explícita del usuario.",
      projects: [],
    });
  });

  // --- PROJECT BLUEPRINT (ARQUITECTURA MANUAL) ---
  app.get("/api/projects/:id/blueprint", (req, res) => {
    const { id } = req.params;
    const project = db.projects.find((p) => p.id === id);
    if (!project) {
      res.status(404).json({ error: "Proyecto no encontrado" });
      return;
    }

    const defaultBlueprint: ProjectBlueprint = {
      masterPrompt: project.description || "",
      generalFeatures: [
        "Diseño totalmente responsive (Móvil y Desktop)",
        "Control de accesos y seguridad",
        "Soporte Modo Claro y Modo Oscuro",
      ],
      screens: [
        {
          id: "screen-1",
          name: "Dashboard Principal",
          path: "/dashboard",
          description: "Vista principal de métricas y acceso rápido a módulos.",
          features: ["Resumen de actividades", "Gráficos o estadísticas clave", "Accesos directos"],
        },
      ],
      connections: [
        {
          id: "conn-1",
          name: "Almacenamiento Local / Base de Datos",
          type: "database",
          configDetails: "Persistencia de datos del proyecto",
        },
      ],
      architecturalNotes: "Diseño modular y tipado estricto con TypeScript.",
    };

    const blueprint = project.blueprint || defaultBlueprint;

    res.json({
      projectId: project.id,
      projectName: project.name,
      mainUrl: project.mainUrl,
      blueprint,
      instructionsForAntigravity:
        "Lee cuidadosamente el prompt maestro, cada pantalla con sus funcionalidades específicas, las funcionalidades generales y las conexiones requeridas. Crea un plan de acción jerárquico dividido en Módulos, Etapas por módulo, Tareas concretas, Minitareas (subtasks) y Pasos técnicos en contextMemory (technicalRequirements, affectedFiles, rulesConstraints, dependencies). Luego, envía el plan en formato JSON mediante POST a /api/projects/" +
        project.id +
        "/populate-plan para poblar la plataforma paso a paso.",
      populatePlanEndpoint: `/api/projects/${project.id}/populate-plan`,
      populatePlanMethod: "POST",
      expectedPlanPayloadFormat: {
        clearExisting: true,
        modules: [
          {
            title: "Módulo 1: Nombre del Módulo",
            description: "Descripción del objetivo del módulo",
            stages: [
              {
                title: "Etapa 1.1: Nombre de la Etapa",
                description: "Descripción de la etapa",
                tasks: [
                  {
                    title: "Título de la Tarea",
                    instruction: "Instrucción técnica detallada para implementar",
                    subtasks: [
                      { title: "Minitarea o paso 1" },
                      { title: "Minitarea o paso 2" },
                    ],
                    contextMemory: {
                      technicalRequirements: ["Requisito 1", "Requisito 2"],
                      affectedFiles: ["src/components/Ejemplo.tsx"],
                      rulesConstraints: ["No romper estado existente"],
                      dependencies: ["lucide-react"],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });
  });

  app.put("/api/projects/:id/blueprint", async (req, res) => {
    const { id } = req.params;
    const project = db.projects.find((p) => p.id === id);
    if (!project) {
      res.status(404).json({ error: "Proyecto no encontrado" });
      return;
    }

    const { masterPrompt, generalFeatures, screens, connections, architecturalNotes } = req.body;

    project.blueprint = {
      masterPrompt: typeof masterPrompt === "string" ? masterPrompt.trim() : project.blueprint?.masterPrompt || "",
      generalFeatures: Array.isArray(generalFeatures) ? generalFeatures : project.blueprint?.generalFeatures || [],
      screens: Array.isArray(screens) ? screens : project.blueprint?.screens || [],
      connections: Array.isArray(connections) ? connections : project.blueprint?.connections || [],
      architecturalNotes:
        typeof architecturalNotes === "string" ? architecturalNotes.trim() : project.blueprint?.architecturalNotes,
      lastGeneratedPlanAt: project.blueprint?.lastGeneratedPlanAt,
    };

    project.updatedAt = new Date().toISOString();

    logChange({
      taskId: "blueprint-" + project.id,
      projectId: project.id,
      taskTitle: `Blueprint Manual: ${project.name}`,
      action: "blueprint_updated",
      details: `Se actualizaron las especificaciones manuales del proyecto (${project.blueprint.screens.length} pantallas, ${project.blueprint.connections.length} conexiones, ${project.blueprint.generalFeatures.length} func. generales).`,
      author: "human",
    });

    await saveDbAsync();
    res.json({ success: true, blueprint: project.blueprint, project });
  });

  // Antigravity o el usuario pegan y pueblan el plan completo en la plataforma
  app.post("/api/projects/:id/populate-plan", async (req, res) => {
    const { id } = req.params;
    const project = db.projects.find((p) => p.id === id);
    if (!project) {
      res.status(404).json({ error: "Proyecto no encontrado" });
      return;
    }

    const { modules, clearExisting = true } = req.body;
    if (!Array.isArray(modules) || modules.length === 0) {
      res.status(400).json({ error: "Se requiere un array de 'modules' válido para poblar el plan." });
      return;
    }

    // Si clearExisting es true, limpiamos los módulos, etapas y tareas previas que NO estén bloqueadas/verificadas
    if (clearExisting) {
      const lockedTaskIds = new Set(db.tasks.filter((t) => t.projectId === id && t.locked).map((t) => t.id));
      db.tasks = db.tasks.filter((t) => t.projectId !== id || lockedTaskIds.has(t.id));
      // Si no hay tareas bloqueadas, podemos limpiar módulos y etapas
      if (lockedTaskIds.size === 0) {
        db.modules = db.modules.filter((m) => m.projectId !== id);
        db.stages = db.stages.filter((s) => s.projectId !== id);
      }
    }

    let createdModulesCount = 0;
    let createdStagesCount = 0;
    let createdTasksCount = 0;

    modules.forEach((modData: any, mIdx: number) => {
      const modId = "mod-" + Date.now() + "-" + (mIdx + 1) + "-" + Math.random().toString(36).substring(2, 5);
      const newModule: ProjectModule = {
        id: modId,
        projectId: id,
        title: (modData.title || `Módulo ${mIdx + 1}`).trim(),
        description: (modData.description || "").trim(),
        order: db.modules.filter((m) => m.projectId === id).length + 1,
        createdAt: new Date().toISOString(),
      };
      db.modules.push(newModule);
      createdModulesCount++;

      const stagesList = Array.isArray(modData.stages) ? modData.stages : [];
      stagesList.forEach((stageData: any, sIdx: number) => {
        const stageId = "stage-" + Date.now() + "-" + (mIdx + 1) + "-" + (sIdx + 1) + "-" + Math.random().toString(36).substring(2, 5);
        const newStage: ProjectStage = {
          id: stageId,
          moduleId: modId,
          projectId: id,
          title: (stageData.title || `Etapa ${mIdx + 1}.${sIdx + 1}`).trim(),
          description: (stageData.description || "").trim(),
          order: sIdx + 1,
          createdAt: new Date().toISOString(),
        };
        db.stages.push(newStage);
        createdStagesCount++;

        const tasksList = Array.isArray(stageData.tasks) ? stageData.tasks : [];
        tasksList.forEach((taskData: any, tIdx: number) => {
          const taskId = "task-" + Date.now() + "-" + (mIdx + 1) + "-" + (sIdx + 1) + "-" + (tIdx + 1) + "-" + Math.random().toString(36).substring(2, 5);
          
          const rawSubtasks = Array.isArray(taskData.subtasks) ? taskData.subtasks : [];
          const formattedSubtasks: SubTaskItem[] = rawSubtasks.map((st: any, stIdx: number) => ({
            id: "st-" + Date.now() + "-" + stIdx + "-" + Math.random().toString(36).substring(2, 5),
            title: typeof st === "string" ? st.trim() : (st.title || `Paso ${stIdx + 1}`).trim(),
            completed: Boolean(st.completed),
          }));

          const newTask: TaskItem = {
            id: taskId,
            projectId: id,
            moduleId: modId,
            stageId: stageId,
            title: (taskData.title || `Tarea ${tIdx + 1}`).trim(),
            instruction: (taskData.instruction || taskData.title || "Implementar según blueprint").trim(),
            status: "pending",
            workUrl: taskData.workUrl || project.mainUrl || "http://localhost:3000",
            locked: false,
            assignedAgent: "Antigravity AI",
            subtasks: formattedSubtasks,
            contextMemory: {
              technicalRequirements: taskData.contextMemory?.technicalRequirements || [],
              affectedFiles: taskData.contextMemory?.affectedFiles || [],
              rulesConstraints: taskData.contextMemory?.rulesConstraints || [
                "Respetar la arquitectura modular",
                "No modificar componentes ya verificados por el usuario humano",
              ],
              dependencies: taskData.contextMemory?.dependencies || [],
              notes: taskData.contextMemory?.notes || "",
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          db.tasks.push(newTask);
          createdTasksCount++;
        });
      });
    });

    if (project.blueprint) {
      project.blueprint.lastGeneratedPlanAt = new Date().toISOString();
    }

    logChange({
      taskId: "plan-" + project.id,
      projectId: project.id,
      taskTitle: `Plan de Acción Poblado: ${project.name}`,
      action: "plan_populated",
      details: `Se pobló el plan de acción con ${createdModulesCount} módulos, ${createdStagesCount} etapas y ${createdTasksCount} tareas/pasos.`,
      author: req.headers["x-api-key"] ? "antigravity_ai" : "human",
    });

    await saveDbAsync();
    res.json({
      success: true,
      message: `Plan poblado exitosamente: ${createdModulesCount} módulos, ${createdStagesCount} etapas y ${createdTasksCount} tareas generadas.`,
      createdModulesCount,
      createdStagesCount,
      createdTasksCount,
    });
  });

  // Generador automático de plan a partir del Blueprint manual
  app.post("/api/projects/:id/generate-plan-from-blueprint", async (req, res) => {
    const { id } = req.params;
    const project = db.projects.find((p) => p.id === id);
    if (!project) {
      res.status(404).json({ error: "Proyecto no encontrado" });
      return;
    }

    const bp = project.blueprint || {
      masterPrompt: project.description || "Aplicación SaaS con vistas y funcionalidades personalizadas.",
      generalFeatures: ["Diseño responsivo", "Modo claro/oscuro", "Seguridad"],
      screens: [
        {
          id: "screen-1",
          name: "Dashboard Principal",
          path: "/dashboard",
          description: "Vista de bienvenida y métricas",
          features: ["Vista de datos", "Navegación"],
        },
      ],
      connections: [],
    };

    // Limpiamos elementos anteriores no bloqueados
    const lockedTaskIds = new Set(db.tasks.filter((t) => t.projectId === id && t.locked).map((t) => t.id));
    db.tasks = db.tasks.filter((t) => t.projectId !== id || lockedTaskIds.has(t.id));
    if (lockedTaskIds.size === 0) {
      db.modules = db.modules.filter((m) => m.projectId !== id);
      db.stages = db.stages.filter((s) => s.projectId !== id);
    }

    let createdModulesCount = 0;
    let createdStagesCount = 0;
    let createdTasksCount = 0;

    // 1. Módulo de Infraestructura & Conexiones (si hay conexiones definidas)
    if (bp.connections && bp.connections.length > 0) {
      const mod1Id = "mod-" + Date.now() + "-infra";
      db.modules.push({
        id: mod1Id,
        projectId: id,
        title: "Módulo 1: Conexiones, Backend & Servicios Externos",
        description: `Configuración e integración de: ${bp.connections.map((c) => c.name).join(", ")}`,
        order: 1,
        createdAt: new Date().toISOString(),
      });
      createdModulesCount++;

      const stg1Id = "stage-" + Date.now() + "-infra-1";
      db.stages.push({
        id: stg1Id,
        moduleId: mod1Id,
        projectId: id,
        title: "Etapa 1.1: Inicialización de Clientes y APIs",
        description: "Integración de librerías y variables de conexión",
        order: 1,
        createdAt: new Date().toISOString(),
      });
      createdStagesCount++;

      bp.connections.forEach((conn, cIdx) => {
        const tId = "task-" + Date.now() + "-conn-" + (cIdx + 1);
        db.tasks.push({
          id: tId,
          projectId: id,
          moduleId: mod1Id,
          stageId: stg1Id,
          title: `Configurar conexión: ${conn.name} (${conn.type.toUpperCase()})`,
          instruction: `Implementar el cliente para ${conn.name}. Configuración requerida: ${conn.configDetails || "Variables de entorno y cliente tipado"}. Asegurar manejo de errores y verificación de conectividad.`,
          status: "pending",
          workUrl: project.mainUrl,
          locked: false,
          assignedAgent: "Antigravity AI",
          subtasks: [
            { id: "st-c1-" + cIdx, title: `Crear módulo de conexión para ${conn.name}`, completed: false },
            { id: "st-c2-" + cIdx, title: "Implementar interceptores y manejo de errores", completed: false },
            { id: "st-c3-" + cIdx, title: "Verificar ping o query inicial de prueba", completed: false },
          ],
          contextMemory: {
            technicalRequirements: [
              `Tipo de conexión: ${conn.type}`,
              `Detalles: ${conn.configDetails || "N/A"}`,
              "Aislar credenciales y exportar funciones limpias y modulares",
            ],
            affectedFiles: [`src/config/${conn.type}.ts`],
            rulesConstraints: ["No exponer secrets en el cliente"],
            dependencies: [],
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        createdTasksCount++;
      });
    }

    // 2. Módulos por cada Pantalla con sus Funcionalidades Específicas
    bp.screens.forEach((screen, sIdx) => {
      const modScreenId = "mod-" + Date.now() + "-scr-" + (sIdx + 1);
      const modOrder = createdModulesCount + 1;
      db.modules.push({
        id: modScreenId,
        projectId: id,
        title: `Módulo ${modOrder}: Pantalla ${screen.name}`,
        description: `Ruta: ${screen.path || "/"}. ${screen.description || "Desarrollo completo de la vista y componentes."}`,
        order: modOrder,
        createdAt: new Date().toISOString(),
      });
      createdModulesCount++;

      // Etapa de maquetación y estructura
      const stageViewId = "stage-" + Date.now() + "-scr-" + (sIdx + 1) + "-view";
      db.stages.push({
        id: stageViewId,
        moduleId: modScreenId,
        projectId: id,
        title: `Etapa ${modOrder}.1: Estructura & Layout de ${screen.name}`,
        description: `Maquetación visual responsiva y contenedores para ${screen.name}`,
        order: 1,
        createdAt: new Date().toISOString(),
      });
      createdStagesCount++;

      // Tarea de maquetación de la pantalla
      const taskLayoutId = "task-" + Date.now() + "-scr-" + (sIdx + 1) + "-layout";
      db.tasks.push({
        id: taskLayoutId,
        projectId: id,
        moduleId: modScreenId,
        stageId: stageViewId,
        title: `Maquetar Pantalla: ${screen.name} (${screen.path || "/"})`,
        instruction: `Crear el contenedor y estructura visual para ${screen.name}. ${screen.description || ""}. Utilizar diseño con Tailwind CSS y tipografía clara.`,
        status: "pending",
        workUrl: project.mainUrl + (screen.path || ""),
        locked: false,
        assignedAgent: "Antigravity AI",
        subtasks: [
          { id: "st-l1-" + sIdx, title: "Crear estructura HTML y componentes base", completed: false },
          { id: "st-l2-" + sIdx, title: "Configurar estilos responsivos y espaciados", completed: false },
          { id: "st-l3-" + sIdx, title: "Agregar navegación y breadcrumbs", completed: false },
        ],
        contextMemory: {
          technicalRequirements: [
            `Pantalla: ${screen.name}`,
            `Ruta: ${screen.path || "/"}`,
            "Utilizar Tailwind CSS y asegurar contraste WCAG AA",
          ],
          affectedFiles: [`src/views/${screen.name.replace(/\s+/g, "")}.tsx`],
          rulesConstraints: ["No romper navegación existente"],
          dependencies: ["lucide-react"],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      createdTasksCount++;

      // Etapa de funcionalidades interactivas de la pantalla
      if (screen.features && screen.features.length > 0) {
        const stageFeatId = "stage-" + Date.now() + "-scr-" + (sIdx + 1) + "-feat";
        db.stages.push({
          id: stageFeatId,
          moduleId: modScreenId,
          projectId: id,
          title: `Etapa ${modOrder}.2: Funcionalidades Interactivas de ${screen.name}`,
          description: `Lógica, eventos y formularios para las funcionalidades declaradas`,
          order: 2,
          createdAt: new Date().toISOString(),
        });
        createdStagesCount++;

        screen.features.forEach((feat, fIdx) => {
          const taskFeatId = "task-" + Date.now() + "-scr-" + (sIdx + 1) + "-f-" + (fIdx + 1);
          db.tasks.push({
            id: taskFeatId,
            projectId: id,
            moduleId: modScreenId,
            stageId: stageFeatId,
            title: `[${screen.name}] ${feat}`,
            instruction: `Desarrollar la funcionalidad: "${feat}" en la pantalla ${screen.name}. Asegurar validaciones, estados de carga y feedback visual al usuario.`,
            status: "pending",
            workUrl: project.mainUrl + (screen.path || ""),
            locked: false,
            assignedAgent: "Antigravity AI",
            subtasks: [
              { id: "st-f1-" + sIdx + "-" + fIdx, title: "Definir estados locales y tipos", completed: false },
              { id: "st-f2-" + sIdx + "-" + fIdx, title: "Implementar manejadores de eventos y validación", completed: false },
              { id: "st-f3-" + sIdx + "-" + fIdx, title: "Conectar con servicios o almacenamiento", completed: false },
            ],
            contextMemory: {
              technicalRequirements: [
                `Funcionalidad: ${feat}`,
                `Ubicación: Pantalla ${screen.name}`,
                "Manejo de errores amigable para el usuario",
              ],
              affectedFiles: [`src/views/${screen.name.replace(/\s+/g, "")}.tsx`],
              rulesConstraints: ["Validar campos obligatorios"],
              dependencies: [],
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          createdTasksCount++;
        });
      }
    });

    // 3. Módulo de Funcionalidades Generales / Transversales
    if (bp.generalFeatures && bp.generalFeatures.length > 0) {
      const modGenId = "mod-" + Date.now() + "-gen";
      const modGenOrder = createdModulesCount + 1;
      db.modules.push({
        id: modGenId,
        projectId: id,
        title: `Módulo ${modGenOrder}: Funcionalidades Generales y Transversales`,
        description: "Requerimientos que impactan a toda la aplicación de manera global.",
        order: modGenOrder,
        createdAt: new Date().toISOString(),
      });
      createdModulesCount++;

      const stgGenId = "stage-" + Date.now() + "-gen-1";
      db.stages.push({
        id: stgGenId,
        moduleId: modGenId,
        projectId: id,
        title: `Etapa ${modGenOrder}.1: Requerimientos Globales del Sistema`,
        description: "Comportamiento transversal, estado compartido y seguridad",
        order: 1,
        createdAt: new Date().toISOString(),
      });
      createdStagesCount++;

      bp.generalFeatures.forEach((gFeat, gIdx) => {
        const taskGId = "task-" + Date.now() + "-gen-" + (gIdx + 1);
        db.tasks.push({
          id: taskGId,
          projectId: id,
          moduleId: modGenId,
          stageId: stgGenId,
          title: `[Global] ${gFeat}`,
          instruction: `Implementar el requerimiento transversal: "${gFeat}". Debe aplicar de forma consistente en todo el proyecto.`,
          status: "pending",
          workUrl: project.mainUrl,
          locked: false,
          assignedAgent: "Antigravity AI",
          subtasks: [
            { id: "st-g1-" + gIdx, title: "Configurar lógica global o proveedor de contexto", completed: false },
            { id: "st-g2-" + gIdx, title: "Aplicar en todas las vistas afectadas", completed: false },
            { id: "st-g3-" + gIdx, title: "Verificar consistencia", completed: false },
          ],
          contextMemory: {
            technicalRequirements: [
              `Requerimiento general: ${gFeat}`,
              "Asegurar persistencia o propagación uniforme",
            ],
            affectedFiles: ["src/App.tsx", "src/types.ts"],
            rulesConstraints: ["No introducir regresiones en módulos ya terminados"],
            dependencies: [],
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        createdTasksCount++;
      });
    }

    if (project.blueprint) {
      project.blueprint.lastGeneratedPlanAt = new Date().toISOString();
    }

    logChange({
      taskId: "blueprint-plan-" + project.id,
      projectId: project.id,
      taskTitle: `Plan Generado desde Blueprint: ${project.name}`,
      action: "plan_generated_from_blueprint",
      details: `Se generó el plan de acción estructurado con ${createdModulesCount} módulos, ${createdStagesCount} etapas y ${createdTasksCount} tareas y subtareas a partir de las pantallas y funcionalidades manuales.`,
      author: "human",
    });

    await saveDbAsync();
    res.json({
      success: true,
      message: `Plan generado exitosamente: ${createdModulesCount} módulos, ${createdStagesCount} etapas y ${createdTasksCount} tareas/pasos creados a partir del blueprint manual.`,
      createdModulesCount,
      createdStagesCount,
      createdTasksCount,
    });
  });

  // --- MODULES ---
  app.get("/api/modules", (req, res) => {
    const { projectId } = req.query;
    let list = [...db.modules];
    if (projectId) {
      list = list.filter((m) => m.projectId === projectId);
    }
    list.sort((a, b) => a.order - b.order);
    res.json(list);
  });

  app.post("/api/modules", async (req, res) => {
    const { projectId, title, description } = req.body;
    if (!title) {
      res.status(400).json({ error: "El título del módulo es obligatorio." });
      return;
    }

    const existingInProj = db.modules.filter((m) => m.projectId === projectId);
    const newModule: ProjectModule = {
      id: "mod-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      projectId: projectId || (db.projects[0] ? db.projects[0].id : "proj-default"),
      title: title.trim(),
      description: (description || "").trim(),
      order: existingInProj.length + 1,
      createdAt: new Date().toISOString(),
    };

    db.modules.push(newModule);
    await saveDbAsync();
    res.status(201).json(newModule);
  });

  app.delete("/api/modules/:id", async (req, res) => {
    const index = db.modules.findIndex((m) => m.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: "Módulo no encontrado" });
      return;
    }
    const [deleted] = db.modules.splice(index, 1);
    // Eliminar etapas asociadas
    db.stages = db.stages.filter((s) => s.moduleId !== deleted.id);
    await saveDbAsync();
    res.json({ success: true, deletedModuleId: deleted.id });
  });

  // --- STAGES ---
  app.get("/api/stages", (req, res) => {
    const { moduleId, projectId } = req.query;
    let list = [...db.stages];
    if (moduleId) {
      list = list.filter((s) => s.moduleId === moduleId);
    }
    if (projectId) {
      list = list.filter((s) => s.projectId === projectId);
    }
    list.sort((a, b) => a.order - b.order);
    res.json(list);
  });

  app.post("/api/stages", async (req, res) => {
    const { moduleId, projectId, title, description } = req.body;
    if (!title || !moduleId) {
      res.status(400).json({ error: "Título y moduleId son obligatorios para crear una etapa." });
      return;
    }

    const existingInMod = db.stages.filter((s) => s.moduleId === moduleId);
    const newStage: ProjectStage = {
      id: "stage-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      moduleId,
      projectId: projectId || (db.projects[0] ? db.projects[0].id : "proj-default"),
      title: title.trim(),
      description: (description || "").trim(),
      order: existingInMod.length + 1,
      createdAt: new Date().toISOString(),
    };

    db.stages.push(newStage);
    await saveDbAsync();
    res.status(201).json(newStage);
  });

  // --- ANTIGRAVITY SPECIAL ENDPOINT: GET PENDING CORRECTIONS ---
  // Este endpoint permite a Antigravity ir directo a buscar las tareas
  // que el usuario revisó en vivo y las marcó como incompletas / que no funcionan.
  app.get("/api/antigravity/pending-corrections", (req, res) => {
    const { projectId } = req.query;
    let corrections = db.tasks.filter((t) => t.status === "needs_revision");

    if (projectId) {
      corrections = corrections.filter((t) => t.projectId === projectId);
    }

    res.json({
      summary: `Hay ${corrections.length} tarea(s) marcadas como incompletas o que requieren revisión tras la prueba del usuario.`,
      count: corrections.length,
      tasksToFix: corrections.map((t) => ({
        id: t.id,
        title: t.title,
        instruction: t.instruction,
        workUrl: t.workUrl,
        humanFeedback: t.humanFeedback || "El usuario probó la web y no funcionó como esperaba.",
        contextMemory: t.contextMemory || {},
        subtasks: t.subtasks || [],
        assignedAgent: t.assignedAgent,
        updatedAt: t.updatedAt,
      })),
    });
  });

  // --- ANTIGRAVITY / AGENT: GET NEXT TASK TO EXECUTE ---
  app.get("/api/agent/next-task", (req, res) => {
    const { projectId } = req.query;
    let pool = db.tasks;
    if (projectId) {
      pool = pool.filter((t) => t.projectId === projectId);
    }

    // Prioridad 1: Tareas que el usuario probó y marcó como incompletas ('needs_revision')
    const revisionTask = pool.find((t) => t.status === "needs_revision" && !t.locked);
    if (revisionTask) {
      res.json({
        found: true,
        priority: "high_correction",
        reason: "El usuario probó la web y reportó observaciones que requieren corrección prioritaria.",
        task: {
          id: revisionTask.id,
          projectId: revisionTask.projectId,
          title: revisionTask.title,
          instruction: revisionTask.instruction,
          status: revisionTask.status,
          humanFeedback: revisionTask.humanFeedback || "Revisión solicitada por el usuario.",
          contextMemory: revisionTask.contextMemory || {},
          subtasks: revisionTask.subtasks || [],
          workUrl: revisionTask.workUrl,
          assignedAgent: revisionTask.assignedAgent,
        },
      });
      return;
    }

    // Prioridad 2: Tareas actualmente en progreso
    const inProgTask = pool.find((t) => t.status === "in_progress" && !t.locked);
    if (inProgTask) {
      res.json({
        found: true,
        priority: "in_progress",
        reason: "Tarea actualmente en curso.",
        task: {
          id: inProgTask.id,
          projectId: inProgTask.projectId,
          title: inProgTask.title,
          instruction: inProgTask.instruction,
          status: inProgTask.status,
          contextMemory: inProgTask.contextMemory || {},
          subtasks: inProgTask.subtasks || [],
          workUrl: inProgTask.workUrl,
          assignedAgent: inProgTask.assignedAgent,
        },
      });
      return;
    }

    // Prioridad 3: Siguiente tarea pendiente
    const pendingTask = pool.find((t) => t.status === "pending" && !t.locked);
    if (pendingTask) {
      res.json({
        found: true,
        priority: "next_pending",
        reason: "Siguiente tarea disponible en la cola de desarrollo.",
        task: {
          id: pendingTask.id,
          projectId: pendingTask.projectId,
          title: pendingTask.title,
          instruction: pendingTask.instruction,
          status: pendingTask.status,
          contextMemory: pendingTask.contextMemory || {},
          subtasks: pendingTask.subtasks || [],
          workUrl: pendingTask.workUrl,
          assignedAgent: pendingTask.assignedAgent,
        },
      });
      return;
    }

    res.json({
      found: false,
      message: "No hay tareas pendientes ni correcciones en este momento. Todas las tareas están verificadas o listas para revisión.",
      task: null,
    });
  });

  // --- ANTIGRAVITY / AGENT: GET CONTEXT MEMORY ---
  app.get("/api/agent/context-memory", (req, res) => {
    const { taskId, projectId } = req.query;

    if (taskId) {
      const task = db.tasks.find((t) => t.id === taskId);
      if (!task) {
        res.status(404).json({ error: "Tarea no encontrada" });
        return;
      }
      res.json({
        taskId: task.id,
        taskTitle: task.title,
        contextMemory: task.contextMemory || {
          technicalRequirements: [],
          affectedFiles: [],
          rulesConstraints: [],
          requiredDependencies: [],
          persistentNotes: "",
        },
      });
      return;
    }

    const targetProjId = (projectId as string) || (db.projects[0] ? db.projects[0].id : "proj-default");
    const projTasks = db.tasks.filter((t) => t.projectId === targetProjId);

    const allTechReqs = new Set<string>();
    const allFiles = new Set<string>();
    const allRules = new Set<string>();
    const allDeps = new Set<string>();
    const notesArr: string[] = [];

    projTasks.forEach((t) => {
      if (t.contextMemory) {
        t.contextMemory.technicalRequirements?.forEach((r) => allTechReqs.add(r));
        t.contextMemory.affectedFiles?.forEach((f) => allFiles.add(f));
        t.contextMemory.rulesConstraints?.forEach((rc) => allRules.add(rc));
        (t.contextMemory.dependencies || t.contextMemory.requiredDependencies)?.forEach((d) => allDeps.add(d));
        const noteText = t.contextMemory.notes || t.contextMemory.persistentNotes;
        if (noteText) {
          notesArr.push(`[${t.title}]: ${noteText}`);
        }
      }
    });

    res.json({
      projectId: targetProjId,
      consolidatedMemory: {
        technicalRequirements: Array.from(allTechReqs),
        affectedFiles: Array.from(allFiles),
        rulesConstraints: Array.from(allRules),
        requiredDependencies: Array.from(allDeps),
        persistentNotes: notesArr.join("\n"),
      },
    });
  });

  // --- ANTIGRAVITY / AGENT: COMPLETE TASK DIRECT ROUTE ---
  app.post("/api/agent/complete-task", async (req, res) => {
    const { taskId, workUrl, aiOutput, aiNotes, updatedSubtasks, updatedContextMemory, gitBranch, gitCommit, branch, commit } = req.body;
    if (!taskId) {
      res.status(400).json({ error: "taskId es requerido en el body" });
      return;
    }

    const task = db.tasks.find((t) => t.id === taskId);
    if (!task) {
      res.status(404).json({ error: "Tarea no encontrada" });
      return;
    }

    if (task.locked) {
      res.status(403).json({
        error: "Esta tarea está verificada y bloqueada. La IA no debe modificarla.",
        locked: true,
      });
      return;
    }

    const prevStatus = task.status;
    task.status = "ready_for_review";
    if (workUrl) task.workUrl = workUrl.trim();
    if (aiOutput !== undefined) task.aiOutput = aiOutput;
    if (aiNotes !== undefined) task.aiNotes = aiNotes;
    if (gitBranch || branch) task.gitBranch = gitBranch || branch;
    if (gitCommit || commit) task.gitCommit = gitCommit || commit;
    task.assignedAgent = "Antigravity AI";
    if (Array.isArray(updatedSubtasks)) task.subtasks = updatedSubtasks;
    if (updatedContextMemory) task.contextMemory = { ...task.contextMemory, ...updatedContextMemory };

    task.completedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    logChange({
      taskId: task.id,
      projectId: task.projectId,
      taskTitle: task.title,
      action: "ai_completed",
      previousStatus: prevStatus,
      newStatus: "ready_for_review",
      details: `Antigravity finalizó la tarea y la dejó lista para revisión en la URL: ${task.workUrl}`,
      workUrl: task.workUrl,
      author: "antigravity_ai",
    });

    await saveDbAsync();
    res.json({
      success: true,
      message: "Tarea marcada exitosamente como 'ready_for_review' para validación del humano.",
      task,
    });
  });

  // --- BLUEPRINT DE PROYECTO (GET / PUT / POST /api/projects/:id/blueprint & /generate-blueprint) ---
  app.get("/api/projects/:id/blueprint", (req, res) => {
    const { id } = req.params;
    const project = db.projects.find((p) => p.id === id);
    if (!project) {
      res.status(404).json({ error: "Proyecto no encontrado" });
      return;
    }

    let blueprintObj: any = project.blueprint;
    if (!blueprintObj || !blueprintObj.masterPrompt) {
      blueprintObj = synthesizeBlueprintByDomain(project.description || project.name, project.name);
    }

    res.json({
      success: true,
      projectId: project.id,
      projectName: project.name,
      blueprint: blueprintObj,
      instructionsForAI: "DIRECTIVA OBLIGATORIA PARA AGENTES IA: Nunca generes un plan genérico. Primero crea un Blueprint específico del dominio del proyecto. Luego cada módulo, etapa y tarea debe derivarse directamente de ese Blueprint. Si una tarea podría servir para cualquier proyecto, reescríbela hasta que sea específica del producto solicitado.",
    });
  });

  app.put("/api/projects/:id/blueprint", async (req, res) => {
    const { id } = req.params;
    const project = db.projects.find((p) => p.id === id);
    if (!project) {
      res.status(404).json({ error: "Proyecto no encontrado" });
      return;
    }

    const blueprintContent = req.body.blueprint || req.body;
    project.blueprint = blueprintContent;
    project.updatedAt = new Date().toISOString();

    if (getNeonStatus().isConnected) {
      await updateProjectSQL(id, { blueprint: JSON.stringify(blueprintContent) }).catch(() => {});
    }

    await saveDbAsync();
    res.json({
      success: true,
      message: "Blueprint del proyecto persistido correctamente.",
      projectId: project.id,
      blueprint: project.blueprint,
      instructionsForAI: "DIRECTIVA OBLIGATORIA PARA AGENTES IA: Nunca generes un plan genérico. Primero crea un Blueprint específico del dominio del proyecto. Luego cada módulo, etapa y tarea debe derivarse directamente de ese Blueprint. Si una tarea podría servir para cualquier proyecto, reescríbela hasta que sea específica del producto solicitado.",
    });
  });

  app.post("/api/projects/:id/generate-blueprint", async (req, res) => {
    const { id } = req.params;
    const project = db.projects.find((p) => p.id === id);
    const idea = req.body.idea || req.body.prompt || (project ? project.description : "") || "Aplicación de servicios";
    const name = (project ? project.name : "") || req.body.name || "Nuevo Proyecto";

    const generated = await generateBlueprintFromIdea(idea, name);
    if (project) {
      project.blueprint = generated;
      project.updatedAt = new Date().toISOString();
      if (getNeonStatus().isConnected) {
        await updateProjectSQL(id, { blueprint: JSON.stringify(generated) }).catch(() => {});
      }
      await saveDbAsync();
    }

    res.json({
      success: true,
      message: "Blueprint estructurado generado exitosamente.",
      projectId: id,
      blueprint: generated,
    });
  });

  // --- GENERACIÓN INTELIGENTE DE PLAN DE TRABAJO DESDE BLUEPRINT ---
  app.post("/api/projects/:id/generate-plan-from-blueprint", async (req, res) => {
    const { id } = req.params;
    const project = db.projects.find((p) => p.id === id);
    if (!project) {
      res.status(404).json({ error: "Proyecto no encontrado" });
      return;
    }

    let targetBlueprint: any = req.body.blueprint || project.blueprint;
    if (!targetBlueprint || !targetBlueprint.masterPrompt) {
      targetBlueprint = await generateBlueprintFromIdea(project.description || project.name, project.name);
      project.blueprint = targetBlueprint;
    }

    const workPlan = await generateWorkPlanFromBlueprint(targetBlueprint, id);

    // Limpiar módulos, etapas y tareas previas si aplica
    if (req.body.clearExisting !== false) {
      db.tasks = db.tasks.filter((t) => t.projectId !== id);
      db.modules = db.modules.filter((m) => m.projectId !== id);
      db.stages = db.stages.filter((s) => s.projectId !== id);
    }

    // Insertar Módulos
    const newModules: ProjectModule[] = (workPlan.modules || []).map((m, idx) => ({
      id: m.id || `mod-${Date.now()}-${idx + 1}`,
      projectId: id,
      title: m.title || `Módulo ${idx + 1}`,
      description: m.description,
      order: m.order || idx + 1,
      createdAt: new Date().toISOString(),
    }));

    // Insertar Etapas
    const newStages: ProjectStage[] = (workPlan.stages || []).map((s, idx) => ({
      id: s.id || `stg-${Date.now()}-${idx + 1}`,
      moduleId: s.moduleId || newModules[0]?.id || "",
      projectId: id,
      title: s.title || `Etapa ${idx + 1}`,
      description: s.description,
      order: s.order || idx + 1,
      createdAt: new Date().toISOString(),
    }));

    // Insertar Tareas
    const newTasks: TaskItem[] = (workPlan.tasks || []).map((t, idx) => ({
      id: t.id || `tsk-${Date.now()}-${idx + 1}`,
      projectId: id,
      moduleId: t.moduleId || newModules[0]?.id,
      stageId: t.stageId || newStages[0]?.id,
      title: t.title || `Tarea ${idx + 1}`,
      instruction: t.instruction || "",
      status: "pending",
      workUrl: project.mainUrl || "",
      locked: false,
      assignedAgent: "Antigravity AI",
      subtasks: t.subtasks || [],
      contextMemory: t.contextMemory || {
        technicalRequirements: [],
        affectedFiles: [],
        rulesConstraints: [],
        dependencies: [],
        notes: "",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    db.modules.push(...newModules);
    db.stages.push(...newStages);
    db.tasks.unshift(...newTasks);

    logChange({
      taskId: newTasks[0]?.id || "plan-generated",
      projectId: id,
      taskTitle: "Plan de Trabajo Inteligente Generado",
      action: "plan_generated",
      newStatus: "pending",
      details: `Se generó plan desde Blueprint con ${newModules.length} módulos, ${newStages.length} etapas y ${newTasks.length} tareas con memoria técnica.`,
      author: "antigravity_ai",
    });

    await saveDbAsync();
    res.json({
      success: true,
      message: `Plan generado con éxito (${newModules.length} módulos, ${newTasks.length} tareas con memoria técnica).`,
      projectId: id,
      blueprint: targetBlueprint,
      createdModulesCount: newModules.length,
      createdStagesCount: newStages.length,
      createdTasksCount: newTasks.length,
      modules: newModules,
      stages: newStages,
      tasks: newTasks,
    });
  });

  // --- ANTIGRAVITY GENERATE AUTOMATIC PLAN BY MODULES (COMPATIBILIDAD) ---
  app.post("/api/antigravity/generate-plan", async (req, res) => {
    const { projectId, projectIdeaPrompt } = req.body;
    if (!projectIdeaPrompt) {
      res.status(400).json({ error: "Se requiere la descripción de la idea del proyecto." });
      return;
    }

    const targetProjId = projectId || (db.projects[0] ? db.projects[0].id : "proj-default");
    const proj = db.projects.find((p) => p.id === targetProjId);

    const targetBlueprint = await generateBlueprintFromIdea(projectIdeaPrompt, proj ? proj.name : "Proyecto ARQAI");
    if (proj) {
      proj.blueprint = targetBlueprint;
    }

    const workPlan = await generateWorkPlanFromBlueprint(targetBlueprint, targetProjId);

    if (req.body.clearExisting !== false) {
      db.tasks = db.tasks.filter((t) => t.projectId !== targetProjId);
      db.modules = db.modules.filter((m) => m.projectId !== targetProjId);
      db.stages = db.stages.filter((s) => s.projectId !== targetProjId);
    }

    const newModules: ProjectModule[] = (workPlan.modules || []).map((m, idx) => ({
      id: m.id || `mod-${Date.now()}-${idx + 1}`,
      projectId: targetProjId,
      title: m.title || `Módulo ${idx + 1}`,
      description: m.description,
      order: m.order || idx + 1,
      createdAt: new Date().toISOString(),
    }));

    const newStages: ProjectStage[] = (workPlan.stages || []).map((s, idx) => ({
      id: s.id || `stg-${Date.now()}-${idx + 1}`,
      moduleId: s.moduleId || newModules[0]?.id || "",
      projectId: targetProjId,
      title: s.title || `Etapa ${idx + 1}`,
      description: s.description,
      order: s.order || idx + 1,
      createdAt: new Date().toISOString(),
    }));

    const newTasks: TaskItem[] = (workPlan.tasks || []).map((t, idx) => ({
      id: t.id || `tsk-${Date.now()}-${idx + 1}`,
      projectId: targetProjId,
      moduleId: t.moduleId || newModules[0]?.id,
      stageId: t.stageId || newStages[0]?.id,
      title: t.title || `Tarea ${idx + 1}`,
      instruction: t.instruction || "",
      status: "pending",
      workUrl: proj ? proj.mainUrl : "",
      locked: false,
      assignedAgent: "Antigravity AI",
      subtasks: t.subtasks || [],
      contextMemory: t.contextMemory || {
        technicalRequirements: [],
        affectedFiles: [],
        rulesConstraints: [],
        dependencies: [],
        notes: "",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    db.modules.push(...newModules);
    db.stages.push(...newStages);
    db.tasks.unshift(...newTasks);

    logChange({
      taskId: newTasks[0]?.id || "plan-generated",
      projectId: targetProjId,
      taskTitle: "Generación Automática de Plan desde Blueprint",
      action: "plan_generated",
      newStatus: "pending",
      details: `Plan generado con éxito con ${newModules.length} módulos y ${newTasks.length} tareas con memoria técnica.`,
      author: "antigravity_ai",
    });

    await saveDbAsync();
    res.json({
      success: true,
      message: "Plan desglosado en módulos, etapas, tareas y ficha de memoria de contexto específica del dominio.",
      blueprint: targetBlueprint,
      modules: newModules,
      stages: newStages,
      tasks: newTasks,
    });
  });

  // --- TASKS GET & FILTER ---
  app.get("/api/tasks", (req, res) => {
    const { projectId, status, locked, moduleId, stageId } = req.query;
    let results = [...db.tasks];

    if (projectId) {
      results = results.filter((t) => t.projectId === projectId);
    }
    if (status) {
      results = results.filter((t) => t.status === status);
    }
    if (locked !== undefined) {
      const isLocked = locked === "true";
      results = results.filter((t) => t.locked === isLocked);
    }
    if (moduleId) {
      results = results.filter((t) => t.moduleId === moduleId);
    }
    if (stageId) {
      results = results.filter((t) => t.stageId === stageId);
    }

    results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json(results);
  });

  app.get("/api/tasks/:id", (req, res) => {
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) {
      res.status(404).json({ error: "Tarea no encontrada" });
      return;
    }
    res.json(task);
  });

  // Crear Tarea con opción de Módulo, Etapa, Subtareas y Memoria de Contexto
  app.post("/api/tasks", async (req, res) => {
    const {
      projectId,
      moduleId,
      stageId,
      title,
      instruction,
      workUrl,
      assignedAgent,
      subtasks,
      contextMemory,
      imageRefs,
    } = req.body;

    if (!instruction) {
      res.status(400).json({ error: "La instrucción para la IA es obligatoria." });
      return;
    }

    const project =
      db.projects.find((p) => p.id === projectId) || db.projects[0];
    const generatedTitle =
      title && title.trim().length > 0
        ? title.trim()
        : instruction.length > 50
        ? instruction.substring(0, 47) + "..."
        : instruction;

    const newTask: TaskItem = {
      id: "task-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      projectId: project ? project.id : "proj-default",
      moduleId: moduleId || undefined,
      stageId: stageId || undefined,
      title: generatedTitle,
      instruction: instruction.trim(),
      status: "pending",
      workUrl: (workUrl || (project ? project.mainUrl : "") || "").trim(),
      locked: false,
      assignedAgent: assignedAgent || "Antigravity AI",
      subtasks: Array.isArray(subtasks) ? subtasks : [],
      imageRefs: Array.isArray(imageRefs) ? imageRefs : (contextMemory?.imageRefs || []),
      contextMemory: contextMemory || {
        technicalRequirements: [],
        affectedFiles: [],
        rulesConstraints: [],
        dependencies: [],
        notes: "Memoria de contexto creada automáticamente para guiar a Antigravity.",
        imageRefs: Array.isArray(imageRefs) ? imageRefs : [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.tasks.unshift(newTask);
    logChange({
      taskId: newTask.id,
      projectId: newTask.projectId,
      taskTitle: newTask.title,
      action: "task_created",
      newStatus: "pending",
      details: `Nueva instrucción asignada: "${newTask.title}"`,
      author: "human",
    });

    await saveDbAsync();
    res.status(201).json(newTask);
  });

  // Antigravity inicia procesamiento
  app.post("/api/tasks/:id/start-by-ai", async (req, res) => {
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) {
      res.status(404).json({ error: "Tarea no encontrada" });
      return;
    }

    if (task.locked) {
      res.status(403).json({
        error: "Esta tarea está verificada y bloqueada por el humano. No debes modificarla.",
        locked: true,
      });
      return;
    }

    const prevStatus = task.status;
    task.status = "in_progress";
    task.updatedAt = new Date().toISOString();
    if (req.body.assignedAgent) {
      task.assignedAgent = req.body.assignedAgent;
    }

    logChange({
      taskId: task.id,
      projectId: task.projectId,
      taskTitle: task.title,
      action: "ai_started",
      previousStatus: prevStatus,
      newStatus: "in_progress",
      details: req.body.notes || "Antigravity consultó la memoria de contexto y comenzó a trabajar.",
      author: "antigravity_ai",
    });

    await saveDbAsync();
    res.json({ success: true, task });
  });

  // Antigravity completa la tarea
  app.post("/api/tasks/:id/complete-by-ai", async (req, res) => {
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) {
      res.status(404).json({ error: "Tarea no encontrada" });
      return;
    }

    if (task.locked) {
      res.status(403).json({
        error: "Esta tarea está verificada y bloqueada. La IA no debe modificarla.",
        locked: true,
      });
      return;
    }

    // SEGURIDAD REFORZADA: Bloquear cualquier intento de la IA de tocar campos humanos o autoverificarse
    const { status, locked, humanFeedback, workUrl, aiOutput, aiNotes, assignedAgent, updatedSubtasks, updatedContextMemory } =
      req.body;

    if (status === "verified" || locked === true || humanFeedback !== undefined) {
      res.status(403).json({
        error: "Acceso Denegado: Antigravity AI no tiene permisos para marcar, autoverificarse, aprobar o modificar la ficha de revisión humana. Esta acción es exclusiva del usuario humano.",
      });
      return;
    }

    const prevStatus = task.status;

    task.status = "ready_for_review";
    if (workUrl) task.workUrl = workUrl.trim();
    if (aiOutput !== undefined) task.aiOutput = aiOutput;
    if (aiNotes !== undefined) task.aiNotes = aiNotes;
    if (assignedAgent) task.assignedAgent = assignedAgent;
    if (Array.isArray(updatedSubtasks)) task.subtasks = updatedSubtasks;
    if (updatedContextMemory) task.contextMemory = { ...task.contextMemory, ...updatedContextMemory };

    task.completedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    logChange({
      taskId: task.id,
      projectId: task.projectId,
      taskTitle: task.title,
      action: "ai_completed",
      previousStatus: prevStatus,
      newStatus: "ready_for_review",
      details: `Antigravity finalizó la tarea y la dejó lista para revisión en la URL: ${task.workUrl}`,
      workUrl: task.workUrl,
      author: "antigravity_ai",
    });

    await saveDbAsync();
    res.json({
      success: true,
      message: "Tarea marcada como lista para revisión del usuario.",
      task,
    });
  });

  // Usuario aprueba y bloquea la tarea tras probar la web en vivo
  app.post("/api/tasks/:id/verify", async (req, res) => {
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) {
      res.status(404).json({ error: "Tarea no encontrada" });
      return;
    }

    const prevStatus = task.status;
    task.status = "verified";
    task.locked = true; // Bloqueado para garantizar que la IA no la toque más
    task.verifiedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();
    if (req.body.notes) {
      task.humanFeedback = req.body.notes;
    }

    logChange({
      taskId: task.id,
      projectId: task.projectId,
      taskTitle: task.title,
      action: "human_verified_and_locked",
      previousStatus: prevStatus,
      newStatus: "verified",
      details: `El usuario revisó la web (${task.workUrl || "URL"}), confirmó que funciona perfectamente y la bloqueó.`,
      workUrl: task.workUrl,
      author: "human",
    });

    await saveDbAsync();
    res.json({
      success: true,
      message: "Tarea verificada, aprobada y bloqueada exitosamente.",
      task,
    });
  });

  // Usuario rechaza / marca como incompleta tras probar la web
  app.post("/api/tasks/:id/reject", async (req, res) => {
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) {
      res.status(404).json({ error: "Tarea no encontrada" });
      return;
    }

    const { feedback } = req.body;
    const prevStatus = task.status;
    task.status = "needs_revision";
    task.locked = false;
    task.humanFeedback = feedback || "El usuario revisó la web y no funcionó como esperaba. Requiere ajustes.";
    task.updatedAt = new Date().toISOString();

    logChange({
      taskId: task.id,
      projectId: task.projectId,
      taskTitle: task.title,
      action: "human_requested_revision",
      previousStatus: prevStatus,
      newStatus: "needs_revision",
      details: `El usuario la revisó en vivo y la marcó como INCOMPLETA / REQUIERE AJUSTES: "${task.humanFeedback}"`,
      workUrl: task.workUrl,
      author: "human",
    });

    await saveDbAsync();
    res.json({
      success: true,
      message: "Tarea marcada como 'Requiere Ajuste'. Antigravity podrá consultarla directamente.",
      task,
    });
  });

  // Desbloquear tarea
  app.post("/api/tasks/:id/unlock", async (req, res) => {
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) {
      res.status(404).json({ error: "Tarea no encontrada" });
      return;
    }

    task.locked = false;
    task.status = "pending";
    task.updatedAt = new Date().toISOString();

    logChange({
      taskId: task.id,
      projectId: task.projectId,
      taskTitle: task.title,
      action: "human_unlocked",
      newStatus: "pending",
      details: "El usuario desbloqueó la tarea para permitir nuevas modificaciones por la IA.",
      author: "human",
    });

    await saveDbAsync();
    res.json({ success: true, task });
  });

  // Actualizar Memoria de Contexto
  app.patch("/api/tasks/:id/context-memory", async (req, res) => {
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) {
      res.status(404).json({ error: "Tarea no encontrada" });
      return;
    }

    const { technicalRequirements, affectedFiles, rulesConstraints, dependencies, notes } = req.body;
    task.contextMemory = {
      technicalRequirements: technicalRequirements || task.contextMemory?.technicalRequirements || [],
      affectedFiles: affectedFiles || task.contextMemory?.affectedFiles || [],
      rulesConstraints: rulesConstraints || task.contextMemory?.rulesConstraints || [],
      dependencies: dependencies || task.contextMemory?.dependencies || [],
      notes: notes !== undefined ? notes : task.contextMemory?.notes,
    };
    task.updatedAt = new Date().toISOString();

    await saveDbAsync();
    res.json({ success: true, contextMemory: task.contextMemory, task });
  });

  // Actualizar Subtareas
  app.patch("/api/tasks/:id/subtasks", async (req, res) => {
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) {
      res.status(404).json({ error: "Tarea no encontrada" });
      return;
    }

    const { subtasks } = req.body;
    if (Array.isArray(subtasks)) {
      task.subtasks = subtasks;
      task.updatedAt = new Date().toISOString();
      await saveDbAsync();
    }

    res.json({ success: true, subtasks: task.subtasks });
  });

  // PATCH Genérico Tarea
  app.patch("/api/tasks/:id", async (req, res) => {
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) {
      res.status(404).json({ error: "Tarea no encontrada" });
      return;
    }

    const isAiRequest = Boolean(req.headers["x-api-key"] || req.body.author === "antigravity_ai" || req.body.source === "ai");

    const {
      title,
      instruction,
      status,
      workUrl,
      aiOutput,
      aiNotes,
      humanFeedback,
      locked,
      moduleId,
      stageId,
      subtasks,
      contextMemory,
    } = req.body;

    // REGLA DE SEGURIDAD ESTRICTA:
    // Si la llamada proviene de la IA (x-api-key o autor IA), no puede autoverificarse, bloquearse ni alterar la ficha de revisión del humano
    if (isAiRequest) {
      if (status === "verified" || locked === true || humanFeedback !== undefined) {
        res.status(403).json({
          error: "Acceso Denegado: Antigravity AI no tiene permisos para marcar, autoverificarse o alterar la ficha de revisión humana. Esos campos son exclusivos del usuario humano.",
        });
        return;
      }
    }

    const prevStatus = task.status;

    if (title !== undefined) task.title = title.trim();
    let effectiveStatus = status;
    if (effectiveStatus === "completed" || effectiveStatus === "done" || effectiveStatus === "finished" || effectiveStatus === "complete") {
      effectiveStatus = "ready_for_review";
    }
    if (effectiveStatus !== undefined) task.status = effectiveStatus;
    if (workUrl !== undefined) task.workUrl = workUrl.trim();
    if (aiOutput !== undefined) task.aiOutput = aiOutput;
    if (aiNotes !== undefined) task.aiNotes = aiNotes;
    if (humanFeedback !== undefined) task.humanFeedback = humanFeedback;
    if (locked !== undefined) task.locked = Boolean(locked);
    if (moduleId !== undefined) task.moduleId = moduleId;
    if (stageId !== undefined) task.stageId = stageId;
    if (Array.isArray(subtasks)) task.subtasks = subtasks;
    if (contextMemory) task.contextMemory = { ...task.contextMemory, ...contextMemory };

    task.updatedAt = new Date().toISOString();

    logChange({
      taskId: task.id,
      projectId: task.projectId,
      taskTitle: task.title,
      action: "task_updated",
      previousStatus: prevStatus,
      newStatus: task.status,
      details: "Tarea y/o Ficha de Contexto actualizada.",
      workUrl: task.workUrl,
      author: "api",
    });

    await saveDbAsync();
    res.json(task);
  });

  // DELETE Tarea
  app.delete("/api/tasks/:id", async (req, res) => {
    const index = db.tasks.findIndex((t) => t.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: "Tarea no encontrada" });
      return;
    }

    const deletedTask = db.tasks.splice(index, 1)[0];
    logChange({
      taskId: deletedTask.id,
      projectId: deletedTask.projectId,
      taskTitle: deletedTask.title,
      action: "task_deleted",
      details: `Tarea "${deletedTask.title}" eliminada.`,
      author: "human",
    });

    await saveDbAsync();
    res.json({ success: true, deletedTaskId: deletedTask.id });
  });

  // --- ENDPOINTS ESPECIALIZADOS PARA AGENTES DE IA (ANTIGRAVITY, CODEX, HERMES, ETC.) ---

  // Carga masiva de Plan de Acción completo (Batch Sync)
  app.post("/api/projects/:id/plan/batch", async (req, res) => {
    const { id } = req.params;
    const project = db.projects.find((p) => p.id === id);
    if (!project) {
      res.status(404).json({ error: "Proyecto no encontrado" });
      return;
    }

    const { modules = [], stages = [], tasks = [] } = req.body;

    for (const m of modules) {
      if (!db.modules.some((mod) => mod.id === m.id)) {
        db.modules.push({
          id: m.id || "mod-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
          projectId: id,
          title: m.title || "Módulo",
          description: m.description || "",
          order: m.order || 1,
          createdAt: new Date().toISOString(),
        });
      }
    }

    for (const stg of stages) {
      if (!db.stages.some((s) => s.id === stg.id)) {
        db.stages.push({
          id: stg.id || "stg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
          projectId: id,
          moduleId: stg.moduleId || (db.modules.find(m => m.projectId === id)?.id || ""),
          title: stg.title || "Etapa",
          description: stg.description || "",
          order: stg.order || 1,
          createdAt: new Date().toISOString(),
        });
      }
    }

    let insertedCount = 0;
    for (const t of tasks) {
      if (!db.tasks.some((task) => task.id === t.id)) {
        const newTask: TaskItem = {
          id: t.id || "task-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
          projectId: id,
          moduleId: t.moduleId,
          stageId: t.stageId,
          title: t.title || "Tarea Asignada",
          instruction: t.instruction || "",
          status: "pending",
          workUrl: t.workUrl || project.mainUrl || "",
          locked: false,
          assignedAgent: t.assignedAgent || (req.headers["x-agent-name"] as string) || "Antigravity AI",
          subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
          contextMemory: t.contextMemory || {
            technicalRequirements: [],
            affectedFiles: [],
            rulesConstraints: [],
            dependencies: [],
            notes: "Memoria contextual enviada en la carga masiva del plan.",
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.tasks.push(newTask);
        insertedCount++;
      }
    }

    logChange({
      taskId: "batch-sync",
      projectId: id,
      taskTitle: `Sincronización de Plan (${insertedCount} tareas)`,
      action: "batch_plan_created",
      newStatus: "pending",
      details: `Agente registró un plan completo con ${modules.length} módulos y ${insertedCount} tareas nuevas.`,
      author: "antigravity_ai",
    });

    await saveDbAsync();
    res.json({
      success: true,
      message: `Plan sincronizado exitosamente. ${insertedCount} tareas creadas.`,
      project,
      tasksCount: insertedCount,
    });
  });

  // Obtener la siguiente tarea pendiente para el Agente con su memoria de contexto técnico
  app.get("/api/projects/:id/next-task", (req, res) => {
    const { id } = req.params;
    const project = db.projects.find((p) => p.id === id);
    if (!project) {
      res.status(404).json({ error: "Proyecto no encontrado" });
      return;
    }

    let nextTask = db.tasks.find((t) => t.projectId === id && t.status === "needs_revision" && !t.locked);
    
    if (!nextTask) {
      nextTask = db.tasks.find((t) => t.projectId === id && t.status === "pending" && !t.locked);
    }

    if (!nextTask) {
      res.json({
        success: true,
        hasMoreTasks: false,
        message: "No hay más tareas pendientes o en revisión para este proyecto. ¡Todo al día!",
      });
      return;
    }

    res.json({
      success: true,
      hasMoreTasks: true,
      task: nextTask,
      contextMemory: nextTask.contextMemory || {},
      humanFeedback: nextTask.humanFeedback || null,
      project: {
        id: project.id,
        name: project.name,
        mainUrl: project.mainUrl,
      },
    });
  });

  // Consultar retroalimentación del humano ('needs_revision')
  app.get("/api/projects/:id/feedback", (req, res) => {
    const { id } = req.params;
    const rejectedTasks = db.tasks.filter(
      (t) => t.projectId === id && t.status === "needs_revision"
    );

    res.json({
      success: true,
      count: rejectedTasks.length,
      tasks: rejectedTasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        humanFeedback: t.humanFeedback,
        workUrl: t.workUrl,
        updatedAt: t.updatedAt,
      })),
    });
  });

  // Endpoint de Auto-descubrimiento en JSON para LLMs y Agentes de IA
  app.get("/api/ai-spec", (req, res) => {
    res.json({
      name: "ARQAI Task Hub & QA Verifier API",
      version: "1.0.0",
      description: "API optimizada para agentes autónomos (Antigravity, Codex, Hermes, Claude, etc.)",
      goldenDirectiveForPlanCreation: "Nunca generes un plan genérico. Primero crea un Blueprint específico del dominio del proyecto. Luego cada módulo, etapa y tarea debe derivarse directamente de ese Blueprint. Si una tarea podría servir para cualquier proyecto, reescríbela hasta que sea específica del producto solicitado.",
      headersRequired: {
        "x-api-key": "Clave API del Proyecto (ej: arqai_sec_...)",
        "x-agent-name": "Nombre de tu Agente (ej: Antigravity AI)",
      },
      endpoints: [
        {
          path: "PUT /api/projects/:id/blueprint",
          purpose: "Guardar el Blueprint estructurado del producto (masterPrompt, generalFeatures, screens, connections, architecturalNotes).",
        },
        {
          path: "POST /api/projects/:id/generate-plan-from-blueprint",
          purpose: "Generar plan de trabajo específico por dominio derivado directamente del Blueprint.",
        },
        {
          path: "GET /api/projects/:id/next-task",
          purpose: "Obtener la siguiente tarea pendiente con memoria de contexto técnico y feedback humano.",
        },
        {
          path: "POST /api/projects/:id/plan/batch",
          purpose: "Cargar masivamente un plan de acción completo (módulos, etapas, tareas) desde un JSON.",
        },
        {
          path: "POST /api/tasks/:id/start-by-ai",
          purpose: "Marcar inicio de trabajo de la IA en la tarea (status -> 'in_progress').",
        },
        {
          path: "POST /api/tasks/:id/complete-by-ai",
          purpose: "Finalizar trabajo de la IA (status -> 'ready_for_review') y adjuntar workUrl y aiNotes.",
        },
        {
          path: "GET /api/projects/:id/feedback",
          purpose: "Obtener lista de tareas rechazadas por el humano ('needs_revision') con sus comentarios.",
        },
      ],
    });
  });

  // --- HISTORIAL ---
  app.get("/api/history", (req, res) => {
    const { projectId, taskId } = req.query;
    let results = [...db.history];

    if (projectId) {
      results = results.filter((h) => h.projectId === projectId);
    }
    if (taskId) {
      results = results.filter((h) => h.taskId === taskId);
    }

    res.json(results);
  });

  app.delete("/api/history", async (req, res) => {
    db.history = [];
    await saveDbAsync();
    res.json({ success: true, message: "Historial limpiado." });
  });

  app.delete("/api/history/:id", async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "ID de historial requerido" });
    try {
      if (getNeonStatus().isConnected) {
        await querySQL("DELETE FROM antigravity_history WHERE id = $1", [id]).catch(() => {});
      }
      db.history = (db.history || []).filter((h: any) => h.id !== id);
      await saveDbAsync();
      res.json({ success: true, deletedHistoryId: id, message: "Registro de historial eliminado correctamente." });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Error al eliminar registro del historial" });
    }
  });

  // --- SIMULADOR DE AGENTE ANTIGRAVITY ---
  app.post("/api/agent/simulate", async (req, res) => {
    const { taskId, actionType, workUrl, customNotes } = req.body;
    const task = db.tasks.find((t) => t.id === taskId);
    if (!task) {
      res.status(404).json({ error: "Tarea no encontrada para simular" });
      return;
    }

    if (task.locked) {
      res.status(403).json({
        error: "La tarea está bloqueada y verificada. La IA rechaza modificarla.",
        locked: true,
      });
      return;
    }

    const project = db.projects.find((p) => p.id === task.projectId);
    const resolvedUrl =
      workUrl || task.workUrl || (project ? project.mainUrl : "") || "https://preview.app.run.app";

    if (actionType === "start") {
      task.status = "in_progress";
      task.updatedAt = new Date().toISOString();
      logChange({
        taskId: task.id,
        projectId: task.projectId,
        taskTitle: task.title,
        action: "ai_started",
        newStatus: "in_progress",
        details: "Antigravity leyó la ficha de contexto técnico y comenzó a programar.",
        author: "antigravity_ai",
      });
    } else {
      // Complete
      task.status = "ready_for_review";
      task.workUrl = resolvedUrl;
      task.aiOutput = `Cambios para "${task.title}" completados satisfactoriamente.`;
      task.aiNotes =
        customNotes ||
        "Se atendió la instrucción y la ficha de contexto técnico. Lista para revisión del usuario en vivo.";
      task.completedAt = new Date().toISOString();
      task.updatedAt = new Date().toISOString();

      // Marcar subtareas como completadas
      if (task.subtasks) {
        task.subtasks = task.subtasks.map((st) => ({ ...st, completed: true }));
      }

      logChange({
        taskId: task.id,
        projectId: task.projectId,
        taskTitle: task.title,
        action: "ai_completed",
        previousStatus: "in_progress",
        newStatus: "ready_for_review",
        details: `Antigravity finalizó la implementación y generó la URL de trabajo: ${resolvedUrl}`,
        workUrl: resolvedUrl,
        author: "antigravity_ai",
      });
    }

    await saveDbAsync();
    res.json({ success: true, task });
  });

let initServerDatabasePromise: Promise<void> | null = null;

export async function initServerDatabase(): Promise<void> {
  if (initServerDatabasePromise) return initServerDatabasePromise;

  initServerDatabasePromise = (async () => {
    try {
      const status = await initNeonConnection();
      if (status.isConnected) {
        console.log(`[Neon] ${status.message}`);
        const remoteData = await loadFromNeon();
        if (remoteData && Array.isArray(remoteData.projects)) {
          const userMap = new Map<string, any>();
          const addUserToMap = (u: any) => {
            const existingById = u.id ? userMap.get(u.id) : null;
            const existingByName = u.name ? userMap.get(`name:${u.name.toLowerCase()}`) : null;
            const existing = existingById || existingByName;
            if (!existing) {
              if (u.id) userMap.set(u.id, u);
              if (u.name) userMap.set(`name:${u.name.toLowerCase()}`, u);
            } else {
              if (u.id) existing.id = u.id;
              if (u.name) existing.name = u.name;
              if (u.pin) existing.pin = u.pin;
              if (u.email) existing.email = u.email;
              if (u.accessType) existing.accessType = u.accessType;
            }
          };

          for (const u of (db.users || [])) addUserToMap(u);
          if (Array.isArray(remoteData.users)) {
            for (const u of remoteData.users) addUserToMap(u);
          }

          const mergedUsers = Array.from(new Set(Array.from(userMap.values())));

          db = {
            projects: remoteData.projects.filter(
              (p) => p.name !== "Proyecto Antigravity Persistente" && p.id !== "proj-1788390562373"
            ),
            modules: remoteData.modules || db.modules || [],
            stages: remoteData.stages || db.stages || [],
            tasks: remoteData.tasks || db.tasks || [],
            history: remoteData.history || db.history || [],
            agentConnections: remoteData.agentConnections || db.agentConnections || [],
            users: mergedUsers,
          };
          await saveDbAsync();
          console.log(
            `[Neon] ${db.projects.length} proyectos y ${db.tasks.length} tareas cargados desde Neon.`
          );
        } else {
          await saveToNeon(db);
          console.log("[Neon] Datos iniciales sincronizados en PostgreSQL.");
        }
      } else {
        console.log(`[Storage] ${status.message}`);
      }
    } catch (err: any) {
      console.warn("[Storage] Inicialización en segundo plano:", err.message);
    }
  })();
  return initServerDatabasePromise;
}

export { db, saveDb, ensureDb };
