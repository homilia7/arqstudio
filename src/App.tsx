import React, { useState, useEffect, useCallback, useRef } from "react";
import { DesktopMenuBar } from "./components/DesktopMenuBar";
import { ProjectCommandBar } from "./components/ProjectCommandBar";
import { CascadingHeader } from "./components/CascadingHeader";
import { AuditSidebar } from "./components/AuditSidebar";
import { MemoryLockfileSidebar } from "./components/MemoryLockfileSidebar";
import { AgentSupervisorView } from "./components/AgentSupervisorView";
import { MemoryRagView } from "./components/MemoryRagView";
import { SemanticGitView } from "./components/SemanticGitView";
import { IdeStatusBar } from "./components/IdeStatusBar";
import { TaskInputForm } from "./components/TaskInputForm";
import { TaskList } from "./components/TaskList";
import { ReviewModal } from "./components/ReviewModal";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { ApiDocumentationModal } from "./components/ApiDocumentationModal";
import { SimulateAgentModal } from "./components/SimulateAgentModal";
import { ContextMemoryModal } from "./components/ContextMemoryModal";
import { PlanGeneratorModal } from "./components/PlanGeneratorModal";
import { ManualArchitecturePanel } from "./components/ManualArchitecturePanel";
import { CloudflareD1Modal } from "./components/CloudflareD1Modal";
import { AgentConnectionsModal } from "./components/AgentConnectionsModal";
import { CreateProjectModal } from "./components/CreateProjectModal";
import { LoginScreen } from "./components/LoginScreen";
import { UserManualModal } from "./components/UserManualModal";
import { ApiKeyOnboardingModal } from "./components/ApiKeyOnboardingModal";
import { CloudflareEdgeModal } from "./components/CloudflareEdgeModal";
import { GatekeeperModal } from "./components/GatekeeperModal";
import { MyAccount } from "./components/MyAccount";
import { AdminUsersPanel } from "./components/AdminUsersPanel";
import { NotificationsDrawer } from "./components/NotificationsDrawer";
import { ProjectChangelogView } from "./components/ProjectChangelogView";
import {
  Project,
  TaskItem,
  ChangeLogEntry,
  FilterStatus,
  ProjectModule,
  ProjectStage,
  TaskContextMemory,
  User,
  AgentNotification,
  WorkspaceTab,
  AgentCommit,
} from "./types";
import * as api from "./services/api";
import {
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  ListTodo,
  Code2,
  Sparkles,
  History,
  Database,
  Layers
} from "lucide-react";

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [modules, setModules] = useState<ProjectModule[]>([]);
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [history, setHistory] = useState<ChangeLogEntry[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("qa_hub");
  const [isAgentRunning, setIsAgentRunning] = useState<boolean>(false);
  const [activeModelName, setActiveModelName] = useState<string>("gemini-3.8-flash");

  // Dockable sidebars state (matching AgentOS screenshot)
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(true);

  const [commits, setCommits] = useState<AgentCommit[]>([
    {
      id: "c-1",
      projectId: "default",
      agentName: "Antigravity AI",
      commitHash: "a8f1b2c",
      commitMessage: "feat: Arquitectura y persistencia Cloudflare D1",
      diffContent: "+ export async function init() {}",
      additions: 14,
      deletions: 0,
      tokensUsed: 620,
      isReverted: false,
      timestamp: "2026-09-05 11:45",
    }
  ]);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const isLoggedOut = localStorage.getItem("antigravity_logged_out") === "true";
      if (isLoggedOut) return null;

      const savedLocal = localStorage.getItem("antigravity_current_user");
      if (savedLocal) return JSON.parse(savedLocal);

      const savedSession = sessionStorage.getItem("antigravity_current_user");
      if (savedSession) return JSON.parse(savedSession);
    } catch (e) {
      console.warn("Error sesión:", e);
    }
    return {
      id: "usr-admin",
      name: "Elena Rostova",
      pin: "1234",
      accessType: "superadmin",
      role: "superadmin",
      createdAt: new Date().toISOString()
    };
  });

  const handleUpdateCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    try {
      if (user) {
        localStorage.setItem("antigravity_current_user", JSON.stringify(user));
        sessionStorage.setItem("antigravity_current_user", JSON.stringify(user));
        localStorage.removeItem("antigravity_logged_out");
      } else {
        localStorage.removeItem("antigravity_current_user");
        sessionStorage.removeItem("antigravity_current_user");
        localStorage.setItem("antigravity_logged_out", "true");
      }
    } catch (e) {
      console.warn("Error sesión:", e);
    }
  };

  // Modals state
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [userManualOpen, setUserManualOpen] = useState(false);
  const [apiKeyOnboardingOpen, setApiKeyOnboardingOpen] = useState(false);
  const [cloudflareEdgeOpen, setCloudflareEdgeOpen] = useState(false);
  const [gatekeeperOpen, setGatekeeperOpen] = useState(false);
  const [reviewTask, setReviewTask] = useState<TaskItem | null>(null);
  const [contextTask, setContextTask] = useState<TaskItem | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [apiDocsOpen, setApiDocsOpen] = useState(false);
  const [simulateTask, setSimulateTask] = useState<TaskItem | null>(null);
  const [planGeneratorOpen, setPlanGeneratorOpen] = useState(false);
  const [d1ModalOpen, setD1ModalOpen] = useState(false);
  const [agentConnectionsOpen, setAgentConnectionsOpen] = useState(false);
  const [myAccountOpen, setMyAccountOpen] = useState(false);
  const [adminUsersOpen, setAdminUsersOpen] = useState(false);
  const [notificationsDrawerOpen, setNotificationsDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Carga inicial de datos
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const projs = await api.fetchProjects(currentUser?.id);
      setProjects(projs);

      let current = activeProject;
      if (!current && projs.length > 0) {
        const savedId = localStorage.getItem("antigravity_active_project_id");
        current = projs.find((p) => p.id === savedId) || projs[0];
        setActiveProject(current);
      }

      if (current) {
        const [loadedTasks, loadedModules, loadedStages, loadedHistory] = await Promise.all([
          api.fetchTasks(current.id),
          api.fetchModules(current.id),
          api.fetchStages(current.id),
          api.fetchHistory(current.id)
        ]);
        setTasks(loadedTasks);
        setModules(loadedModules);
        setStages(loadedStages);
        setHistory(loadedHistory);
      }
    } catch (e) {
      console.error("Error al cargar datos:", e);
    } finally {
      if (!isSilent) setIsRefreshing(false);
    }
  }, [activeProject, currentUser]);

  useEffect(() => {
    loadData(true);
  }, []);

  const handleSelectProject = (proj: Project) => {
    setActiveProject(proj);
    localStorage.setItem("antigravity_active_project_id", proj.id);
    loadData(false);
  };

  const handleCreateProjectModalSubmit = async (data: { name: string; description?: string; mainUrl?: string }) => {
    try {
      const created = await api.createProject({
        name: data.name,
        description: data.description,
        mainUrl: data.mainUrl || "https://arqaistudio.pages.dev",
        userId: currentUser?.id
      });
      setProjects((prev) => [created, ...prev]);
      setActiveProject(created);
      showToast("Proyecto creado con éxito.", "success");
    } catch (e) {
      showToast("Error al crear proyecto", "error");
      throw e;
    }
  };

  const handleCloneProject = async (proj: Project) => {
    try {
      const cloned = await api.cloneProject(proj.id, currentUser?.id);
      setProjects((prev) => [cloned, ...prev]);
      setActiveProject(cloned);
      showToast("Proyecto clonado exitosamente.", "success");
    } catch (e) {
      showToast("Error al clonar", "error");
    }
  };

  const handleDeleteProject = async (proj: Project) => {
    if (!confirm(`¿Eliminar el proyecto "${proj.name}" y todas sus tareas?`)) return;
    try {
      await api.deleteProject(proj.id);
      const remaining = projects.filter((p) => p.id !== proj.id);
      setProjects(remaining);
      setActiveProject(remaining[0] || null);
      showToast("Proyecto eliminado.", "info");
    } catch (e) {
      showToast("Error al eliminar proyecto", "error");
    }
  };

  const handleAddTask = async (title: string, instruction: string, assignedAgent?: string, branch?: string) => {
    if (!activeProject) return;
    try {
      const created = await api.createTask({
        projectId: activeProject.id,
        title,
        instruction,
        assignedAgent: assignedAgent || "Antigravity AI",
        gitBranch: branch || "main"
      });
      setTasks((prev) => [created, ...prev]);
      showToast("Tarea agregada al flujo.", "success");
    } catch (e) {
      showToast("Error al crear tarea", "error");
    }
  };

  const handleVerifyTask = async (taskId: string) => {
    try {
      await api.verifyAndLockTask(taskId, currentUser?.id);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "verified", locked: true } : t)));
      showToast("Tarea aprobada y bloqueada en historial.md.", "success");
      setReviewTask(null);
    } catch (e) {
      showToast("Error al verificar tarea", "error");
    }
  };

  const handleRejectTask = async (taskId: string, feedback: string) => {
    try {
      await api.rejectTask(taskId, feedback, currentUser?.id);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "needs_revision", humanFeedback: feedback } : t)));
      showToast("Tarea devuelta al agente para ajustes.", "info");
      setReviewTask(null);
    } catch (e) {
      showToast("Error al rechazar tarea", "error");
    }
  };

  const handleRunAgentLoop = () => {
    setIsAgentRunning(true);
    showToast("Ejecutando bucle agéntico...", "info");
    setTimeout(() => {
      setIsAgentRunning(false);
      showToast("Bucle completado con éxito.", "success");
      loadData(true);
    }, 3800);
  };

  // Contadores
  const activeTasks = tasks.filter((t) => !activeProject || t.projectId === activeProject.id);
  const approvedTasksCount = activeTasks.filter((t) => t.status === "verified" || t.locked).length;
  const pendingReviewCount = activeTasks.filter((t) => t.status === "ready_for_review").length;
  const pendingWaitCount = activeTasks.filter((t) => t.status === "pending").length;

  if (!currentUser) {
    return <LoginScreen onLogin={handleUpdateCurrentUser} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#07090c] dark:bg-[#07090c] text-[#c9d1d9] font-sans selection:bg-emerald-600 selection:text-white pb-6">
      {/* 1. Header Desktop Superior */}
      <DesktopMenuBar
        currentUser={currentUser}
        activeProject={activeProject}
        allProjects={projects}
        onSelectProject={handleSelectProject}
        onOpenNewProject={() => setCreateProjectModalOpen(true)}
        onOpenMyAccount={() => setMyAccountOpen(true)}
        onOpenAdminUsers={() => setAdminUsersOpen(true)}
        onOpenApiDocs={() => setApiDocsOpen(true)}
        onOpenAgentConnections={() => setAgentConnectionsOpen(true)}
        onOpenNotifications={() => setNotificationsDrawerOpen(true)}
        onOpenD1Modal={() => setD1ModalOpen(true)}
        onOpenAuditHistory={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        onOpenUserManual={() => setUserManualOpen(true)}
        onOpenApiKeyOnboarding={() => setApiKeyOnboardingOpen(true)}
        onOpenCloudflareEdge={() => setCloudflareEdgeOpen(true)}
        onOpenGatekeeper={() => setGatekeeperOpen(true)}
        onRefresh={() => loadData(false)}
        onLogout={() => handleUpdateCurrentUser(null)}
        isRefreshing={isRefreshing}
        unreadNotificationsCount={notifications.filter((n) => !n.read).length}
      />

      {/* 2. Barra de Comandos y Badges de Estado */}
      <ProjectCommandBar
        activeProject={activeProject}
        allProjects={projects}
        onSelectProject={handleSelectProject}
        onOpenNewProject={() => setCreateProjectModalOpen(true)}
        approvedTasksCount={approvedTasksCount}
        onRunAgentLoop={handleRunAgentLoop}
        isAgentRunning={isAgentRunning}
        activeModelName={activeModelName}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        onToggleRightSidebar={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
        isLeftSidebarOpen={isLeftSidebarOpen}
        isRightSidebarOpen={isRightSidebarOpen}
      />

      {/* 3. Layout Principal 3 Columnas Dockable */}
      <div className="flex-1 flex overflow-hidden">
        {/* Columna 1: Panel Izquierdo de Auditoría */}
        <AuditSidebar
          isOpen={isLeftSidebarOpen}
          onClose={() => setIsLeftSidebarOpen(false)}
          commits={commits}
          onRollback={(c) => {
            showToast(`Rollback completado para ${c.commitHash}`, "info");
          }}
        />

        {/* Columna 2: Panel Central de Flujo en Cascada / QA Hub */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-[#07090c] border-x border-[#1e222d]">
          {/* Cabecera del Flujo en Cascada */}
          <CascadingHeader
            approvedCount={approvedTasksCount}
            reviewCount={pendingReviewCount}
            pendingCount={pendingWaitCount}
            onOpenNewTask={() => {
              const el = document.getElementById("instruction-input");
              if (el) el.focus();
            }}
          />

          {/* Contenido Central */}
          <div className="p-4 space-y-4 max-w-5xl w-full mx-auto">
            {/* Formulario de Entrada */}
            <TaskInputForm
              activeProject={activeProject}
              onAddTask={handleAddTask}
              onOpenApiDocs={() => setApiDocsOpen(true)}
            />

            {/* Lista de Tareas y Quality Gates */}
            <TaskList
              tasks={activeTasks}
              modules={modules}
              stages={stages}
              filter={filter}
              onFilterChange={setFilter}
              onReviewTask={(t) => setReviewTask(t)}
              onQuickVerify={handleVerifyTask}
              onUnlockTask={(id) => api.unlockTask(id, currentUser?.id).then(() => loadData(true))}
              onDeleteTask={(id) => api.deleteTask(id).then(() => loadData(true))}
              onSimulateTask={(id) => {
                const found = tasks.find((t) => t.id === id);
                if (found) setSimulateTask(found);
              }}
              onOpenNewTaskPrompt={() => {
                const el = document.getElementById("instruction-input");
                if (el) el.focus();
              }}
              onOpenContextMemory={(t) => setContextTask(t)}
              onCreateModule={(title) => activeProject && api.createModule(activeProject.id, title).then(() => loadData(true))}
              onCreateStage={(modId, title) => activeProject && api.createStage(modId, activeProject.id, title).then(() => loadData(true))}
              onDeleteModule={(modId) => api.deleteModule(modId).then(() => loadData(true))}
              onOpenPlanGenerator={() => setPlanGeneratorOpen(true)}
              onRejectTask={handleRejectTask}
            />
          </div>
        </main>

        {/* Columna 3: Panel Derecho de Memoria y Lockfile */}
        <MemoryLockfileSidebar
          isOpen={isRightSidebarOpen}
          onClose={() => setIsRightSidebarOpen(false)}
          activeProject={activeProject}
          ragCount={2}
          activeTokens={0}
        />
      </div>

      {/* 4. Barra de Estado Inferior Inmóvil (Footer) */}
      <IdeStatusBar
        approvedCount={approvedTasksCount}
        pendingReviewCount={pendingReviewCount}
        activeTokens={0}
        ragDocsCount={0}
      />

      {/* Modales */}
      <UserManualModal
        isOpen={userManualOpen}
        onClose={() => setUserManualOpen(false)}
        onOpenApiKey={() => { setUserManualOpen(false); setApiKeyOnboardingOpen(true); }}
        onOpenCloudflare={() => { setUserManualOpen(false); setCloudflareEdgeOpen(true); }}
        onOpenGatekeeper={() => { setUserManualOpen(false); setGatekeeperOpen(true); }}
      />

      <ApiKeyOnboardingModal
        isOpen={apiKeyOnboardingOpen}
        onClose={() => setApiKeyOnboardingOpen(false)}
        projectId={activeProject?.id || "proj-default"}
        projectName={activeProject?.name || "ARQAISTUDIO Core"}
        apiKey={activeProject?.api_key || "arqai_sec_1234_main"}
      />

      <CloudflareEdgeModal
        isOpen={cloudflareEdgeOpen}
        onClose={() => setCloudflareEdgeOpen(false)}
      />

      <GatekeeperModal
        isOpen={gatekeeperOpen}
        onClose={() => setGatekeeperOpen(false)}
      />
      <CreateProjectModal
        isOpen={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
        onCreateProject={handleCreateProjectModalSubmit}
      />

      <ReviewModal
        task={reviewTask}
        onClose={() => setReviewTask(null)}
        onVerify={handleVerifyTask}
        onReject={handleRejectTask}
      />

      <ContextMemoryModal
        isOpen={!!contextTask}
        task={contextTask}
        onClose={() => setContextTask(null)}
        onSaveContextMemory={async (taskId, mem) => {
          await api.updateTaskContextMemory(taskId, mem);
          showToast("Memoria de contexto actualizada.", "success");
          setContextTask(null);
          loadData(true);
        }}
      />

      <MyAccount
        isOpen={myAccountOpen}
        onClose={() => setMyAccountOpen(false)}
        user={currentUser}
        onUpdateUser={handleUpdateCurrentUser}
        onLogout={() => {
          handleUpdateCurrentUser(null);
          setMyAccountOpen(false);
        }}
      />

      <PlanGeneratorModal
        isOpen={planGeneratorOpen}
        onClose={() => setPlanGeneratorOpen(false)}
        onGeneratePlan={async (prompt) => {
          if (!activeProject) return;
          await api.generatePlanFromBlueprint(activeProject.id, { prompt });
          showToast("Plan generado por IA con éxito.", "success");
          setPlanGeneratorOpen(false);
          loadData(true);
        }}
      />

      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onClearHistory={() => api.clearHistory(activeProject?.id).then(() => loadData(true))}
        onDeleteSingleHistory={(id) => api.deleteHistoryEntry(id).then(() => loadData(true))}
      />

      <ApiDocumentationModal
        isOpen={apiDocsOpen}
        onClose={() => setApiDocsOpen(false)}
        activeProject={activeProject}
        currentUser={currentUser}
      />

      <SimulateAgentModal
        task={simulateTask}
        activeProject={activeProject}
        onClose={() => setSimulateTask(null)}
        onExecuteSimulation={async (taskId, output, notes, workUrl) => {
          await api.simulateAgentAction(taskId, { output, notes, workUrl });
          showToast("Simulación de entrega completada.", "success");
          setSimulateTask(null);
          loadData(true);
        }}
      />

      <CloudflareD1Modal
        isOpen={d1ModalOpen}
        onClose={() => setD1ModalOpen(false)}
        onRefreshData={() => loadData(true)}
      />

      <UserManualModal
        isOpen={userManualOpen}
        onClose={() => setUserManualOpen(false)}
        onOpenApiKey={() => {
          setUserManualOpen(false);
          setApiKeyOnboardingOpen(true);
        }}
        onOpenCloudflare={() => {
          setUserManualOpen(false);
          setCloudflareEdgeOpen(true);
        }}
        onOpenGatekeeper={() => {
          setUserManualOpen(false);
          setGatekeeperOpen(true);
        }}
      />

      <ApiKeyOnboardingModal
        isOpen={apiKeyOnboardingOpen}
        onClose={() => setApiKeyOnboardingOpen(false)}
        projectId={activeProject?.id || "proj-default"}
        projectName={activeProject?.name || "ARQAISTUDIO Core"}
        apiKey={activeProject?.apiKey || "arqai_sec_1234_main"}
      />

      <CloudflareEdgeModal
        isOpen={cloudflareEdgeOpen}
        onClose={() => setCloudflareEdgeOpen(false)}
      />

      <GatekeeperModal
        isOpen={gatekeeperOpen}
        onClose={() => setGatekeeperOpen(false)}
      />

      {agentConnectionsOpen && (
        <AgentConnectionsModal onClose={() => setAgentConnectionsOpen(false)} currentUser={currentUser} />
      )}

      <NotificationsDrawer
        isOpen={notificationsDrawerOpen}
        onClose={() => setNotificationsDrawerOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
        onMarkAsRead={(id) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))}
        onDeleteNotification={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))}
        onClearNotifications={() => setNotifications([])}
        projects={projects}
        onSelectProjectById={handleSelectProject}
      />
    </div>
  );
}
