import React, { useState } from "react";
import {
  Search,
  Filter,
  Eye,
  Clock,
  AlertCircle,
  Lock,
  Layers,
  Sparkles,
  ListTodo,
  Grid,
  Bot,
} from "lucide-react";
import {
  TaskItem,
  FilterStatus,
  ProjectModule,
  ProjectStage,
  Project,
} from "../types";
import { TaskCard } from "./TaskCard";
import { ModulePlanView } from "./ModulePlanView";

interface TaskListProps {
  tasks: TaskItem[];
  modules: ProjectModule[];
  stages: ProjectStage[];
  filter: FilterStatus;
  activeProject?: Project | null;
  onFilterChange: (filter: FilterStatus) => void;
  onReviewTask: (task: TaskItem) => void;
  onQuickVerify: (taskId: string) => Promise<void>;
  onUnlockTask: (taskId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onSimulateTask: (taskId: string, actionType: "start" | "complete") => void;
  onOpenNewTaskPrompt: () => void;
  onOpenContextMemory: (task: TaskItem) => void;
  onCreateModule: (title: string) => Promise<void>;
  onCreateStage: (moduleId: string, title: string) => Promise<void>;
  onDeleteModule: (id: string) => Promise<void>;
  onOpenPlanGenerator: () => void;
  onOpenChatAudit?: (task: TaskItem) => void;
  onRejectTask?: (taskId: string, feedback: string) => Promise<void>;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  modules,
  stages,
  filter,
  activeProject,
  onFilterChange,
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
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"tasks" | "modules">("tasks");

  const availableAgents = Array.from(
    new Set(tasks.map((t) => t.assignedAgent).filter(Boolean))
  ) as string[];

  const counts = {
    all: tasks.length,
    ready_for_review: tasks.filter((t) => t.status === "ready_for_review").length,
    verified: tasks.filter((t) => t.status === "verified" || t.locked).length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    pending: tasks.filter((t) => t.status === "pending").length,
    needs_revision: tasks.filter((t) => t.status === "needs_revision").length,
  };

  const filteredTasks = tasks.filter((task) => {
    // Filtro por agente asignado
    if (selectedAgent !== "all" && task.assignedAgent !== selectedAgent) {
      return false;
    }

    // Filtro por estado
    if (filter === "verified" && !(task.status === "verified" || task.locked)) {
      return false;
    } else if (filter !== "all" && filter !== "verified" && task.status !== filter) {
      return false;
    }

    // Búsqueda
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchInst = task.instruction.toLowerCase().includes(q);
      const matchNotes = (task.aiNotes || "").toLowerCase().includes(q);
      const matchFeedback = (task.humanFeedback || "").toLowerCase().includes(q);
      const matchUrl = (task.workUrl || "").toLowerCase().includes(q);
      const matchAgent = (task.assignedAgent || "").toLowerCase().includes(q);
      return matchTitle || matchInst || matchNotes || matchFeedback || matchUrl || matchAgent;
    }

    return true;
  });

