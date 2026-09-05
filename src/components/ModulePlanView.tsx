import React, { useState } from "react";
import {
  Layers,
  ChevronDown,
  ChevronRight,
  Plus,
  BrainCircuit,
  Eye,
  CheckCircle2,
  Lock,
  Clock,
  AlertCircle,
  FolderPlus,
  Trash2,
  ExternalLink,
  Bot,
  CheckSquare,
  Square,
  Check,
  AlertTriangle,
  Send,
  X
} from "lucide-react";
import {
  ProjectModule,
  ProjectStage,
  TaskItem,
  TaskStatus,
} from "../types";

interface ModulePlanViewProps {
  modules: ProjectModule[];
  stages: ProjectStage[];
  tasks: TaskItem[];
  onReviewTask: (task: TaskItem) => void;
  onQuickVerify: (taskId: string) => Promise<void>;
  onOpenContextMemory: (task: TaskItem) => void;
  onCreateModule: (title: string) => Promise<void>;
  onCreateStage: (moduleId: string, title: string) => Promise<void>;
  onDeleteModule: (id: string) => Promise<void>;
  onRejectTask?: (taskId: string, feedback: string) => Promise<void>;
}

export const ModulePlanView: React.FC<ModulePlanViewProps> = ({
  modules,
  stages,
  tasks,
  onReviewTask,
  onQuickVerify,
  onOpenContextMemory,
  onCreateModule,
  onCreateStage,
  onDeleteModule,
  onRejectTask,
}) => {
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newStageTitle, setNewStageTitle] = useState<Record<string, string>>({});
  const [isAddingModule, setIsAddingModule] = useState(false);
  
  // Modal de reporte rápido de corrección
  const [reportingTaskId, setReportingTaskId] = useState<string | null>(null);
  const [reportComment, setReportComment] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const toggleModule = (id: string) => {
    setCollapsedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTaskExpanded = (id: string) => {
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    await onCreateModule(newModuleTitle.trim());
    setNewModuleTitle("");
    setIsAddingModule(false);
  };

  const handleAddStageSubmit = async (moduleId: string, e: React.FormEvent) => {
    e.preventDefault();
    const title = newStageTitle[moduleId];
    if (!title || !title.trim()) return;
    await onCreateStage(moduleId, title.trim());
    setNewStageTitle((prev) => ({ ...prev, [moduleId]: "" }));
  };

  const handleSendReject = async (taskId: string) => {
    if (!reportComment.trim() || !onRejectTask) return;
    setIsSubmittingReport(true);
    try {
      await onRejectTask(taskId, reportComment.trim());
      setReportingTaskId(null);
      setReportComment("");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const getStatusBadge = (status: TaskStatus, locked: boolean) => {
    if (locked || status === "verified") {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800">
          <Lock className="w-2.5 h-2.5 text-emerald-400" />
          <span>Verificada & Bloqueada</span>
        </span>
      );
    }
    switch (status) {
      case "ready_for_review":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/70 text-amber-300 border border-amber-800 animate-pulse">
            <Eye className="w-2.5 h-2.5 text-amber-400" />
            <span>Por Revisar</span>
          </span>
        );
      case "needs_revision":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/70 text-rose-300 border border-rose-800">
            <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
            <span>Requiere Ajuste</span>
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950/70 text-indigo-300 border border-indigo-800">
            <Clock className="w-2.5 h-2.5 animate-spin text-indigo-400" />
            <span>En Progreso</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
            <span>Pendiente</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar for Modules */}
      <div className="flex items-center justify-between bg-[#0e1117] border border-zinc-800 p-3.5 rounded-lg shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Desglose Jerárquico: Módulos, Etapas, Tareas y Pasos</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {modules.length} Módulo(s), {stages.length} Etapa(s) y {tasks.length} Tarea(s) registradas en el proyecto
          </p>
        </div>

        {!isAddingModule ? (
          <button
            onClick={() => setIsAddingModule(true)}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded border border-zinc-700 shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Agregar Módulo Manual</span>
          </button>
        ) : (
          <form
            onSubmit={handleAddModuleSubmit}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              autoFocus
              required
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="Nombre del Módulo (ej: Módulo 3: Pasarela de Pago)"
              className="px-3 py-1.5 bg-[#090b0e] border border-zinc-800 rounded text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded shadow-sm cursor-pointer"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setIsAddingModule(false)}
              className="px-2.5 py-1.5 bg-zinc-800 text-zinc-300 hover:text-white text-xs rounded border border-zinc-700 cursor-pointer"
            >
              Cancelar
            </button>
          </form>
        )}
      </div>

      {/* Module Cards List */}
      {modules.map((mod, modIdx) => {
        const isCollapsed = collapsedModules[mod.id];
        const moduleStages = stages.filter((s) => s.moduleId === mod.id);
        const moduleTasks = tasks.filter((t) => t.moduleId === mod.id);
        const completedTasksCount = moduleTasks.filter(
          (t) => t.status === "verified" || t.locked
        ).length;

        return (
          <div
            key={mod.id}
            className="bg-[#0e1117] border border-zinc-800 rounded-lg overflow-hidden shadow-sm transition-all"
          >
            {/* Module Header */}
            <div className="bg-[#12151b] px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="p-1 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <div className="w-6 h-6 rounded bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 font-bold text-xs">
                  {modIdx + 1}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>{mod.title}</span>
                  </h3>
                  {mod.description && (
                    <p className="text-xs text-zinc-400">{mod.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right font-mono">
                  <span className="text-[11px] text-zinc-500">Progreso: </span>
                  <span className="text-xs font-bold text-emerald-400">
                    {completedTasksCount} / {moduleTasks.length} Tareas
                  </span>
                </div>
                <button
                  onClick={() => onDeleteModule(mod.id)}
                  title="Eliminar Módulo"
                  className="p-1.5 text-zinc-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Module Body */}
            {!isCollapsed && (
              <div className="p-4 space-y-4 bg-[#090b0e]">
                {/* Etapas dentro del Módulo */}
                {moduleStages.map((stage) => {
                  const stageTasks = tasks.filter((t) => t.stageId === stage.id);

                  return (
                    <div
                      key={stage.id}
                      className="bg-[#12151b]/80 border border-zinc-800 rounded-lg p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <h4 className="text-xs font-bold text-zinc-200">
                            {stage.title}
                          </h4>
                          {stage.description && (
                            <span className="text-[11px] text-zinc-400">
                              • {stage.description}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {stageTasks.length} Tarea(s)
                        </span>
                      </div>

                      {/* Lista de Tareas de esta Etapa */}
                      <div className="space-y-2 pt-1">
                        {stageTasks.map((task) => {
                          const isExpanded = expandedTasks[task.id];
                          const subtasks = task.subtasks || [];
                          const completedSub = subtasks.filter(s => s.completed).length;

                          return (
                            <div
                              key={task.id}
                              className={`p-3 rounded-lg border transition-all space-y-2 ${
                                task.locked
                                  ? "bg-[#0e1117] border-emerald-900/40"
                                  : task.status === "ready_for_review"
                                  ? "bg-[#16191f] border-amber-800/80 shadow-xs"
                                  : task.status === "needs_revision"
                                  ? "bg-[#180f12] border-rose-800/80 shadow-xs"
                                  : "bg-[#0e1117] border-zinc-800"
                              }`}
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => toggleTaskExpanded(task.id)}
                                      className="text-zinc-400 hover:text-white cursor-pointer"
                                      title={isExpanded ? "Ocultar pasos" : "Ver pasos de la tarea"}
                                    >
                                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                    </button>
                                    <h5 className="text-xs font-bold text-white truncate">
                                      {task.title}
                                    </h5>
                                    {getStatusBadge(task.status, task.locked)}
                                  </div>
                                  <p className="text-[11px] text-zinc-400 line-clamp-1 font-mono pl-5">
                                    {task.instruction}
                                  </p>

                                  {/* Subtareas Progress Bar */}
                                  {subtasks.length > 0 && (
                                    <div className="flex items-center space-x-2 pt-0.5 pl-5">
                                      <div className="w-24 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                        <div
                                          className="bg-emerald-500 h-full transition-all"
                                          style={{ width: `${(completedSub / subtasks.length) * 100}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] font-mono text-zinc-400">
                                        {completedSub}/{subtasks.length} Pasos Completados
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Botones de Control Humano */}
                                <div className="flex items-center space-x-1.5 shrink-0 pl-5 md:pl-0">
                                  {task.workUrl && (
                                    <a
                                      href={task.workUrl.startsWith("http") ? task.workUrl : `https://${task.workUrl}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-mono rounded border border-zinc-700 flex items-center space-x-1 cursor-pointer"
                                      title="Abrir URL desplegada en vivo"
                                    >
                                      <span>URL</span>
                                      <ExternalLink className="w-2.5 h-2.5 text-emerald-400" />
                                    </a>
                                  )}

                                  <button
                                    onClick={() => onOpenContextMemory(task)}
                                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-purple-300 text-[11px] rounded border border-zinc-700 flex items-center space-x-1 cursor-pointer"
                                    title="Ver Ficha de Memoria de Contexto Técnico"
                                  >
                                    <BrainCircuit className="w-3 h-3 text-purple-400" />
                                    <span>Memoria</span>
                                  </button>

                                  <button
                                    onClick={() => onReviewTask(task)}
                                    className={`px-2.5 py-1 text-[11px] font-bold rounded flex items-center space-x-1 cursor-pointer ${
                                      task.status === "ready_for_review"
                                        ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                                        : "bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900 border border-emerald-800"
                                    }`}
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>{task.locked ? "Verificada" : "Revisar / Aprobar"}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Checklist Desplegable de Pasos (Subtasks) */}
                              {isExpanded && subtasks.length > 0 && (
                                <div className="p-2.5 mt-2 bg-[#090b0e] border border-zinc-800 rounded space-y-1.5 animate-in fade-in duration-150">
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                    Checklist de Pasos Agénticos:
                                  </span>
                                  <div className="space-y-1">
                                    {subtasks.map((st) => (
                                      <div key={st.id} className="flex items-center space-x-2 text-xs">
                                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] ${
                                          st.completed ? "bg-emerald-500 text-white" : "border border-zinc-700 bg-zinc-900"
                                        }`}>
                                          {st.completed && <Check className="w-2.5 h-2.5" />}
                                        </div>
                                        <span className={`${st.completed ? "line-through text-zinc-500" : "text-zinc-300"}`}>
                                          {st.title}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {stageTasks.length === 0 && (
                          <p className="text-[11px] text-zinc-500 italic p-2">
                            Sin tareas asignadas a esta etapa aún.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Tareas sin Etapa explícita pero asignadas al módulo */}
                {moduleTasks.filter((t) => !t.stageId).length > 0 && (
                  <div className="bg-[#12151b]/60 border border-zinc-800 rounded-lg p-3 space-y-2">
                    <span className="text-xs font-bold text-zinc-300">
                      Otras tareas del Módulo:
                    </span>
                    <div className="space-y-1.5">
                      {moduleTasks
                        .filter((t) => !t.stageId)
                        .map((task) => (
                          <div
                            key={task.id}
                            className="p-2 rounded bg-[#0e1117] border border-zinc-800 flex items-center justify-between text-xs"
                          >
                            <span className="text-white font-medium">{task.title}</span>
                            <button
                              onClick={() => onReviewTask(task)}
                              className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[11px]"
                            >
                              Revisar
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {modules.length === 0 && (
        <div className="p-8 text-center bg-[#0e1117] border border-zinc-800 rounded-xl space-y-2">
          <Layers className="w-8 h-8 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No hay módulos creados aún</h3>
          <p className="text-xs text-zinc-400">
            Haz clic en "Desglosar con IA" o "Agregar Módulo Manual" para estructurar tu proyecto.
          </p>
        </div>
      )}
    </div>
  );
};
