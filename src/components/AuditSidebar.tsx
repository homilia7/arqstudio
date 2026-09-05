import React from 'react';
import { History, X, ShieldAlert, Code2, RotateCcw } from 'lucide-react';
import { AgentCommit } from '../types';

interface AuditSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  commits?: AgentCommit[];
  onRollback?: (commit: AgentCommit) => void;
}

export const AuditSidebar: React.FC<AuditSidebarProps> = ({
  isOpen,
  onClose,
  commits = [],
  onRollback,
}) => {
  if (!isOpen) return null;

  return (
    <aside className="w-80 shrink-0 bg-zinc-100/95 dark:bg-zinc-900/95 border-r border-zinc-300 dark:border-zinc-800 flex flex-col h-full text-xs text-zinc-900 dark:text-zinc-100 transition-colors animate-fadeIn select-none">
      {/* Header */}
      <div className="h-11 px-3.5 bg-zinc-200/80 dark:bg-zinc-950 flex items-center justify-between border-b border-zinc-300 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
          <span className="font-bold text-xs">Registro de Auditoría</span>
          <span className="px-1.5 py-0.2 rounded bg-zinc-300 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 text-[10px] font-mono">
            {commits.length} ciclos
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-300 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Subtitle */}
      <div className="p-3 border-b border-zinc-300 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
        Trazabilidad completa de cada iteración ágil con rapidez exacta, resumen técnico de la IA y diff reversible.
      </div>

      {/* Content */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
        {commits.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center text-zinc-400 dark:text-zinc-500 space-y-2">
            <History className="w-8 h-8 opacity-40" />
            <p className="text-xs font-medium">No hay ciclos de auditoría registrados todavía.</p>
            <p className="text-[11px] opacity-75">Los ciclos se registran al ejecutar el agente.</p>
          </div>
        ) : (
          commits.map((c) => (
            <div
              key={c.id}
              className="p-2.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold">{c.commitHash}</span>
                <span className="text-zinc-500 text-[10px]">{c.timestamp}</span>
              </div>
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 mt-1 line-clamp-2">
                {c.commitMessage}
              </p>
              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-300 dark:border-zinc-800/80 text-[10px] font-mono text-zinc-500">
                <span>{c.agentName}</span>
                {onRollback && !c.isReverted && (
                  <button
                    onClick={() => onRollback(c)}
                    className="text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> Revertir
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
