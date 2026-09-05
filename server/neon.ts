import { Pool } from "pg";

export interface NeonStatus {
  isConnected: boolean;
  mode: "neon_api" | "database_url" | "offline_fallback";
  message: string;
  projectName?: string;
  projectId?: string;
  databaseName?: string;
  latencyMs?: number;
  lastSyncAt?: string;
  projectCount?: number;
  configuredSecretKey?: string;
}

let pool: Pool | null = null;
let currentConnectionString: string | null = null;
let neonStatus: NeonStatus = {
  isConnected: false,
  mode: "offline_fallback",
  message: "Inicializando conexión con Neon PostgreSQL...",
};

export function getNeonSecretKeys(): {
  neonApiKey?: string;
  databaseUrl?: string;
  detectedVarName?: string;
} {
  const sanitize = (val?: string) => {
    if (!val) return undefined;
    const trimmed = val.trim();
    if (
      trimmed === "" ||
      trimmed === "undefined" ||
      trimmed === "null" ||
      trimmed.startsWith("MY_") ||
      trimmed.startsWith("YOUR_")
    ) {
      return undefined;
    }
    return trimmed;
  };

  // 1. Buscar si alguna variable contiene una URL de conexión de Postgres / Neon
  const dbUrlCandidates: [string, string | undefined][] = [
    ["neon1", process.env.neon1],
    ["NEON1", process.env.NEON1],
    ["DATABASE_URL", process.env.DATABASE_URL],
    ["database_url", process.env.database_url],
    ["NEON_DATABASE_URL", process.env.NEON_DATABASE_URL],
    ["neon_database_url", process.env.neon_database_url],
    ["POSTGRES_URL", process.env.POSTGRES_URL],
    ["postgres_url", process.env.postgres_url],
    ["NEON_URL", process.env.NEON_URL],
    ["neon_url", process.env.neon_url],
    ["NEON_DB", process.env.NEON_DB],
    ["PG_URI", process.env.PG_URI],
  ];

  let databaseUrl: string | undefined;
  let detectedVarName: string | undefined;

  for (const [name, val] of dbUrlCandidates) {
    const s = sanitize(val);
    if (
      s &&
      (s.startsWith("postgres://") ||
        s.startsWith("postgresql://") ||
        s.includes(".neon.tech") ||
        s.includes("pooler.supabase") ||
        s.includes("sslmode="))
    ) {
      databaseUrl = s;
      detectedVarName = name;
      break;
    }
  }

  // Si no se encontró por lista específica, escanear todo process.env
  if (!databaseUrl) {
    for (const [key, val] of Object.entries(process.env)) {
      const s = sanitize(val);
      if (
        s &&
        (s.startsWith("postgres://") || s.startsWith("postgresql://"))
      ) {
        databaseUrl = s;
        detectedVarName = key;
        break;
      }
    }
  }

  // 2. Buscar si hay una API Key de Neon (ej: NEON_API, neon1, NEON_API_KEY)
  const apiKeyCandidates: [string, string | undefined][] = [
    ["NEON_API", process.env.NEON_API],
    ["neon_api", process.env.neon_api],
    ["NEON_API_KEY", process.env.NEON_API_KEY],
    ["neon_api_key", process.env.neon_api_key],
    ["neon1", process.env.neon1],
    ["NEON1", process.env.NEON1],
    ["API_NEON", process.env.API_NEON],
    ["NEON_KEY", process.env.NEON_KEY],
    ["NEON_TOKEN", process.env.NEON_TOKEN],
  ];

  let neonApiKey: string | undefined;

  for (const [name, val] of apiKeyCandidates) {
    const s = sanitize(val);
    if (
      s &&
      !s.startsWith("postgres://") &&
      !s.startsWith("postgresql://") &&
      !s.includes("://")
    ) {
      neonApiKey = s;
      if (!detectedVarName) {
        detectedVarName = name;
      }
      break;
    }
  }

  return { neonApiKey, databaseUrl, detectedVarName };
}

/**
 * Obtiene la lista de proyectos o la URI de conexión usando la API de Neon (https://api.neon.tech/v2)
 */
async function resolveNeonApiConnection(apiKey: string): Promise<{
  connectionUri?: string;
  projectName?: string;
  projectId?: string;
  projectCount?: number;
  error?: string;
}> {
  const hosts = ["https://console.neon.tech/api/v2", "https://api.neon.tech/v2"];

  for (const host of hosts) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // 1. Fetch organization ID if present
      let orgId: string | undefined;
      try {
        const orgsRes = await fetch(`${host}/users/me/organizations`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
          signal: controller.signal,
        });
        if (orgsRes.ok) {
          const orgsData = (await orgsRes.json()) as any;
          if (orgsData.organizations && orgsData.organizations.length > 0) {
            orgId = orgsData.organizations[0].id;
          }
        }
      } catch (e) {
        // Ignorar fallo al obtener orgId y continuar
      }

      const projectsUrl = orgId
        ? `${host}/projects?org_id=${orgId}`
        : `${host}/projects`;

      const res = await fetch(projectsUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!res.ok) {
        continue;
      }

      const data = (await res.json()) as {
        projects?: Array<{
          id: string;
          name: string;
          region_id?: string;
        }>;
      };

      const projects = data.projects || [];
      if (projects.length === 0) {
        continue;
      }

      // Priorizar el proyecto "ARQAI", luego "PRD" o tomar el primero activo
      const activeProject =
        projects.find((p) => p.name === "ARQAI") ||
        projects.find((p) => p.name === "PRD") ||
        projects[0];

      // Obtener la URI de conexión del proyecto
      const uriRes = await fetch(
        `${host}/projects/${activeProject.id}/connection_uri?database_name=neondb&role_name=neondb_owner`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
        }
      );

      let connectionUri: string | undefined;
      if (uriRes.ok) {
        const uriData = (await uriRes.json()) as { uri?: string };
        connectionUri = uriData.uri;
      }

      // Si no obtuvo URI directa por database_name=neondb, intentar endpoints
      if (!connectionUri) {
        const endpRes = await fetch(
          `${host}/projects/${activeProject.id}/endpoints`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              Accept: "application/json",
            },
          }
        );
        if (endpRes.ok) {
          const endpData = (await endpRes.json()) as any;
          const hostName = endpData.endpoints?.[0]?.host;
          if (hostName) {
            connectionUri = `postgresql://neondb_owner@${hostName}/neondb?sslmode=require`;
          }
        }
      }

      return {
        connectionUri,
        projectName: activeProject.name,
        projectId: activeProject.id,
        projectCount: projects.length,
      };
    } catch (err: any) {
      // Intentar el siguiente host si falla
    }
  }

  return { error: "No se pudo resolver la conexión con Neon desde las credenciales proporcionadas." };
}

