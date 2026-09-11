import {
  Project,
  ProjectModule,
  ProjectStage,
  TaskItem,
  ChangeLogEntry,
  TaskStatus,
  TaskContextMemory,
  SubTaskItem,
  AgentConnection,
  User,
  AgentNotification,
  BlockedAgent,
} from "../types";

const BASE_URL = "/api";

async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
  fallbackErrorMessage: string = "Error de comunicación con el servidor"
): Promise<T> {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    if (!res.ok) {
      throw new Error(`Servidor ocupado o reiniciándose (Código ${res.status}). Por favor reintente.`);
    }
    throw new Error(`Respuesta del servidor no válida (HTTP ${res.status}).`);
  }

  const data = await res.json().catch(() => {
    throw new Error(`Error al procesar los datos recibidos del servidor.`);
  });

  if (!res.ok) {
    throw new Error(data?.error || data?.message || fallbackErrorMessage);
  }

  return data as T;
}

export async function fetchAgentConnections(userId?: string): Promise<AgentConnection[]> {
  const url = userId ? `${BASE_URL}/agent-connections?userId=${encodeURIComponent(userId)}` : `${BASE_URL}/agent-connections`;
  return safeFetchJson<AgentConnection[]>(
    url,
    userId ? { headers: { "x-user-id": userId } } : undefined,
    "Error al obtener conexiones de agentes"
  );
}

export async function clearAgentConnections(userId?: string): Promise<boolean> {
  const url = userId ? `${BASE_URL}/agent-connections?userId=${encodeURIComponent(userId)}` : `${BASE_URL}/agent-connections`;
  await safeFetchJson<{ success: boolean }>(
    url,
    {
      method: "DELETE",
      ...(userId ? { headers: { "x-user-id": userId } } : {}),
    },
    "Error al borrar conexiones"
  );
  return true;
}

export async function createAgentConnection(agentName: string, data?: {
  actionDescription?: string;
  projectName?: string;
  userId?: string;
}): Promise<AgentConnection> {
  return safeFetchJson<AgentConnection>(
    `${BASE_URL}/agent-connections`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentName,
        actionDescription: data?.actionDescription,
        projectName: data?.projectName,
        userId: data?.userId,
      }),
    },
    "Error al registrar conexión de agente"
  );
}

export function logUserAction(
  userName: string,
  actionDescription: string,
  projectName?: string,
  userId?: string
): void {
  createAgentConnection(`👤 ${userName}`, {
    actionDescription,
    projectName,
    userId,
  }).catch(() => {});
}

export async function fetchProjects(userId?: string): Promise<Project[]> {
  const params = new URLSearchParams();
  if (userId) params.append("userId", userId);
  return safeFetchJson<Project[]>(
    `${BASE_URL}/projects?${params.toString()}`,
    userId ? { headers: { "x-user-id": userId } } : undefined,
    "Error al obtener proyectos"
  );
}

export async function createProject(data: {
  name: string;
  mainUrl: string;
  description?: string;
  userId?: string;
  creatorName?: string;
  agentName?: string;
  blueprint?: any;
  autoGenerateBlueprint?: boolean;
}): Promise<Project> {
  return safeFetchJson<Project>(
    `${BASE_URL}/projects`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(data.userId ? { "x-user-id": data.userId } : {}),
      },
      body: JSON.stringify(data),
    },
    "Error al crear proyecto"
  );
}

export async function cloneProject(
  id: string,
  data?: { name?: string; userId?: string }
): Promise<Project> {
  return safeFetchJson<Project>(
    `${BASE_URL}/projects/${id}/clone`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(data?.userId ? { "x-user-id": data.userId } : {}),
      },
      body: JSON.stringify(data || {}),
    },
    "Error al clonar proyecto"
  );
}

