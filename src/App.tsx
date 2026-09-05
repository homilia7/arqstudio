import React, { useState, useEffect, useCallback, useRef } from "react";
import { DesktopMenuBar } from "./components/DesktopMenuBar";
import { ProjectCommandBar } from "./components/ProjectCommandBar";
import { CreateProjectModal } from "./components/CreateProjectModal";
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
import { NeonDatabaseModal } from "./components/NeonDatabaseModal";
import { AgentConnectionsModal } from "./components/AgentConnectionsModal";
import { LoginScreen } from "./components/LoginScreen";
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

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const isLoggedOut = localStorage.getItem("antigravity_logged_out") === "true";
      if (isLoggedOut) return null;

      const savedLocal = localStorage.getItem("antigravity_current_user");
      if (savedLocal) return JSON.parse(savedLocal);

      const savedSession = sessionStorage.getItem("antigravity_current_user");
      if (savedSession) return JSON.parse(savedSession);
    } catch (e) {
      console.warn("Error al recuperar sesión:", e);
    }
    return {
      id: "usr-admin",
      name: "Andrés",
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
  const [reviewTask, setReviewTask] = useState<TaskItem | null>(null);
  const [contextTask, setContextTask] = useState<TaskItem | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [apiDocsOpen, setApiDocsOpen] = useState(false);
  const [simulateTask, setSimulateTask] = useState<TaskItem | null>(null);
  const [planGeneratorOpen, setPlanGeneratorOpen] = useState(false);
  const [neonModalOpen, setNeonModalOpen] = useState(false);
  const [agentConnectionsOpen, setAgentConnectionsOpen] = useState(false);
  const [myAccountOpen, setMyAccountOpen] = useState(false);
  const [adminUsersOpen, setAdminUsersOpen] = useState(false);
  const [notificationsDrawerOpen, setNotificationsDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Toast notifications
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

  // Handlers para Tareas y Proyectos
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
      showToast("Tarea creada y lista para el agente.", "success");
    } catch (e) {
      showToast("Error al crear tarea", "error");
    }
  };

  const handleVerifyTask = async (taskId: string) => {
    try {
      await api.verifyAndLockTask(taskId, currentUser?.id);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "verified", locked: true } : t)));
      showToast("Tarea verificada y bloqueada exitosamente.", "success");
      setReviewTask(null);
    } catch (e) {
      showToast("Error al verificar tarea", "error");
    }
  };

  const handleRejectTask = async (taskId: string, feedback: string) => {
    try {
      await api.rejectTask(taskId, feedback, currentUser?.id);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "needs_revision", humanFeedback: feedback } : t)));
      showToast("Tarea devuelta al agente con feedback.", "info");
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
      showToast("Bucle completado. Nueva entrega lista para revisión.", "success");
      loadData(true);
    }, 3800);
  };

  // Contadores
  const activeTasks = tasks.filter((t) => !activeProject || t.projectId === activeProject.id);
  const approvedTasksCount = activeTasks.filter((t) => t.status === "verified" || t.locked).length;
  const pendingReviewCount = activeTasks.filter((t) => t.status === "ready_for_review").length;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors pb-8">
      {/* 1. Barra de Menús Estilo Desktop IDE */}
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
        onOpenNeonModal={() => setNeonModalOpen(true)}
        onOpenAuditHistory={() => setHistoryOpen(true)}
        onRefresh={() => loadData(false)}
        isRefreshing={isRefreshing}
        unreadNotificationsCount={notifications.filter((n) => !n.read).length}
      />

      {/* 2. Barra de Comandos y Pestañas */}
      <ProjectCommandBar
        activeProject={activeProject}
        allProjects={projects}
        onSelectProject={handleSelectProject}
        onOpenNewProject={() => setCreateProjectModalOpen(true)}
        onCloneProject={handleCloneProject}
        onDeleteProject={handleDeleteProject}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        approvedTasksCount={approvedTasksCount}
        onRunAgentLoop={handleRunAgentLoop}
        isAgentRunning={isAgentRunning}
        activeModelName={activeModelName}
      />

      {/* 3. Área Principal según Modo de Trabajo */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-4 space-y-4">
        {activeTab === "qa_hub" && (
          <div className="space-y-4">
            {/* Formulario de Entrada */}
            <TaskInputForm
              activeProject={activeProject}
              onAddTask={handleAddTask}
              onOpenApiDocs={() => setApiDocsOpen(true)}
            />

            {/* Banner Flujo de Calidad HITL */}
            <div className="bg-zinc-200/80 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg p-3.5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                    Flujo de Calidad HITL: Requerimientos, Memoria de Contexto & Candado
                  </h4>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    Las tareas aprobadas se bloquean de forma inmutable. Los agentes reportan su trabajo vía API y solicitan revisión humana.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setApiDocsOpen(true)}
                className="px-3 py-1.5 bg-zinc-300 dark:bg-zinc-800 hover:bg-zinc-400 dark:hover:bg-zinc-700 text-violet-700 dark:text-violet-300 font-semibold rounded text-xs border border-zinc-400 dark:border-zinc-700 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Skill API para Agentes</span>
              </button>
            </div>

            {/* Lista de Tareas */}
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
        )}

        {activeTab === "agent_supervisor" && (
          <AgentSupervisorView
            activeProject={activeProject}
            tasks={activeTasks}
            isAgentRunning={isAgentRunning}
            onRunAgentLoop={handleRunAgentLoop}
          />
        )}

        {activeTab === "memory_rag" && (
          <MemoryRagView activeProject={activeProject} />
        )}

        {activeTab === "semantic_git" && (
          <SemanticGitView activeProject={activeProject} />
        )}

        {activeTab === "changelog" && (
          <ProjectChangelogView
            activeProject={activeProject}
            history={history}
            onAddChangelogEntry={async (entry) => {
              if (!activeProject) return;
              await api.addChangelogEntry({
                projectId: activeProject.id,
                title: entry.title,
                details: entry.details,
                action: entry.action,
                author: currentUser?.name || "USUARIO",
              });
              await loadData(false);
              showToast("Cambio registrado.", "success");
            }}
            onDeleteChangelogEntry={(id) => api.deleteHistoryEntry(id).then(() => loadData(true))}
          />
        )}
      </main>

      {/* 4. Barra de Estado Inferior Inmóvil */}
      <IdeStatusBar
        approvedCount={approvedTasksCount}
        pendingReviewCount={pendingReviewCount}
        activeTokens={1070}
        ragDocsCount={2}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 right-4 z-50 px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Modals */}
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

      <NeonDatabaseModal
        isOpen={neonModalOpen}
        onClose={() => setNeonModalOpen(false)}
        onRefreshData={() => loadData(true)}
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
