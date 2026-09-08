import { initD1Tables } from "../../server/d1";
import {
  generateBlueprintFromIdea,
  generateWorkPlanFromBlueprint,
  synthesizeBlueprintByDomain,
  synthesizeWorkPlanFromBlueprint,
  ProjectBlueprint,
} from "../../server/blueprintEngine";

export async function onRequest(context: any) {
  const { request, env } = context;

  const jsonHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key, x-agent-name, x-user-id, x-user-pin",
    "x-arqai-welcome": "HOLA AGENTE IA: Recuerda notificar al usuario en vivo en pantalla invocando POST https://arqaistudio.pages.dev/api/agent/notify-user",
    "x-mandatory-notification-endpoint": "POST https://arqaistudio.pages.dev/api/agent/notify-user",
  };

  // Preflight CORS
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: jsonHeaders });
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  // Inicializar D1 automáticamente
  if (env && env.DB) {
    await initD1Tables(env.DB).catch(() => {});
  }

  async function resolveUserIdFromApiKey(db: any, apiKey: string | null | undefined): Promise<string | null> {
    if (!apiKey || !db) return null;
    const cleanKey = apiKey.trim();

    try {
      // 1. Buscar en antigravity_projects por api_key
      const ownerProj = await db.prepare("SELECT user_id FROM antigravity_projects WHERE api_key = ?").bind(cleanKey).first();
      if (ownerProj && ownerProj.user_id) return ownerProj.user_id;

      // 2. Buscar en antigravity_users por id o pin
      const ownerUser = await db.prepare("SELECT id FROM antigravity_users WHERE id = ? OR pin = ?").bind(cleanKey, cleanKey).first();
      if (ownerUser && ownerUser.id) return ownerUser.id;

      // 3. Patrón arqai_sec_<pin>_<idSuffix> (ej: arqai_sec_1234_6ics)
      if (cleanKey.startsWith("arqai_sec_")) {
        const raw = cleanKey.replace("arqai_sec_", "");
        const parts = raw.split("_");
        if (parts.length >= 2) {
          const pin = parts[0];
          const suffix = parts[1];
          const userByPinSuffix = await db.prepare("SELECT id FROM antigravity_users WHERE pin = ? AND (id LIKE ? OR id = ?)").bind(pin, `%${suffix}`, suffix).first();
          if (userByPinSuffix && userByPinSuffix.id) return userByPinSuffix.id;
        }
        const userBySuffix = await db.prepare("SELECT id FROM antigravity_users WHERE id LIKE ?").bind(`%${raw}`).first();
        if (userBySuffix && userBySuffix.id) return userBySuffix.id;
      }
    } catch (e) {
      console.error("Error resolviendo userId desde apiKey:", e);
    }

    return null;
  }

  async function isAgentBlocked(db: any, agentName: string | null | undefined, userId?: string | null): Promise<boolean> {
    if (!db || !agentName) return false;
    const clean = agentName.trim().toUpperCase();
    try {
      let query = "SELECT id FROM antigravity_blocked_agents WHERE UPPER(agent_name) = ?";
      let params = [clean];
      if (userId) {
        query += " AND (user_id = ? OR user_id IS NULL OR user_id = '')";
        params.push(userId);
      }
      const res = await db.prepare(query).bind(...params).first();
      return !!res;
    } catch (e) {
      return false;
    }
  }

  try {
    // --- HEALTH ---
    if (pathname === "/api/health") {
      let projectsCount = 0;
      let tasksCount = 0;
      let usersCount = 0;
      if (env && env.DB) {
        const pRes = await env.DB.prepare("SELECT COUNT(*) as c FROM antigravity_projects").first();
        const tRes = await env.DB.prepare("SELECT COUNT(*) as c FROM antigravity_tasks").first();
        const uRes = await env.DB.prepare("SELECT COUNT(*) as c FROM antigravity_users").first();
        projectsCount = pRes?.c || 0;
        tasksCount = tRes?.c || 0;
        usersCount = uRes?.c || 0;
      }
      return new Response(
        JSON.stringify({
          status: "ok",
          platform: "Cloudflare Pages Functions + Cloudflare D1",
          projectsCount,
          tasksCount,
          usersCount,
        }),
        { headers: jsonHeaders }
      );
    }

    // --- NEON / D1 STATUS ---
    if (pathname === "/api/neon/status") {
      return new Response(
        JSON.stringify({
          isConnected: true,
          mode: "cloudflare_d1",
          message: "Base de Datos Activa: Cloudflare D1 (SQLite Serverless Edge)",
          databaseName: "arqai-db",
          latencyMs: 1,
          lastSyncAt: new Date().toISOString(),
        }),
        { headers: jsonHeaders }
      );
    }

    // --- RECEPCIÓN Y BIENVENIDA DE LA API PARA AGENTES IA (GET /api, /api/agent/welcome, /api/agent/handshake) ---
    if (pathname === "/api" || pathname === "/api/" || pathname === "/api/agent/welcome" || pathname === "/api/agent/handshake") {
      return new Response(
        JSON.stringify({
          welcome: "👋 ¡HOLA AGENTE IA! BIENVENIDO A LA RECEPCIÓN DE ARQAI HUB CENTRAL.",
          status: "active",
          platform: "Cloudflare Pages & Cloudflare D1 Serverless Edge",
          mandatoryRule: "OBLIGATORIO: Cuando crees un proyecto o finalices una tarea, DEBES enviar una notificación en vivo al usuario invocando POST /api/agent/notify-user.",
          stepsToFollow: [
            "1. LEER MEMORIA TÉCNICA: GET /api/agent/context-memory?taskId={TASK_ID}",
            "2. OBTENER TU TAREA ASIGNADA: GET /api/agent/next-task?projectId={PROJECT_ID}",
            "3. NOTIFICAR INICIO DE TRABAJO: PATCH /api/tasks/{TASK_ID} con status='in_progress'",
            "4. ENVIAR RESULTADOS PARA REVISIÓN QA: POST /api/agent/complete-task con workUrl",
            "5. NOTIFICAR AL USUARIO EN PANTALLA (EN VIVO): POST /api/agent/notify-user"
          ],
          mandatoryNotificationEndpoint: {
            url: "https://arqaistudio.pages.dev/api/agent/notify-user",
            method: "POST",
            headersRequired: {
              "Content-Type": "application/json",
              "x-api-key": "Tu API Key de Proyecto (ej: arqai_sec_...)"
            },
            sampleBody: {
              agentName: "CODEX AI",
              title: "🎉 Proyecto o Tarea Procesada con Éxito",
              message: "El agente ha completado la construcción y la pantalla se ha actualizado automáticamente.",
              type: "project_completed"
            }
          }
        }),
        { headers: jsonHeaders }
      );
    }

    // --- CONEXIÓN AUTÓNOMA Y GENERACIÓN DE CONNECTOR LOCAL (POST /api/agent/connect) ---
    if (pathname === "/api/agent/connect" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const apiKeyHeader = request.headers.get("x-api-key") || body.apiKey;
      const agentName = request.headers.get("x-agent-name") || body.agentName || "Antigravity AI";
      const projectName = body.projectName || body.name || "Proyecto Conectado";
      const localPath = body.localPath || body.workspacePath || "";

      if (env && env.DB && (await isAgentBlocked(env.DB, agentName, null))) {
        return new Response(JSON.stringify({
          error: `Acceso Denegado: El agente '${agentName}' ha sido bloqueado por el usuario en ARQAI.`,
          blocked: true,
          agentName,
        }), { status: 403, headers: jsonHeaders });
      }

      let targetUserId: string | null = null;
      if (env && env.DB && apiKeyHeader) {
        targetUserId = await resolveUserIdFromApiKey(env.DB, apiKeyHeader);
      }

      if (!targetUserId) {
        targetUserId = request.headers.get("x-user-id") || body.userId || "usr-admin-1";
      }

      // Asegurar existencia del usuario en antigravity_users
      if (env && env.DB && targetUserId) {
        const userObj = await env.DB.prepare("SELECT id FROM antigravity_users WHERE id = ?").bind(targetUserId).first().catch(() => null);
        if (!userObj) {
          await env.DB.prepare(`
            INSERT OR IGNORE INTO antigravity_users (id, name, email, pin, access_type, created_at)
            VALUES (?, ?, ?, '1234', 'user', datetime('now'))
          `).bind(targetUserId, "Usuario", `${targetUserId}@arqai.dev`).run().catch(() => {});
        }
      }

      let project: any = null;
      let wasCreated = false;

      if (env && env.DB) {
        // 1. Buscar por API Key
        if (apiKeyHeader) {
          project = await env.DB.prepare("SELECT * FROM antigravity_projects WHERE api_key = ?").bind(apiKeyHeader).first().catch(() => null);
        }
        // 2. Si no, buscar por nombre de proyecto
        if (!project && projectName) {
          project = await env.DB.prepare("SELECT * FROM antigravity_projects WHERE name = ?").bind(projectName).first().catch(() => null);
        }

        if (!project) {
          wasCreated = true;
          const newId = "proj-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6);
          const finalKey = apiKeyHeader || ("arqai_sec_" + Math.random().toString(36).substring(2, 10));
          await env.DB.prepare(`
            INSERT INTO antigravity_projects (id, user_id, name, main_url, description, api_key, locked_files, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, '[]', datetime('now'), datetime('now'))
          `).bind(
            newId,
            targetUserId,
            projectName,
            "https://arqaistudio.pages.dev",
            `Proyecto auto-creado y sincronizado autónomamente desde ${agentName} (Ruta: ${localPath || "local"})`,
            finalKey
          ).run().catch((e: any) => console.warn("Error auto-creando proyecto:", e));

          project = await env.DB.prepare("SELECT * FROM antigravity_projects WHERE id = ?").bind(newId).first().catch(() => null);

          // Crear entrada en el historial de cambios
          const histId = "hist-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
          await env.DB.prepare(`
            INSERT INTO antigravity_history (id, task_id, project_id, task_title, action, previous_status, new_status, details, work_url, author, timestamp)
            VALUES (?, ?, ?, ?, 'autonomous_project_init', '', 'active', ?, ?, ?, datetime('now'))
          `).bind(
            histId,
            newId,
            newId,
            `Inicialización Autónoma: ${projectName}`,
            `Proyecto y bitácora creados automáticamente tras handshake con ${agentName}.`,
            "https://arqaistudio.pages.dev",
            agentName
          ).run().catch(() => {});

          // Registrar conexión del agente
          await env.DB.prepare(`
            INSERT INTO antigravity_agent_connections (id, agent_name, connected_at, action_description, project_name, user_id)
            VALUES (?, ?, datetime('now'), ?, ?, ?)
          `).bind(
            "conn-" + Date.now(),
            agentName,
            `Conexión inicial y registro autónomo de proyecto '${projectName}'`,
            projectName,
            targetUserId
          ).run().catch(() => {});

          // Notificar al usuario
          await env.DB.prepare(`
            INSERT INTO antigravity_notifications (id, agent_name, title, message, type, project_id, user_id, read, created_at)
            VALUES (?, ?, ?, ?, 'project_connected', ?, ?, 0, datetime('now'))
          `).bind(
            "notif-" + Date.now(),
            agentName,
            `🚀 Conexión Autónoma: ${projectName}`,
            `El agente ${agentName} se ha conectado y sincronizado el proyecto en ARQAISTUDIO con su historial activo.`,
            newId,
            targetUserId
          ).run().catch(() => {});
        }
      }

      // Extraer lista de archivos bloqueados
      let lockedFilesList: string[] = [];
      try {
        if (project && project.locked_files) {
          lockedFilesList = JSON.parse(project.locked_files);
        }
      } catch (e) {
        lockedFilesList = [];
      }

      // Obtener fragmentos RAG existentes para este proyecto
      let ragSnippets: any[] = [];
      if (env && env.DB && project) {
        const ragRes = await env.DB.prepare("SELECT * FROM antigravity_rag_memory WHERE project_id = ? ORDER BY created_at DESC LIMIT 20").bind(project.id).all().catch(() => ({ results: [] }));
        ragSnippets = (ragRes.results || []).map((r: any) => ({
          id: r.id,
          componentTag: r.component_tag,
          title: r.title,
          contentSnippet: r.content_snippet,
          rulesSummary: r.rules_summary,
          tokenWeight: r.token_weight,
          createdAt: r.created_at
        }));
      }

      const connectorConfig = {
        hub: {
          apiUrl: "https://arqaistudio.pages.dev/api",
          apiKey: project?.api_key || apiKeyHeader,
          projectId: project?.id,
          projectName: project?.name
        },
        security: {
          lockedFiles: lockedFilesList,
          enforceLock: true,
          notice: "LOS ARCHIVOS EN lockedFiles TIENEN CANDADO DE CALIDAD INMUTABLE. NO EDITARLOS SIN AUTORIZACIÓN."
        },
        sync: {
          autoSync: true,
          chatAudit: true,
          ragEnabled: true
        }
      };

      return new Response(JSON.stringify({
        success: true,
        message: wasCreated 
          ? `Proyecto '${projectName}' auto-creado y registrado con su historial de cambios en ARQAISTUDIO.`
          : `Conectado exitosamente al proyecto existente '${project?.name}'.`,
        project: {
          id: project?.id,
          name: project?.name,
          userId: project?.user_id,
          apiKey: project?.api_key || apiKeyHeader,
          isNew: wasCreated,
          createdAt: project?.created_at
        },
        connectorConfig,
        lockedFiles: lockedFilesList,
        ragSnippets,
        instructionsForAgent: [
          "1. Guarda el objeto 'connectorConfig' en la raíz del proyecto local en '.arqai.json'.",
          "2. Antes de realizar modificaciones, verifica que ningún archivo esté en 'lockedFiles'.",
          "3. Al completar requerimientos del humano, registra el log en POST /api/agent/chat-log.",
          "4. Consulta fragmentos RAG en GET /api/agent/rag-context para ahorrar tokens."
        ]
      }), { headers: jsonHeaders });
    }

    // --- REGISTRO DE AUDITORÍA DE CHAT Y VALIDACIÓN HUMANA HITL (POST /api/agent/chat-log) ---
    if (pathname === "/api/agent/chat-log" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const projectId = body.projectId || url.searchParams.get("projectId");
      const taskId = body.taskId || null;
      const userPrompt = body.userPrompt || body.prompt || "";
      const aiSummary = body.aiSummary || body.summary || "";
      let modifiedFiles: string[] = [];
      if (Array.isArray(body.modifiedFiles)) {
        modifiedFiles = body.modifiedFiles;
      } else if (typeof body.modifiedFiles === "string") {
        try {
          modifiedFiles = JSON.parse(body.modifiedFiles);
        } catch {
          modifiedFiles = body.modifiedFiles.split(",").map((s: string) => s.trim()).filter(Boolean);
        }
      }
      const workUrl = body.workUrl || body.testUrl || "";
      const agentName = request.headers.get("x-agent-name") || body.agentName || "Antigravity AI";
      const aiModel = request.headers.get("x-ai-model") || body.aiModel || body.model || "Gemini 2.5 Pro";

      if (env && env.DB && (await isAgentBlocked(env.DB, agentName, null))) {
        return new Response(JSON.stringify({
          error: `Acceso Denegado: El agente '${agentName}' ha sido bloqueado por el usuario en ARQAI.`,
          blocked: true,
          agentName,
        }), { status: 403, headers: jsonHeaders });
      }

      if (!projectId || !userPrompt) {
        return new Response(JSON.stringify({
          error: "Faltan campos obligatorios: projectId y userPrompt son requeridos."
        }), { status: 400, headers: jsonHeaders });
      }

      if (env && env.DB) {
        // ENFORCE LOCKFILE: Verificar si alguno de modifiedFiles está bloqueado
        const proj = await env.DB.prepare("SELECT locked_files, user_id FROM antigravity_projects WHERE id = ?").bind(projectId).first().catch(() => null);
        let lockedFiles: string[] = [];
        try {
          if (proj && proj.locked_files) {
            lockedFiles = JSON.parse(proj.locked_files);
          }
        } catch (e) {
          lockedFiles = [];
        }

        const violatedFiles = modifiedFiles.filter(f => lockedFiles.includes(f));
        if (violatedFiles.length > 0) {
          return new Response(JSON.stringify({
            error: `ESCUDO DE CÓDIGO ACTIVO (HTTP 403): Los siguientes archivos están protegidos por Quality Gate inmutable y NO pueden modificarse: ${violatedFiles.join(", ")}. Desbloquea la funcionalidad en la web si deseas alterarlos.`,
            violatedFiles,
            locked: true
          }), { status: 403, headers: jsonHeaders });
        }

        const auditId = "audit-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
        await env.DB.prepare(`
          INSERT INTO antigravity_chat_audit (id, project_id, task_id, user_prompt, ai_summary, modified_files, work_url, status, agent_name, ai_model, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_review', ?, ?, datetime('now'))
        `).bind(
          auditId,
          projectId,
          taskId,
          userPrompt,
          aiSummary,
          JSON.stringify(modifiedFiles),
          workUrl,
          agentName,
          aiModel
        ).run();

        // Si hay taskId vinculado, actualizar la tarea
        if (taskId) {
          await env.DB.prepare(`
            UPDATE antigravity_tasks 
            SET modified_files = ?, work_url = CASE WHEN ? != '' THEN ? ELSE work_url END, status = 'ready_for_review', updated_at = datetime('now')
            WHERE id = ?
          `).bind(JSON.stringify(modifiedFiles), workUrl, workUrl, taskId).run().catch(() => {});
        }

        // Registrar en historial de cambios con el modelo de IA
        const histId = "hist-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
        await env.DB.prepare(`
          INSERT INTO antigravity_history (id, task_id, project_id, task_title, action, previous_status, new_status, details, work_url, author, timestamp)
          VALUES (?, ?, ?, ?, 'chat_audit_logged', 'in_progress', 'ready_for_review', ?, ?, ?, datetime('now'))
        `).bind(
          histId,
          taskId || projectId,
          projectId,
          `Diálogo [${aiModel}]: ${userPrompt.slice(0, 45)}...`,
          `Prompt Humano: "${userPrompt.slice(0, 85)}..." | Modelo IA: ${aiModel} | Agente: ${agentName} | Modificados: ${modifiedFiles.join(", ") || "Ninguno"}`,
          workUrl,
          agentName
        ).run().catch(() => {});

        // Notificar al usuario en pantalla
        await env.DB.prepare(`
          INSERT INTO antigravity_notifications (id, agent_name, title, message, type, project_id, user_id, read, created_at)
          VALUES (?, ?, ?, ?, 'chat_audit', ?, ?, 0, datetime('now'))
        `).bind(
          "notif-" + Date.now(),
          agentName,
          `💬 Diálogo [${aiModel}] Registrado`,
          `El humano consultó: "${userPrompt.slice(0, 75)}..." ejecutado con modelo ${aiModel}.`,
          projectId,
          proj?.user_id || "usr-admin-1"
        ).run().catch(() => {});

        return new Response(JSON.stringify({
          success: true,
          message: "Diálogo registrado en auditoría y enviado a validación humana.",
          auditEntry: {
            id: auditId,
            projectId,
            taskId,
            userPrompt,
            aiSummary,
            modifiedFiles,
            workUrl,
            status: "pending_review",
            agentName,
            aiModel,
            createdAt: new Date().toISOString()
          }
        }), { status: 201, headers: jsonHeaders });
      }

      return new Response(JSON.stringify({ success: false, error: "Base de datos no disponible" }), { status: 500, headers: jsonHeaders });
    }

    // --- CONSULTA DE AUDITORÍA DE CHAT (GET /api/agent/chat-log) ---
    if (pathname === "/api/agent/chat-log" && request.method === "GET") {
      const projectId = url.searchParams.get("projectId");
      const taskId = url.searchParams.get("taskId");
      let entries: any[] = [];
      if (env && env.DB) {
        let query = "SELECT * FROM antigravity_chat_audit WHERE 1=1";
        const params: any[] = [];
        if (projectId) {
          query += " AND project_id = ?";
          params.push(projectId);
        }
        if (taskId) {
          query += " AND task_id = ?";
          params.push(taskId);
        }
        query += " ORDER BY created_at DESC LIMIT 100";
        const res = await env.DB.prepare(query).bind(...params).all().catch(() => ({ results: [] }));
        entries = res.results || [];
      }

      return new Response(JSON.stringify(entries.map((e: any) => ({
        id: e.id,
        projectId: e.project_id,
        taskId: e.task_id,
        userPrompt: e.user_prompt,
        aiSummary: e.ai_summary,
        modifiedFiles: e.modified_files ? JSON.parse(e.modified_files) : [],
        workUrl: e.work_url,
        status: e.status,
        agentName: e.agent_name || "Antigravity AI",
        aiModel: e.ai_model || "Gemini 2.5 Pro",
        createdAt: e.created_at
      }))), { headers: jsonHeaders });
    }

    // --- SIMULADOR DE AGENTE IA CON REGISTRO DE MODELO (POST /api/agent/simulate) ---
    if (pathname === "/api/agent/simulate" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const { taskId, actionType, workUrl, customNotes } = body;
      const aiModel = body.aiModel || body.model || "Gemini 2.5 Pro";
      const agentName = body.agentName || "Antigravity AI";

      if (!taskId) {
        return new Response(JSON.stringify({ error: "Falta taskId obligatorio" }), { status: 400, headers: jsonHeaders });
      }

      if (env && env.DB) {
        const task = await env.DB.prepare("SELECT * FROM antigravity_tasks WHERE id = ?").bind(taskId).first();
        if (!task) {
          return new Response(JSON.stringify({ error: "Tarea no encontrada" }), { status: 404, headers: jsonHeaders });
        }

        if (task.locked) {
          return new Response(JSON.stringify({ error: "La tarea está bloqueada y verificada.", locked: true }), { status: 403, headers: jsonHeaders });
        }

        const project = await env.DB.prepare("SELECT main_url, user_id FROM antigravity_projects WHERE id = ?").bind(task.project_id).first().catch(() => null);
        const resolvedUrl = workUrl || task.work_url || (project ? project.main_url : "") || "https://preview.app.run.app";

        if (actionType === "start") {
          await env.DB.prepare("UPDATE antigravity_tasks SET status = 'in_progress', updated_at = datetime('now') WHERE id = ?").bind(taskId).run();
        } else {
          // Complete
          const notesText = customNotes || `Se atendió la tarea usando el modelo de IA: ${aiModel}. Lista para revisión.`;
          await env.DB.prepare(`
            UPDATE antigravity_tasks 
            SET status = 'ready_for_review', work_url = ?, ai_output = ?, ai_notes = ?, updated_at = datetime('now') 
            WHERE id = ?
          `).bind(resolvedUrl, `Completado por ${agentName} con modelo ${aiModel}`, notesText, taskId).run();

          // Registrar en antigravity_chat_audit
          const auditId = "audit-sim-" + Date.now();
          await env.DB.prepare(`
            INSERT INTO antigravity_chat_audit (id, project_id, task_id, user_prompt, ai_summary, modified_files, work_url, status, agent_name, ai_model, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'ready_for_review', ?, ?, datetime('now'))
          `).bind(
            auditId,
            task.project_id,
            taskId,
            task.title,
            notesText,
            task.modified_files || "[]",
            resolvedUrl,
            agentName,
            aiModel
          ).run().catch(() => {});
        }

        const updatedTask = await env.DB.prepare("SELECT * FROM antigravity_tasks WHERE id = ?").bind(taskId).first();
        return new Response(JSON.stringify({ success: true, task: updatedTask }), { headers: jsonHeaders });
      }

      return new Response(JSON.stringify({ success: false, error: "Base de datos no disponible" }), { status: 500, headers: jsonHeaders });
    }

    // --- CONSULTA DE MEMORIA RAG (GET /api/agent/rag-context) ---
    if (pathname === "/api/agent/rag-context" && request.method === "GET") {
      const projectId = url.searchParams.get("projectId");
      const query = (url.searchParams.get("query") || url.searchParams.get("q") || "").toLowerCase().trim();
      const tag = (url.searchParams.get("tag") || "").toLowerCase().trim();

      let snippets: any[] = [];
      if (env && env.DB) {
        let sql = "SELECT * FROM antigravity_rag_memory WHERE 1=1";
        const params: any[] = [];
        if (projectId) {
          sql += " AND project_id = ?";
          params.push(projectId);
        }
        if (tag) {
          sql += " AND LOWER(component_tag) LIKE ?";
          params.push(`%${tag}%`);
        }
        sql += " ORDER BY created_at DESC LIMIT 30";
        const res = await env.DB.prepare(sql).bind(...params).all().catch(() => ({ results: [] }));
        snippets = (res.results || []).map((r: any) => ({
          id: r.id,
          projectId: r.project_id,
          componentTag: r.component_tag,
          title: r.title,
          contentSnippet: r.content_snippet,
          rulesSummary: r.rules_summary,
          tokenWeight: r.token_weight,
          createdAt: r.created_at,
        }));

        if (query) {
          snippets = snippets.filter(s => 
            s.title.toLowerCase().includes(query) || 
            s.contentSnippet.toLowerCase().includes(query) ||
            (s.rulesSummary && s.rulesSummary.toLowerCase().includes(query)) ||
            (s.componentTag && s.componentTag.toLowerCase().includes(query))
          );
        }
      }

      return new Response(JSON.stringify({
        success: true,
        count: snippets.length,
        estimatedTokensSaved: snippets.reduce((acc, s) => acc + (s.tokenWeight || 150), 0),
        snippets
      }), { headers: jsonHeaders });
    }

    // --- INSERTAR CÁPSULA EN MEMORIA RAG (POST /api/agent/rag-memory) ---
    if (pathname === "/api/agent/rag-memory" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const projectId = body.projectId;
      const title = body.title || "Fragmento de Memoria";
      const contentSnippet = body.contentSnippet || body.snippet || "";
      const componentTag = body.componentTag || "general";
      const rulesSummary = body.rulesSummary || "";
      const tokenWeight = body.tokenWeight || Math.round(contentSnippet.length / 4);

      if (!projectId || !contentSnippet) {
        return new Response(JSON.stringify({ error: "projectId y contentSnippet son requeridos." }), { status: 400, headers: jsonHeaders });
      }

      const ragId = "rag-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
      if (env && env.DB) {
        await env.DB.prepare(`
          INSERT INTO antigravity_rag_memory (id, project_id, component_tag, title, content_snippet, rules_summary, token_weight, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(ragId, projectId, componentTag, title, contentSnippet, rulesSummary, tokenWeight).run();
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Cápsula de memoria RAG indexada.",
        id: ragId
      }), { status: 201, headers: jsonHeaders });
    }

    // --- SINCRONIZACIÓN BIDIRECCIONAL DE LOCKFILE Y CONECTOR .arqai.json (GET & POST /api/agent/sync-lockfile) ---
    if ((pathname === "/api/agent/sync-lockfile" || pathname === "/api/agent/locked-files") && (request.method === "GET" || request.method === "POST")) {
      let projectId = url.searchParams.get("projectId");
      let localFiles: string[] = [];

      if (request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (body.projectId) projectId = body.projectId;
        if (Array.isArray(body.lockedFiles)) localFiles = body.lockedFiles;
      }

      let lockedFiles: string[] = [];
      let project: any = null;

      if (env && env.DB && projectId) {
        project = await env.DB.prepare("SELECT * FROM antigravity_projects WHERE id = ?").bind(projectId).first().catch(() => null);
        if (project && project.locked_files) {
          try {
            lockedFiles = JSON.parse(project.locked_files);
          } catch (e) {
            lockedFiles = [];
          }
        }

        // Si se enviaron archivos locales, fusionar con D1
        if (localFiles.length > 0) {
          const merged = Array.from(new Set([...lockedFiles, ...localFiles]));
          if (merged.length !== lockedFiles.length) {
            await env.DB.prepare("UPDATE antigravity_projects SET locked_files = ?, updated_at = datetime('now') WHERE id = ?")
              .bind(JSON.stringify(merged), projectId).run().catch(() => {});
            lockedFiles = merged;
          }
        }
      }

      const connectorConfig = {
        hub: {
          apiUrl: "https://arqaistudio.pages.dev/api",
          apiKey: project?.api_key || "arqai_sec_...",
          projectId: project?.id || projectId,
          projectName: project?.name || "Proyecto",
        },
        security: {
          lockedFiles: lockedFiles,
          enforceLock: true,
          notice: "LOS ARCHIVOS EN lockedFiles TIENEN CANDADO DE CALIDAD INMUTABLE. NO EDITARLOS SIN AUTORIZACIÓN.",
        },
        sync: {
          autoSync: true,
          chatAudit: true,
          ragEnabled: true,
          lastSyncedAt: new Date().toISOString(),
        }
      };

      return new Response(JSON.stringify({
        success: true,
        projectId,
        projectName: project?.name,
        lockedFiles,
        connectorConfig,
        lastSyncedAt: new Date().toISOString(),
        message: "Lockfile sincronizado exitosamente entre la nube y el entorno local."
      }), { headers: jsonHeaders });
    }

    // --- AI SPECIFICATION ---
    if (pathname === "/api/ai-spec") {
      return new Response(
        JSON.stringify({
          name: "ARQAI Task Hub & QA Verifier API",
          version: "2.0.0 Autonomous",
          platform: "Cloudflare Pages & Cloudflare D1",
          receptionGreeting: "👋 Hola Agente IA. Por favor lee las reglas obligatorias en GET /api/agent/welcome.",
          mandatoryNotificationEndpoint: "POST /api/agent/notify-user",
          headersRequired: {
            "x-api-key": "Clave API del Proyecto (ej: arqai_sec_...)",
            "x-agent-name": "Nombre de tu Agente (ej: CODEX AI)",
          },
          endpoints: [
            { path: "GET /api/agent/welcome", purpose: "Recepción y Saludo del Agente con reglas obligatorias" },
            { path: "POST /api/agent/notify-user", purpose: "Notificar al instante al usuario en vivo en su pantalla" },
            { path: "GET /api/agent/next-task", purpose: "Obtener siguiente tarea pendiente con contexto" },
            { path: "GET /api/agent/context-memory", purpose: "Leer ficha de memoria de contexto técnico" },
            { path: "POST /api/agent/complete-task", purpose: "Finalizar tarea y enviar workUrl para QA" },
            { path: "POST /api/projects/:id/plan/batch", purpose: "Cargar plan completo estructurado en JSON" },
          ],
        }),
        { headers: jsonHeaders }
      );
    }

    // --- AUTENTICACIÓN & USUARIOS CRUD EN CLOUDFLARE D1 ---
    if (pathname === "/api/auth/login" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const { name, pin, email } = body;
      if (!name || !pin) {
        return new Response(
          JSON.stringify({ error: "Ingresa tu usuario o correo y tu PIN de acceso (máximo 6 dígitos)." }),
          { status: 400, headers: jsonHeaders }
        );
      }

      const cleanName = name.trim();
      const cleanPin = pin.toString().trim();
      let user: any = null;

      if (env && env.DB) {
        user = await env.DB.prepare("SELECT * FROM antigravity_users WHERE LOWER(name) = ? OR (email IS NOT NULL AND LOWER(email) = ?)")
          .bind(cleanName.toLowerCase(), cleanName.toLowerCase())
          .first();
      }

      if (!user && cleanName.toLowerCase() === "admin" && (cleanPin === "1234" || cleanPin === "123456")) {
        user = {
          id: "usr-admin-1",
          name: "Super Admin",
          email: email || "admin@arqai.dev",
          pin: cleanPin,
          access_type: "admin",
        };
        if (env && env.DB) {
          await env.DB.prepare(`
            INSERT OR IGNORE INTO antigravity_users (id, name, email, pin, access_type)
            VALUES ('usr-admin-1', 'Super Admin', 'admin@arqai.dev', ?, 'admin')
          `).bind(cleanPin).run();
        }
      }

      if (!user) {
        return new Response(
          JSON.stringify({ error: `El usuario o correo "${cleanName}" no está registrado. Haz clic en 'Crear Cuenta' para registrarte.` }),
          { status: 404, headers: jsonHeaders }
        );
      }

      if (user.pin !== cleanPin) {
        return new Response(
          JSON.stringify({ error: "PIN o contraseña incorrecta. Verifica tus dígitos." }),
          { status: 401, headers: jsonHeaders }
        );
      }

      if (env && env.DB) {
        await env.DB.prepare(`
          INSERT INTO antigravity_agent_connections (id, agent_name, connected_at, action_description, project_name, user_id)
          VALUES (?, ?, datetime('now'), ?, 'Sesión Web', ?)
        `).bind(
          "conn-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
          user.name,
          "Inicio de sesión en la plataforma",
          user.id
        ).run().catch(() => {});
      }

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            pin: user.pin,
            accessType: user.access_type || user.accessType || "user",
          },
        }),
        { headers: jsonHeaders }
      );
    }

    if (pathname === "/api/users" && request.method === "GET") {
      const requesterId = (request.headers.get("x-user-id") || url.searchParams.get("userId") || "").trim();
      let users: any[] = [];
      let projects: any[] = [];
      let connections: any[] = [];

      if (env && env.DB) {
        const res = await env.DB.prepare("SELECT * FROM antigravity_users ORDER BY created_at DESC").all();
        users = res.results || [];
        const projRes = await env.DB.prepare("SELECT user_id, api_key FROM antigravity_projects").all().catch(() => ({ results: [] }));
        projects = projRes.results || [];
        const connRes = await env.DB.prepare("SELECT user_id, action_description, connected_at FROM antigravity_agent_connections ORDER BY connected_at DESC LIMIT 200").all().catch(() => ({ results: [] }));
        connections = connRes.results || [];
      }

      const projectKeyMap = new Map<string, string>();
      const projectCountMap = new Map<string, number>();
      projects.forEach((p: any) => {
        if (p.user_id) {
          projectCountMap.set(p.user_id, (projectCountMap.get(p.user_id) || 0) + 1);
          if (p.api_key) projectKeyMap.set(p.user_id, p.api_key);
        }
      });

      // Mapear última actividad por usuario
      const lastActivityMap = new Map<string, { action: string; timestamp: string }>();
      connections.forEach((c: any) => {
        if (c.user_id && !lastActivityMap.has(c.user_id)) {
          lastActivityMap.set(c.user_id, {
            action: c.action_description || "Conexión a la plataforma",
            timestamp: c.connected_at,
          });
        }
      });

      const nowMs = Date.now();
      const ONLINE_THRESHOLD_MS = 25 * 60 * 1000; // 25 minutos de inactividad

      return new Response(
        JSON.stringify(users.map((u) => {
          const userProjectKey = projectKeyMap.get(u.id);
          const defaultKey = `arqai_sec_${u.pin || "1234"}_${(u.id || "usr").slice(-4)}`;
          const userActivity = lastActivityMap.get(u.id);
          const lastActiveAt = userActivity?.timestamp || u.created_at;
          const lastActiveMs = new Date(lastActiveAt).getTime();
          
          const isOnline = (requesterId && (u.id === requesterId || (u.name?.toLowerCase() === "admin" && requesterId.includes("admin")))) 
            || (!isNaN(lastActiveMs) && (nowMs - lastActiveMs) < ONLINE_THRESHOLD_MS);

          return {
            id: u.id,
            name: u.name,
            email: u.email,
            pin: u.pin,
            apiKey: u.api_key || userProjectKey || defaultKey,
            accessType: u.access_type || "user",
            createdAt: u.created_at,
            projectsCount: projectCountMap.get(u.id) || 0,
            isOnline: Boolean(isOnline),
            lastActiveAt: lastActiveAt,
            lastActivity: userActivity?.action || "Registro en la plataforma",
          };
        })),
        { headers: jsonHeaders }
      );
    }

    // CREAR / REGISTRAR USUARIO (POST /api/users & POST /api/auth/register)
    if ((pathname === "/api/users" || pathname === "/api/auth/register") && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const { name, pin, email, accessType } = body;
      if (!name || !name.trim()) {
        return new Response(
          JSON.stringify({ error: "El nombre de usuario es obligatorio." }),
          { status: 400, headers: jsonHeaders }
        );
      }
      const pinStr = pin ? pin.toString().trim() : "";
      if (!pinStr || pinStr.length < 4 || pinStr.length > 6) {
        return new Response(
          JSON.stringify({ error: "El PIN o contraseña debe tener entre 4 y 6 dígitos (máximo 6 dígitos)." }),
          { status: 400, headers: jsonHeaders }
        );
      }

      const newUser = {
        id: body.id || "usr-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        name: name.trim(),
        email: email ? email.trim() : null,
        pin: pin.toString().trim(),
        api_key: body.api_key || "ag_usr_" + Math.random().toString(36).substring(2, 12),
        access_type: accessType || "user",
        created_at: new Date().toISOString(),
      };

      if (env && env.DB) {
        try {
          await env.DB.prepare(`
            INSERT INTO antigravity_users (id, name, email, pin, access_type, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(newUser.id, newUser.name, newUser.email, newUser.pin, newUser.access_type, newUser.created_at).run();
        } catch (e: any) {
          // Actualizar si ya existe el nombre
          await env.DB.prepare(`
            UPDATE antigravity_users SET email = ?, pin = ?, access_type = ? WHERE LOWER(name) = ?
          `).bind(newUser.email, newUser.pin, newUser.access_type, newUser.name.toLowerCase()).run();
        }

        // Notificación EXCLUSIVA para el Super Administrador (usr-admin-1)
        const notifIdAdmin = "notif-user-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
        await env.DB.prepare(`
          INSERT INTO antigravity_notifications (id, agent_name, title, message, type, project_id, user_id, read, created_at)
          VALUES (?, ?, ?, ?, 'user_registered', '', 'usr-admin-1', 0, ?)
        `).bind(
          notifIdAdmin,
          "SISTEMA ARQAI",
          "👤 ¡NUEVO USUARIO REGISTRADO EN LA WEB!",
          `El usuario '${newUser.name}' (${newUser.email || "Sin correo"}) se acaba de registrar en la plataforma.`,
          newUser.created_at
        ).run().catch(() => {});

        const registeringAgent = (
          request.headers.get("x-agent-name") ||
          body.agentName ||
          body.agent_name ||
          body.author ||
          "SISTEMA ARQAI"
        ).trim();

        await env.DB.prepare(`
          INSERT INTO antigravity_agent_connections (id, agent_name, connected_at, action_description, project_name, user_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          "conn-" + Date.now(),
          registeringAgent,
          new Date().toISOString(),
          `Nuevo registro de usuario en la plataforma: '${newUser.name}' por ${registeringAgent}`,
          "Registro Web",
          newUser.id
        ).run().catch(() => {});

        await env.DB.prepare(`
          INSERT INTO antigravity_history (id, task_id, project_id, task_title, action, previous_status, new_status, details, work_url, author, timestamp)
          VALUES (?, null, ?, ?, 'user_registered', '', 'registered', ?, ?, ?, ?)
        `).bind(
          "hist-user-" + Date.now(),
          "",
          `👤 REGISTRO DE USUARIO: ${newUser.name}`,
          `👤 ¡NUEVO REGISTRO EN LA PLATAFORMA! Se ha registrado el usuario '${newUser.name}' (${newUser.email || "Sin correo"}) con rol '${newUser.access_type}'.`,
          "https://arqaistudio.pages.dev",
          "SISTEMA ARQAI",
          newUser.created_at
        ).run().catch(() => {});
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Usuario '${newUser.name}' guardado correctamente en Cloudflare D1.`,
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            pin: newUser.pin,
            accessType: newUser.access_type,
            createdAt: newUser.created_at,
          },
        }),
        { status: 201, headers: jsonHeaders }
      );
    }

    // ELIMINAR USUARIO (DELETE /api/users/:id o DELETE /api/users?id=...)
    if ((pathname.startsWith("/api/users/") || pathname === "/api/users") && request.method === "DELETE") {
      const parts = pathname.split("/");
      const targetId = (parts.length > 3 && parts[3]) ? parts[3] : url.searchParams.get("id");

      if (!targetId) {
        return new Response(JSON.stringify({ error: "ID de usuario requerido para eliminar." }), { status: 400, headers: jsonHeaders });
      }

      if (env && env.DB) {
        await env.DB.prepare("DELETE FROM antigravity_users WHERE id = ?").bind(targetId).run();
      }

      return new Response(
        JSON.stringify({ success: true, message: "Usuario eliminado correctamente de la base de datos." }),
        { headers: jsonHeaders }
      );
    }

    // ACTUALIZAR USUARIO / EMAIL (PATCH /api/auth/update & PATCH /api/users/:id)
    if ((pathname === "/api/auth/update" || pathname.startsWith("/api/users/")) && request.method === "PATCH") {
      const body = await request.json().catch(() => ({}));
      const parts = pathname.split("/");
      const id = body.id || (parts.length > 3 ? parts[3] : null);

      if (!id) {
        return new Response(JSON.stringify({ error: "ID de usuario requerido." }), { status: 400, headers: jsonHeaders });
      }

      let updatedUser: any = null;
      if (env && env.DB) {
        if (body.email !== undefined) {
          await env.DB.prepare("UPDATE antigravity_users SET email = ? WHERE id = ?").bind(body.email, id).run();
        }
        if (body.pin !== undefined) {
          await env.DB.prepare("UPDATE antigravity_users SET pin = ? WHERE id = ?").bind(body.pin, id).run();
        }
        if (body.name !== undefined) {
          await env.DB.prepare("UPDATE antigravity_users SET name = ? WHERE id = ?").bind(body.name, id).run();
        }
        if (body.accessType !== undefined) {
          await env.DB.prepare("UPDATE antigravity_users SET access_type = ? WHERE id = ?").bind(body.accessType, id).run();
        }
        updatedUser = await env.DB.prepare("SELECT * FROM antigravity_users WHERE id = ?").bind(id).first();
      }

      const userObj = updatedUser ? {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        pin: updatedUser.pin,
        accessType: updatedUser.access_type || "user",
      } : { id, ...body };

      return new Response(
        JSON.stringify({
          success: true,
          message: "Usuario actualizado exitosamente en Cloudflare D1.",
          user: userObj,
        }),
        { headers: jsonHeaders }
      );
    }

    // ELIMINAR USUARIO (DELETE /api/users/:id)
    if (pathname.startsWith("/api/users/") && request.method === "DELETE") {
      const parts = pathname.split("/");
      const id = parts[3];
      if (env && env.DB && id) {
        await env.DB.prepare("DELETE FROM antigravity_users WHERE id = ?").bind(id).run();
      }
      return new Response(JSON.stringify({ success: true, deletedUserId: id }), { headers: jsonHeaders });
    }

    // --- PROYECTOS ---
    if (pathname === "/api/projects" && request.method === "GET") {
      const rawUserId = url.searchParams.get("userId") || request.headers.get("x-user-id");
      const userId = rawUserId ? rawUserId.trim() : "";
      let projects: any[] = [];
      if (env && env.DB) {
        if (userId) {
          const userObj = await env.DB.prepare("SELECT access_type FROM antigravity_users WHERE id = ?").bind(userId).first().catch(() => null);
          const isSuperAdmin = userObj && (userObj.access_type === "admin" || userObj.access_type === "superadmin" || userId === "usr-admin-1");
          if (isSuperAdmin && url.searchParams.get("all") === "true") {
            const res = await env.DB.prepare("SELECT * FROM antigravity_projects ORDER BY created_at DESC").all();
            projects = res.results || [];
          } else {
            const res = await env.DB.prepare("SELECT * FROM antigravity_projects WHERE user_id = ? ORDER BY created_at DESC").bind(userId).all();
            projects = res.results || [];
          }
        } else {
          // Seguridad y Aislamiento Estricto: Si no hay usuario autenticado, cuenta limpia (0 proyectos)
          projects = [];
        }
      }
      return new Response(
        JSON.stringify(projects.map((p) => ({
          id: p.id,
          userId: p.user_id,
          name: p.name,
          mainUrl: p.main_url,
          description: p.description,
          apiKey: p.api_key,
          blueprint: p.blueprint ? JSON.parse(p.blueprint) : undefined,
          lockedFiles: p.locked_files ? JSON.parse(p.locked_files) : [],
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }))),
        { headers: jsonHeaders }
      );
    }

    if (pathname === "/api/projects" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const apiKeyHeader = request.headers.get("x-api-key") || body.apiKey;
      let targetUserId: string | null = null;

      if (env && env.DB && apiKeyHeader) {
        targetUserId = await resolveUserIdFromApiKey(env.DB, apiKeyHeader);
      }

      if (!targetUserId) {
        targetUserId = request.headers.get("x-user-id") || body.userId;
      }

      if (env && env.DB) {
        // Garantizar que targetUserId exista en antigravity_users para cumplir con la Foreign Key
        if (targetUserId) {
          const userObj = await env.DB.prepare("SELECT id FROM antigravity_users WHERE id = ?").bind(targetUserId).first().catch(() => null);
          if (!userObj) {
            const userName = body.creatorName || body.userName || "Usuario";
            await env.DB.prepare(`
              INSERT OR IGNORE INTO antigravity_users (id, name, email, pin, access_type, created_at)
              VALUES (?, ?, ?, '1234', 'user', datetime('now'))
            `).bind(targetUserId, userName, `${userName.toLowerCase().replace(/[^a-z0-9]/g, '') || "usuario"}@arqai.dev`).run().catch(() => {});
          }
        } else {
          targetUserId = "usr-admin-1";
          await env.DB.prepare(`
            INSERT OR IGNORE INTO antigravity_users (id, name, email, pin, access_type, created_at)
            VALUES ('usr-admin-1', 'Super Admin', 'admin@arqai.dev', '1234', 'admin', datetime('now'))
          `).run().catch(() => {});
        }
      }

      const newProj = {
        id: body.id || "proj-" + Date.now(),
        user_id: targetUserId,
        name: body.name || "Nuevo Proyecto",
        main_url: body.mainUrl || "https://arqaistudio.pages.dev",
        description: body.description || "",
        api_key: body.apiKey || apiKeyHeader || "arqai_sec_" + Math.random().toString(36).substring(2, 10),
        blueprint: body.blueprint ? JSON.stringify(body.blueprint) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (env && env.DB) {
        await env.DB.prepare(`
          INSERT INTO antigravity_projects (id, user_id, name, main_url, description, api_key, blueprint, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(newProj.id, newProj.user_id, newProj.name, newProj.main_url, newProj.description, newProj.api_key, newProj.blueprint, newProj.created_at, newProj.updated_at).run();

        let creatorName = body.creatorName || body.userName || body.agentName || request.headers.get("x-agent-name") || request.headers.get("x-user-name");

        if (!creatorName && targetUserId) {
          const userObj = await env.DB.prepare("SELECT name FROM antigravity_users WHERE id = ?").bind(targetUserId).first().catch(() => null) as { name?: string } | null;
          if (userObj && userObj.name) {
            creatorName = userObj.name;
          }
        }

        if (!creatorName) {
          creatorName = "USUARIO";
        }

        const isAgent = Boolean(request.headers.get("x-agent-name") || body.agentName);
        const icon = isAgent ? "🤖" : "👤";
        const actionDetails = isAgent 
          ? `🤖 ¡AGENTE IA CONECTADO! Se ha creado el proyecto '${newProj.name}' en tu cuenta al instante.`
          : `👤 ¡NUEVO PROYECTO! '${creatorName}' ha registrado el proyecto '${newProj.name}'.`;
        const notifTitle = `${icon} ¡NUEVO PROYECTO CREADO POR ${creatorName.toUpperCase()}!`;
        const notifMessage = isAgent
          ? `Se ha registrado automáticamente el proyecto '${newProj.name}' en tu cuenta.`
          : `Se ha registrado el proyecto '${newProj.name}' en tu cuenta.`;

        await env.DB.prepare(`
          INSERT INTO antigravity_history (id, task_id, project_id, task_title, action, previous_status, new_status, details, work_url, author, timestamp)
          VALUES (?, null, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          "hist-" + Date.now(),
          newProj.id,
          newProj.name,
          "project_created",
          "",
          "created",
          actionDetails,
          newProj.main_url,
          creatorName,
          new Date().toISOString()
        ).run().catch(() => {});

        if (isAgent) {
          await env.DB.prepare(`
            INSERT INTO antigravity_agent_connections (id, agent_name, connected_at, action_description, project_name, user_id)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            "conn-" + Date.now(),
            creatorName,
            new Date().toISOString(),
            `Ingresó a la web vía API REST y creó el proyecto '${newProj.name}'`,
            newProj.name,
            newProj.user_id
          ).run().catch(() => {});
        }

        const notifId = "notif-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
        await env.DB.prepare(`
          INSERT INTO antigravity_notifications (id, agent_name, title, message, type, project_id, user_id, read, created_at)
          VALUES (?, ?, ?, ?, 'project_created', ?, ?, 0, ?)
        `).bind(
          notifId,
          creatorName,
          notifTitle,
          notifMessage,
          newProj.id,
          targetUserId,
          new Date().toISOString()
        ).run().catch(() => {});
      }

      return new Response(JSON.stringify({
        id: newProj.id,
        userId: newProj.user_id,
        name: newProj.name,
        mainUrl: newProj.main_url,
        description: newProj.description,
        apiKey: newProj.api_key,
        createdAt: newProj.created_at,
        updatedAt: newProj.updated_at,
      }), { status: 201, headers: jsonHeaders });
    }

    // CLONAR PROYECTO (POST /api/projects/:id/clone)
    if (pathname.startsWith("/api/projects/") && pathname.endsWith("/clone") && request.method === "POST") {
      const parts = pathname.split("/");
      const sourceProjId = parts[3];
      const body = await request.json().catch(() => ({}));

      if (env && env.DB && sourceProjId) {
        const source = await env.DB.prepare("SELECT * FROM antigravity_projects WHERE id = ?").bind(sourceProjId).first();
        if (source) {
          const newId = "proj-" + Date.now();
          const newName = body.name || `${source.name} (Copia)`;
          const newApiKey = "arqai_sec_" + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
          await env.DB.prepare(`
            INSERT INTO antigravity_projects (id, user_id, name, main_url, description, api_key, blueprint, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            newId,
            source.user_id,
            newName,
            source.main_url,
            `Copia clonada del proyecto "${source.name}". ${source.description || ""}`,
            newApiKey,
            source.blueprint,
            new Date().toISOString(),
            new Date().toISOString()
          ).run();

          return new Response(JSON.stringify({
            id: newId,
            userId: source.user_id,
            name: newName,
            mainUrl: source.main_url,
            description: source.description,
            apiKey: newApiKey,
            blueprint: source.blueprint ? JSON.parse(source.blueprint) : undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }), { status: 201, headers: jsonHeaders });
        }
      }
      return new Response(JSON.stringify({ error: "Proyecto original no encontrado" }), { status: 404, headers: jsonHeaders });
    }

    if (pathname.startsWith("/api/projects/") && request.method === "PATCH") {
      const projId = pathname.split("/")[3];
      const body = await request.json().catch(() => ({}));
      if (env && env.DB && projId) {
        if (body.name) await env.DB.prepare("UPDATE antigravity_projects SET name = ? WHERE id = ?").bind(body.name, projId).run();
        if (body.mainUrl) await env.DB.prepare("UPDATE antigravity_projects SET main_url = ? WHERE id = ?").bind(body.mainUrl, projId).run();
        if (body.description) await env.DB.prepare("UPDATE antigravity_projects SET description = ? WHERE id = ?").bind(body.description, projId).run();
      }
      return new Response(JSON.stringify({ success: true, id: projId }), { headers: jsonHeaders });
    }

    // BLUEPRINT DE PROYECTO (GET / PUT / POST /api/projects/:id/blueprint & /generate-blueprint)
    if (pathname.includes("/generate-blueprint")) {
      const parts = pathname.split("/");
      const projId = parts[3] || "proj-default";
      const body = await request.json().catch(() => ({}));
      
      let projName = body.name || "";
      let ideaPrompt = body.idea || body.prompt || body.description || "";

      if (env && env.DB && projId && (!projName || !ideaPrompt)) {
        const p = await env.DB.prepare("SELECT name, description FROM antigravity_projects WHERE id = ?").bind(projId).first().catch(() => null);
        if (p) {
          if (!projName) projName = p.name;
          if (!ideaPrompt) ideaPrompt = p.description || p.name;
        }
      }

      const generatedBlueprint = await generateBlueprintFromIdea(ideaPrompt || "Aplicación de servicios", projName || "Nuevo Proyecto", env?.GEMINI_API_KEY);
      const blueprintStr = JSON.stringify(generatedBlueprint);

      if (env && env.DB && projId) {
        await env.DB.prepare("UPDATE antigravity_projects SET blueprint = ?, updated_at = ? WHERE id = ?")
          .bind(blueprintStr, new Date().toISOString(), projId)
          .run().catch(() => {});
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Blueprint estructurado generado y persistido con éxito en Cloudflare D1.",
        projectId: projId,
        blueprint: generatedBlueprint,
      }), { status: 200, headers: jsonHeaders });
    }

    if (pathname.includes("/blueprint")) {
      const parts = pathname.split("/");
      const projId = parts[3];

      if (request.method === "GET") {
        let blueprintObj: any = null;
        let projName = "";
        let projDesc = "";
        if (env && env.DB && projId) {
          const proj = await env.DB.prepare("SELECT * FROM antigravity_projects WHERE id = ?").bind(projId).first();
          if (proj) {
            projName = proj.name;
            projDesc = proj.description || "";
            if (proj.blueprint) {
              try { blueprintObj = JSON.parse(proj.blueprint); } catch (e) {}
            }
          }
        }
        
        // Si no tiene blueprint registrado pero tiene descripción/nombre, sintetizar automáticamente
        if (!blueprintObj || !blueprintObj.masterPrompt) {
          blueprintObj = synthesizeBlueprintByDomain(projDesc || projName || "Aplicación de Servicios", projName || "Proyecto ARQAI");
        }

        return new Response(JSON.stringify({
          success: true,
          projectId: projId,
          projectName: projName,
          blueprint: blueprintObj,
          instructionsForAI: "DIRECTIVA OBLIGATORIA PARA AGENTES IA: Nunca generes un plan genérico. Primero crea un Blueprint específico del dominio del proyecto. Luego cada módulo, etapa y tarea debe derivarse directamente de ese Blueprint. Si una tarea podría servir para cualquier proyecto, reescríbela hasta que sea específica del producto solicitado.",
        }), { headers: jsonHeaders });
      }

      if (request.method === "PUT" || request.method === "POST") {
        const body = await request.json().catch(() => ({}));
        const blueprintContent = body.blueprint || body;
        const blueprintStr = JSON.stringify(blueprintContent);

        if (env && env.DB && projId) {
          await env.DB.prepare("UPDATE antigravity_projects SET blueprint = ?, updated_at = ? WHERE id = ?")
            .bind(blueprintStr, new Date().toISOString(), projId)
            .run();
        }

        return new Response(JSON.stringify({
          success: true,
          message: "Blueprint del proyecto persistido correctamente en Cloudflare D1.",
          projectId: projId,
          blueprint: blueprintContent,
          instructionsForAI: "DIRECTIVA OBLIGATORIA PARA AGENTES IA: Nunca generes un plan genérico. Primero crea un Blueprint específico del dominio del proyecto. Luego cada módulo, etapa y tarea debe derivarse directamente de ese Blueprint. Si una tarea podría servir para cualquier proyecto, reescríbela hasta que sea específica del producto solicitado.",
        }), { headers: jsonHeaders });
      }
    }

    // GENERADOR INTELIGENTE DE PLAN DE TRABAJO (POST /api/projects/:id/generate-plan-from-blueprint & /api/antigravity/generate-plan & /populate-plan)
    if (pathname.includes("generate-plan-from-blueprint") || pathname.includes("generate-plan") || pathname.includes("populate-plan")) {
      const parts = pathname.split("/");
      const projId = parts[3] || "proj-default";
      const body = await request.json().catch(() => ({}));

      let targetBlueprint: ProjectBlueprint | null = null;

      // 1. Obtener Blueprint del cuerpo o de Cloudflare D1
      if (body.blueprint && body.blueprint.masterPrompt) {
        targetBlueprint = body.blueprint;
      } else if (env && env.DB && projId) {
        const proj = await env.DB.prepare("SELECT name, description, blueprint FROM antigravity_projects WHERE id = ?").bind(projId).first().catch(() => null);
        if (proj) {
          if (proj.blueprint) {
            try { targetBlueprint = JSON.parse(proj.blueprint); } catch (e) {}
          }
          if (!targetBlueprint || !targetBlueprint.masterPrompt) {
            const idea = body.projectIdeaPrompt || body.idea || proj.description || proj.name || "Aplicación web";
            targetBlueprint = await generateBlueprintFromIdea(idea, proj.name, env?.GEMINI_API_KEY);
            // Guardar el blueprint generado
            await env.DB.prepare("UPDATE antigravity_projects SET blueprint = ?, updated_at = ? WHERE id = ?")
              .bind(JSON.stringify(targetBlueprint), new Date().toISOString(), projId).run().catch(() => {});
          }
        }
      }

      if (!targetBlueprint) {
        const promptIdea = body.projectIdeaPrompt || body.idea || "Aplicación de servicios";
        targetBlueprint = await generateBlueprintFromIdea(promptIdea, "Proyecto ARQAI", env?.GEMINI_API_KEY);
      }

      // 2. Si vienen módulos explícitos en el payload, usarlos; de lo contrario, generar plan inteligente no genérico
      let workPlan = (body.modules && Array.isArray(body.modules) && body.modules.length > 0)
        ? { modules: body.modules, stages: body.stages || [], tasks: body.tasks || [] }
        : await generateWorkPlanFromBlueprint(targetBlueprint, projId, env?.GEMINI_API_KEY);

      const inputModules = workPlan.modules || [];
      const inputStages = workPlan.stages || [];
      const inputTasks = workPlan.tasks || [];

      if (env && env.DB && projId) {
        // Limpiar módulos, etapas y tareas anteriores si se solicita o al regenerar desde blueprint
        if (body.clearExisting !== false) {
          await env.DB.prepare("DELETE FROM antigravity_tasks WHERE project_id = ?").bind(projId).run().catch(() => {});
          await env.DB.prepare("DELETE FROM antigravity_modules WHERE project_id = ?").bind(projId).run().catch(() => {});
          await env.DB.prepare("DELETE FROM antigravity_stages WHERE project_id = ?").bind(projId).run().catch(() => {});
        }

        // Insertar Módulos específicos de dominio
        for (let i = 0; i < inputModules.length; i++) {
          const m = inputModules[i];
          const mId = m.id || ("mod-" + Date.now() + "-" + (i + 1));
          await env.DB.prepare(`
            INSERT OR REPLACE INTO antigravity_modules (id, project_id, title, description, order_num, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(mId, projId, m.title || `Módulo ${i + 1}`, m.description || "", m.order || (i + 1), new Date().toISOString()).run().catch(() => {});
        }

        // Insertar Etapas
        for (let i = 0; i < inputStages.length; i++) {
          const s = inputStages[i];
          const sId = s.id || ("stg-" + Date.now() + "-" + (i + 1));
          await env.DB.prepare(`
            INSERT OR REPLACE INTO antigravity_stages (id, module_id, project_id, title, description, order_num, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(sId, s.moduleId || inputModules[0]?.id || "", projId, s.title || `Etapa ${i + 1}`, s.description || "", s.order || (i + 1), new Date().toISOString()).run().catch(() => {});
        }

        // Insertar Tareas con Memoria Técnica completa y directiva anti-genérica
        for (let i = 0; i < inputTasks.length; i++) {
          const t = inputTasks[i];
          const tId = t.id || ("tsk-" + Date.now() + "-" + (i + 1));
          const existingRules = t.contextMemory?.rulesConstraints || t.rulesConstraints || [];
          const requiredRule = "Nunca generes un plan genérico. Primero crea un Blueprint específico del dominio del proyecto. Luego cada módulo, etapa y tarea debe derivarse directamente de ese Blueprint. Si una tarea podría servir para cualquier proyecto, reescríbela hasta que sea específica del producto solicitado.";
          
          const combinedRules = Array.from(new Set([
            ...existingRules,
            requiredRule,
            "No editar humanFeedback.",
            "No marcar tareas como verified automáticamente."
          ]));

          const memory = JSON.stringify({
            technicalRequirements: t.contextMemory?.technicalRequirements || t.technicalRequirements || [
              "Implementar lógica y vistas según especificación de dominio.",
              "Manejo de errores y validaciones de entrada."
            ],
            affectedFiles: t.contextMemory?.affectedFiles || t.affectedFiles || ["src/components/*", "server/apiApp.ts"],
            rulesConstraints: combinedRules,
            dependencies: t.contextMemory?.dependencies || t.dependencies || ["React", "Tailwind"],
            notes: t.contextMemory?.notes || t.notes || `Tarea perteneciente al plan de trabajo de ${targetBlueprint.screens?.[0]?.name || "la aplicación"}.`,
          });
          const subtasksStr = JSON.stringify(t.subtasks || []);

          await env.DB.prepare(`
            INSERT OR REPLACE INTO antigravity_tasks (id, project_id, module_id, stage_id, title, instruction, status, locked, assigned_agent, subtasks, context_memory, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            tId,
            projId,
            t.moduleId || inputModules[0]?.id || "",
            t.stageId || inputStages[0]?.id || "",
            t.title || `Tarea ${i + 1}`,
            t.instruction || t.description || "Implementar requerimiento técnico.",
            t.status || "pending",
            0,
            t.assignedAgent || "Antigravity AI",
            subtasksStr,
            memory,
            new Date().toISOString(),
            new Date().toISOString()
          ).run().catch(() => {});
        }

        // Registrar Historial y Notificación en vivo
        const proj = await env.DB.prepare("SELECT user_id, name FROM antigravity_projects WHERE id = ?").bind(projId).first().catch(() => null);
        const ownerUserId = proj?.user_id || request.headers.get("x-user-id") || body.userId;
        const agentName = request.headers.get("x-agent-name") || body.agentName || "CODEX AI";

        const notifId = "notif-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
        await env.DB.prepare(`
          INSERT INTO antigravity_notifications (id, agent_name, title, message, type, project_id, user_id, read, created_at)
          VALUES (?, ?, ?, ?, 'plan_uploaded', ?, ?, 0, ?)
        `).bind(
          notifId,
          agentName,
          `📝 ¡PLAN DE TRABAJO INTELIGENTE GENERADO!`,
          `Se crearon ${inputTasks.length} tareas técnicas estructuradas en ${inputModules.length} módulos para '${proj?.name || projId}'.`,
          projId,
          ownerUserId,
          new Date().toISOString()
        ).run().catch(() => {});
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Plan de trabajo inteligente generado con éxito (${inputModules.length} módulos, ${inputTasks.length} tareas con memoria técnica).`,
        projectId: projId,
        blueprint: targetBlueprint,
        createdModulesCount: inputModules.length,
        createdStagesCount: inputStages.length,
        createdTasksCount: inputTasks.length,
        modules: inputModules,
        stages: inputStages,
        tasks: inputTasks,
      }), { status: 200, headers: jsonHeaders });
    }

    // ELIMINAR PROYECTO INDIVIDUAL
    if (pathname.startsWith("/api/projects/") && request.method === "DELETE") {
      const projId = pathname.split("/")[3];
      const userId = url.searchParams.get("userId");
      if (env && env.DB && projId) {
        await env.DB.prepare("DELETE FROM antigravity_tasks WHERE project_id = ?").bind(projId).run().catch(() => {});
        await env.DB.prepare("DELETE FROM antigravity_modules WHERE project_id = ?").bind(projId).run().catch(() => {});
        await env.DB.prepare("DELETE FROM antigravity_stages WHERE project_id = ?").bind(projId).run().catch(() => {});
        await env.DB.prepare("DELETE FROM antigravity_projects WHERE id = ?").bind(projId).run();
      }
      let remaining: any[] = [];
      if (env && env.DB) {
        const res = userId 
          ? await env.DB.prepare("SELECT * FROM antigravity_projects WHERE user_id = ? ORDER BY created_at DESC").bind(userId).all()
          : await env.DB.prepare("SELECT * FROM antigravity_projects ORDER BY created_at DESC").all();
        remaining = res.results || [];
      }
      return new Response(
        JSON.stringify({
          success: true,
          deletedProjectId: projId,
          projects: remaining.map((p) => ({
            id: p.id,
            userId: p.user_id,
            name: p.name,
            mainUrl: p.main_url,
            description: p.description,
            apiKey: p.api_key,
            blueprint: p.blueprint ? JSON.parse(p.blueprint) : undefined,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          })),
        }),
        { headers: jsonHeaders }
      );
    }

    // ELIMINAR TODOS LOS PROYECTOS (DELETE /api/projects)
    if (pathname === "/api/projects" && request.method === "DELETE") {
      const userId = url.searchParams.get("userId");
      if (env && env.DB) {
        if (userId) {
          const userProjs = await env.DB.prepare("SELECT id FROM antigravity_projects WHERE user_id = ?").bind(userId).all();
          const ids = (userProjs.results || []).map((p: any) => p.id);
          for (const pid of ids) {
            await env.DB.prepare("DELETE FROM antigravity_tasks WHERE project_id = ?").bind(pid).run().catch(() => {});
            await env.DB.prepare("DELETE FROM antigravity_modules WHERE project_id = ?").bind(pid).run().catch(() => {});
            await env.DB.prepare("DELETE FROM antigravity_stages WHERE project_id = ?").bind(pid).run().catch(() => {});
            await env.DB.prepare("DELETE FROM antigravity_projects WHERE id = ?").bind(pid).run().catch(() => {});
          }
        } else {
          await env.DB.prepare("DELETE FROM antigravity_tasks").run().catch(() => {});
          await env.DB.prepare("DELETE FROM antigravity_modules").run().catch(() => {});
          await env.DB.prepare("DELETE FROM antigravity_stages").run().catch(() => {});
          await env.DB.prepare("DELETE FROM antigravity_projects").run().catch(() => {});
        }
      }
      return new Response(
        JSON.stringify({ success: true, message: "Todos los proyectos han sido eliminados de Cloudflare D1.", projects: [] }),
        { headers: jsonHeaders }
      );
    }

    // --- MÓDULOS Y ETAPAS ---
    if (pathname === "/api/modules" && request.method === "GET") {
      const projectId = url.searchParams.get("projectId");
      const userId = url.searchParams.get("userId");
      let modules: any[] = [];
      if (env && env.DB) {
        if (projectId) {
          const res = await env.DB.prepare("SELECT * FROM antigravity_modules WHERE project_id = ? ORDER BY order_num ASC").bind(projectId).all();
          modules = res.results || [];
        } else if (userId) {
          const res = await env.DB.prepare("SELECT m.* FROM antigravity_modules m INNER JOIN antigravity_projects p ON m.project_id = p.id WHERE p.user_id = ? ORDER BY m.order_num ASC").bind(userId).all();
          modules = res.results || [];
        } else {
          const res = await env.DB.prepare("SELECT * FROM antigravity_modules ORDER BY order_num ASC").all();
          modules = res.results || [];
        }
      }
      return new Response(JSON.stringify(modules.map((m) => ({
        id: m.id,
        projectId: m.project_id,
        title: m.title,
        description: m.description,
        order: m.order_num,
        createdAt: m.created_at,
      }))), { headers: jsonHeaders });
    }

    if (pathname === "/api/modules" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const newMod = {
        id: "mod-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        projectId: body.projectId || "proj-default",
        title: body.title || "Nuevo Módulo",
        description: body.description || "",
        order: body.order || 1,
        createdAt: new Date().toISOString(),
      };
      if (env && env.DB) {
        await env.DB.prepare(`
          INSERT INTO antigravity_modules (id, project_id, title, description, order_num, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(newMod.id, newMod.projectId, newMod.title, newMod.description, newMod.order, newMod.createdAt).run();
      }
      return new Response(JSON.stringify(newMod), { status: 201, headers: jsonHeaders });
    }

    if (pathname === "/api/stages" && request.method === "GET") {
      const projectId = url.searchParams.get("projectId");
      const userId = url.searchParams.get("userId");
      let stages: any[] = [];
      if (env && env.DB) {
        if (projectId) {
          const res = await env.DB.prepare("SELECT * FROM antigravity_stages WHERE project_id = ? ORDER BY order_num ASC").bind(projectId).all();
          stages = res.results || [];
        } else if (userId) {
          const res = await env.DB.prepare("SELECT s.* FROM antigravity_stages s INNER JOIN antigravity_projects p ON s.project_id = p.id WHERE p.user_id = ? ORDER BY s.order_num ASC").bind(userId).all();
          stages = res.results || [];
        } else {
          const res = await env.DB.prepare("SELECT * FROM antigravity_stages ORDER BY order_num ASC").all();
          stages = res.results || [];
        }
      }
      return new Response(JSON.stringify(stages.map((s) => ({
        id: s.id,
        moduleId: s.module_id,
        projectId: s.project_id,
        title: s.title,
        description: s.description,
        order: s.order_num,
        createdAt: s.created_at,
      }))), { headers: jsonHeaders });
    }

    if (pathname === "/api/stages" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const newStg = {
        id: "stg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        moduleId: body.moduleId,
        projectId: body.projectId || "proj-default",
        title: body.title || "Nueva Etapa",
        description: body.description || "",
        order: body.order || 1,
        createdAt: new Date().toISOString(),
      };
      if (env && env.DB) {
        await env.DB.prepare(`
          INSERT INTO antigravity_stages (id, module_id, project_id, title, description, order_num, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(newStg.id, newStg.moduleId, newStg.projectId, newStg.title, newStg.description, newStg.order, newStg.createdAt).run();
      }
      return new Response(JSON.stringify(newStg), { status: 201, headers: jsonHeaders });
    }

    // --- TAREAS ---
    if (pathname === "/api/tasks" && request.method === "GET") {
      const projectId = url.searchParams.get("projectId");
      let tasks: any[] = [];
      if (env && env.DB) {
        if (projectId) {
          const res = await env.DB.prepare("SELECT * FROM antigravity_tasks WHERE project_id = ? ORDER BY created_at DESC").bind(projectId).all();
          tasks = res.results || [];
        } else {
          const res = await env.DB.prepare("SELECT * FROM antigravity_tasks ORDER BY created_at DESC").all();
          tasks = res.results || [];
        }
      }
      return new Response(
        JSON.stringify(tasks.map((t) => ({
          id: t.id,
          projectId: t.project_id,
          moduleId: t.module_id,
          stageId: t.stage_id,
          title: t.title,
          instruction: t.instruction,
          status: t.status,
          workUrl: t.work_url,
          aiOutput: t.ai_output,
          aiNotes: t.ai_notes,
          humanFeedback: t.human_feedback,
          locked: Boolean(t.locked),
          assignedAgent: t.assigned_agent,
          subtasks: t.subtasks ? JSON.parse(t.subtasks) : [],
          contextMemory: t.context_memory ? JSON.parse(t.context_memory) : {},
          modifiedFiles: t.modified_files ? JSON.parse(t.modified_files) : [],
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }))),
        { headers: jsonHeaders }
      );
    }

    if (pathname === "/api/tasks" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const contextObj = body.contextMemory || {
        technicalRequirements: body.technicalRequirements || body.technical_requirements || [],
        affectedFiles: body.affectedFiles || body.affected_files || [],
        rulesConstraints: body.rulesConstraints || body.rules_constraints || [],
        dependencies: body.dependencies || body.requiredDependencies || [],
        notes: body.notes || body.persistentNotes || "",
      };

      const newTask = {
        id: body.id || ("task-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6)),
        projectId: body.projectId || "proj-default",
        moduleId: body.moduleId || body.module || null,
        stageId: body.stageId || body.stage || null,
        title: body.title || body.instruction?.substring(0, 45) || "Instrucción Asignada",
        instruction: body.instruction || body.description || "",
        status: body.status || "pending",
        workUrl: body.workUrl || body.testUrl || "",
        locked: false,
        assignedAgent: body.assignedAgent || body.author || "Antigravity AI",
        subtasks: JSON.stringify(body.subtasks || []),
        contextMemory: JSON.stringify(contextObj),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (env && env.DB) {
        await env.DB.prepare(`
          INSERT OR REPLACE INTO antigravity_tasks (id, project_id, module_id, stage_id, title, instruction, status, work_url, locked, assigned_agent, subtasks, context_memory, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(newTask.id, newTask.projectId, newTask.moduleId, newTask.stageId, newTask.title, newTask.instruction, newTask.status, newTask.workUrl, 0, newTask.assignedAgent, newTask.subtasks, newTask.contextMemory, newTask.createdAt, newTask.updatedAt).run();
      }

      return new Response(JSON.stringify({
        success: true,
        ...newTask,
        subtasks: JSON.parse(newTask.subtasks),
        contextMemory: JSON.parse(newTask.contextMemory),
        locked: false,
      }), { status: 201, headers: jsonHeaders });
    }

    // PATCH / PUT TAREA INDIVIDUAL (incluyendo Context Memory)
    if (pathname.startsWith("/api/tasks/") && (request.method === "PATCH" || request.method === "PUT")) {
      const parts = pathname.split("/");
      const taskId = parts[3];
      const isContextMemorySubroute = pathname.includes("/context-memory");
      const body = await request.json().catch(() => ({}));

      if (env && env.DB && taskId) {
        const existing = await env.DB.prepare("SELECT * FROM antigravity_tasks WHERE id = ?").bind(taskId).first();
        if (existing) {
          let currentMemory: any = { technicalRequirements: [], affectedFiles: [], rulesConstraints: [], dependencies: [], notes: "" };
          if (existing.context_memory) {
            try { currentMemory = JSON.parse(existing.context_memory); } catch (e) {}
          }

          if (isContextMemorySubroute) {
            const updatedMemory = {
              technicalRequirements: body.technicalRequirements || body.technical_requirements || currentMemory.technicalRequirements || [],
              affectedFiles: body.affectedFiles || body.affected_files || currentMemory.affectedFiles || [],
              rulesConstraints: body.rulesConstraints || body.rules_constraints || currentMemory.rulesConstraints || [],
              dependencies: body.dependencies || body.requiredDependencies || currentMemory.dependencies || [],
              notes: body.notes || body.persistentNotes || currentMemory.notes || "",
            };

            await env.DB.prepare("UPDATE antigravity_tasks SET context_memory = ?, updated_at = ? WHERE id = ?")
              .bind(JSON.stringify(updatedMemory), new Date().toISOString(), taskId)
              .run();

            return new Response(JSON.stringify({
              success: true,
              message: "Memoria técnica de contexto actualizada correctamente en Cloudflare D1.",
              taskId: taskId,
              contextMemory: updatedMemory,
            }), { headers: jsonHeaders });
          }

          // Actualización de campos generales de la tarea
          const newTitle = body.title || existing.title;
          const newInstruction = body.instruction || body.description || existing.instruction;
          const newStatus = body.status || existing.status;
          const newWorkUrl = body.workUrl || body.testUrl || existing.work_url;
          const newAiNotes = body.aiNotes || body.aiOutput || existing.ai_notes;
          const newAgent = body.assignedAgent || existing.assigned_agent;
          const newSubtasks = body.subtasks ? JSON.stringify(body.subtasks) : existing.subtasks;

          let newMemory = existing.context_memory;
          if (body.contextMemory || body.technicalRequirements) {
            const memoryObj = body.contextMemory || {
              technicalRequirements: body.technicalRequirements || currentMemory.technicalRequirements || [],
              affectedFiles: body.affectedFiles || currentMemory.affectedFiles || [],
              rulesConstraints: body.rulesConstraints || currentMemory.rulesConstraints || [],
              dependencies: body.dependencies || currentMemory.dependencies || [],
              notes: body.notes || currentMemory.notes || "",
            };
            newMemory = JSON.stringify(memoryObj);
          }

          await env.DB.prepare(`
            UPDATE antigravity_tasks 
            SET title = ?, instruction = ?, status = ?, work_url = ?, ai_notes = ?, assigned_agent = ?, subtasks = ?, context_memory = ?, updated_at = ?
            WHERE id = ?
          `).bind(newTitle, newInstruction, newStatus, newWorkUrl, newAiNotes, newAgent, newSubtasks, newMemory, new Date().toISOString(), taskId).run();

          const updated = await env.DB.prepare("SELECT * FROM antigravity_tasks WHERE id = ?").bind(taskId).first();
          return new Response(JSON.stringify({
            success: true,
            message: "Tarea actualizada exitosamente en Cloudflare D1.",
            task: {
              id: updated.id,
              projectId: updated.project_id,
              moduleId: updated.module_id,
              stageId: updated.stage_id,
              title: updated.title,
              instruction: updated.instruction,
              status: updated.status,
              workUrl: updated.work_url,
              aiNotes: updated.ai_notes,
              assignedAgent: updated.assigned_agent,
              subtasks: updated.subtasks ? JSON.parse(updated.subtasks) : [],
              contextMemory: updated.context_memory ? JSON.parse(updated.context_memory) : {},
              updatedAt: updated.updated_at,
            }
          }), { headers: jsonHeaders });
        }
      }

      return new Response(JSON.stringify({ success: true, taskId }), { headers: jsonHeaders });
    }

    // CONTEXT MEMORY DEDICADO PARA AGENTES (GET /api/agent/context-memory)
    if (pathname.includes("/agent/context-memory") && request.method === "GET") {
      const taskId = url.searchParams.get("taskId") || url.searchParams.get("id");
      let memoryObj = { technicalRequirements: [], affectedFiles: [], rulesConstraints: [], dependencies: [], notes: "" };
      let taskTitle = "";

      if (env && env.DB && taskId) {
        const task = await env.DB.prepare("SELECT title, context_memory FROM antigravity_tasks WHERE id = ?").bind(taskId).first();
        if (task) {
          taskTitle = task.title;
          if (task.context_memory) {
            try { memoryObj = JSON.parse(task.context_memory); } catch (e) {}
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        taskId: taskId,
        taskTitle: taskTitle,
        contextMemory: memoryObj,
      }), { headers: jsonHeaders });
    }

    // CONSULTA DIRECTA DE CORRECCIONES PENDIENTES PARA AGENTES IA (GET /api/agent/pending-corrections)
    if ((pathname.includes("/pending-corrections") || pathname.includes("/corrections")) && request.method === "GET") {
      let projectId = url.searchParams.get("projectId");
      let corrections: any[] = [];
      if (env && env.DB) {
        let query = "SELECT * FROM antigravity_tasks WHERE status = 'needs_revision'";
        if (projectId) query += " AND project_id = '" + projectId + "'";
        query += " ORDER BY updated_at DESC LIMIT 50";
        const res = await env.DB.prepare(query).all();
        corrections = res.results || [];
      }
      return new Response(JSON.stringify({
        success: true,
        count: corrections.length,
        corrections: corrections.map((t) => ({
          taskId: t.id,
          projectId: t.project_id,
          title: t.title,
          instruction: t.instruction,
          humanFeedback: t.human_feedback || "Revisada por humano: requiere ajustes.",
          status: t.status,
          assignedAgent: t.assigned_agent,
          workUrl: t.work_url,
          updatedAt: t.updated_at,
        })),
      }), { headers: jsonHeaders });
    }

    // SIGUIENTE TAREA EN COLA PARA AGENTE (GET /api/agent/next-task o /api/projects/:id/next-task)
    if (pathname.includes("/next-task") && request.method === "GET") {
      let projectId = url.searchParams.get("projectId");
      if (!projectId && pathname.startsWith("/api/projects/")) {
        projectId = pathname.split("/")[3];
      }
      let nextTask: any = null;

      if (env && env.DB) {
        let query = "SELECT * FROM antigravity_tasks WHERE status IN ('needs_revision', 'pending')";
        if (projectId) query += " AND project_id = '" + projectId + "'";
        query += " ORDER BY CASE WHEN status = 'needs_revision' THEN 1 ELSE 2 END, created_at ASC LIMIT 1";

        const res = await env.DB.prepare(query).first();
        if (res) {
          nextTask = {
            id: res.id,
            projectId: res.project_id,
            moduleId: res.module_id,
            stageId: res.stage_id,
            title: res.title,
            instruction: res.instruction,
            status: res.status,
            assignedAgent: res.assigned_agent,
            humanFeedback: res.human_feedback,
            subtasks: res.subtasks ? JSON.parse(res.subtasks) : [],
            contextMemory: res.context_memory ? JSON.parse(res.context_memory) : {},
          };
        }
      }

      return new Response(JSON.stringify({
        success: true,
        task: nextTask,
      }), { headers: jsonHeaders });
    }

    // NOTIFICAR AL USUARIO DIRECTAMENTE POR IA (POST /api/agent/notify-user & POST /api/notifications)
    if ((pathname === "/api/agent/notify-user" || pathname === "/api/notifications") && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const apiKeyHeader = request.headers.get("x-api-key") || body.apiKey;
      let targetUserId: string | null = null;

      if (env && env.DB && apiKeyHeader) {
        targetUserId = await resolveUserIdFromApiKey(env.DB, apiKeyHeader);
      }

      if (!targetUserId) {
        targetUserId = request.headers.get("x-user-id") || body.userId;
      }

      if (!targetUserId && body.projectId && env && env.DB) {
        const p = await env.DB.prepare("SELECT user_id FROM antigravity_projects WHERE id = ?").bind(body.projectId).first();
        if (p && p.user_id) targetUserId = p.user_id;
      }

      const agentName = request.headers.get("x-agent-name") || body.agentName || "Antigravity AI";
      if (env && env.DB && (await isAgentBlocked(env.DB, agentName, targetUserId))) {
        return new Response(JSON.stringify({
          error: `Acceso Denegado: El agente '${agentName}' ha sido bloqueado por el usuario en ARQAI.`,
          blocked: true,
          agentName,
        }), { status: 403, headers: jsonHeaders });
      }

      const title = body.title || "🤖 Notificación del Agente IA";
      const message = body.message || "El agente ha completado su trabajo y ha enviado una alerta al usuario.";
      const type = body.type || "agent_notification";
      const projectId = body.projectId || "";
      const notifId = "notif-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
      const createdAt = new Date().toISOString();

      if (env && env.DB) {
        await env.DB.prepare(`
          INSERT INTO antigravity_notifications (id, agent_name, title, message, type, project_id, user_id, read, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
        `).bind(notifId, agentName, title, message, type, projectId, targetUserId || null, createdAt).run().catch(() => {});

        await env.DB.prepare(`
          INSERT INTO antigravity_agent_connections (id, agent_name, connected_at, action_description, project_name, user_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind("conn-" + Date.now(), agentName, createdAt, `Envió una notificación al usuario: "${title}"`, projectId, targetUserId || null).run().catch(() => {});
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Notificación registrada exclusivamente para la cuenta del usuario propietario de esta API.",
        notification: { id: notifId, agentName, title, message, type, projectId, userId: targetUserId, createdAt },
        userNotified: true,
      }), { status: 201, headers: jsonHeaders });
    }

    // COMPLETAR TAREA Y NOTIFICAR EN TIEMPO REAL (POST /api/agent/complete-task)
    if (pathname.includes("/agent/complete-task") && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const taskId = body.taskId || url.searchParams.get("taskId");
      const agentName = request.headers.get("x-agent-name") || body.agentName || "Antigravity AI";

      if (env && env.DB && (await isAgentBlocked(env.DB, agentName, null))) {
        return new Response(JSON.stringify({
          error: `Acceso Denegado: El agente '${agentName}' ha sido bloqueado por el usuario en ARQAI.`,
          blocked: true,
          agentName,
        }), { status: 403, headers: jsonHeaders });
      }

      const workUrl = body.workUrl || body.testUrl || "";
      const aiNotes = body.aiNotes || body.aiOutput || "";
      const gitBranch = body.gitBranch || body.branch || null;
      const gitCommit = body.gitCommit || body.commit || null;

      if (env && env.DB && taskId) {
        const taskObj = await env.DB.prepare("SELECT project_id FROM antigravity_tasks WHERE id = ?").bind(taskId).first().catch(() => null);
        let taskOwnerUserId = null;
        if (taskObj && taskObj.project_id) {
          const projObj = await env.DB.prepare("SELECT user_id FROM antigravity_projects WHERE id = ?").bind(taskObj.project_id).first().catch(() => null);
          if (projObj && projObj.user_id) taskOwnerUserId = projObj.user_id;
        }

        if (gitBranch || gitCommit) {
          await env.DB.prepare("UPDATE antigravity_tasks SET status = 'ready_for_review', work_url = ?, ai_notes = ?, assigned_agent = ?, git_branch = ?, git_commit = ?, updated_at = ? WHERE id = ?")
            .bind(workUrl, aiNotes, agentName, gitBranch, gitCommit, new Date().toISOString(), taskId)
            .run().catch(async () => {
              await env.DB.prepare("UPDATE antigravity_tasks SET status = 'ready_for_review', work_url = ?, ai_notes = ?, assigned_agent = ?, updated_at = ? WHERE id = ?")
                .bind(workUrl, aiNotes, agentName, new Date().toISOString(), taskId).run();
            });
        } else {
          await env.DB.prepare("UPDATE antigravity_tasks SET status = 'ready_for_review', work_url = ?, ai_notes = ?, assigned_agent = ?, updated_at = ? WHERE id = ?")
            .bind(workUrl, aiNotes, agentName, new Date().toISOString(), taskId)
            .run();
        }

        const notifId = "notif-" + Date.now();
        await env.DB.prepare(`
          INSERT INTO antigravity_notifications (id, agent_name, title, message, type, project_id, user_id, read, created_at)
          VALUES (?, ?, ?, ?, 'task_completed', ?, ?, 0, ?)
        `).bind(notifId, agentName, `✨ Tarea lista para revisión QA`, `El agente ${agentName} ha completado la tarea '${taskId}' y la envió a revisión humana.`, taskObj?.project_id || '', taskOwnerUserId, new Date().toISOString()).run().catch(() => {});
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Tarea completada y notificación enviada exclusivamente al usuario propietario de la tarea.",
        userNotified: true,
        taskId: taskId,
        status: "ready_for_review",
      }), { headers: jsonHeaders });
    }

    // MARCAR TODAS COMO LEÍDAS (POST /api/notifications/mark-all-read)
    if (pathname === "/api/notifications/mark-all-read" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const userId = body.userId || url.searchParams.get("userId") || request.headers.get("x-user-id");
      if (env && env.DB && userId) {
        await env.DB.prepare("UPDATE antigravity_notifications SET read = 1 WHERE user_id = ?").bind(userId).run().catch(() => {});
      }
      return new Response(JSON.stringify({ success: true, message: "Todas las notificaciones marcadas como leídas." }), { headers: jsonHeaders });
    }

    // VACIAR BUZÓN DE NOTIFICACIONES (DELETE /api/notifications/clear o DELETE /api/notifications)
    if ((pathname === "/api/notifications/clear" || pathname === "/api/notifications") && request.method === "DELETE") {
      const userId = url.searchParams.get("userId") || request.headers.get("x-user-id");
      if (env && env.DB && userId) {
        await env.DB.prepare("DELETE FROM antigravity_notifications WHERE user_id = ?").bind(userId).run().catch(() => {});
      }
      return new Response(JSON.stringify({ success: true, message: "Buzón de notificaciones vaciado." }), { headers: jsonHeaders });
    }

    // ELIMINAR NOTIFICACIÓN INDIVIDUAL (DELETE /api/notifications/:id)
    if (pathname.startsWith("/api/notifications/") && !pathname.endsWith("/clear") && !pathname.endsWith("/read") && request.method === "DELETE") {
      const notifId = pathname.split("/")[3];
      if (env && env.DB && notifId) {
        await env.DB.prepare("DELETE FROM antigravity_notifications WHERE id = ?").bind(notifId).run().catch(() => {});
      }
      return new Response(JSON.stringify({ success: true, deletedNotificationId: notifId, message: "Notificación eliminada correctamente." }), { headers: jsonHeaders });
    }

    // MARCAR NOTIFICACIÓN COMO LEÍDA (POST /api/notifications/:id/read)
    if (pathname.includes("/notifications/") && pathname.endsWith("/read") && request.method === "POST") {
      const notifId = pathname.split("/")[3];
      if (env && env.DB && notifId) {
        await env.DB.prepare("UPDATE antigravity_notifications SET read = 1 WHERE id = ?").bind(notifId).run().catch(() => {});
      }
      return new Response(JSON.stringify({ success: true, notifId }), { headers: jsonHeaders });
    }

    // OBTENER NOTIFICACIONES EN VIVO (GET /api/notifications)
    if (pathname === "/api/notifications" && request.method === "GET") {
      const userId = url.searchParams.get("userId") || request.headers.get("x-user-id");
      let notifs: any[] = [];
      if (env && env.DB) {
        if (userId) {
          // Filtrado estricto por cuenta: únicamente notificaciones asignadas a este usuario
          const res = await env.DB.prepare(`
            SELECT * FROM antigravity_notifications 
            WHERE user_id = ?
            AND (type != 'user_registered' OR ? = 'usr-admin-1')
            ORDER BY created_at DESC LIMIT 50
          `).bind(userId, userId).all();
          notifs = res.results || [];
        } else {
          notifs = [];
        }
      }
      return new Response(JSON.stringify(notifs.map((n) => ({
        id: n.id,
        agentName: n.agent_name || n.agentName || "Antigravity AI",
        title: n.title,
        message: n.message,
        type: n.type || "agent_notification",
        projectId: n.project_id || n.projectId || "",
        userId: n.user_id || n.userId,
        read: Boolean(n.read),
        createdAt: n.created_at || n.createdAt,
      }))), { headers: jsonHeaders });
    }

    // ACCIONES EN TAREAS: Verify, Reject, Unlock
    if (pathname.includes("/verify") && request.method === "POST") {
      const taskId = pathname.split("/")[3];
      const body = await request.json().catch(() => ({}));
      if (env && env.DB && taskId) {
        await env.DB.prepare("UPDATE antigravity_tasks SET status = 'verified', locked = 1, human_feedback = ?, verified_at = ? WHERE id = ?")
          .bind(body.notes || "Verificada y aprobada por humano.", new Date().toISOString(), taskId)
          .run();
        const updated = await env.DB.prepare("SELECT * FROM antigravity_tasks WHERE id = ?").bind(taskId).first() as any;

        if (updated) {
          // Extraer archivos modificados para bloquearlos inmutablemente
          let filesToLock: string[] = [];
          try {
            if (updated.modified_files) {
              const p = JSON.parse(updated.modified_files);
              if (Array.isArray(p)) filesToLock.push(...p);
            }
          } catch (e) {}

          const audits = await env.DB.prepare("SELECT modified_files FROM antigravity_chat_audit WHERE task_id = ?").bind(taskId).all().catch(() => ({ results: [] }));
          for (const a of (audits.results || [])) {
            try {
              if (a.modified_files) {
                const parsed = JSON.parse(a.modified_files);
                if (Array.isArray(parsed)) filesToLock.push(...parsed);
              }
            } catch (e) {}
          }
          filesToLock = Array.from(new Set(filesToLock.filter(Boolean)));

          // Agregar al candado inmutable de locked_files en antigravity_projects
          if (updated.project_id && filesToLock.length > 0) {
            const proj = await env.DB.prepare("SELECT locked_files FROM antigravity_projects WHERE id = ?").bind(updated.project_id).first().catch(() => null);
            let currentLocked: string[] = [];
            try {
              if (proj && proj.locked_files) {
                currentLocked = JSON.parse(proj.locked_files);
              }
            } catch (e) {}
            const newLocked = Array.from(new Set([...currentLocked, ...filesToLock]));
            await env.DB.prepare("UPDATE antigravity_projects SET locked_files = ?, updated_at = datetime('now') WHERE id = ?")
              .bind(JSON.stringify(newLocked), updated.project_id)
              .run().catch(() => {});
          }

          // Actualizar estado de auditorías de chat asociadas
          await env.DB.prepare("UPDATE antigravity_chat_audit SET status = 'verified' WHERE task_id = ?").bind(taskId).run().catch(() => {});

          // Auto-indexar cápsula en antigravity_rag_memory para ahorro de tokens
          if (updated.project_id) {
            const ragId = "rag-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
            const snippetContent = `[APROBADO]: ${updated.title}\nFeedback Humano: ${body.notes || updated.instruction || "Verificado correctamente."}\nArchivos Inmutables: ${filesToLock.join(", ") || "N/A"}`;
            await env.DB.prepare(`
              INSERT INTO antigravity_rag_memory (id, project_id, component_tag, title, content_snippet, rules_summary, token_weight, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `).bind(
              ragId,
              updated.project_id,
              (updated.title || "general").slice(0, 30),
              `Aprobado: ${updated.title}`,
              snippetContent,
              `Archivos bloqueados bajo Quality Gate: ${filesToLock.join(", ") || "N/A"}`,
              Math.round(snippetContent.length / 4)
            ).run().catch(() => {});
          }

          const histId = "hist-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
          await env.DB.prepare(`
            INSERT INTO antigravity_history (id, task_id, project_id, task_title, action, previous_status, new_status, details, work_url, author, timestamp)
            VALUES (?, ?, ?, ?, 'feature_approved', 'ready_for_review', 'verified', ?, ?, ?, ?)
          `).bind(
            histId,
            updated.id,
            updated.project_id || "",
            updated.title || "Funcionalidad Aprobada",
            `✅ FUNCIONALIDAD APROBADA POR HUMANO: ${body.notes || updated.instruction || "Verificada y blindada con Quality Gate."} (${filesToLock.length} archivos protegidos)`,
            updated.work_url || "",
            body.author || request.headers.get("x-user-name") || "USUARIO HUMANO",
            new Date().toISOString()
          ).run().catch(() => {});
        }

        return new Response(JSON.stringify({ success: true, task: updated }), { headers: jsonHeaders });
      }
      return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
    }

    if (pathname.includes("/reject") && request.method === "POST") {
      const taskId = pathname.split("/")[3];
      const body = await request.json().catch(() => ({}));
      if (env && env.DB && taskId) {
        const feedbackText = body.feedback || "Revisada en vivo: requiere ajustes.";
        await env.DB.prepare("UPDATE antigravity_tasks SET status = 'needs_revision', locked = 0, human_feedback = ? WHERE id = ?")
          .bind(feedbackText, taskId)
          .run();
        await env.DB.prepare("UPDATE antigravity_chat_audit SET status = 'needs_revision' WHERE task_id = ?").bind(taskId).run().catch(() => {});
        const updated = await env.DB.prepare("SELECT * FROM antigravity_tasks WHERE id = ?").bind(taskId).first() as any;

        if (updated) {
          const histId = "hist-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
          await env.DB.prepare(`
            INSERT INTO antigravity_history (id, task_id, project_id, task_title, action, previous_status, new_status, details, work_url, author, timestamp)
            VALUES (?, ?, ?, ?, 'feature_rejected', 'ready_for_review', 'needs_revision', ?, ?, ?, ?)
          `).bind(
            histId,
            updated.id,
            updated.project_id || "",
            updated.title || "Tarea Incompleta",
            `⚠️ NO FUNCIONA (REPORTE HUMANO): ${feedbackText}`,
            updated.work_url || "",
            body.author || request.headers.get("x-user-name") || "USUARIO HUMANO",
            new Date().toISOString()
          ).run().catch(() => {});

          await env.DB.prepare(`
            INSERT INTO antigravity_agent_connections (id, agent_name, connected_at, action_description, project_name, user_id)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            "conn-" + Date.now(),
            "USUARIO HUMANO",
            new Date().toISOString(),
            `Fallo reportado por humano ("No Funciona"): '${feedbackText}'`,
            updated.title || "",
            null
          ).run().catch(() => {});
        }

        return new Response(JSON.stringify({ success: true, task: updated }), { headers: jsonHeaders });
      }
      return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
    }

    if (pathname.includes("/unlock") && request.method === "POST") {
      const taskId = pathname.split("/")[3];
      if (env && env.DB && taskId) {
        await env.DB.prepare("UPDATE antigravity_tasks SET status = 'pending', locked = 0 WHERE id = ?").bind(taskId).run();
        await env.DB.prepare("UPDATE antigravity_chat_audit SET status = 'pending_review' WHERE task_id = ?").bind(taskId).run().catch(() => {});
        const updated = await env.DB.prepare("SELECT * FROM antigravity_tasks WHERE id = ?").bind(taskId).first();
        return new Response(JSON.stringify({ success: true, task: updated }), { headers: jsonHeaders });
      }
      return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
    }

    if (pathname.startsWith("/api/tasks/") && request.method === "DELETE") {
      const taskId = pathname.split("/")[3];
      if (env && env.DB && taskId) {
        await env.DB.prepare("DELETE FROM antigravity_tasks WHERE id = ?").bind(taskId).run();
      }
      return new Response(JSON.stringify({ success: true, deletedTaskId: taskId }), { headers: jsonHeaders });
    }

    // --- AGENT CONNECTIONS & HISTORY ---
    if (pathname === "/api/agent-connections" && request.method === "GET") {
      const userId = url.searchParams.get("userId") || request.headers.get("x-user-id");
      let conns: any[] = [];
      if (env && env.DB) {
        if (userId) {
          const res = await env.DB.prepare("SELECT * FROM antigravity_agent_connections WHERE user_id = ? ORDER BY connected_at DESC LIMIT 50").bind(userId).all();
          conns = res.results || [];
        } else {
          const res = await env.DB.prepare("SELECT * FROM antigravity_agent_connections ORDER BY connected_at DESC LIMIT 50").all();
          conns = res.results || [];
        }
      }
      return new Response(JSON.stringify(conns.map((c) => ({
        id: c.id,
        agentName: c.agent_name,
        connectedAt: c.connected_at,
        actionDescription: c.action_description || "Conexión a la API del proyecto",
        projectName: c.project_name || "",
        userId: c.user_id,
      }))), { headers: jsonHeaders });
    }

    if (pathname === "/api/agent-connections" && request.method === "DELETE") {
      const userId = url.searchParams.get("userId") || request.headers.get("x-user-id");
      if (env && env.DB) {
        if (userId) {
          await env.DB.prepare("DELETE FROM antigravity_agent_connections WHERE user_id = ?").bind(userId).run();
        } else {
          await env.DB.prepare("DELETE FROM antigravity_agent_connections").run();
        }
      }
      return new Response(JSON.stringify({ success: true, message: "Historial de conexiones borrado correctamente." }), { headers: jsonHeaders });
    }

    if (pathname === "/api/agent-connections" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const apiKeyHeader = request.headers.get("x-api-key") || body.apiKey;
      let targetUserId = request.headers.get("x-user-id") || body.userId;

      if (!targetUserId && env && env.DB && apiKeyHeader) {
        const ownerProj = await env.DB.prepare("SELECT user_id FROM antigravity_projects WHERE api_key = ?").bind(apiKeyHeader).first();
        if (ownerProj && ownerProj.user_id) {
          targetUserId = ownerProj.user_id;
        } else {
          const ownerUser = await env.DB.prepare("SELECT id FROM antigravity_users WHERE pin = ? OR id = ?").bind(apiKeyHeader, apiKeyHeader).first();
          if (ownerUser && ownerUser.id) {
            targetUserId = ownerUser.id;
          }
        }
      }

      const newConn = {
        id: "conn-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        agent_name: (
          request.headers.get("x-agent-name") ||
          body.agentName ||
          body.agent_name ||
          body.author ||
          body.creatorName ||
          "CODEX AI"
        ).trim(),
        connected_at: new Date().toISOString(),
        action_description: body.actionDescription || "Conexión vía API REST",
        project_name: body.projectName || "",
        user_id: targetUserId || null,
      };

      if (env && env.DB) {
        await env.DB.prepare(`
          INSERT INTO antigravity_agent_connections (id, agent_name, connected_at, action_description, project_name, user_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(newConn.id, newConn.agent_name, newConn.connected_at, newConn.action_description, newConn.project_name, newConn.user_id).run().catch(() => {});
      }

      return new Response(JSON.stringify({
        id: newConn.id,
        agentName: newConn.agent_name,
        connectedAt: newConn.connected_at,
        actionDescription: newConn.action_description,
        projectName: newConn.project_name,
        userId: newConn.user_id,
      }), { status: 201, headers: jsonHeaders });
    }

    // --- AGENTES BLOQUEADOS / GESTIÓN DE PERMISOS ---
    if (pathname === "/api/blocked-agents" && request.method === "GET") {
      const userId = url.searchParams.get("userId") || request.headers.get("x-user-id");
      let list: any[] = [];
      if (env && env.DB) {
        if (userId) {
          const res = await env.DB.prepare("SELECT * FROM antigravity_blocked_agents WHERE user_id = ? OR user_id IS NULL OR user_id = '' ORDER BY blocked_at DESC").bind(userId).all();
          list = res.results || [];
        } else {
          const res = await env.DB.prepare("SELECT * FROM antigravity_blocked_agents ORDER BY blocked_at DESC").all();
          list = res.results || [];
        }
      }
      return new Response(JSON.stringify(list.map((b) => ({
        id: b.id,
        agentName: b.agent_name || b.agentName,
        userId: b.user_id || b.userId,
        blockedAt: b.blocked_at || b.blockedAt,
        reason: b.reason || "Bloqueado por el usuario",
      }))), { headers: jsonHeaders });
    }

    if (pathname === "/api/blocked-agents/toggle" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const agentName = (body.agentName || "").trim();
      const userId = body.userId || request.headers.get("x-user-id") || null;
      const reason = body.reason || "Bloqueado por el usuario en la interfaz.";

      if (!agentName) {
        return new Response(JSON.stringify({ error: "Nombre de agente requerido." }), { status: 400, headers: jsonHeaders });
      }

      let isBlocked = false;
      if (env && env.DB) {
        const existing = await env.DB.prepare("SELECT id FROM antigravity_blocked_agents WHERE UPPER(agent_name) = ?").bind(agentName.toUpperCase()).first();
        if (existing) {
          await env.DB.prepare("DELETE FROM antigravity_blocked_agents WHERE UPPER(agent_name) = ?").bind(agentName.toUpperCase()).run();
          isBlocked = false;
        } else {
          const id = "block-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
          await env.DB.prepare("INSERT INTO antigravity_blocked_agents (id, agent_name, user_id, blocked_at, reason) VALUES (?, ?, ?, ?, ?)")
            .bind(id, agentName, userId, new Date().toISOString(), reason).run();
          isBlocked = true;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        agentName,
        isBlocked,
        message: isBlocked ? `El agente '${agentName}' ha sido bloqueado exitosamente.` : `El agente '${agentName}' ha sido desbloqueado.`,
      }), { headers: jsonHeaders });
    }

    if (pathname === "/api/history" && request.method === "GET") {
      const userId = url.searchParams.get("userId") || request.headers.get("x-user-id");
      const projectId = url.searchParams.get("projectId");
      const taskId = url.searchParams.get("taskId");

      let hist: any[] = [];
      if (env && env.DB) {
        if (taskId) {
          const res = await env.DB.prepare("SELECT * FROM antigravity_history WHERE task_id = ? ORDER BY timestamp DESC LIMIT 100").bind(taskId).all();
          hist = res.results || [];
        } else if (projectId) {
          const res = await env.DB.prepare("SELECT * FROM antigravity_history WHERE project_id = ? ORDER BY timestamp DESC LIMIT 100").bind(projectId).all();
          hist = res.results || [];
        } else if (userId) {
          const res = await env.DB.prepare(`
            SELECT DISTINCT h.* FROM antigravity_history h
            LEFT JOIN antigravity_projects p ON h.project_id = p.id
            WHERE p.user_id = ? OR h.author = 'SISTEMA ARQAI' OR h.task_id = ?
            ORDER BY h.timestamp DESC
            LIMIT 100
          `).bind(userId, userId).all();
          hist = res.results || [];
        } else {
          const res = await env.DB.prepare("SELECT * FROM antigravity_history ORDER BY timestamp DESC LIMIT 100").all();
          hist = res.results || [];
        }
      }
      return new Response(JSON.stringify(hist.map((h) => ({
        id: h.id,
        taskId: h.task_id,
        projectId: h.project_id,
        taskTitle: h.task_title,
        action: h.action,
        previousStatus: h.previous_status,
        newStatus: h.new_status,
        details: h.details,
        workUrl: h.work_url,
        author: h.author,
        timestamp: h.timestamp,
      }))), { headers: jsonHeaders });
    }

    if (pathname.startsWith("/api/history/") && request.method === "DELETE") {
      const historyId = pathname.split("/")[3];
      if (env && env.DB && historyId) {
        await env.DB.prepare("DELETE FROM antigravity_history WHERE id = ?").bind(historyId).run().catch(() => {});
      }
      return new Response(JSON.stringify({ success: true, deletedHistoryId: historyId, message: "Registro del historial eliminado correctamente." }), { headers: jsonHeaders });
    }

    if (pathname === "/api/history" && request.method === "DELETE") {
      const userId = url.searchParams.get("userId") || request.headers.get("x-user-id");
      const projectId = url.searchParams.get("projectId");
      if (env && env.DB) {
        if (projectId) {
          await env.DB.prepare("DELETE FROM antigravity_history WHERE project_id = ?").bind(projectId).run();
        } else if (userId) {
          await env.DB.prepare("DELETE FROM antigravity_history WHERE project_id IN (SELECT id FROM antigravity_projects WHERE user_id = ?)").bind(userId).run();
        } else {
          await env.DB.prepare("DELETE FROM antigravity_history").run();
        }
      }
      return new Response(JSON.stringify({ success: true, message: "Historial de cambios borrado correctamente." }), { headers: jsonHeaders });
    }

    if (pathname === "/api/history" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const newEntry = {
        id: "hist-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        task_id: body.taskId || body.projectId || "manual-entry",
        project_id: body.projectId || "",
        task_title: body.title || body.taskTitle || "Cambio Registrado",
        action: body.action || "manual_update",
        previous_status: "",
        new_status: "logged",
        details: body.details || "",
        work_url: body.workUrl || "",
        author: body.author || request.headers.get("x-agent-name") || request.headers.get("x-user-name") || "USUARIO",
        timestamp: new Date().toISOString(),
      };

      if (env && env.DB) {
        await env.DB.prepare(`
          INSERT INTO antigravity_history (id, task_id, project_id, task_title, action, previous_status, new_status, details, work_url, author, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          newEntry.id,
          newEntry.task_id,
          newEntry.project_id,
          newEntry.task_title,
          newEntry.action,
          newEntry.previous_status,
          newEntry.new_status,
          newEntry.details,
          newEntry.work_url,
          newEntry.author,
          newEntry.timestamp
        ).run().catch(() => {});
      }

      return new Response(JSON.stringify({
        success: true,
        entry: {
          id: newEntry.id,
          taskId: newEntry.task_id,
          projectId: newEntry.project_id,
          taskTitle: newEntry.task_title,
          action: newEntry.action,
          previousStatus: newEntry.previous_status,
          newStatus: newEntry.new_status,
          details: newEntry.details,
          workUrl: newEntry.work_url,
          author: newEntry.author,
          timestamp: newEntry.timestamp,
        }
      }), { status: 201, headers: jsonHeaders });
    }

    // BATCH PLAN SYNC (POST /api/projects/:id/plan/batch)
    if (pathname.includes("/plan/batch") && request.method === "POST") {
      const parts = pathname.split("/");
      const projId = parts[3];
      const body = await request.json().catch(() => ({}));
      const modules = body.modules || [];
      const stages = body.stages || [];
      const tasks = body.tasks || [];

      if (env && env.DB && projId) {
        // 1. Insertar Módulos en D1
        for (let i = 0; i < modules.length; i++) {
          const m = modules[i];
          const modId = m.id || ("mod-" + Date.now() + "-" + i);
          await env.DB.prepare(`
            INSERT OR REPLACE INTO antigravity_modules (id, project_id, title, description, order_num, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(modId, projId, m.title || "Nuevo Módulo", m.description || "", m.order || (i + 1), new Date().toISOString()).run().catch((e) => console.warn("Error ins mod:", e));
        }

        // 2. Insertar Etapas en D1
        for (let i = 0; i < stages.length; i++) {
          const s = stages[i];
          const stgId = s.id || ("stg-" + Date.now() + "-" + i);
          await env.DB.prepare(`
            INSERT OR REPLACE INTO antigravity_stages (id, module_id, project_id, title, description, order_num, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(stgId, s.moduleId || "", projId, s.name || s.title || "Nueva Etapa", s.description || "", s.order || (i + 1), new Date().toISOString()).run().catch((e) => console.warn("Error ins stg:", e));
        }

        // 3. Insertar Tareas en D1
        for (let i = 0; i < tasks.length; i++) {
          const t = tasks[i];
          const taskId = t.id || ("tsk-" + Date.now() + "-" + i);
          await env.DB.prepare(`
            INSERT OR REPLACE INTO antigravity_tasks (id, project_id, module_id, stage_id, title, description, status, priority, test_url, human_notes, author, order_num, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            taskId,
            projId,
            t.moduleId || "",
            t.stageId || "",
            t.title || "Nueva Tarea",
            t.description || "",
            t.status || "pending",
            t.priority || "medium",
            t.testUrl || "",
            t.humanVerificationNotes || t.humanNotes || "",
            t.author || "Antigravity AI",
            t.order || (i + 1),
            new Date().toISOString(),
            new Date().toISOString()
          ).run().catch((e) => console.warn("Error ins tsk:", e));
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Plan de Acción completo insertado exitosamente en Cloudflare D1.",
          projectId: projId,
          insertedModulesCount: modules.length,
          insertedStagesCount: stages.length,
          insertedTasksCount: tasks.length,
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Response genérica
    return new Response(
      JSON.stringify({ status: "ok", service: "ARQAI Cloudflare Pages Functions", path: pathname }),
      { headers: jsonHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Error en Cloudflare Pages Function" }),
      { status: 500, headers: jsonHeaders }
    );
  }
}
