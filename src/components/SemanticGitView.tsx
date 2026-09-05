import React, { useState } from 'react';
import { 
  FolderGit2, 
  GitCommit, 
  GitBranch, 
  RotateCcw, 
  FileCode2 
} from 'lucide-react';
import { Project, AgentCommit } from '../types';

interface SemanticGitViewProps {
  activeProject: Project | null;
}

export const SemanticGitView: React.FC<SemanticGitViewProps> = ({ activeProject }) => {
  const [commits, setCommits] = useState<AgentCommit[]>([
    {
      id: 'commit-1',
      projectId: activeProject?.id || 'default',
      agentName: 'Antigravity Lead Agent',
      commitHash: 'a8f1b2c',
      commitMessage: 'feat: Endpoints de autenticación con PIN y persistencia D1',
      diffContent: '@@ -0,0 +1,14 @@\n+ export async function handleLogin(pin: string) {\n+   const user = await db.query(\'SELECT * FROM users WHERE pin = ?\', [pin]);\n+   if (!user) throw new Error(\'PIN inválido\');\n+   return user;\n+ }',
      additions: 14,
      deletions: 0,
      tokensUsed: 620,
      isReverted: false,
      timestamp: '2026-09-05 11:45'
    },
    {
      id: 'commit-2',
      projectId: activeProject?.id || 'default',
      agentName: 'Antigravity Lead Agent',
      commitHash: 'e4d9c7a',
      commitMessage: 'fix: Corregido timeout en conexión SSE con Cloudflare Workers',
      diffContent: '@@ -12,4 +12,4 @@\n- const timeout = 5000;\n+ const timeout = 30000; // Cloudflare streaming keepalive',
      additions: 1,
      deletions: 1,
      tokensUsed: 310,
      isReverted: false,
      timestamp: '2026-09-05 12:02'
    }
  ]);

  const [selectedCommit, setSelectedCommit] = useState<AgentCommit>(commits[0]);
  const [revertingId, setRevertingId] = useState<string | null>(null);

  const handleRollback = (commit: AgentCommit) => {
    if (confirm('¿Confirmas hacer Rollback del commit ' + commit.commitHash + '? Se restaurará el estado previo.')) {
      setRevertingId(commit.id);
      setTimeout(() => {
        setCommits((prev) =>
          prev.map((c) => (c.id === commit.id ? { ...c, isReverted: true } : c))
        );
        setRevertingId(null);
        alert('Rollback completado con éxito.');
      }, 1000);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto text-zinc-900 dark:text-zinc-100">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-300 dark:border-zinc-800 pb-3">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <FolderGit2 className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            <span>Motor de Control de Versiones Semántico (Git para Agentes)</span>
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            Árbol de commits DAG, inspección de diferencias (diff) línea por línea y reversión segura en 1 clic.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5" /> main (HEAD)
          </span>
        </div>
      </div>

      {/* Grid: Lista de Commits a la izquierda, Diff a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Columna Izquierda: Commits DAG */}
        <div className="lg:col-span-5 space-y-2">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">Historial de Commits</h3>
          <div className="space-y-2">
            {commits.map((commit) => (
              <div
                key={commit.id}
                onClick={() => setSelectedCommit(commit)}
                className={'p-3 rounded-lg border cursor-pointer transition-all ' + (
                  selectedCommit?.id === commit.id
                    ? 'bg-zinc-300/80 dark:bg-zinc-800/90 border-cyan-500 shadow-md'
                    : 'bg-zinc-200/60 dark:bg-zinc-900/80 border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                )}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1">
                    <GitCommit className="w-3 h-3" /> {commit.commitHash}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">{commit.timestamp}</span>
                </div>
                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 mt-1">{commit.commitMessage}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-300 dark:border-zinc-800/60 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
                  <span>Por: {commit.agentName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400">+{commit.additions}</span>
                    <span className="text-rose-600 dark:text-rose-400">-{commit.deletions}</span>
                    {commit.isReverted ? (
                      <span className="px-1.5 py-0.2 rounded bg-rose-200 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800/60">REVERTIDO</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Visualizador de Diff de Código */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
          <div className="h-9 bg-zinc-900 px-3 flex items-center justify-between border-b border-zinc-800 text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono font-semibold">Diff: {selectedCommit?.commitHash}</span>
            </div>
            {!selectedCommit?.isReverted && (
              <button
                onClick={() => handleRollback(selectedCommit)}
                disabled={revertingId === selectedCommit?.id}
                className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 font-mono text-[11px] flex items-center gap-1 transition-colors"
              >
                <RotateCcw className={'w-3 h-3 ' + (revertingId === selectedCommit?.id ? 'animate-spin' : '')} />
                <span>Deshacer Cambios (Rollback)</span>
              </button>
            )}
          </div>

          <div className="p-4 font-mono text-xs overflow-x-auto flex-1 bg-black text-zinc-300 leading-relaxed">
            <pre className="whitespace-pre-wrap">
              {selectedCommit?.diffContent.split('\n').map((line, idx) => {
                const isAdd = line.startsWith('+');
                const isDel = line.startsWith('-');
                const isHeader = line.startsWith('@');
                return (
                  <div
                    key={idx}
                    className={'px-2 py-0.5 rounded ' + (
                      isAdd ? 'bg-emerald-950/40 text-emerald-300' :
                      isDel ? 'bg-rose-950/40 text-rose-300' :
                      isHeader ? 'text-violet-400 bg-violet-950/20' :
                      'text-zinc-400'
                    )}
                  >
                    {line}
                  </div>
                );
              })}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
