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
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#0d0f12] border-b border-[#21262d] select-none text-[#c9d1d9]">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#58a6ff] shrink-0 mt-0.5">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            Flujo en Cascada de Tareas Agénticas
          </h2>
          <p className="text-xs text-[#8b949e] mt-0.5">
            Supervisión secuencial Human-in-the-Loop (HITL) con validación obligatoria antes de indexación.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 font-mono text-[11px]">
        {/* Aprobadas */}
        <span className="px-2.5 py-1 rounded-full bg-[#0d281e] border border-[#0e6245] text-emerald-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Aprobadas: {approvedCount}
        </span>

        {/* Revisión */}
        <span className="px-2.5 py-1 rounded-full bg-[#2a1d06] border border-[#6b470c] text-amber-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Revisión: {reviewCount}
        </span>

        {/* En espera */}
        <span className="px-2.5 py-1 rounded-full bg-[#1c2128] border border-[#30363d] text-[#8b949e] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8b949e]" /> En espera: {pendingCount}
        </span>

        <button
          onClick={onOpenNewTask}
          className="ml-2 px-3 py-1 rounded-md bg-[#1e222b] hover:bg-[#282e3a] text-white border border-[#2d333f] font-sans font-medium flex items-center gap-1 text-xs cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" /> Agregar Tarea
        </button>
      </div>
    </div>
  );
};
