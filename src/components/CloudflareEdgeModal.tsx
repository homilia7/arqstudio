import React, { useState } from "react";
import { Cloud, RefreshCw, X, Server, Database, Zap, Cpu, Layers, Activity } from "lucide-react";

interface CloudflareEdgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudflareEdgeModal: React.FC<CloudflareEdgeModalProps> = ({
  isOpen,
  onClose
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [latency, setLatency] = useState(2);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLatency(Math.floor(Math.random() * 3) + 1);
      setIsRefreshing(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0e1117] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl text-zinc-800 dark:text-zinc-200 w-full max-w-3xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-[#16191f] border-b border-zinc-200 dark:border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-950/80 border border-orange-800/80 flex items-center justify-center text-orange-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                  Ecosistema Cloudflare Edge Native
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-orange-950/50 text-orange-400 border border-orange-800/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                  Edge Activo
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Arquitectura distribuida sin servidor, latencia ultrabaja y persistencia relacional SQL en D1.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-800 transition-colors"
              title="Refrescar métricas"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-orange-400" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-4 bg-[#12151b] border-b border-zinc-200 dark:border-zinc-800 text-xs">
          <div className="p-2.5 rounded bg-zinc-50 dark:bg-[#090b0e] border border-zinc-200 dark:border-zinc-800/80 space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Latencia Edge</span>
            <div className="text-base font-mono font-bold text-emerald-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              <span>{latency} ms</span>
            </div>
          </div>

          <div className="p-2.5 rounded bg-zinc-50 dark:bg-[#090b0e] border border-zinc-200 dark:border-zinc-800/80 space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Base de Datos</span>
            <div className="text-base font-mono font-bold text-orange-400 flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              <span>Cloudflare D1</span>
            </div>
          </div>

          <div className="p-2.5 rounded bg-zinc-50 dark:bg-[#090b0e] border border-zinc-200 dark:border-zinc-800/80 space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Cálculo</span>
            <div className="text-base font-mono font-bold text-purple-400 flex items-center gap-1.5">
              <Server className="w-4 h-4" />
              <span>Pages Functions</span>
            </div>
          </div>

          <div className="p-2.5 rounded bg-zinc-50 dark:bg-[#090b0e] border border-zinc-200 dark:border-zinc-800/80 space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Streaming</span>
            <div className="text-base font-mono font-bold text-blue-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>SSE Activo</span>
            </div>
          </div>
        </div>

        {/* Detailed Service Cards */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto text-xs text-zinc-300 max-h-72">
          <div className="p-3 rounded-lg bg-white dark:bg-[#12151b] border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-start gap-3">
            <div className="p-2 rounded bg-orange-950/40 border border-orange-800/50 text-orange-400 shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white text-xs">Cloudflare D1 Serverless SQL</h4>
              <p className="text-zinc-600 dark:text-zinc-400 text-[11px] mt-0.5">
                Almacena usuarios, proyectos, tareas agénticas, historial de auditoría y bloqueos de seguridad en SQLite distribuido con replicación global automática.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white dark:bg-[#12151b] border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-start gap-3">
            <div className="p-2 rounded bg-purple-950/40 border border-purple-800/50 text-purple-400 shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white text-xs">Edge Workers & Functions</h4>
              <p className="text-zinc-600 dark:text-zinc-400 text-[11px] mt-0.5">
                Enrutamiento API y ejecución de lógica agéntica en más de 300 centros de datos mundiales con tiempos de arranque en frío de 0 ms.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white dark:bg-[#12151b] border border-zinc-200 dark:border-zinc-800 shadow-2xs flex items-start gap-3">
            <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white text-xs">Memoria Vectorial & Cache</h4>
              <p className="text-zinc-600 dark:text-zinc-400 text-[11px] mt-0.5">
                Vectorize para recuperación RAG de fragmentos técnicos y cache distribuido para respuestas de LLM de alta velocidad.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-[#16191f] border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-zinc-500">Nodo Edge: SJO (San José / Global Anycast)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-transparent text-xs font-medium transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