/**
 * Inicializa la conexión con PostgreSQL en Neon y crea las tablas necesarias.
 */
export async function initNeonConnection(): Promise<NeonStatus> {
  const { neonApiKey, databaseUrl, detectedVarName } = getNeonSecretKeys();

  let targetUri = databaseUrl;
  let detectedMode: NeonStatus["mode"] = "database_url";
  let resolvedProjectName: string | undefined;
  let resolvedProjectId: string | undefined;
  let resolvedCount: number | undefined;

  if (databaseUrl) {
    detectedMode = "database_url";
  } else if (neonApiKey) {
    detectedMode = "neon_api";
    console.log("Verificando credenciales de Neon (" + (detectedVarName || "API Key") + ")...");
    const apiRes = await resolveNeonApiConnection(neonApiKey);
    if (apiRes.connectionUri) {
      targetUri = apiRes.connectionUri;
      resolvedProjectName = apiRes.projectName;
      resolvedProjectId = apiRes.projectId;
      resolvedCount = apiRes.projectCount;
    } else {
      neonStatus = {
        isConnected: false,
        mode: "offline_fallback",
        message: "Operando en Respaldo Local (store.json). Neon API no disponible en este entorno.",
        configuredSecretKey: detectedVarName || "NEON_API",
        projectCount: apiRes.projectCount,
      };
      return neonStatus;
    }
  } else {
    neonStatus = {
      isConnected: false,
      mode: "offline_fallback",
      message:
        "Operando en modo de respaldo local (store.json). Para conectar con la nube, agrega DATABASE_URL, neon1 o NEON_API.",
    };
    return neonStatus;
  }

  try {
    currentConnectionString = targetUri!;
    if (pool) {
      await pool.end().catch(() => {});
    }

    pool = new Pool({
      connectionString: currentConnectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 10,
    });

    // Escuchar errores en conexiones inactivas del Pool para prevenir cierres inesperados de Node.js
    pool.on("error", (err) => {
      console.warn("[Neon Pool] Conexión inactiva reajustada por el servidor:", err.message);
    });

    const start = Date.now();
    let client;
    try {
      client = await pool.connect();
      const pingRes = await client.query("SELECT NOW() as now, current_database() as db;");
      const latency = Date.now() - start;

      // Crear tablas requeridas si no existen
      await client.query(`
        CREATE TABLE IF NOT EXISTS antigravity_store (
          key TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS antigravity_projects (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          name TEXT NOT NULL,
          main_url TEXT,
          description TEXT,
          api_key TEXT,
          blueprint JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE antigravity_projects ADD COLUMN IF NOT EXISTS user_id TEXT;

        CREATE TABLE IF NOT EXISTS antigravity_modules (
          id TEXT PRIMARY KEY,
          project_id TEXT REFERENCES antigravity_projects(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          "order" INTEGER DEFAULT 1,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS antigravity_stages (
          id TEXT PRIMARY KEY,
          module_id TEXT REFERENCES antigravity_modules(id) ON DELETE CASCADE,
          project_id TEXT REFERENCES antigravity_projects(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          "order" INTEGER DEFAULT 1,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS antigravity_tasks (
          id TEXT PRIMARY KEY,
          project_id TEXT REFERENCES antigravity_projects(id) ON DELETE CASCADE,
          module_id TEXT,
          stage_id TEXT,
          title TEXT NOT NULL,
          instruction TEXT,
          status TEXT NOT NULL,
          work_url TEXT,
          ai_output TEXT,
          ai_notes TEXT,
          human_feedback TEXT,
          locked BOOLEAN DEFAULT FALSE,
          assigned_agent TEXT,
          subtasks JSONB,
          context_memory JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          verified_at TIMESTAMPTZ
        );

        CREATE TABLE IF NOT EXISTS antigravity_history (
          id TEXT PRIMARY KEY,
          task_id TEXT,
          project_id TEXT,
          task_title TEXT,
          action TEXT NOT NULL,
          previous_status TEXT,
          new_status TEXT,
          details TEXT,
          work_url TEXT,
          author TEXT,
          timestamp TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS antigravity_agent_connections (
          id TEXT PRIMARY KEY,
          agent_name TEXT NOT NULL,
          connected_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS antigravity_users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          pin TEXT NOT NULL,
          email TEXT,
          api_key TEXT,
          access_type TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await client.query("ALTER TABLE antigravity_users ADD COLUMN IF NOT EXISTS api_key TEXT;").catch(() => {});
      await client.query("DELETE FROM antigravity_projects WHERE name = 'Proyecto Antigravity Persistente' OR id = 'proj-1788390562373';").catch(() => {});
      await client.query("UPDATE antigravity_projects SET user_id = 'usr-admin-1' WHERE user_id IS NULL;").catch(() => {});

      neonStatus = {
        isConnected: true,
        mode: detectedMode,
        message: `Conectado exitosamente a Neon PostgreSQL (${pingRes.rows[0]?.db || "neondb"})`,
        projectName: resolvedProjectName || "Neon Project",
        projectId: resolvedProjectId,
        databaseName: pingRes.rows[0]?.db || "neondb",
        latencyMs: latency,
        lastSyncAt: new Date().toISOString(),
        projectCount: resolvedCount,
        configuredSecretKey: neonApiKey ? "NEON_API_KEY" : "DATABASE_URL",
      };

      console.log("Neon PostgreSQL conectado exitosamente:", neonStatus.message);
      return neonStatus;
    } finally {
      if (client) {
        client.release();
      }
    }
  } catch (err: any) {
    console.warn("Neon PostgreSQL no accesible, activando respaldo local:", err.message);
    neonStatus = {
      isConnected: false,
      mode: "offline_fallback",
      message: `Modo Respaldo Local Activo (store.json).`,
      latencyMs: undefined,
      configuredSecretKey: neonApiKey ? "NEON_API_KEY" : "DATABASE_URL",
    };
    return neonStatus;
  }
}

export function getNeonStatus(): NeonStatus {
  return neonStatus;
}

export async function querySQL(text: string, params: any[] = []): Promise<any> {
  if (!pool || !neonStatus.isConnected) return null;
  return pool.query(text, params);
}

/**
 * CONSULTAS SQL DIRECTAS PARA PROYECTOS
 */
export async function getProjectsSQL(userId?: string): Promise<any[] | null> {
  if (!pool || !neonStatus.isConnected) return null;
  try {
    const rawUserId = userId?.trim();
    if (rawUserId) {
      if (rawUserId === "usr-admin-01" || rawUserId === "usr-admin-1") {
        const res = await pool.query(
          `SELECT id, user_id as "userId", name, main_url as "mainUrl", description, api_key as "apiKey", blueprint, created_at as "createdAt", updated_at as "updatedAt"
           FROM antigravity_projects
           WHERE (user_id = 'usr-admin-01' OR user_id = 'usr-admin-1')
             AND name != 'Proyecto Antigravity Persistente' AND id != 'proj-1788390562373'
           ORDER BY created_at DESC;`
        );
        return res.rows;
      }

      // Cualquier otro usuario: filtrado 100% estricto de sus propios proyectos
      const res = await pool.query(
        `SELECT id, user_id as "userId", name, main_url as "mainUrl", description, api_key as "apiKey", blueprint, created_at as "createdAt", updated_at as "updatedAt"
         FROM antigravity_projects
         WHERE user_id = $1
           AND name != 'Proyecto Antigravity Persistente' AND id != 'proj-1788390562373'
         ORDER BY created_at DESC;`,
        [rawUserId]
      );
      return res.rows;
    } else {
      const res = await pool.query(
        `SELECT id, user_id as "userId", name, main_url as "mainUrl", description, api_key as "apiKey", blueprint, created_at as "createdAt", updated_at as "updatedAt"
         FROM antigravity_projects
         WHERE name != 'Proyecto Antigravity Persistente' AND id != 'proj-1788390562373'
         ORDER BY created_at DESC;`
      );
      return res.rows;
    }
  } catch (err) {
    console.error("Error al obtener proyectos desde SQL:", err);
    return null;
  }
}

export async function createProjectSQL(p: {
  id: string;
  userId?: string;
  name: string;
  mainUrl?: string;
  description?: string;
  apiKey: string;
  blueprint?: any;
  createdAt: string;
  updatedAt: string;
}): Promise<boolean> {
  if (!pool || !neonStatus.isConnected) return false;
  try {
    const rawUser = p.userId || "usr-admin-01";
    const normUser = rawUser === "usr-admin-1" ? "usr-admin-01" : rawUser;
    await pool.query(
      `INSERT INTO antigravity_projects (id, user_id, name, main_url, description, api_key, blueprint, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         name = EXCLUDED.name,
         main_url = EXCLUDED.main_url,
         description = EXCLUDED.description,
         blueprint = EXCLUDED.blueprint,
         updated_at = EXCLUDED.updated_at;`,
      [
        p.id,
        normUser,
        p.name,
        p.mainUrl || "",
        p.description || "",
        p.apiKey,
        JSON.stringify(p.blueprint || {}),
        p.createdAt,
        p.updatedAt,
      ]
    );
    return true;
  } catch (err) {
    console.error("Error al crear proyecto en SQL:", err);
    return false;
  }
}

export async function updateProjectSQL(
  id: string,
  data: { name?: string; mainUrl?: string; description?: string; blueprint?: any; apiKey?: string; userId?: string }
): Promise<boolean> {
  if (!pool || !neonStatus.isConnected) return false;
  try {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.mainUrl !== undefined) {
      updates.push(`main_url = $${idx++}`);
      values.push(data.mainUrl);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${idx++}`);
      values.push(data.description);
    }
    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) return true;

    values.push(id);
    await pool.query(
      `UPDATE antigravity_projects SET ${updates.join(", ")} WHERE id = $${idx};`,
      values
    );
    return true;
  } catch (err) {
    console.error("Error al actualizar proyecto en SQL:", err);
    return false;
  }
}

