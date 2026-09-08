import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  X, 
  BookOpen, 
  Cpu, 
  Copy, 
  Check, 
  AlertTriangle, 
  ShieldCheck,
  FileCode,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Project, RagMemorySnippet } from '../types';
import { fetchRagMemory } from '../services/api';

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
  const [activeTab, setActiveTab] = useState<'locked' | 'rag' | 'connector'>('locked');
  const [copied, setCopied] = useState(false);
  const [ragSnippets, setRagSnippets] = useState<RagMemorySnippet[]>([]);
  const [tokensSaved, setTokensSaved] = useState(0);
  const [loadingRag, setLoadingRag] = useState(false);

  useEffect(() => {
    if (isOpen && activeProject?.id) {
      setLoadingRag(true);
      fetchRagMemory(activeProject.id)
        .then((res) => {
          setRagSnippets(res.snippets || []);
          setTokensSaved(res.estimatedTokensSaved || 0);
        })
        .catch((e) => console.error("Error loading RAG snippets:", e))
        .finally(() => setLoadingRag(false));
    }
  }, [isOpen, activeProject?.id]);

  if (!isOpen) return null;

  const lockedFilesList = activeProject?.lockedFiles || [];

  const connectorPayload = JSON.stringify(
    {
      hub: {
        apiUrl: "https://arqaistudio.pages.dev/api",
        apiKey: activeProject?.apiKey || "arqai_sec_...",
        projectId: activeProject?.id,
        projectName: activeProject?.name,
      },
      security: {
        lockedFiles: lockedFilesList,
        enforceLock: true,
      },
      sync: {
        autoSync: true,
        chatAudit: true,
        ragEnabled: true,
      },
    },
    null,
    2
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="w-96 shrink-0 bg-zinc-100/95 dark:bg-zinc-900/95 border-l border-zinc-300 dark:border-zinc-800 flex flex-col h-full text-xs text-zinc-900 dark:text-zinc-100 transition-colors animate-fadeIn select-none">
      {/* Header */}
      <div className="h-11 px-3.5 bg-zinc-200/80 dark:bg-zinc-950 flex items-center justify-between border-b border-zinc-300 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
          <span className="font-bold text-xs">Inspector de Escudo & RAG Memory</span>
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
          onClick={() => setActiveTab('locked')}
          className={'px-2.5 py-1.5 rounded-t flex items-center gap-1.5 transition-all cursor-pointer ' + (
            activeTab === 'locked'
              ? 'bg-zinc-100 dark:bg-zinc-900 text-amber-600 dark:text-amber-400 border-b-2 border-amber-500 font-bold'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          )}
        >
          <Lock className="w-3 h-3" /> Candados ({lockedFilesList.length})
        </button>

        <button
          onClick={() => setActiveTab('rag')}
          className={'px-2.5 py-1.5 rounded-t flex items-center gap-1.5 transition-all cursor-pointer ' + (
            activeTab === 'rag'
              ? 'bg-zinc-100 dark:bg-zinc-900 text-violet-600 dark:text-violet-400 border-b-2 border-violet-500 font-bold'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          )}
        >
          <Sparkles className="w-3 h-3" /> RAG ({ragSnippets.length || ragCount})
        </button>

        <button
          onClick={() => setActiveTab('connector')}
          className={'px-2.5 py-1.5 rounded-t flex items-center gap-1.5 transition-all cursor-pointer ' + (
            activeTab === 'connector'
              ? 'bg-zinc-100 dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 font-bold'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
          )}
        >
          <FileCode className="w-3 h-3" /> .arqai.json
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
        {activeTab === 'locked' && (
          <>
            {/* Banner Contrato de Inmutabilidad */}
            <div className="p-3 rounded-lg bg-amber-100/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Escudo de Código Activo (Quality Gate)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-400/90">
                Los archivos listados aquí están blindados inmutablemente. Si cualquier agente intenta sobreescribirlos, la API devolverá HTTP 403 Forbidden.
              </p>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Archivos Protegidos ({lockedFilesList.length})
              </div>
              {lockedFilesList.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg">
                  No hay archivos con candado aún. Al verificar tareas en la web, sus archivos entrarán automáticamente a este escudo.
                </div>
              ) : (
                lockedFilesList.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate text-zinc-800 dark:text-zinc-200">{file}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                      INMUTABLE
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'rag' && (
          <>
            <div className="p-3 rounded-lg bg-violet-100/90 dark:bg-violet-950/40 border border-violet-300 dark:border-violet-800/60 text-violet-900 dark:text-violet-300 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Memoria RAG Indexada</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-violet-200 dark:bg-violet-900/60 px-2 py-0.5 rounded">
                  ~{tokensSaved} tokens ahorrados
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-violet-800 dark:text-violet-300/90">
                Fragmentos indexados semánticamente. La IA consulta solo estas cápsulas en vez de todo el proyecto, reduciendo hasta 90% el consumo de tokens.
              </p>
            </div>

            {loadingRag ? (
              <div className="p-4 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-violet-500" />
                Cargando cápsulas RAG...
              </div>
            ) : ragSnippets.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg">
                No hay cápsulas indexadas. Se generarán automáticamente al aprobar tareas y auditorías de diálogo.
              </div>
            ) : (
              <div className="space-y-2">
                {ragSnippets.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                        {s.title}
                      </span>
                      {s.componentTag && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 font-mono text-zinc-600 dark:text-zinc-300">
                          {s.componentTag}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-3 font-mono">
                      {s.contentSnippet}
                    </p>
                    {s.rulesSummary && (
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono pt-0.5">
                        🛡️ {s.rulesSummary}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'connector' && (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-zinc-500 dark:text-zinc-400">./.arqai.json (Local Bridge)</span>
              <button
                onClick={() => handleCopy(connectorPayload)}
                className="px-2.5 py-1 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 flex items-center gap-1 font-mono text-[11px] transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado' : 'Copiar Config'}</span>
              </button>
            </div>

            <div className="bg-zinc-200/80 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-300 dark:border-zinc-800 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {connectorPayload}
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

