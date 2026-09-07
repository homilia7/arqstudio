import React from 'react';
import { Zap, BookOpen, Lock, Users, FolderGit2 } from 'lucide-react';

interface IdeStatusBarProps {
  approvedCount: number;
  pendingReviewCount: number;
  activeTokens: number;
  ragDocsCount: number;
}

export const IdeStatusBar: React.FC<IdeStatusBarProps> = ({
  approvedCount,
  pendingReviewCount,
  activeTokens,
  ragDocsCount,
}) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-6 bg-white dark:bg-black border-t border-zinc-200 dark:border-[#21262d] flex items-center justify-between px-3 text-[11px] font-mono select-none z-50 text-zinc-600 dark:text-[#8b949e] shadow-xs dark:shadow-none">
      {/* Lado Izquierdo: Conectividad */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-zinc-800 dark:text-[#c9d1d9] font-medium">SSE Conectado</span>
      </div>

      {/* Lado Derecho: Telemetría Exacta */}
      <div className="flex items-center gap-4">
        {/* Tokens */}
        <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
          <Zap className="w-3 h-3" />
          <span>{activeTokens} tk</span>
        </div>

        {/* RAG */}
        <div className="flex items-center gap-1 text-purple-700 dark:text-[#c084fc] hidden sm:flex">
          <BookOpen className="w-3 h-3" />
          <span>RAG: {ragDocsCount} docs | {activeTokens} tk</span>
        </div>

        {/* Lockfile */}
        <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
          <Lock className="w-3 h-3" />
          <span>historial.md: LOCKED</span>
        </div>

        {/* Multijugador */}
        <div className="flex items-center gap-1 text-blue-700 dark:text-[#58a6ff] hidden md:flex">
          <Users className="w-3 h-3" />
          <span>Multijugador</span>
        </div>

        {/* Rama Git */}
        <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hidden lg:flex">
          <FolderGit2 className="w-3 h-3" />
          <span>main (HEAD)</span>
        </div>
      </div>
    </footer>
  );
};