export async function updateProject(
  id: string,
  data: { name?: string; mainUrl?: string; description?: string }
): Promise<Project> {
  return safeFetchJson<Project>(
    `${BASE_URL}/projects/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "Error al actualizar proyecto"
  );
}

export async function deleteProject(
  id: string,
  userId?: string
): Promise<{ success: boolean; deletedProjectId: string; deletedProjectName?: string; projects: Project[] }> {
  const url = userId ? `${BASE_URL}/projects/${id}?userId=${encodeURIComponent(userId)}` : `${BASE_URL}/projects/${id}`;
  return safeFetchJson(
    url,
    {
      method: "DELETE",
      headers: userId ? { "x-user-id": userId } : undefined,
    },
    "Error al eliminar proyecto"
  );
}

export async function deleteAllProjects(userId?: string): Promise<{
  success: boolean;
  message: string;
  projects: Project[];
}> {
  const url = userId
    ? `${BASE_URL}/projects?confirm=true&userId=${encodeURIComponent(userId)}`
    : `${BASE_URL}/projects?confirm=true`;
  return safeFetchJson(
    url,
    {
      method: "DELETE",
      headers: userId ? { "x-user-id": userId } : undefined,
    },
    "Error al eliminar todos los proyectos"
  );
}

export async function loadSampleTemplate(): Promise<{
  success: boolean;
  message: string;
  project: Project;
  modulesCount: number;
  tasksCount: number;
}> {
  return safeFetchJson(
    `${BASE_URL}/database/recreate-from-scratch`,
    {
      method: "POST",
    },
    "Error al cargar plantilla de ejemplo"
  );
}

// --- MODULES & STAGES ---
export async function fetchModules(projectId?: string): Promise<ProjectModule[]> {
  const params = new URLSearchParams();
  if (projectId) params.append("projectId", projectId);
  return safeFetchJson<ProjectModule[]>(
    `${BASE_URL}/modules?${params.toString()}`,
    undefined,
    "Error al obtener módulos"
  );
}

export async function createModule(data: {
  projectId: string;
  title: string;
  description?: string;
}): Promise<ProjectModule> {
  return safeFetchJson<ProjectModule>(
    `${BASE_URL}/modules`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "Error al crear módulo"
  );
}

export async function deleteModule(id: string): Promise<{ success: boolean }> {
  return safeFetchJson(
    `${BASE_URL}/modules/${id}`,
    {
      method: "DELETE",
    },
    "Error al eliminar módulo"
  );
}

export async function fetchStages(
  moduleId?: string,
  projectId?: string
): Promise<ProjectStage[]> {
  const params = new URLSearchParams();
  if (moduleId) params.append("moduleId", moduleId);
  if (projectId) params.append("projectId", projectId);
  return safeFetchJson<ProjectStage[]>(
    `${BASE_URL}/stages?${params.toString()}`,
    undefined,
    "Error al obtener etapas"
  );
}

export async function createStage(data: {
  moduleId: string;
  projectId: string;
  title: string;
  description?: string;
}): Promise<ProjectStage> {
  return safeFetchJson<ProjectStage>(
    `${BASE_URL}/stages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "Error al crear etapa"
  );
}

// --- TASKS ---
export async function fetchTasks(
  projectId?: string,
  status?: TaskStatus,
  moduleId?: string,
  stageId?: string
): Promise<TaskItem[]> {
  const params = new URLSearchParams();
  if (projectId) params.append("projectId", projectId);
  if (status) params.append("status", status);
  if (moduleId) params.append("moduleId", moduleId);
  if (stageId) params.append("stageId", stageId);

  const rawTasks = await safeFetchJson<any[]>(
    `${BASE_URL}/tasks?${params.toString()}`,
    undefined,
    "Error al obtener tareas"
  );

  return (rawTasks || []).map((t) => {
    let st = t.status;
    if (st === "completed" || st === "done" || st === "finished" || st === "complete") {
      st = "ready_for_review";
    }
    return { ...t, status: st };
  });
}