  return (
    <div className="space-y-3.5">
      {/* Selector de Modo de Vista & Filtro Destacado de Corrección */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg shadow-sm transition-colors">
        {/* Toggle de Modo de Vista */}
        <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded border border-zinc-200 dark:border-zinc-700 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setViewMode("tasks")}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              viewMode === "tasks"
                ? "bg-zinc-100 dark:bg-zinc-900 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-300/60 dark:border-slate-600"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Vista Tareas ({tasks.length})</span>
          </button>

          <button
            onClick={() => setViewMode("modules")}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              viewMode === "modules"
                ? "bg-zinc-100 dark:bg-zinc-900 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-300/60 dark:border-slate-600"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Vista Módulos & Etapas, TAREAS, PASOS ({modules.length})</span>
          </button>
        </div>

        {/* Acciones Secundarias */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {counts.needs_revision > 0 && (
            <button
              onClick={() => {
                setViewMode("tasks");
                onFilterChange("needs_revision");
              }}
              className="px-3 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 rounded text-xs font-bold transition-all flex items-center space-x-1.5 animate-pulse cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>{counts.needs_revision} por re-revisar / corregir</span>
            </button>
          )}

          <button
            onClick={onOpenPlanGenerator}
            className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-semibold rounded text-xs border border-indigo-100 dark:border-indigo-800/60 transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Desglosar con IA</span>
          </button>
        </div>
      </div>

      {/* Render según el modo seleccionado */}
      {viewMode === "modules" ? (
        <ModulePlanView
          modules={modules}
          stages={stages}
          tasks={tasks}
          onReviewTask={onReviewTask}
          onQuickVerify={onQuickVerify}
          onOpenContextMemory={onOpenContextMemory}
          onCreateModule={onCreateModule}
          onCreateStage={onCreateStage}
          onDeleteModule={onDeleteModule}
        />
      ) : (
        <>
          {/* Barra de Filtros y Búsqueda */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
            {/* Pestañas de Filtro */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => onFilterChange("all")}
                className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
                  filter === "all"
                    ? "bg-zinc-800 dark:bg-slate-700 text-white shadow-sm font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Todas</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[10px] text-zinc-700 dark:text-zinc-300">
                  {counts.all}
                </span>
              </button>

              <button
                onClick={() => onFilterChange("ready_for_review")}
                className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
                  filter === "ready_for_review"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                    : "text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Por Revisar</span>
                {counts.ready_for_review > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                    {counts.ready_for_review}
                  </span>
                )}
              </button>

              <button
                onClick={() => onFilterChange("needs_revision")}
                className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
                  filter === "needs_revision"
                    ? "bg-rose-600 text-white shadow-sm font-bold"
                    : "text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Requiere Ajuste</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 text-[10px] font-bold">
                  {counts.needs_revision}
                </span>
              </button>

              <button
                onClick={() => onFilterChange("verified")}
                className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
                  filter === "verified"
                    ? "bg-emerald-600 text-white shadow-sm font-bold"
                    : "text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Verificadas</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                  {counts.verified}
                </span>
              </button>

              <button
                onClick={() => onFilterChange("in_progress")}
                className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
                  filter === "in_progress"
                    ? "bg-indigo-600 text-white shadow-sm font-semibold"
                    : "text-indigo-700 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>En Progreso</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 text-[10px]">
                  {counts.in_progress}
                </span>
              </button>

              <button
                onClick={() => onFilterChange("pending")}
                className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
                  filter === "pending"
                    ? "bg-slate-700 dark:bg-slate-600 text-white shadow-sm font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                <span>Pendientes</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[10px] text-zinc-700 dark:text-zinc-300">
                  {counts.pending}
                </span>
              </button>
            </div>

            {/* Controles de Búsqueda y Filtro de Agente */}
            <div className="flex items-center gap-2 flex-wrap">
              {availableAgents.length > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
                  <Bot className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer font-medium"
                    title="Filtrar tareas por Agente de IA"
                  >
                    <option value="all" className="bg-white dark:bg-zinc-800">Todos los Agentes ({tasks.length})</option>
                    {availableAgents.map((ag) => (
                      <option key={ag} value={ag} className="bg-white dark:bg-zinc-800">
                        {ag} ({tasks.filter((t) => t.assignedAgent === ag).length})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Buscador */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar tareas, URLs o IA..."
                  className="w-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white rounded pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-zinc-100 dark:bg-zinc-900 dark:focus:bg-zinc-800 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
              </div>
            </div>
          </div>

          {/* Lista de Tareas */}
          {filteredTasks.length === 0 ? (
            <div className="bg-zinc-200/90 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg p-10 text-center shadow-sm transition-colors">
              <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 mx-auto flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-3">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                No se encontraron tareas en esta vista
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
                {searchTerm
                  ? "No hay tareas que coincidan con tu búsqueda."
                  : filter === "ready_for_review"
                  ? "¡Excelente! No tienes tareas pendientes de revisión en este momento."
                  : filter === "needs_revision"
                  ? "No hay tareas pendientes de corrección."
                  : "Agrega una nueva instrucción para que Antigravity comience a trabajar."}
              </p>
              <button
                onClick={onOpenNewTaskPrompt}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Crear Nueva Instrucción</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  activeProject={activeProject}
                  onReview={onReviewTask}
                  onQuickVerify={onQuickVerify}
                  onUnlock={onUnlockTask}
                  onDelete={onDeleteTask}
                  onSimulate={onSimulateTask}
                  onOpenContextMemory={onOpenContextMemory}
                  onOpenChatAudit={onOpenChatAudit}
                  onRejectTask={onRejectTask}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
