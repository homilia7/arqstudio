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
}) => {
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newStageTitle, setNewStageTitle] = useState<Record<string, string>>({});
  const [isAddingModule, setIsAddingModule] = useState(false);

  const toggleModule = (id: string) => {
    setCollapsedModules((prev) => ({ ...prev, [id]: !prev[id] }));
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

  const getStatusBadge = (status: TaskStatus, locked: boolean) => {
    if (locked || status === "verified") {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <Lock className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
          <span>Verificada</span>
        </span>
      );
    }
    switch (status) {
      case "ready_for_review":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
            <Eye className="w-2.5 h-2.5 text-amber-700 dark:text-amber-400" />
            <span>Por Revisar</span>
          </span>
        );
      case "needs_revision":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />
            <span>Requiere Ajuste</span>
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Clock className="w-2.5 h-2.5 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span>En Progreso</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            <span>Pendiente</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar for Modules */}
      <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 p-3.5 rounded-lg shadow-sm transition-colors">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Jerarquía por Módulos y Etapas</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {modules.length} Módulo(s), {stages.length} Etapa(s) y {tasks.length} Tarea(s) registradas
          </p>
        </div>

        {!isAddingModule ? (
          <button
            onClick={() => setIsAddingModule(true)}
            className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded border border-zinc-300 dark:border-zinc-700 shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
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
              placeholder="Nombre del Módulo (ej: Módulo 3: Pagos)"
              className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-zinc-100 dark:bg-zinc-900 dark:focus:bg-zinc-800"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded shadow-sm cursor-pointer"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setIsAddingModule(false)}
              className="px-2.5 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer"
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
          (t) => t.status === "verified"
        ).length;

        return (
          <div
            key={mod.id}
            className="bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm transition-all"
          >
            {/* Module Header */}
            <div className="bg-zinc-100/80 dark:bg-zinc-800/60 px-4 py-3 border-b border-zinc-300 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-colors cursor-pointer"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <div className="w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  {modIdx + 1}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
                    <span>{mod.title}</span>
                  </h3>
                  {mod.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{mod.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Progreso: </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {completedTasksCount} / {moduleTasks.length} Tareas
                  </span>
                </div>
                <button
                  onClick={() => onDeleteModule(mod.id)}
                  title="Eliminar Módulo"
                  className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Module Body */}
            {!isCollapsed && (
              <div className="p-4 space-y-4">
                {/* Etapas dentro del Módulo */}
                {moduleStages.map((stage) => {
                  const stageTasks = tasks.filter((t) => t.stageId === stage.id);

                  return (
                    <div
                      key={stage.id}
                      className="bg-zinc-100/80 dark:bg-zinc-800/40 border border-zinc-300 dark:border-zinc-800 rounded-lg p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                          <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            {stage.title}
                          </h4>
                          {stage.description && (
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              • {stage.description}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                          {stageTasks.length} Tarea(s)
                        </span>
                      </div>

                      {/* Lista de Tareas de esta Etapa */}
                      <div className="space-y-2 pt-1">
                        {stageTasks.map((task) => (
                          <div
                            key={task.id}
                            className={`p-2.5 rounded border transition-all flex flex-col md:flex-row md:items-center justify-between gap-2.5 ${
                              task.locked
                                ? "bg-zinc-100 dark:bg-zinc-900/60 border-zinc-300 dark:border-zinc-800"
                                : task.status === "ready_for_review"
                                ? "bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-900 border-amber-300 dark:border-amber-700/80 shadow-2xs"
                                : task.status === "needs_revision"
                                ? "bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-900 border-rose-300 dark:border-rose-700/80 shadow-2xs"
                                : "bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                                  {task.title}
                                </h5>
                                {getStatusBadge(task.status, task.locked)}
                              </div>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 font-mono">
                                {task.instruction}
                              </p>

                              {/* Subtareas Progress */}
                              {task.subtasks && task.subtasks.length > 0 && (
                                <div className="flex items-center space-x-2 pt-1">
                                  <div className="flex-1 bg-zinc-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden max-w-xs">
                                    <div
                                      className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all"
                                      style={{
                                        width: `${
                                          (task.subtasks.filter((s) => s.completed)
                                            .length /
                                            task.subtasks.length) *
                                          100
                                        }%`,
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                    {
                                      task.subtasks.filter((s) => s.completed)
                                        .length
                                    }
                                    /{task.subtasks.length} Subtareas
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Controles rápidos de la Tarea */}
                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                onClick={() => onOpenContextMemory(task)}
                                className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold rounded border border-zinc-300 dark:border-zinc-700 shadow-2xs flex items-center space-x-1 cursor-pointer"
                                title="Ver Ficha de Memoria de Contexto Técnico"
                              >
                                <BrainCircuit className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                <span>Ficha Contexto</span>
                              </button>

                              <button
                                onClick={() => onReviewTask(task)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded flex items-center space-x-1 shadow-2xs cursor-pointer ${
                                  task.status === "ready_for_review"
                                    ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                                    : "bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-slate-700"
                                }`}
                              >
                                <Eye className="w-3 h-3" />
                                <span>Revisar Web</span>
                              </button>
                            </div>
                          </div>
                        ))}

                        {stageTasks.length === 0 && (
                          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 italic p-2">
                            Sin tareas asignadas a esta etapa aún.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Tareas sin Etapa explícita pero asignadas al módulo */}
                {moduleTasks.filter((t) => !t.stageId).length > 0 && (
                  <div className="bg-zinc-100/60 dark:bg-zinc-800/40 border border-zinc-300 dark:border-zinc-800 rounded-lg p-3 space-y-2">
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                      Otras tareas del Módulo:
                    </span>
                    {moduleTasks
                      .filter((t) => !t.stageId)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="p-2.5 bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded flex items-center justify-between text-xs"
                        >
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {task.title}
                          </span>
                          <button
                            onClick={() => onReviewTask(task)}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px] font-semibold cursor-pointer"
                          >
                            Revisar
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                {/* Formulario rápido para agregar nueva etapa */}
                <form
                  onSubmit={(e) => handleAddStageSubmit(mod.id, e)}
                  className="flex items-center space-x-2 pt-2"
                >
                  <input
                    type="text"
                    value={newStageTitle[mod.id] || ""}
                    onChange={(e) =>
                      setNewStageTitle({
                        ...newStageTitle,
                        [mod.id]: e.target.value,
                      })
                    }
                    placeholder="Escribe el nombre de una nueva etapa..."
                    className="flex-1 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded border border-zinc-300 dark:border-zinc-700 shadow-sm flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Etapa</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        );
      })}

      {modules.length === 0 && (
        <div className="text-center p-10 bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg space-y-3 shadow-sm transition-colors">
          <Layers className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            Aún no has creado ningún módulo
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Puedes presionar "Desglosar Proyecto en Módulos" para generar la
            estructura completa automáticamente con IA.
          </p>
        </div>
      )}
    </div>
  );
};