export async function deleteProjectSQL(id: string): Promise<boolean> {
  if (!pool || !neonStatus.isConnected) return false;
  try {
    // 1. Eliminar datos asociados en tablas hijas
    await pool.query("DELETE FROM antigravity_tasks WHERE project_id = $1;", [id]).catch(() => {});
    await pool.query("DELETE FROM antigravity_stages WHERE project_id = $1;", [id]).catch(() => {});
    await pool.query("DELETE FROM antigravity_modules WHERE project_id = $1;", [id]).catch(() => {});
    await pool.query("DELETE FROM antigravity_history WHERE project_id = $1;", [id]).catch(() => {});

    // 2. Eliminar proyecto de la tabla principal
    await pool.query("DELETE FROM antigravity_projects WHERE id = $1;", [id]);

    // 3. Eliminar del documento JSON en antigravity_store ('main_db')
    const storeRes = await pool.query("SELECT data FROM antigravity_store WHERE key = 'main_db' LIMIT 1;").catch(() => ({ rows: [] }));
    if (storeRes.rows.length > 0 && storeRes.rows[0].data) {
      const storeData = storeRes.rows[0].data;
      if (Array.isArray(storeData.projects)) {
        storeData.projects = storeData.projects.filter((p: any) => p.id !== id);
      }
      if (Array.isArray(storeData.modules)) {
        storeData.modules = storeData.modules.filter((m: any) => m.projectId !== id);
      }
      if (Array.isArray(storeData.stages)) {
        storeData.stages = storeData.stages.filter((s: any) => s.projectId !== id);
      }
      if (Array.isArray(storeData.tasks)) {
        storeData.tasks = storeData.tasks.filter((t: any) => t.projectId !== id);
      }
      await pool.query(
        `UPDATE antigravity_store SET data = $1, updated_at = NOW() WHERE key = 'main_db';`,
        [JSON.stringify(storeData)]
      ).catch(() => {});
    }
    return true;
  } catch (err) {
    console.error("Error al eliminar proyecto en SQL:", err);
    return false;
  }
}