export async function createTask(data: {
  projectId: string;
  moduleId?: string;
  stageId?: string;
  title?: string;
  instruction: string;
  workUrl?: string;
  assignedAgent?: string;
  subtasks?: SubTaskItem[];
  contextMemory?: TaskContextMemory;
  imageRefs?: string[];
}): Promise<TaskItem> {
  return safeFetchJson<TaskItem>(
    `${BASE_URL}/tasks`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "Error al crear tarea"
  );
}

export async function updateTask(
  id: string,
  data: Partial<TaskItem>
): Promise<TaskItem> {
  return safeFetchJson<TaskItem>(
    `${BASE_URL}/tasks/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "Error al actualizar tarea"
  );
}

export async function verifyAndLockTask(
  id: string,
  notes?: string
): Promise<{ success: boolean; task: TaskItem; message: string }> {
  return safeFetchJson(
    `${BASE_URL}/tasks/${id}/verify`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    },
    "Error al verificar tarea"
  );
}

export async function rejectTask(
  id: string,
  feedback: string,
  imageRefs?: string[]
): Promise<{ success: boolean; task: TaskItem; message: string }> {
  return safeFetchJson(
    `${BASE_URL}/tasks/${id}/reject`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback, imageRefs }),
    },
    "Error al solicitar ajuste"
  );
}

export async function unlockTask(
  id: string
): Promise<{ success: boolean; task: TaskItem }> {
  return safeFetchJson(
    `${BASE_URL}/tasks/${id}/unlock`,
    {
      method: "POST",
    },
    "Error al desbloquear tarea"
  );
}

export async function updateTaskContextMemory(
  id: string,
  memory: TaskContextMemory
): Promise<{ success: boolean; contextMemory: TaskContextMemory; task: TaskItem }> {
  return safeFetchJson(
    `${BASE_URL}/tasks/${id}/context-memory`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memory),
    },
    "Error al actualizar memoria de contexto"
  );
}

export async function updateTaskSubtasks(
  id: string,
  subtasks: SubTaskItem[]
): Promise<{ success: boolean; subtasks: SubTaskItem[] }> {
  return safeFetchJson(
    `${BASE_URL}/tasks/${id}/subtasks`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtasks }),
    },
    "Error al actualizar subtareas"
  );
}

export async function deleteTask(
  id: string
): Promise<{ success: boolean; deletedTaskId: string }> {
  return safeFetchJson(
    `${BASE_URL}/tasks/${id}`,
    {
      method: "DELETE",
    },
    "Error al eliminar tarea"
  );
}

// --- ANTIGRAVITY SPECIAL APIS ---
export async function fetchPendingCorrections(
  projectId?: string
): Promise<{ summary: string; count: number; tasksToFix: any[] }> {
  const params = new URLSearchParams();
  if (projectId) params.append("projectId", projectId);
  return safeFetchJson(
    `${BASE_URL}/antigravity/pending-corrections?${params.toString()}`,
    undefined,
    "Error al obtener correcciones pendientes"
  );
}

export async function generatePlanByModules(
  projectId: string,
  projectIdeaPrompt: string
): Promise<{
  success: boolean;
  message: string;
  modules: ProjectModule[];
  stages: ProjectStage[];
  tasks: TaskItem[];
}> {
  return safeFetchJson(
    `${BASE_URL}/antigravity/generate-plan`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, projectIdeaPrompt }),
    },
    "Error al generar el plan de módulos"
  );
}

// --- HISTORY & SIMULATION ---
export async function fetchHistory(
  userId?: string,
  projectId?: string,
  taskId?: string
): Promise<ChangeLogEntry[]> {
  const params = new URLSearchParams();
  if (userId) params.append("userId", userId);
  if (projectId) params.append("projectId", projectId);
  if (taskId) params.append("taskId", taskId);

  return safeFetchJson<ChangeLogEntry[]>(
    `${BASE_URL}/history?${params.toString()}`,
    undefined,
    "Error al obtener historial"
  );
}

export async function clearHistory(userId?: string): Promise<{ success: boolean }> {
  const params = new URLSearchParams();
  if (userId) params.append("userId", userId);
  return safeFetchJson(
    `${BASE_URL}/history?${params.toString()}`,
    {
      method: "DELETE",
    },
    "Error al limpiar historial"
  );
}

export async function deleteHistoryEntry(id: string): Promise<{ success: boolean; deletedHistoryId: string }> {
  return safeFetchJson(
    `${BASE_URL}/history/${id}`,
    {
      method: "DELETE",
    },
    "Error al eliminar registro del historial"
  );
}

export async function addChangelogEntry(data: {
  projectId: string;
  title: string;
  details?: string;
  action?: string;
  author?: string;
  workUrl?: string;
}): Promise<{ success: boolean; entry: ChangeLogEntry }> {
  return safeFetchJson(
    `${BASE_URL}/history`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "Error al registrar cambio"
  );
}

export async function simulateAgentAction(data: {
  taskId: string;
  actionType: "start" | "complete";
  workUrl?: string;
  customNotes?: string;
}): Promise<{ success: boolean; task: TaskItem }> {
  return safeFetchJson(
    `${BASE_URL}/agent/simulate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "Error en la simulación"
  );
}

