import React, { useState } from 'react';
import { 
  Lock, 
  X, 
  BookOpen, 
  Cpu, 
  Copy, 
  Check, 
  AlertTriangle, 
  ShieldCheck 
} from 'lucide-react';
import { Project } from '../types';

interface MemoryLockfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: Project | null;
  ragCount?: number;
  activeTokens?: number;
}

export const MemoryLockfileSidebar: React.FC<MemoryLockfileSidebarProps> = ({
  isOpen,
  onClose,
  activeProject,
  ragCount = 0,
  activeTokens = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'historial' | 'rag' | 'stm'>('historial');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sampleMarkdown = `# Historial Inmutable de Cambios - ${activeProject?.name || 'Proyecto'}
- Estado: LOCKED (Inmutable)
- Regla: Prohibido alterar la lógica de componentes verificados.
- Última sincronización: ${new Date().toISOString().split('T')[0]}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="w-96 shrink-0 bg-zinc-100/95 dark:bg-zinc-900/95 border-l border-zinc-300 dark:border-zinc-800 flex flex-col h-full text-xs text-zinc-900 dark:text-zinc-100 transition-colors animate-fadeIn select-none">
      {/* Header */}
      <div className="h-11 px-3.5 bg-zinc-200/80 dark:bg-zinc-950 flex items-center justify-between border-b border-zinc-300 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
          <span className="font-bold text-xs">Inspector de Memoria y Lockfile</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-300 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-zinc-300 dark:border-zinc-800 bg-zinc-200/50 dark:bg-zinc-950/60 px-2 pt-1 gap-1 text-[11px] font-mono">
        <button
          onClick={() => setActiveTab('historial')}
          className={'px-2.5 py-1.5 rounded-t flex items-center gap-1.5 transition-all cursor-pointer ' + (
            activeTab === 'historial'
              ? 'bg-zinc-100 dark:bg-zinc-900 text-amber-600 dark:text-amber-400 border-b-2 border-amber-500 font-bold'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          )}
        >
          <Lock className="w-3 h-3" /> historial.md ( 0 )
        </button>

        <button
          onClick={() => setActiveTab('rag')}
          className={'px-2.5 py-1.5 rounded-t flex items-center gap-1.5 transition-all cursor-pointer ' + (
            activeTab === 'rag'
              ? 'bg-zinc-100 dark:bg-zinc-900 text-violet-600 dark:text-violet-400 border-b-2 border-violet-500 font-bold'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          )}
        >
          <BookOpen className="w-3 h-3" /> RAG Vectorial ( {ragCount} )
        </button>

        <button
          onClick={() => setActiveTab('stm')}
          className={'px-2.5 py-1.5 rounded-t flex items-center gap-1.5 transition-all cursor-pointer ' + (
            activeTab === 'stm'
              ? 'bg-zinc-100 dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 font-bold'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          )}
        >
          <Cpu className="w-3 h-3" /> STM ( {activeTokens} tk )
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
        {/* Banner Contrato de Inmutabilidad */}
        <div className="p-3 rounded-lg bg-amber-100/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Contrato de Inmutabilidad Activo</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-400/90">
            El System Prompt prohíbe taxativamente al agente alterar la lógica de los componentes aquí registrados.
          </p>
        </div>

        {/* Lockfile path and copy action */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="font-mono text-zinc-500 dark:text-zinc-400">./historial.md</span>
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 flex items-center gap-1 font-mono text-[11px] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copiado' : 'Copiar Markdown'}</span>
          </button>
        </div>

        {/* Markdown Content Preview */}
        <div className="bg-zinc-200/80 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-300 dark:border-zinc-800 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
          {sampleMarkdown}
        </div>
      </div>
    </aside>
  );
};
