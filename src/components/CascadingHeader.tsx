import React, { useState } from 'react';
import { Layers, Plus, Zap, AlertTriangle, Check, Copy } from 'lucide-react';

interface CascadingHeaderProps {
  approvedCount: number;
  reviewCount: number;
  pendingCount: number;
  sessionTokens?: number;
  onOpenNewTask: () => void;
}

export const CascadingHeader: React.FC<CascadingHeaderProps> = ({
  approvedCount,
  reviewCount,
  pendingCount,
  sessionTokens = 14200,
  onOpenNewTask,
}) => {
  const [copiedRotationPrompt, setCopiedRotationPrompt] = useState(false);

  // Semáforo de Tokens (Límite 40k)
  const isOptimal = sessionTokens < 25000;
  const isWarning = sessionTokens >= 25000 && sessionTokens < 40000;
  const isCritical = sessionTokens >= 40000;

  const handleCopyRotationPrompt = () => {
    const prompt = `Continúo el trabajo en este proyecto. Por favor lee de inmediato el archivo CONTEXTO_PROYECTO.md en la raíz local para adoptar el estado actual sin gastar tokens y procede con el siguiente paso pendiente.`;
    navigator.clipboard.writeText(prompt);
    setCopiedRotationPrompt(true);
    setTimeout(() => setCopiedRotationPrompt(false), 2500);
  };

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

      <div className="flex items-center flex-wrap gap-2 font-mono text-[11px]">
        {/* SEMÁFORO DE TOKENS (LÍMITE 40.000) */}
        <div 
          onClick={handleCopyRotationPrompt}
          className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 cursor-pointer transition-all ${
            isCritical
              ? "bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300 ring-2 ring-rose-500/30 animate-pulse"
              : isWarning
              ? "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300"
              : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-[#0d281e] dark:border-[#0e6245] dark:text-emerald-400"
          }`}
          title="Semáforo de Consumo de Tokens: Clic para copiar prompt de rotación de chat"
        >
          <span className={`w-2 h-2 rounded-full ${isCritical ? "bg-rose-500 animate-ping" : isWarning ? "bg-amber-500" : "bg-emerald-400"}`} />
          <span className="font-semibold">
            {Math.round(sessionTokens / 1000)}k tokens
          </span>
          <span className="text-[10px] opacity-80 hidden md:inline">
            {isCritical ? "(Límite 40k - Rotar)" : isWarning ? "(Moderado)" : "(Óptimo)"}
          </span>
          {copiedRotationPrompt ? (
            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 ml-1" />
          ) : (
            <Copy className="w-2.5 h-2.5 opacity-60 ml-0.5" />
          )}
        </div>

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