// --- PROJECT BLUEPRINT & MANUAL ARCHITECTURE ---
export async function fetchBlueprint(projectId: string): Promise<{
  projectId: string;
  projectName: string;
  mainUrl: string;
  blueprint: any;
  instructionsForAntigravity: string;
  populatePlanEndpoint: string;
  populatePlanMethod: string;
  expectedPlanPayloadFormat: any;
}> {
  return safeFetchJson(
    `${BASE_URL}/projects/${projectId}/blueprint`,
    undefined,
    "Error al obtener el blueprint del proyecto"
  );
}

export async function saveBlueprint(
  projectId: string,
  blueprintData: any
): Promise<{ success: boolean; blueprint: any; project: Project }> {
  return safeFetchJson(
    `${BASE_URL}/projects/${projectId}/blueprint`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blueprintData),
    },
    "Error al guardar el blueprint del proyecto"
  );
}

export async function generateBlueprint(
  projectId: string,
  data?: { idea?: string; name?: string; prompt?: string }
): Promise<{ success: boolean; message: string; blueprint: any; projectId: string }> {
  return safeFetchJson(
    `${BASE_URL}/projects/${projectId}/generate-blueprint`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || {}),
    },
    "Error al generar el blueprint del proyecto"
  );
}

export async function populatePlan(
  projectId: string,
  data: { modules: any[]; clearExisting?: boolean }
): Promise<{
  success: boolean;
  message: string;
  createdModulesCount: number;
  createdStagesCount: number;
  createdTasksCount: number;
}> {
  return safeFetchJson(
    `${BASE_URL}/projects/${projectId}/populate-plan`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "Error al poblar el plan de acción"
  );
}

export async function generatePlanFromBlueprint(projectId: string): Promise<{
  success: boolean;
  message: string;
  createdModulesCount: number;
  createdStagesCount: number;
  createdTasksCount: number;
}> {
  return safeFetchJson(
    `${BASE_URL}/projects/${projectId}/generate-plan-from-blueprint`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    "Error al generar el plan desde el blueprint"
  );
}

// --- NEON POSTGRESQL ---
export interface NeonDatabaseStatus {
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
  hasNeonApiKey?: boolean;
  hasDatabaseUrl?: boolean;
}

export async function fetchNeonStatus(): Promise<NeonDatabaseStatus> {
  return safeFetchJson<NeonDatabaseStatus>(
    `${BASE_URL}/neon/status`,
    undefined,
    "Error al obtener estado de Neon"
  );
}

export async function reconnectNeon(): Promise<NeonDatabaseStatus> {
  return safeFetchJson<NeonDatabaseStatus>(
    `${BASE_URL}/neon/reconnect`,
    {
      method: "POST",
    },
    "Error al reconectar con Neon"
  );
}

