import React, { useState } from "react";
import {
  Bot,
  Plus,
  Copy,
  Check,
  SlidersHorizontal,
  X,
  ShieldCheck,
  Bot as BotIcon,
  Users,
  Sparkles,
  History,
  Database,
  Key,
  BookOpen,
  Sun,
  Moon,
  Bell,
  User as UserIcon,
  Layers,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Monitor
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { TaskInputForm } from "./TaskInputForm";
import { TaskList } from "./TaskList";
import { Project, TaskItem, ProjectModule, ProjectStage, FilterStatus, User } from "../types";

interface HomeCleanViewProps {
  activeProject: Project | null;
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onOpenNewProject: () => void;
  tasks: TaskItem[];
  modules: ProjectModule[];
  stages: ProjectStage[];
  filter: FilterStatus;
  onFilterChange: (f: FilterStatus) => void;
  onAddTask: (instruction: string, options?: any) => Promise<any>;
  onReviewTask: (t: TaskItem) => void;
  onQuickVerify: (t: TaskItem) => void;
  onUnlockTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onSimulateTask: (id: string) => void;
  onOpenNewTaskPrompt: () => void;
  onOpenContextMemory: (t: TaskItem) => void;
  onCreateModule: (title: string) => void;
  onCreateStage: (modId: string, title: string) => void;
  onDeleteModule: (modId: string) => void;
  onOpenPlanGenerator: () => void;
  onOpenChatAudit: (t: TaskItem | null) => void;
  onRejectTask: (taskId: string, rejectionReason: string) => void;
  onOpenApiDocs: () => void;
  onOpenAgentConnections: () => void;
  onOpenAdminUsers: () => void;
  onOpenHistory: () => void;
  onOpenCloudflareD1: () => void;
  onOpenUserManual: () => void;
  onOpenApiKeyOnboarding: () => void;
  onOpenGatekeeper: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
  currentUser: User | null;
  onOpenMyAccount: () => void;
  onSwitchToClassicView: () => void;
}

export const HomeCleanView: React.FC<HomeCleanViewProps> = ({
  activeProject,
  projects,
  onSelectProject,
  onOpenNewProject,
  tasks,
  modules,
  stages,
  filter,
  onFilterChange,
  onAddTask,
  onReviewTask,
  onQuickVerify,
  onUnlockTask,
  onDeleteTask,
  onSimulateTask,
  onOpenNewTaskPrompt,
  onOpenContextMemory,
  onCreateModule,
  onCreateStage,
  onDeleteModule,
  onOpenPlanGenerator,
  onOpenChatAudit,
  onRejectTask,
  onOpenApiDocs,
  onOpenAgentConnections,
  onOpenAdminUsers,
  onOpenHistory,
  onOpenCloudflareD1,
  onOpenUserManual,
  onOpenApiKeyOnboarding,
  onOpenGatekeeper,
  onOpenNotifications,
  unreadNotificationsCount,
  currentUser,
  onOpenMyAccount,
  onSwitchToClassicView,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isToolsDrawerOpen, setIsToolsDrawerOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Estadísticas del proyecto
  const totalTasks = tasks.length;
  const verifiedCount = tasks.filter((t) => t.status === "verified").length;
  const pendingReviewCount = tasks.filter((t) => t.status === "pending_review").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const pendingWaitCount = tasks.filter((t) => t.status === "pending").length;
  const completionPercentage = totalTasks > 0 ? Math.round((verifiedCount / totalTasks) * 100) : 0;

  const handleCopyUnifiedKey = () => {
    const baseUrl = "https://arqaistudio.pages.dev/api";
    const apiKey = activeProject?.apiKey || (activeProject as any)?.api_key || currentUser?.apiKey || "arqai_sec_1234_main";
    const payload = `Base URL: ${baseUrl}\nAPI Key: ${apiKey}`;
    navigator.clipboard.writeText(payload);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* 1. Barra de Navegación Limpia & Minimalista */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0c1017]/90 border-b border-slate-200 dark:border-slate-800/80 backdrop-blur-md px-4 sm:px-8 py-2.5 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Marca + Switcher */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
                  ARQ AI Studio
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  Vista Focus (Limpia)
                </span>
              </div>
            </div>
          </div>

          {/* Selector de Proyecto & Botón Rápido de Copiar */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <select
                value={activeProject?.id || ""}
                onChange={(e) => {
                  const p = projects.find((proj) => proj.id === e.target.value);
                  if (p) onSelectProject(p);
                }}
                className="text-xs font-semibold bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[140px] sm:max-w-[200px] truncate"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onOpenNewProject}
              title="Crear nuevo proyecto"
              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleCopyUnifiedKey}
              title="Copiar Base URL y API Key juntas para el Agente"
              className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? "¡Copiado!" : "Copiar Claves API"}</span>
            </button>
          </div>

          {/* Acciones del Extremo Derecho */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Botón de alternancia hacia Vista Clásica IDE */}
            <button
              onClick={onSwitchToClassicView}
              title="Volver a la vista completa clásica de AgentOS / IDE (/)"
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Vista IDE (/)</span>
            </button>

            {/* Tema Claro / Oscuro */}
            <button
              onClick={toggleTheme}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Alternar tema"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Buzón de Notificaciones */}
            <button
              onClick={onOpenNotifications}
              className={`relative p-1.5 rounded-lg transition cursor-pointer ${
                unreadNotificationsCount > 0
                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title="Buzón de notificaciones"
            >
              <Bell className={`w-4 h-4 ${unreadNotificationsCount > 0 ? "text-rose-600 animate-bounce" : ""}`} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center animate-pulse shadow-xs">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Botón Mágico: Herramientas Técnicas Plegables */}
            <button
              onClick={() => setIsToolsDrawerOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Herramientas</span>
            </button>

            {/* Perfil de Usuario */}
            <button
              onClick={onOpenMyAccount}
              className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-800 cursor-pointer"
              title={`Usuario: ${currentUser?.name || "Cuenta"}`}
            >
              {(currentUser?.name || "U").charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Área Central Principal (90% del Espacio dedicado a Tareas y QA) */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Banner Informativo del Proyecto Activo */}
        <div className="bg-white dark:bg-[#0c1017] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {activeProject?.name || "Sin Proyecto Seleccionado"}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {activeProject?.id || "N/A"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {activeProject?.description || "Espacio de trabajo optimizado para control de calidad e instrucciones de Agentes IA."}
              </p>
            </div>

            {/* Métricas en Píldoras Compactas */}
            <div className="flex items-center flex-wrap gap-2 text-xs">
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{verifiedCount} Aprobadas</span>
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{pendingReviewCount} Para Revisión</span>
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                <span>{totalTasks} Total</span>
              </div>
            </div>
          </div>

          {/* Barra de Progreso */}
          {totalTasks > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 rounded-full"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                {completionPercentage}% Aprobado
              </span>
            </div>
          )}
        </div>

        {/* Formulario Principal de Instrucción para la IA (Hero) */}
        <div className="shadow-xs">
          <TaskInputForm
            activeProject={activeProject}
            onAddTask={onAddTask}
            onOpenApiDocs={onOpenApiDocs}
          />
        </div>

        {/* Stream de Tareas y Control de Calidad (QA) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Flujo de Tareas & Verificaciones de Calidad</span>
            </h3>
            <span className="text-xs text-slate-400">
              Supervisa entregas, aprueba con candado inmutable o devuelve correcciones
            </span>
          </div>

          <TaskList
            tasks={tasks}
            modules={modules}
            stages={stages}
            filter={filter}
            activeProject={activeProject}
            onFilterChange={onFilterChange}
            onReviewTask={onReviewTask}
            onQuickVerify={onQuickVerify}
            onUnlockTask={onUnlockTask}
            onDeleteTask={onDeleteTask}
            onSimulateTask={onSimulateTask}
            onOpenNewTaskPrompt={onOpenNewTaskPrompt}
            onOpenContextMemory={onOpenContextMemory}
            onCreateModule={onCreateModule}
            onCreateStage={onCreateStage}
            onDeleteModule={onDeleteModule}
            onOpenPlanGenerator={onOpenPlanGenerator}
            onOpenChatAudit={onOpenChatAudit}
            onRejectTask={onRejectTask}
          />
        </div>
      </main>

      {/* 3. Menú Lateral Desplegable: Herramientas Técnicas (Drawer) */}
      {isToolsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#0c1017] border-l border-slate-200 dark:border-slate-800 w-full max-w-sm h-full flex flex-col shadow-2xl overflow-y-auto">
            {/* Cabecera del Drawer */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Herramientas & Ajustes Técnicos
                </h3>
              </div>
              <button
                onClick={() => setIsToolsDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido de Herramientas Agrupadas */}
            <div className="p-4 space-y-4 flex-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Accede a las configuraciones avanzadas, auditorías y gobernanza sin saturar tu vista principal.
              </p>

              {/* Grupo 1: Agentes y Conexiones */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Agentes de IA
                </span>
                <button
                  onClick={() => {
                    setIsToolsDrawerOpen(false);
                    onOpenAgentConnections();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition text-left cursor-pointer group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <BotIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        Auditoría de Agentes
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Bitácora y telemetría de IA en tiempo real
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                </button>

                <button
                  onClick={() => {
                    setIsToolsDrawerOpen(false);
                    onOpenApiDocs();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition text-left cursor-pointer group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        Instrucciones & API Key
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Credenciales para Antigravity y Jules
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                </button>
              </div>

              {/* Grupo 2: Arquitectura y Memoria */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Arquitectura & Memoria
                </span>
                <button
                  onClick={() => {
                    setIsToolsDrawerOpen(false);
                    onOpenPlanGenerator();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition text-left cursor-pointer group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        Generador de Blueprint con IA
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Desglosa ideas en módulos y etapas
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                </button>

                <button
                  onClick={() => {
                    setIsToolsDrawerOpen(false);
                    onOpenHistory();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition text-left cursor-pointer group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Historial de Cambios Aprobados
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Memoria protegida de lo verificado
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                </button>
              </div>

              {/* Grupo 3: Administración & Sistema */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Administración & Servidor
                </span>
                <button
                  onClick={() => {
                    setIsToolsDrawerOpen(false);
                    onOpenAdminUsers();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition text-left cursor-pointer group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        Admin: Usuarios & PINs
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Control de accesos y borrado individual
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                </button>

                <button
                  onClick={() => {
                    setIsToolsDrawerOpen(false);
                    onOpenCloudflareD1();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition text-left cursor-pointer group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                        Cloudflare D1 & SQL
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Estado de base de datos Edge
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                </button>
              </div>

              {/* Botón para cambiar a Vista IDE Clásica */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setIsToolsDrawerOpen(false);
                    onSwitchToClassicView();
                  }}
                  className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Monitor className="w-4 h-4 text-indigo-500" />
                  <span>Cambiar a Vista Clásica IDE (/)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};