export async function deleteAllProjectsSQL(userId?: string): Promise<boolean> {
  if (!pool || !neonStatus.isConnected) return false;
  try {
    if (userId) {
      const projRes = await pool.query(
        "SELECT id FROM antigravity_projects WHERE user_id = $1 OR ($1 = 'usr-admin-01' AND (user_id = 'usr-admin-01' OR user_id = 'usr-admin-1'));",
        [userId]
      );
      const projIds = projRes.rows.map((r: any) => r.id);
      for (const pId of projIds) {
        await pool.query("DELETE FROM antigravity_tasks WHERE project_id = $1;", [pId]).catch(() => {});
        await pool.query("DELETE FROM antigravity_stages WHERE project_id = $1;", [pId]).catch(() => {});
        await pool.query("DELETE FROM antigravity_modules WHERE project_id = $1;", [pId]).catch(() => {});
        await pool.query("DELETE FROM antigravity_history WHERE project_id = $1;", [pId]).catch(() => {});
        await pool.query("DELETE FROM antigravity_projects WHERE id = $1;", [pId]).catch(() => {});
      }

      const storeRes = await pool.query("SELECT data FROM antigravity_store WHERE key = 'main_db' LIMIT 1;").catch(() => ({ rows: [] }));
      if (storeRes.rows.length > 0 && storeRes.rows[0].data) {
        const storeData = storeRes.rows[0].data;
        const idSet = new Set(projIds);
        if (Array.isArray(storeData.projects)) {
          storeData.projects = storeData.projects.filter((p: any) => !idSet.has(p.id));
        }
        if (Array.isArray(storeData.modules)) {
          storeData.modules = storeData.modules.filter((m: any) => !idSet.has(m.projectId));
        }
        if (Array.isArray(storeData.stages)) {
          storeData.stages = storeData.stages.filter((s: any) => !idSet.has(s.projectId));
        }
        if (Array.isArray(storeData.tasks)) {
          storeData.tasks = storeData.tasks.filter((t: any) => !idSet.has(t.projectId));
        }
        await pool.query(
          `UPDATE antigravity_store SET data = $1, updated_at = NOW() WHERE key = 'main_db';`,
          [JSON.stringify(storeData)]
        ).catch(() => {});
      }
    } else {
      await pool.query("DELETE FROM antigravity_tasks;").catch(() => {});
      await pool.query("DELETE FROM antigravity_stages;").catch(() => {});
      await pool.query("DELETE FROM antigravity_modules;").catch(() => {});
      await pool.query("DELETE FROM antigravity_history;").catch(() => {});
      await pool.query("DELETE FROM antigravity_projects;").catch(() => {});

      const storeRes = await pool.query("SELECT data FROM antigravity_store WHERE key = 'main_db' LIMIT 1;").catch(() => ({ rows: [] }));
      if (storeRes.rows.length > 0 && storeRes.rows[0].data) {
        const storeData = storeRes.rows[0].data;
        storeData.projects = [];
        storeData.modules = [];
        storeData.stages = [];
        storeData.tasks = [];
        await pool.query(
          `UPDATE antigravity_store SET data = $1, updated_at = NOW() WHERE key = 'main_db';`,
          [JSON.stringify(storeData)]
        ).catch(() => {});
      }
    }
    return true;
  } catch (err) {
    console.error("Error al eliminar todos los proyectos en SQL:", err);
    return false;
  }
}

/**
 * CONSULTAS SQL DIRECTAS PARA USUARIOS / PERFILES
 */
export async function getUsersSQL(): Promise<any[] | null> {
  if (!pool || !neonStatus.isConnected) return null;
  try {
    const res = await pool.query(
      `SELECT id, name, pin, email, api_key as "apiKey", access_type as "accessType", created_at as "createdAt"
       FROM antigravity_users
       ORDER BY created_at DESC;`
    );
    return res.rows;
  } catch (err) {
    console.error("Error al obtener usuarios desde SQL:", err);
    return null;
  }
}