export async function testNeonConnection(): Promise<{
  success: boolean;
  latencyMs: number;
  result?: any;
  error?: string;
}> {
  return safeFetchJson(
    `${BASE_URL}/neon/test`,
    {
      method: "POST",
    },
    "Error al probar la base de datos Neon"
  );
}

export async function syncNeonDatabase(direction: "to_neon" | "from_neon" = "to_neon"): Promise<{
  success: boolean;
  message: string;
  dbSummary?: any;
}> {
  return safeFetchJson(
    `${BASE_URL}/neon/sync`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    },
    "Error al sincronizar con Neon"
  );
}

export async function recreateDatabaseFromScratch(): Promise<{
  success: boolean;
  message: string;
  neonResult?: any;
  project?: Project;
  summary?: {
    projects: number;
    modules: number;
    stages: number;
    tasks: number;
  };
}> {
  return safeFetchJson(
    `${BASE_URL}/database/recreate-from-scratch`,
    {
      method: "POST",
    },
    "Error al recrear la base de datos desde cero"
  );
}

export async function recreateNeonTables(): Promise<{
  success: boolean;
  message: string;
  tablesCreated: string[];
  sqlExecuted?: string;
  error?: string;
}> {
  return safeFetchJson(
    `${BASE_URL}/neon/recreate-all-tables`,
    {
      method: "POST",
    },
    "Error al recrear tablas en Neon"
  );
}

export async function loginUser(name: string, pin: string, email?: string) {
  return safeFetchJson(
    `${BASE_URL}/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pin, email }),
    },
    "Error al iniciar sesión"
  );
}

export async function registerUser(name: string, pin: string, email?: string, accessType?: string) {
  return safeFetchJson(
    `${BASE_URL}/users`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pin, email, accessType }),
    },
    "Error al registrar usuario en la base de datos"
  );
}

export async function deleteUser(userId: string) {
  return safeFetchJson<{ success: boolean; message?: string }>(
    `${BASE_URL}/users/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
    },
    "Error al eliminar el usuario de la base de datos"
  );
}

export async function loginWithPin(pin: string) {
  return safeFetchJson(
    `${BASE_URL}/auth/login-pin`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    },
    "Error al iniciar sesión con PIN"
  );
}

export async function updateUserEmail(id: string, email: string) {
  return safeFetchJson(
    `${BASE_URL}/auth/update`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, email }),
    },
    "Error al actualizar correo"
  );
}

export async function fetchUsers(requesterUserId?: string, requesterUserPin?: string): Promise<User[]> {
  const headers: Record<string, string> = {};
  if (requesterUserId) {
    headers["x-user-id"] = requesterUserId;
  }
  if (requesterUserPin) {
    headers["x-user-pin"] = requesterUserPin;
  }
  const res = await fetch('/api/users', { headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || 'Error al obtener la lista de usuarios');
  }
  return res.json();
}

export async function getUserProfile(id: string) {
  return safeFetchJson(
    `${BASE_URL}/auth/user/${encodeURIComponent(id)}`,
    {},
    "Error al obtener perfil de usuario"
  );
}

export async function fetchNotifications(userId?: string, projectId?: string): Promise<AgentNotification[]> {
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  if (projectId) params.set("projectId", projectId);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return safeFetchJson<AgentNotification[]>(
    `${BASE_URL}/notifications${qs}`,
    userId ? { headers: { "x-user-id": userId } } : undefined,
    "Error al obtener notificaciones"
  ).catch(() => []);
}

export async function markNotificationAsRead(notifId: string): Promise<boolean> {
  await safeFetchJson(
    `${BASE_URL}/notifications/${encodeURIComponent(notifId)}/read`,
    { method: "POST" },
    "Error al marcar notificación como leída"
  ).catch(() => {});
  return true;
}

