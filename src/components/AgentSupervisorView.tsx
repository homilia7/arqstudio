import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Terminal, 
  Cpu, 
  Play, 
  Pause, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Activity, 
  Layers, 
  Code2, 
  AlertCircle 
} from 'lucide-react';
import { Project, TaskItem } from '../types';

interface AgentSupervisorViewProps {
  activeProject: Project | null;
  tasks: TaskItem[];
  isAgentRunning: boolean;
  onRunAgentLoop: () => void;
}

export const AgentSupervisorView: React.FC<AgentSupervisorViewProps> = ({
  activeProject,
  tasks,
  isAgentRunning,
  onRunAgentLoop,
}) => {
  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] AgentOS Runtime v2.5 initialized on Cloudflare Pages.',
    '[RAG] Vector index connected: 0 documents indexed in long term memory.',
    '[HITL] Human-in-the-Loop strict gate active: Locked tasks cannot be modified by agents.',
    '[READY] Swarm ready. Waiting for task execution dispatch...'
  ]);

  const [activeStep, setActiveStep] = useState<string>('Esperando tarea...');

  useEffect(() => {
    if (isAgentRunning) {
      setLogs((prev) => [
        ...prev,
        '[DISPATCH] ' + new Date().toLocaleTimeString() + ' - Bucle agéntico iniciado para proyecto ' + (activeProject?.name || 'Active'),
        '[REASONING] Agente analizando contexto de requerimientos e inyectando reglas TDD / Hyrum...',
        '[CODEGEN] Generando archivos de implementación sin romper dependencias...',
        '[VERIFY] Ejecutando linter y exportando build a Cloudflare Pages...'
      ]);
      setActiveStep('Razonando & Escribiendo código...');
      const timer = setTimeout(() => {
        setLogs((prev) => [
          ...prev,
          '[SUCCESS] Tarea procesada con éxito. Solicitando revisión humana en QA Hub.'
        ]);
        setActiveStep('Completado - Listo para QA');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isAgentRunning]);

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto text-zinc-900 dark:text-zinc-100">
      {/* Encabezado del Supervisor */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-300 dark:border-zinc-800 pb-3">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Cpu className="w-4 h-4 text-violet-500 dark:text-violet-400" />
            <span>Supervisor de Agentes & Enjambre (AgentOS Swarm)</span>
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            Monitoreo en tiempo real del ciclo de razonamiento, ejecución de código y telemetría de tokens.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRunAgentLoop}
            disabled={isAgentRunning}
            className={'flex items-center gap-2 px-4 py-1.5 rounded text-white font-semibold text-xs shadow transition-all ' + (
              isAgentRunning ? 'bg-amber-600 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-500'
            )}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isAgentRunning ? 'Ejecutando Agente...' : 'Iniciar Ciclo de Supervisión'}</span>
          </button>
        </div>
      </div>

      {/* Grid de Estado: Nodos del Enjambre (Swarm) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Nodo 1: Antigravity Lead */}
        <div className="bg-zinc-200/80 dark:bg-zinc-900/90 border border-zinc-300 dark:border-zinc-800 rounded-lg p-3.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Antigravity Lead Agent</h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">Rol: Orquestador & Arquitectura</p>
              </div>
            </div>
            <span className={'w-2 h-2 rounded-full ' + (isAgentRunning ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500')} />
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-300 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            <span>Estado: {isAgentRunning ? 'Razonando' : 'En espera'}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">2,410 tk</span>
          </div>
        </div>

        {/* Nodo 2: Gemini QA Verifier */}
        <div className="bg-zinc-200/80 dark:bg-zinc-900/90 border border-zinc-300 dark:border-zinc-800 rounded-lg p-3.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-violet-100 dark:bg-violet-950/60 border border-violet-300 dark:border-violet-700/60 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Gemini QA Verifier</h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">Rol: Quality Gates & Tests</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-violet-500" />
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-300 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            <span>Estado: Activo</span>
            <span className="text-violet-600 dark:text-violet-400 font-semibold">890 tk</span>
          </div>
        </div>

        {/* Nodo 3: Semantic Git Auditor */}
        <div className="bg-zinc-200/80 dark:bg-zinc-900/90 border border-zinc-300 dark:border-zinc-800 rounded-lg p-3.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-700/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Semantic Git Auditor</h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">Rol: Diffs & Rollbacks</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-300 dark:border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            <span>Estado: Vigilando</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-semibold">450 tk</span>
          </div>
        </div>
      </div>

      {/* Consola Terminal de Razonamiento en Vivo */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden shadow-xl font-mono text-xs">
        <div className="h-8 bg-zinc-900 px-3 flex items-center justify-between border-b border-zinc-800 text-zinc-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-200 text-[11px]">Consola de Telemetría y Razonamiento en Vivo</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">SSE: Conectado</span>
            <span className="text-emerald-400 font-bold">• EN LÍNEA</span>
          </div>
        </div>

        <div className="p-4 h-64 overflow-y-auto space-y-1.5 text-zinc-300 leading-relaxed bg-black">
          {logs.map((log, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-zinc-600 select-none">{String(index + 1).padStart(2, '0')}</span>
              <span className={
                log.includes('[SUCCESS]') ? 'text-emerald-400 font-semibold' :
                log.includes('[REASONING]') ? 'text-violet-300' :
                log.includes('[DISPATCH]') ? 'text-amber-400' :
                log.includes('[HITL]') ? 'text-cyan-400' :
                'text-zinc-400'
              }>
                {log}
              </span>
            </div>
          ))}
          {isAgentRunning && (
            <div className="flex items-center gap-2 text-emerald-400 animate-pulse pt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Agente ejecutando ciclo de pensamiento autónomo...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
