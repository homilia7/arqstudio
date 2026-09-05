import React from 'react';
import { 
  Database, 
  Activity, 
  Zap, 
  BookOpen, 
  Lock, 
  GitBranch, 
  Users, 
  Sun, 
  Moon 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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
  const { theme, toggleTheme } = useTheme();

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-6 bg-zinc-900 dark:bg-black border-t border-zinc-700 dark:border-zinc-800 flex items-center justify-between px-3 text-[11px] font-mono select-none z-50 text-zinc-300 dark:text-zinc-400">
      {/* Lado Izquierdo: Conectividad y Backend Cloudflare */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Cloudflare D1 & Pages</span>
        </div>
        <span className="text-zinc-600">|</span>
        <div className="flex items-center gap-1 text-cyan-400">
          <Activity className="w-3 h-3" />
          <span>SSE Conectado</span>
        </div>
      </div>

      {/* Lado Derecho: Telemetría de Tokens, RAG, Lockfile, Tareas y Tema */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-amber-400">
          <Zap className="w-3 h-3" />
          <span>{activeTokens} tk</span>
        </div>

        <div className="flex items-center gap-1 text-violet-400 hidden sm:flex">
          <BookOpen className="w-3 h-3" />
          <span>RAG: {ragDocsCount} docs</span>
        </div>

        <div className="flex items-center gap-1 text-emerald-400">
          <Lock className="w-3 h-3" />
          <span>historial.md: LOCKED</span>
        </div>

        <div className="flex items-center gap-1 text-cyan-400 hidden md:flex">
          <GitBranch className="w-3 h-3" />
          <span>main (HEAD)</span>
        </div>

        <div className="flex items-center gap-1 text-zinc-300 hidden lg:flex">
          <Users className="w-3 h-3 text-indigo-400" />
          <span>Multiplayer</span>
        </div>

        <span className="text-zinc-600">|</span>

        <div className="text-zinc-300 font-medium">
          <span className="text-emerald-400">{approvedCount} Aprobadas</span> / <span className="text-amber-400">{pendingReviewCount} En Revisión</span>
        </div>

        <button
          onClick={toggleTheme}
          title="Alternar Tema"
          className="hover:text-white transition-colors pl-1"
        >
          {theme === 'dark' ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-indigo-300" />}
        </button>
      </div>
    </footer>
  );
};
