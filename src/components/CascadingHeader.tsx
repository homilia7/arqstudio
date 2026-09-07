import React from 'react';
import { Layers, Plus } from 'lucide-react';

interface CascadingHeaderProps {
  approvedCount: number;
  reviewCount: number;
  pendingCount: number;
  onOpenNewTask: () => void;
}

export const CascadingHeader: React.FC<CascadingHeaderProps> = ({
  approvedCount,
  reviewCount,
  pendingCount,
  onOpenNewTask,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#0d0f12] border-b border-zinc-200 dark:border-[#21262d] select-none text-zinc-800 dark:text-[#c9d1d9] shadow-xs dark:shadow-none">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#161b22] border border-blue-200 dark:border-[#30363d] flex items-center justify-center text-blue-600 dark:text-[#58a6ff] shrink-0 mt-0.5">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            Flujo en Cascada de Tareas Agénticas
          </h2>
          <p className="text-xs text-zinc-600 dark:text-[#8b949e] mt-0.5">
            Supervisión secuencial Human-in-the-Loop (HITL) con validación obligatoria antes de indexación.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 font-mono text-[11px]">
        {/* Aprobadas */}
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-[#0d281e] dark:border-[#0e6245] dark:text-emerald-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Aprobadas: {approvedCount}
        </span>

        {/* Revisión */}
        <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 dark:bg-[#2a1d06] dark:border-[#6b470c] dark:text-amber-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Revisión: {reviewCount}
        </span>

        {/* En espera */}
        <span className="px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 dark:bg-[#1c2128] dark:border-[#30363d] dark:text-[#8b949e] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8b949e]" /> En espera: {pendingCount}
        </span>

        <button
          onClick={onOpenNewTask}
          className="ml-2 px-3 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-[#1e222b] dark:hover:bg-[#282e3a] dark:text-white border border-zinc-300 dark:border-[#2d333f] font-sans font-medium flex items-center gap-1 text-xs cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" /> Agregar Tarea
        </button>
      </div>
    </div>
  );
};