export async function markAllNotificationsAsRead(userId?: string): Promise<boolean> {
  await safeFetchJson(
    `${BASE_URL}/notifications/mark-all-read`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    },
    "Error al marcar todas las notificaciones como leídas"
  ).catch(() => {});
  return true;
}

export async function deleteNotification(notifId: string): Promise<boolean> {
  await safeFetchJson(
    `${BASE_URL}/notifications/${encodeURIComponent(notifId)}`,
    { method: "DELETE" },
    "Error al eliminar la notificación"
  ).catch(() => {});
  return true;
}

export async function clearNotifications(userId?: string): Promise<boolean> {
  const url = userId ? `${BASE_URL}/notifications/clear?userId=${encodeURIComponent(userId)}` : `${BASE_URL}/notifications/clear`;
  await safeFetchJson(
    url,
    {
      method: "DELETE",
      ...(userId ? { headers: { "x-user-id": userId } } : {}),
    },
    "Error al vaciar notificaciones"
  ).catch(() => {});
  return true;
}

export async function notifyUser(data: {
  agentName?: string;
  title: string;
  message: string;
  type?: string;
  projectId?: string;
  userId?: string;
}): Promise<any> {
  return safeFetchJson<any>(
    `${BASE_URL}/agent/notify-user`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "Error al emitir notificación"
  ).catch(() => null);
}

export async function fetchBlockedAgents(userId?: string): Promise<BlockedAgent[]> {
  const url = userId ? `${BASE_URL}/blocked-agents?userId=${encodeURIComponent(userId)}` : `${BASE_URL}/blocked-agents`;
  return safeFetchJson<BlockedAgent[]>(
    url,
    userId ? { headers: { "x-user-id": userId } } : undefined,
    "Error al obtener agentes bloqueados"
  ).catch(() => []);
}

export async function toggleBlockAgent(agentName: string, userId?: string, reason?: string): Promise<{ success: boolean; isBlocked: boolean; message: string }> {
  return safeFetchJson<{ success: boolean; isBlocked: boolean; message: string }>(
    `${BASE_URL}/blocked-agents/toggle`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(userId ? { "x-user-id": userId } : {}),
      },
      body: JSON.stringify({ agentName, userId, reason }),
    },
    "Error al cambiar estado de bloqueo del agente"
  );
}

// --- RAG & CLOUDFLARE VECTORIZE ---
export interface RagSearchResultItem {
  id: string;
  projectId: string;
  type: string;
  referenceId?: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  score: number;
}

export async function searchRag(
  query: string,
  options?: {
    projectId?: string;
    type?: "task" | "history" | "chat" | "rule" | "all";
    topK?: number;
    threshold?: number;
  }
): Promise<{ query: string; count: number; results: RagSearchResultItem[] }> {
  return safeFetchJson(
    `${BASE_URL}/rag/search`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, ...options }),
    },
    "Error al realizar búsqueda semántica RAG"
  );
}

export async function fetchAgentRagContext(
  projectId: string,
  taskTitle: string,
  taskInstruction?: string
): Promise<{
  promptContext: string;
  matchesCount: number;
  estimatedTokensSaved: number;
  items: RagSearchResultItem[];
}> {
  const params = new URLSearchParams();
  if (projectId) params.append("projectId", projectId);
  if (taskTitle) params.append("taskTitle", taskTitle);
  if (taskInstruction) params.append("taskInstruction", taskInstruction);

  return safeFetchJson(
    `${BASE_URL}/rag/context?${params.toString()}`,
    undefined,
    "Error al obtener contexto RAG para el agente"
  );
}

export async function reindexRag(projectId?: string): Promise<{
  success: boolean;
  message: string;
  tasksIndexed: number;
  historyIndexed: number;
  totalIndexed: number;
}> {
  return safeFetchJson(
    `${BASE_URL}/rag/reindex`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    },
    "Error al reindexar la base vectorial RAG"
  );
}