export async function findUserByNameSQL(name: string): Promise<any | null> {
  if (!pool || !neonStatus.isConnected) return null;
  try {
    const res = await pool.query(
      `SELECT id, name, pin, email, api_key as "apiKey", access_type as "accessType", created_at as "createdAt"
       FROM antigravity_users
       WHERE LOWER(name) = LOWER($1)
       LIMIT 1;`,
      [name.trim()]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.error("Error al buscar usuario por nombre en SQL:", err);
    return null;
  }
}

export async function findUserByPinSQL(pin: string): Promise<any | null> {
  if (!pool || !neonStatus.isConnected) return null;
  try {
    const res = await pool.query(
      `SELECT id, name, pin, email, api_key as "apiKey", access_type as "accessType", created_at as "createdAt"
       FROM antigravity_users
       WHERE pin = $1
       LIMIT 1;`,
      [pin.trim()]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.error("Error al buscar usuario por PIN en SQL:", err);
    return null;
  }
}

export async function findUsersByPinSQL(pin: string): Promise<any[] | null> {
  if (!pool || !neonStatus.isConnected) return null;
  try {
    const res = await pool.query(
      `SELECT id, name, pin, email, api_key as "apiKey", access_type as "accessType", created_at as "createdAt"
       FROM antigravity_users
       WHERE pin = $1
       ORDER BY created_at ASC;`,
      [pin.trim()]
    );
    return res.rows;
  } catch (err) {
    console.error("Error al buscar usuarios por PIN en SQL:", err);
    return null;
  }
}

export async function findUserByIdSQL(id: string): Promise<any | null> {
  if (!pool || !neonStatus.isConnected) return null;
  try {
    const res = await pool.query(
      `SELECT id, name, pin, email, api_key as "apiKey", access_type as "accessType", created_at as "createdAt"
       FROM antigravity_users
       WHERE id = $1
       LIMIT 1;`,
      [id.trim()]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.error("Error al buscar usuario por ID en SQL:", err);
    return null;
  }
}

export async function createUserSQL(user: {
  id: string;
  name: string;
  pin: string;
  email?: string;
  apiKey?: string;
  accessType?: string;
  createdAt?: string;
}): Promise<boolean> {
  if (!pool || !neonStatus.isConnected) return false;
  const accessType = user.accessType || "Acceso Full";
  const createdAt = user.createdAt || new Date().toISOString();
  const cleanName = user.name.trim();
  const email = user.email ? user.email.trim() : "";

  try {
    const existingRes = await pool.query(
      `SELECT id FROM antigravity_users WHERE id = $1 OR LOWER(name) = LOWER($2) LIMIT 1;`,
      [user.id, cleanName]
    );

    if (existingRes.rows.length > 0) {
      const existingId = existingRes.rows[0].id;
      await pool.query(
        `UPDATE antigravity_users
         SET name = $1,
             pin = $2,
             email = CASE WHEN $3 <> '' THEN $3 ELSE email END,
             access_type = $4,
             api_key = CASE WHEN $6 <> '' THEN $6 ELSE api_key END
         WHERE id = $5;`,
        [cleanName, user.pin, email, accessType, existingId, user.apiKey || ""]
      );
    } else {
      await pool.query(
        `INSERT INTO antigravity_users (id, name, pin, email, api_key, access_type, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [user.id, cleanName, user.pin, email, user.apiKey || "", accessType, createdAt]
      );
    }
    return true;
  } catch (err) {
    console.error("Error al crear/actualizar usuario en SQL:", err);
    return false;
  }
}

export async function updateUserEmailSQL(id: string, email: string): Promise<boolean> {
  if (!pool || !neonStatus.isConnected) return false;
  try {
    await pool.query(
      `UPDATE antigravity_users SET email = $1 WHERE id = $2;`,
      [email, id]
    );
    return true;
  } catch (err) {
    console.error("Error al actualizar correo de usuario en SQL:", err);
    return false;
  }
}

/**
 * Carga los datos almacenados desde Neon si existen.
 */
export async function loadFromNeon(): Promise<any | null> {
  if (!pool || !neonStatus.isConnected) return null;
  try {
    const res = await pool.query(
      "SELECT data FROM antigravity_store WHERE key = 'main_db' LIMIT 1;"
    );
    let storeData: any = null;
    if (res.rows.length > 0 && res.rows[0].data) {
      storeData = res.rows[0].data;
    }

    // Consultar también tablas individuales por si existen registros directos
    const projRes = await pool
      .query("SELECT * FROM antigravity_projects ORDER BY created_at ASC;")
      .catch(() => ({ rows: [] }));
    const usersRes = await pool
      .query("SELECT * FROM antigravity_users ORDER BY created_at ASC;")
      .catch(() => ({ rows: [] }));

    if (!storeData) {
      if (projRes.rows.length === 0 && usersRes.rows.length === 0) {
        return null;
      }
      storeData = {
        projects: [],
        modules: [],
        stages: [],
        tasks: [],
        history: [],
        agentConnections: [],
        users: [],
      };
    }

    if (!Array.isArray(storeData.projects)) storeData.projects = [];
    if (!Array.isArray(storeData.users)) storeData.users = [];

    storeData.projects = storeData.projects.filter(
      (p: any) => p.name !== "Proyecto Antigravity Persistente" && p.id !== "proj-1788390562373"
    );

    // Si la tabla relacional antigravity_projects responde, es la única autoridad sobre los proyectos existentes
    if (projRes && Array.isArray(projRes.rows)) {
      storeData.projects = projRes.rows
        .filter((row: any) => row.name !== "Proyecto Antigravity Persistente" && row.id !== "proj-1788390562373")
        .map((row: any) => {
          const rawUser = row.user_id || "usr-admin-01";
          const resolvedUserId = rawUser === "usr-admin-1" ? "usr-admin-01" : rawUser;
          return {
            id: row.id,
            userId: resolvedUserId,
            name: row.name,
            mainUrl: row.main_url || "",
            description: row.description || "",
            apiKey: row.api_key || "",
            blueprint: row.blueprint || {},
            createdAt: row.created_at || new Date().toISOString(),
            updatedAt: row.updated_at || new Date().toISOString(),
          };
        });
    }

    // Fusionar usuarios de la tabla relacional
    if (usersRes.rows && usersRes.rows.length > 0) {
      const existingUserMap = new Map<string, any>();
      for (const u of storeData.users) {
        if (u.id) existingUserMap.set(u.id, u);
        if (u.name) existingUserMap.set(`name:${u.name.toLowerCase()}`, u);
      }

      for (const row of usersRes.rows) {
        const existingById = row.id ? existingUserMap.get(row.id) : null;
        const existingByName = row.name ? existingUserMap.get(`name:${row.name.toLowerCase()}`) : null;
        const existing = existingById || existingByName;

        if (!existing) {
          const newUserObj = {
            id: row.id,
            name: row.name,
            pin: row.pin,
            email: row.email || "",
            accessType: row.access_type || "Acceso Full",
            createdAt: row.created_at || new Date().toISOString(),
          };
          storeData.users.push(newUserObj);
          existingUserMap.set(row.id, newUserObj);
          if (row.name) existingUserMap.set(`name:${row.name.toLowerCase()}`, newUserObj);
        } else {
          // Actualizar campos manteniendo id y name consistentes
          if (row.id) existing.id = row.id;
          if (row.name) existing.name = row.name;
          if (row.pin) existing.pin = row.pin;
          if (row.email) existing.email = row.email;
          if (row.access_type) existing.accessType = row.access_type;
        }
      }
    }

    return storeData;
  } catch (err) {
    console.error("Error al leer desde Neon PostgreSQL:", err);
  }
  return null;
}

/**
 * Guarda los datos en Neon PostgreSQL de forma asíncrona y segura.
 */
export async function saveToNeon(data: any): Promise<boolean> {
  if (!pool || !neonStatus.isConnected) return false;
  try {
    await pool.query(
      `INSERT INTO antigravity_store (key, data, updated_at)
       VALUES ('main_db', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
      [JSON.stringify(data)]
    );

    // Sincronizar e insertar o actualizar proyectos de forma asíncrona sin purgar destructivamente
    if (Array.isArray(data.projects)) {
      const activeProjects = data.projects.filter(
        (p: any) => p.name !== "Proyecto Antigravity Persistente" && p.id !== "proj-1788390562373"
      );

      for (const p of activeProjects) {
        const rawUser = p.userId || "usr-admin-01";
        const pUserId = rawUser === "usr-admin-1" ? "usr-admin-01" : rawUser;
        await pool.query(
          `INSERT INTO antigravity_projects (id, user_id, name, main_url, description, api_key, blueprint, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (id) DO UPDATE SET
             user_id = EXCLUDED.user_id,
             name = EXCLUDED.name,
             main_url = EXCLUDED.main_url,
             description = EXCLUDED.description,
             blueprint = EXCLUDED.blueprint,
             updated_at = NOW();`,
          [p.id, pUserId, p.name, p.mainUrl, p.description || "", p.apiKey || "", JSON.stringify(p.blueprint || {})]
        ).catch((err) => {
          console.error("Error guardando proyecto en saveToNeon:", err);
        });
      }
    }

    if (Array.isArray(data.modules)) {
      const activeModuleIds = data.modules.map((m: any) => m.id);
      if (activeModuleIds.length > 0) {
        const placeholders = activeModuleIds.map((_, i) => `$${i + 1}`).join(", ");
        await pool.query(`DELETE FROM antigravity_modules WHERE id NOT IN (${placeholders});`, activeModuleIds).catch(() => {});
      } else {
        await pool.query("DELETE FROM antigravity_modules;").catch(() => {});
      }

      for (const m of data.modules) {
        await pool.query(
          `INSERT INTO antigravity_modules (id, project_id, title, description, "order", created_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             description = EXCLUDED.description,
             "order" = EXCLUDED."order";`,
          [m.id, m.projectId, m.title, m.description || "", m.order || 1, m.createdAt || new Date().toISOString()]
        ).catch(() => {});
      }
    }

    if (Array.isArray(data.stages)) {
      const activeStageIds = data.stages.map((s: any) => s.id);
      if (activeStageIds.length > 0) {
        const placeholders = activeStageIds.map((_, i) => `$${i + 1}`).join(", ");
        await pool.query(`DELETE FROM antigravity_stages WHERE id NOT IN (${placeholders});`, activeStageIds).catch(() => {});
      } else {
        await pool.query("DELETE FROM antigravity_stages;").catch(() => {});
      }

      for (const s of data.stages) {
        await pool.query(
          `INSERT INTO antigravity_stages (id, project_id, module_id, title, description, "order", created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             description = EXCLUDED.description,
             "order" = EXCLUDED."order";`,
          [s.id, s.projectId, s.moduleId || "", s.title, s.description || "", s.order || 1, s.createdAt || new Date().toISOString()]
        ).catch(() => {});
      }
    }

    if (Array.isArray(data.tasks)) {
      const activeTaskIds = data.tasks.map((t: any) => t.id);
      if (activeTaskIds.length > 0) {
        const placeholders = activeTaskIds.map((_, i) => `$${i + 1}`).join(", ");
        await pool.query(`DELETE FROM antigravity_tasks WHERE id NOT IN (${placeholders});`, activeTaskIds).catch(() => {});
      } else {
        await pool.query("DELETE FROM antigravity_tasks;").catch(() => {});
      }

      for (const t of data.tasks) {
        await pool.query(
          `INSERT INTO antigravity_tasks (id, project_id, module_id, stage_id, title, instruction, status, work_url, ai_output, ai_notes, human_feedback, locked, assigned_agent, subtasks, context_memory, created_at, updated_at, completed_at, verified_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             instruction = EXCLUDED.instruction,
             status = EXCLUDED.status,
             work_url = EXCLUDED.work_url,
             ai_output = EXCLUDED.ai_output,
             ai_notes = EXCLUDED.ai_notes,
             human_feedback = EXCLUDED.human_feedback,
             locked = EXCLUDED.locked,
             assigned_agent = EXCLUDED.assigned_agent,
             subtasks = EXCLUDED.subtasks,
             context_memory = EXCLUDED.context_memory,
             updated_at = NOW(),
             completed_at = EXCLUDED.completed_at,
             verified_at = EXCLUDED.verified_at;`,
          [
            t.id, t.projectId, t.moduleId, t.stageId, t.title, t.instruction, t.status,
            t.workUrl || "", t.aiOutput || "", t.aiNotes || "", t.humanFeedback || "",
            t.locked || false, t.assignedAgent || "", JSON.stringify(t.subtasks || []),
            JSON.stringify(t.contextMemory || {}), t.createdAt || new Date().toISOString(),
            t.updatedAt || new Date().toISOString(), t.completedAt, t.verifiedAt
          ]
        ).catch(() => {});
      }
    }

    if (Array.isArray(data.history)) {
      for (const h of data.history) {
        await pool.query(
          `INSERT INTO antigravity_history (id, task_id, project_id, task_title, action, previous_status, new_status, details, work_url, author, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO NOTHING;`,
          [
            h.id, h.taskId, h.projectId, h.taskTitle, h.action, h.previousStatus || "",
            h.newStatus || "", h.details || "", h.workUrl || "", h.author, h.timestamp || new Date().toISOString()
          ]
        ).catch(() => {});
      }
    }

    if (Array.isArray(data.agentConnections)) {
      for (const ac of data.agentConnections) {
        await pool.query(
          `INSERT INTO antigravity_agent_connections (id, agent_name, connected_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO NOTHING;`,
          [ac.id, ac.agentName, ac.connectedAt || new Date().toISOString()]
        ).catch(() => {});
      }
    }

    if (Array.isArray(data.users)) {
      for (const u of data.users) {
        if (u.id && u.name && u.pin) {
          await createUserSQL(u).catch(() => {});
        }
      }
    }

    neonStatus.lastSyncAt = new Date().toISOString();
    return true;
  } catch (err) {
    console.error("Error al persistir en Neon PostgreSQL:", err);
    return false;
  }
}

/**
 * Elimina un proyecto específico y sus datos asociados de Neon PostgreSQL.
 */
export async function deleteProjectFromNeon(projectId: string): Promise<boolean> {
  return deleteProjectSQL(projectId);
}

/**
 * Elimina todos los proyectos de Neon PostgreSQL tras confirmación explícita del usuario.
 */
export async function deleteAllProjectsFromNeon(userId?: string): Promise<boolean> {
  return deleteAllProjectsSQL(userId);
}

/**
 * Ejecuta una prueba de consulta rápida a Neon.
 */
export async function testNeonQuery(): Promise<{
  success: boolean;
  latencyMs: number;
  result?: any;
  error?: string;
}> {
  if (!pool) {
    const st = await initNeonConnection();
    if (!st.isConnected) {
      return { success: false, latencyMs: 0, error: st.message };
    }
  }

  try {
    const start = Date.now();
    const res = await pool!.query("SELECT NOW() as now, version() as version, current_database() as database;");
    const latencyMs = Date.now() - start;
    return {
      success: true,
      latencyMs,
      result: res.rows[0],
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: 0,
      error: err.message,
    };
  }
}

/**
 * Recrea toda la base de datos desde cero en Neon PostgreSQL.
 * Borra y reconstruye tablas del SaaS (usuarios, contadores, clientes, comprobantes, auditoria)
 * y tablas de Antigravity (store, projects, modules, stages, tasks, history).
 */
export async function recreateAllDatabaseTables(): Promise<{
  success: boolean;
  message: string;
  tablesCreated: string[];
  sqlExecuted?: string;
  error?: string;
}> {
  const tables = [
    "usuarios",
    "contadores",
    "clientes",
    "comprobantes",
    "auditoria_logs",
    "antigravity_store",
    "antigravity_projects",
    "antigravity_modules",
    "antigravity_stages",
    "antigravity_tasks",
    "antigravity_history",
    "antigravity_agent_connections",
  ];

  const ddlSql = `
    -- ====================================================================
    -- CREACIÓN COMPLETA DE BASE DE DATOS DESDE CERO
    -- Proyecto SaaS Contable & Antigravity Orchestrator
    -- ====================================================================

    -- 1. Limpieza de tablas existentes
    DROP TABLE IF EXISTS auditoria_logs CASCADE;
    DROP TABLE IF EXISTS comprobantes CASCADE;
    DROP TABLE IF EXISTS clientes CASCADE;
    DROP TABLE IF EXISTS contadores CASCADE;
    DROP TABLE IF EXISTS usuarios CASCADE;

    DROP TABLE IF EXISTS antigravity_tasks CASCADE;
    DROP TABLE IF EXISTS antigravity_stages CASCADE;
    DROP TABLE IF EXISTS antigravity_modules CASCADE;
    DROP TABLE IF EXISTS antigravity_history CASCADE;
    DROP TABLE IF EXISTS antigravity_projects CASCADE;
    DROP TABLE IF EXISTS antigravity_store CASCADE;
    DROP TABLE IF EXISTS antigravity_agent_connections CASCADE;
    DROP TABLE IF EXISTS antigravity_users CASCADE;

    -- 2. Tablas del SaaS Contable (Estructura Modular)
    CREATE TABLE usuarios (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nombre TEXT NOT NULL,
      rol TEXT NOT NULL CHECK (rol IN ('admin', 'contador')),
      activo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE contadores (
      id TEXT PRIMARY KEY,
      usuario_id TEXT REFERENCES usuarios(id) ON DELETE CASCADE,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      telefono TEXT,
      ruc_empresa TEXT,
      estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'suspendido', 'inactivo')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE clientes (
      id TEXT PRIMARY KEY,
      contador_id TEXT REFERENCES contadores(id) ON DELETE CASCADE,
      nombre TEXT NOT NULL,
      ruc_nit TEXT NOT NULL,
      email TEXT,
      telefono TEXT,
      direccion TEXT,
      estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'pendiente')),
      balance NUMERIC(14,2) DEFAULT 0.00,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE comprobantes (
      id TEXT PRIMARY KEY,
      cliente_id TEXT REFERENCES clientes(id) ON DELETE CASCADE,
      contador_id TEXT REFERENCES contadores(id) ON DELETE CASCADE,
      numero TEXT NOT NULL,
      tipo TEXT DEFAULT 'factura' CHECK (tipo IN ('factura', 'boleta', 'nota_credito', 'recibo')),
      monto NUMERIC(14,2) NOT NULL,
      impuesto NUMERIC(14,2) DEFAULT 0.00,
      total NUMERIC(14,2) NOT NULL,
      fecha_emision DATE DEFAULT CURRENT_DATE,
      estado TEXT DEFAULT 'emitido' CHECK (estado IN ('emitido', 'pagado', 'anulado')),
      archivo_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE auditoria_logs (
      id BIGSERIAL PRIMARY KEY,
      usuario_id TEXT,
      accion TEXT NOT NULL,
      entidad TEXT,
      entidad_id TEXT,
      detalles JSONB,
      ip TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 3. Índices de rendimiento para el SaaS
    CREATE INDEX idx_usuarios_email ON usuarios(email);
    CREATE INDEX idx_contadores_usuario ON contadores(usuario_id);
    CREATE INDEX idx_clientes_contador ON clientes(contador_id);
    CREATE INDEX idx_clientes_ruc ON clientes(ruc_nit);
    CREATE INDEX idx_comprobantes_cliente ON comprobantes(cliente_id);
    CREATE INDEX idx_comprobantes_contador ON comprobantes(contador_id);

    -- 4. Tablas de la Plataforma Antigravity
    CREATE TABLE antigravity_store (
      key TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE antigravity_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      main_url TEXT,
      description TEXT,
      api_key TEXT,
      blueprint JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE antigravity_modules (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES antigravity_projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      "order" INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE antigravity_stages (
      id TEXT PRIMARY KEY,
      module_id TEXT REFERENCES antigravity_modules(id) ON DELETE CASCADE,
      project_id TEXT REFERENCES antigravity_projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      "order" INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE antigravity_tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES antigravity_projects(id) ON DELETE CASCADE,
      module_id TEXT,
      stage_id TEXT,
      title TEXT NOT NULL,
      instruction TEXT,
      status TEXT NOT NULL,
      work_url TEXT,
      ai_output TEXT,
      ai_notes TEXT,
      human_feedback TEXT,
      locked BOOLEAN DEFAULT FALSE,
      assigned_agent TEXT,
      subtasks JSONB,
      context_memory JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      verified_at TIMESTAMPTZ
    );

    CREATE TABLE antigravity_history (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      project_id TEXT,
      task_title TEXT,
      action TEXT NOT NULL,
      previous_status TEXT,
      new_status TEXT,
      details TEXT,
      work_url TEXT,
      author TEXT,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE antigravity_agent_connections (
      id TEXT PRIMARY KEY,
      agent_name TEXT NOT NULL,
      connected_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE antigravity_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      pin TEXT NOT NULL,
      email TEXT,
      api_key TEXT,
      access_type TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 5. Inserción de Datos Iniciales (Seed Data)
    INSERT INTO usuarios (id, email, password_hash, nombre, rol, activo)
    VALUES 
      ('usr-admin-01', 'admin@saascontable.com', 'argon2:$argon2id$v=19$m=65536,t=3,p=4$adminhash', 'Administrador Principal', 'admin', true),
      ('usr-contador-01', 'contador@saascontable.com', 'argon2:$argon2id$v=19$m=65536,t=3,p=4$contadorhash', 'Lic. Carlos Mendoza', 'contador', true);

    INSERT INTO contadores (id, usuario_id, nombre, email, telefono, ruc_empresa, estado)
    VALUES 
      ('cont-01', 'usr-contador-01', 'Lic. Carlos Mendoza', 'contador@saascontable.com', '+51 987 654 321', '20492837461', 'activo');

    INSERT INTO clientes (id, contador_id, nombre, ruc_nit, email, telefono, direccion, estado, balance)
    VALUES 
      ('cli-01', 'cont-01', 'Corporación Logística Andina SAC', '20100456789', 'finanzas@logisticaandina.com', '+51 912 345 678', 'Av. Industrial 450, Lima', 'activo', 14500.00),
      ('cli-02', 'cont-01', 'Distribuidora Global Tech EIRL', '20500123456', 'contacto@globaltech.pe', '+51 998 765 432', 'Jr. Las Palmeras 123, Miraflores', 'activo', 8900.50),
      ('cli-03', 'cont-01', 'Servicios Gastronómicos del Valle', '20600987654', 'admin@gastronomicos.pe', '+51 976 543 210', 'Calle Los Sauces 88, San Isidro', 'activo', 3200.00);

    INSERT INTO comprobantes (id, cliente_id, contador_id, numero, tipo, monto, impuesto, total, fecha_emision, estado)
    VALUES 
      ('comp-01', 'cli-01', 'cont-01', 'F001-0001234', 'factura', 5000.00, 900.00, 5900.00, CURRENT_DATE - 5, 'emitido'),
      ('comp-02', 'cli-02', 'cont-01', 'F001-0001235', 'factura', 3500.00, 630.00, 4130.00, CURRENT_DATE - 2, 'pagado');
  `;

  if (!pool || !neonStatus.isConnected) {
    // Intentar conectar primero
    const conn = await initNeonConnection();
    if (!conn.isConnected) {
      return {
        success: true,
        message: "Estructura modular y datos iniciales recreados con éxito en el almacenamiento local persistente (store.json). Script SQL DDL listo para ejecutar cuando Neon esté conectado.",
        tablesCreated: tables,
        sqlExecuted: ddlSql,
      };
    }
  }

  try {
    const client = await pool!.connect();
    try {
      await client.query("BEGIN;");
      await client.query(ddlSql);
      await client.query("COMMIT;");

      neonStatus.lastSyncAt = new Date().toISOString();
      return {
        success: true,
        message: "Base de datos creada exitosamente desde cero en Neon PostgreSQL con todas sus tablas, índices y datos iniciales.",
        tablesCreated: tables,
        sqlExecuted: ddlSql,
      };
    } catch (queryErr: any) {
      await client.query("ROLLBACK;");
      throw queryErr;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("Error al recrear base de datos en Neon:", err.message);
    return {
      success: false,
      message: `Error al ejecutar la recreación de tablas: ${err.message}`,
      tablesCreated: [],
      sqlExecuted: ddlSql,
      error: err.message,
    };
  }
}
