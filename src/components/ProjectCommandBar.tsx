import React, { useState } from 'react';
import { 
  Play, 
  Plus, 
  FolderGit2, 
  ExternalLink, 
  Copy, 
  Check, 
  Layers, 
  Cpu, 
  BookOpen, 
  History, 
  Lock, 
  Sparkles, 
  Globe 
} from 'lucide-react';
import { Project, WorkspaceTab } from '../types';

interface ProjectCommandBarProps {
  activeProject: Project | null;
  allProjects: Project[];
  onSelectProject: (p: Project) => void;
  onOpenNewProject: () => void;
  onCloneProject: (p: Project) => void;
  onDeleteProject: (p: Project) => void;
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  approvedTasksCount: number;
  onRunAgentLoop: () => void;
  isAgentRunning: boolean;
  activeModelName: string;
}

export const ProjectCommandBar: React.FC<ProjectCommandBarProps> = ({
  activeProject,
  allProjects,
  onSelectProject,
  onOpenNewProject,
  onCloneProject,
  onDeleteProject,
  activeTab,
  onSelectTab,
  approvedTasksCount,
  onRunAgentLoop,
  isAgentRunning,
  activeModelName,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCopyApiKey = () => {
    if (!activeProject?.apiKey) return;
    navigator.clipboard.writeText(activeProject.apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-zinc-200 dark:bg-zinc-950 border-b border-zinc-300 dark:border-zinc-800 text-xs shadow-sm select-none text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Fila 1: Selector de Proyecto y Metadatos Rápidos */}
      <div className="h-11 px-3 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-300 dark:border-zinc-800/80">
        {/* Izquierda: Selector de Proyecto */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono uppercase">PROYECTO:</span>
            <select
              value={activeProject?.id || ''}
              onChange={(e) => {
                const found = allProjects.find((p) => p.id === e.target.value);
                if (found) onSelectProject(found);
              }}
              className="bg-transparent text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none cursor-pointer text-xs"
            >
              {allProjects.map((p) => (
                <option key={p.id} value={p.id} className="bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenNewProject}
            className="px-2.5 py-1 rounded bg-zinc-300 dark:bg-zinc-800 hover:bg-zinc-400 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-400/60 dark:border-zinc-700 flex items-center gap-1 transition-colors font-medium cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Nuevo</span>
          </button>

          {activeProject && (
            <button
              onClick={() => onCloneProject(activeProject)}
              className="px-2 py-1 rounded bg-zinc-300/70 dark:bg-zinc-800/60 hover:bg-zinc-400 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-400/40 dark:border-zinc-700/60 flex items-center gap-1 transition-colors cursor-pointer"
            >
              Clonar
            </button>
          )}

          {activeProject?.apiKey && (
            <button
              onClick={handleCopyApiKey}
              className="px-2 py-1 rounded bg-zinc-300/40 dark:bg-zinc-800/40 hover:bg-zinc-400 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-300 dark:border-zinc-700/50 flex items-center gap-1 font-mono text-[10px] transition-colors cursor-pointer"
            >
              {copiedKey ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>Key: {activeProject.apiKey.slice(0, 10)}...</span>
            </button>
          )}

          {activeProject?.mainUrl && (
            <a
              href={activeProject.mainUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 rounded bg-zinc-300/40 dark:bg-zinc-800/40 hover:bg-zinc-400 dark:hover:bg-zinc-700 text-cyan-600 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-900/40 flex items-center gap-1 text-[11px]"
            >
              <Globe className="w-3 h-3" />
              <span className="truncate max-w-[140px]">{activeProject.mainUrl}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>

        {/* Derecha: Botón de Bucle Agéntico & Badges */}
        <div className="flex items-center gap-2">
          {/* Botón Verde de Bucle Agéntico */}
          <button
            onClick={onRunAgentLoop}
            disabled={isAgentRunning}
            className={'flex items-center gap-1.5 px-3.5 py-1 rounded text-white font-semibold shadow-sm transition-all text-xs cursor-pointer ' + (
              isAgentRunning 
                ? 'bg-amber-600 animate-pulse cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95'
            )}
          >
            <Play className={'w-3 h-3 fill-current ' + (isAgentRunning ? 'animate-spin' : '')} />
            <span>{isAgentRunning ? 'Agente Razonando...' : 'Ejecutar Bucle Agéntico'}</span>
          </button>

          {/* Badges tipo IDE */}
          <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 font-mono text-[11px] flex items-center gap-1">
            <Lock className="w-3 h-3" /> {approvedTasksCount} Aprob.
          </span>

          <span className="px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-950/40 border border-violet-300 dark:border-violet-800/40 text-violet-700 dark:text-violet-300 font-mono text-[11px] hidden md:inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-violet-600 dark:text-violet-400" /> Modelo: <strong className="text-zinc-900 dark:text-white">{activeModelName}</strong>
          </span>

          <span className="px-2 py-0.5 rounded bg-zinc-300/80 dark:bg-zinc-800/80 border border-zinc-400/60 dark:border-zinc-700 text-zinc-700 dark:text-zinc-400 font-mono text-[11px] hidden lg:inline-block">
            Día: {todayStr}
          </span>
        </div>
      </div>

      {/* Fila 2: Pestañas de Modos de Trabajo (Tabs Principales) */}
      <div className="px-3 flex items-center gap-1 overflow-x-auto bg-zinc-100 dark:bg-zinc-950/60 py-1">
        <button
          onClick={() => onSelectTab('qa_hub')}
          className={'flex items-center gap-1.5 px-3 py-1.5 rounded-t font-medium transition-all cursor-pointer ' + (
            activeTab === 'qa_hub'
              ? 'bg-zinc-200 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 font-semibold shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50'
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>1. Requerimientos & QA Hub</span>
        </button>

        <button
          onClick={() => onSelectTab('agent_supervisor')}
          className={'flex items-center gap-1.5 px-3 py-1.5 rounded-t font-medium transition-all cursor-pointer ' + (
            activeTab === 'agent_supervisor'
              ? 'bg-zinc-200 dark:bg-zinc-800 text-violet-600 dark:text-violet-400 border-b-2 border-violet-500 font-semibold shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50'
          )}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>2. Supervisor & Enjambre</span>
        </button>

        <button
          onClick={() => onSelectTab('memory_rag')}
          className={'flex items-center gap-1.5 px-3 py-1.5 rounded-t font-medium transition-all cursor-pointer ' + (
            activeTab === 'memory_rag'
              ? 'bg-zinc-200 dark:bg-zinc-800 text-amber-600 dark:text-amber-400 border-b-2 border-amber-500 font-semibold shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50'
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>3. Memoria RAG & Lockfile</span>
        </button>

        <button
          onClick={() => onSelectTab('semantic_git')}
          className={'flex items-center gap-1.5 px-3 py-1.5 rounded-t font-medium transition-all cursor-pointer ' + (
            activeTab === 'semantic_git'
              ? 'bg-zinc-200 dark:bg-zinc-800 text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-500 font-semibold shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50'
          )}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>4. Git Semántico & Rollback</span>
        </button>

        <button
          onClick={() => onSelectTab('changelog')}
          className={'flex items-center gap-1.5 px-3 py-1.5 rounded-t font-medium transition-all cursor-pointer ' + (
            activeTab === 'changelog'
              ? 'bg-zinc-200 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 font-semibold shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/50'
          )}
        >
          <History className="w-3.5 h-3.5" />
          <span>5. Historial de Cambios</span>
        </button>
      </div>
    </div>
  );
};
