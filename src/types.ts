export type TaskStatus =
  | "pending" // Pendiente / Asignada
  | "in_progress" // En progreso por Antigravity
  | "ready_for_review" // Completada por IA, pendiente de revisión humana
  | "verified" // Verificada y Aprobada por humano (Bloqueada)
  | "needs_revision"; // Requiere ajustes / Rechazada tras revisión humana

export interface ProjectScreen {
  id: string;
  name: string;
  path?: string;
  description?: string;
  features: string[];
}

export interface ProjectConnection {
  id: string;
  name: string;
  type: "database" | "auth" | "api" | "storage" | "webhook" | "other";
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
  lockedFiles?: string[];
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
  notes?: string;
}

export interface TaskItem {
  id: string;
  projectId: string;
  moduleId?: string;
  stageId?: string;
  title: string;
  instruction: string;
  status: TaskStatus;
  workUrl: string;
  aiOutput?: string;
  aiNotes?: string;
  humanFeedback?: string;
  locked: boolean;
  assignedAgent?: string;
  subtasks?: SubTaskItem[];
  gitBranch?: string;
  gitCommit?: string;
  modifiedFiles?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  verifiedAt?: string;
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

export type FilterStatus = TaskStatus | "all";

export interface AgentConnection {
  id: string;
  agentName: string;
  connectedAt: string;
  actionDescription?: string;
  projectName?: string;
}

export interface User {
  id: string;
  name: string;
  pin: string;
  email?: string;
  apiKey?: string;
  accessType: string;
  createdAt: string;
}

export interface AgentNotification {
  id: string;
  agentName: string;
  title: string;
  message: string;
  type: string;
  projectId?: string;
  userId?: string;
  read: boolean;
  createdAt: string;
}

export interface BlockedAgent {
  id: string;
  agentName: string;
  userId?: string;
  blockedAt: string;
  reason?: string;
}

export interface ChatAuditEntry {
  id: string;
  projectId: string;
  taskId?: string;
  userPrompt: string;
  aiSummary?: string;
  modifiedFiles?: string[];
  workUrl?: string;
  status: "pending_review" | "verified" | "needs_revision";
  agentName?: string;
  createdAt: string;
}

export interface RagMemorySnippet {
  id: string;
  projectId: string;
  componentTag?: string;
  title: string;
  contentSnippet: string;
  rulesSummary?: string;
  tokenWeight?: number;
  createdAt: string;
}
