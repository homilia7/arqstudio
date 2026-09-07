import React, { useState } from "react";
import {
  X,
  Play,
  Bot,
  Globe,
  Sparkles,
  CheckCircle,
  FileCode,
} from "lucide-react";
import { TaskItem, Project } from "../types";

interface SimulateAgentModalProps {
  task: TaskItem | null;
  activeProject: Project | null;
  onClose: () => void;
  onExecuteSimulation: (
    taskId: string,
    actionType: "start" | "complete",
    workUrl?: string,
    notes?: string
  ) => Promise<void>;
}

export const SimulateAgentModal: React.FC<SimulateAgentModalProps> = ({
  task,
  activeProject,
  onClose,
  onExecuteSimulation,
}) => {
  if (!task) return null;

  const [workUrl, setWorkUrl] = useState(
    task.workUrl ||
      activeProject?.mainUrl ||
      "https://preview-antigravity-dev.app.run.app"
  );
  const [notes, setNotes] = useState(
    "Implementé la instrucción solicitada, probé los componentes y generé la URL de trabajo para comprobación."
  );
  const [actionType, setActionType] = useState<"start" | "complete">("complete");
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSimulating(true);
      await onExecuteSimulation(
        task.id,
        actionType,
        workUrl.trim() || undefined,
        notes.trim() || undefined
      );
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 rounded-lg max-w-md w-full p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-900 tracking-tight">
                Simulador de Respuesta de Antigravity
              </h3>
              <p className="text-xs text-zinc-500">
                Prueba cómo la IA responde a la tarea y entrega la URL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="bg-zinc-100 p-2.5 rounded border border-zinc-300 text-xs">
            <span className="text-zinc-500 font-bold block mb-0.5">
              Tarea a simular:
            </span>
            <span className="text-zinc-900 font-semibold">{task.title}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Acción que la IA reportará:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActionType("start")}
                className={`py-1.5 px-2.5 text-xs rounded font-semibold border transition-all ${
                  actionType === "start"
                    ? "bg-indigo-600 text-zinc-900 dark:text-white border-indigo-600"
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 border-zinc-300 hover:bg-zinc-100"
                }`}
              >
                1. Empezar tarea (In Progress)
              </button>
              <button
                type="button"
                onClick={() => setActionType("complete")}
                className={`py-1.5 px-2.5 text-xs rounded font-semibold border transition-all ${
                  actionType === "complete"
                    ? "bg-amber-600 text-zinc-900 dark:text-white border-amber-600 font-bold"
                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 border-zinc-300 hover:bg-zinc-100"
                }`}
              >
                2. Completar y Entregar URL
              </button>
            </div>
          </div>

          {actionType === "complete" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center space-x-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  <span>URL donde Antigravity trabajó:</span>
                </label>
                <input
                  type="text"
                  value={workUrl}
                  onChange={(e) => setWorkUrl(e.target.value)}
                  placeholder="https://preview-mi-app.run.app"
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-800 placeholder:text-zinc-600 dark:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center space-x-1">
                  <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Notas técnicas del cambio:</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 rounded p-2 text-xs text-zinc-800 placeholder:text-zinc-600 dark:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSimulating}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-zinc-900 dark:text-white text-xs font-bold rounded shadow-sm transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isSimulating ? "Ejecutando..." : "Ejecutar Simulación"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
