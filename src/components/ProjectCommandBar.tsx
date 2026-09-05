import React from 'react';
import { 
  Play, 
  Plus, 
  FolderGit2, 
  RefreshCw, 
  Lock, 
  Sparkles,
  Layers,
  BookOpen
} from 'lucide-react';
import { Project, WorkspaceTab } from '../types';

interface ProjectCommandBarProps {
  activeProject: Project | null;
  allProjects: Project[];
  onSelectProject: (p: Project) => void;
  onOpenNewProject: () => void;
  approvedTasksCount: number;
  onRunAgentLoop: () => void;
  isAgentRunning: boolean;
  activeModelName: string;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
}

export const ProjectCommandBar: React.FC<ProjectCommandBarProps> = ({
  activeProject,
  allProjects,
  onSelectProject,
  onOpenNewProject,
  approvedTasksCount,
  onRunAgentLoop,
  isAgentRunning,
  activeModelName,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  isLeftSidebarOpen,
  isRightSidebarOpen,
}) => {
  return (
    <div className="h-11 bg-[#16191f] dark:bg-[#16191f] border-b border-[#21262d] px-3 flex items-center justify-between text-xs select-none text-[#c9d1d9] font-sans">
      {/* Botones de Acción Izquierda */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenNewProject}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1e222b] hover:bg-[#282e3a] text-[#c9d1d9] hover:text-white border border-[#2d333f] font-medium transition-colors cursor-pointer"
        >
          <span>+</span> Nuevo historial de cambios
        </button>

        <button
          onClick={onOpenNewProject}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1e222b] hover:bg-[#282e3a] text-[#c9d1d9] hover:text-white border border-[#2d333f] font-medium transition-colors cursor-pointer"
        >
          <span className="text-emerald-400 font-bold">+</span> Nueva Tarea
        </button>

        {/* Botón Principal Verde: Ejecutar Bucle Agéntico */}
        <button
          onClick={onRunAgentLoop}
          disabled={isAgentRunning}
          className={'flex items-center gap-2 px-4 py-1.5 rounded-md text-white font-semibold shadow-sm transition-all text-xs cursor-pointer ' + (
            isAgentRunning 
              ? 'bg-amber-600 animate-pulse cursor-not-allowed' 
              : 'bg-[#059669] hover:bg-[#10b981] active:scale-95'
          )}
        >
          <Play className={'w-3 h-3 fill-current ' + (isAgentRunning ? 'animate-spin' : '')} />
          <span>{isAgentRunning ? 'Agente Razonando...' : 'Ejecutar Bucle Agéntico'}</span>
        </button>

        <button
          onClick={onToggleLeftSidebar}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#111e24] hover:bg-[#172c36] text-emerald-400 border border-[#164e43] font-medium transition-colors cursor-pointer"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Agentes Git</span>
        </button>

        <button
          onClick={onToggleRightSidebar}
          title="Sincronizar"
          className="p-1.5 rounded-md bg-[#1e222b] hover:bg-[#282e3a] text-[#8b949e] hover:text-[#c9d1d9] border border-[#2d333f] transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Badges de Estado Derecha + Botones de Paneles Laterales */}
      <div className="flex items-center gap-2 font-mono text-[11px]">
        {/* Aprobadas */}
        <span className="px-2.5 py-1 rounded bg-[#201a09] border border-[#854d0e] text-[#eab308] flex items-center gap-1">
          <Lock className="w-3 h-3" /> {approvedTasksCount} aprox.
        </span>

        {/* Modelo */}
        <span className="px-2.5 py-1 rounded bg-[#1e1035] border border-[#581c87] text-[#c084fc] hidden md:inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#c084fc]" /> Modelo: <strong className="text-white font-sans">{activeModelName}</strong>
        </span>

        {/* Fecha */}
        <span className="px-2.5 py-1 rounded bg-[#1c2128] border border-[#30363d] text-[#8b949e] hidden lg:inline-block">
          Día: 5 de septiembre de 2026
        </span>

        {/* Toggle Panel Izquierdo (Auditoría) */}
        <button
          onClick={onToggleLeftSidebar}
          title={isLeftSidebarOpen ? "Ocultar Registro de Auditoría" : "Mostrar Registro de Auditoría"}
          className={'p-1.5 rounded border transition-colors cursor-pointer ' + (
            isLeftSidebarOpen 
              ? 'bg-[#21262d] border-[#58a6ff] text-[#58a6ff]' 
              : 'bg-[#1c2128] border-[#30363d] text-[#8b949e] hover:text-white'
          )}
        >
          <Layers className="w-3.5 h-3.5" />
        </button>

        {/* Toggle Panel Derecho (Memoria & Lockfile) */}
        <button
          onClick={onToggleRightSidebar}
          title={isRightSidebarOpen ? "Ocultar Inspector de Memoria" : "Mostrar Inspector de Memoria"}
          className={'p-1.5 rounded border transition-colors cursor-pointer ' + (
            isRightSidebarOpen 
              ? 'bg-[#21262d] border-[#c084fc] text-[#c084fc]' 
              : 'bg-[#1c2128] border-[#30363d] text-[#8b949e] hover:text-white'
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
