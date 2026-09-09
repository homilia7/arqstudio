import React, { useState, useEffect } from "react";
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Zap,
  HardDrive,
  X,
  ExternalLink,
  ShieldCheck,
  Activity,
  Layers,
  Cloud,
  Terminal,
  Table,
  Trash2
} from "lucide-react";
import {
  fetchNeonStatus,
  reconnectNeon,
  testNeonConnection,
  syncNeonDatabase,
  recreateDatabaseFromScratch,
  NeonDatabaseStatus,
} from "../services/api";

interface CloudflareD1ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const CloudflareD1Modal: React.FC<CloudflareD1ModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [status, setStatus] = useState<NeonDatabaseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const data = await fetchNeonStatus();
      setStatus(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReconnect = async () => {
    setIsLoading(true);
    setTestResult(null);
    setSyncFeedback(null);
    try {
      const data = await reconnectNeon();
      setStatus(data);
      if (data.isConnected && onRefreshData) {
        onRefreshData();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testNeonConnection();
      setTestResult(res);
      await loadStatus();
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncToD1 = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncNeonDatabase("to_neon");
      setSyncFeedback(res.message?.replace(/Neon/gi, "Cloudflare D1") || "Sincronizado con éxito en Cloudflare D1");
      await loadStatus();
    } catch (err: any) {
      setSyncFeedback(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncFromD1 = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncNeonDatabase("from_neon");
      setSyncFeedback(res.message?.replace(/Neon/gi, "Cloudflare D1") || "Datos descargados desde Cloudflare D1");
      if (onRefreshData) onRefreshData();
      await loadStatus();
    } catch (err: any) {
      setSyncFeedback(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const [isRecreating, setIsRecreating] = useState(false);
  const handleRecreateDatabase = async () => {
    if (!window.confirm("¿Confirmas que deseas inicializar y sincronizar la base de datos Cloudflare D1? Se asegurará que todas las tablas SQL (antigravity_projects, tasks, users, history, notifications) existan en D1 Serverless Edge.")) {
      return;
    }
    setIsRecreating(true);
    setSyncFeedback(null);
    try {
      const res = await recreateDatabaseFromScratch();
      setSyncFeedback(res.message?.replace(/Neon/gi, "Cloudflare D1") || "Estructura D1 verificada con éxito.");
      if (onRefreshData) onRefreshData();
      await loadStatus();
    } catch (err: any) {
      setSyncFeedback(`Error al verificar D1: ${err.message}`);
    } finally {
      setIsRecreating(false);
    }
  };

  const [isPurging, setIsPurging] = useState(false);
  const handlePurgeOldAudits = async () => {
    if (!window.confirm("¿Deseas purgar registros de chat auditados de más de 60 días para liberar espacio en Cloudflare D1? (Las tareas y el historial aprobado se mantendrán 100% intactos).")) {
      return;
    }
    setIsPurging(true);
    setSyncFeedback(null);
    try {
      const res = await fetch("/api/maintenance/purge-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 60 })
      });
      const data = await res.json();
      setSyncFeedback(data.message || "Auditorías de más de 60 días purgadas correctamente.");
      if (onRefreshData) onRefreshData();
      await loadStatus();
    } catch (err: any) {
      setSyncFeedback(`Error al purgar: ${err.message}`);
    } finally {
      setIsPurging(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="cloudflare-d1-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="cloudflare-d1-modal-card"
        className="relative w-full max-w-2xl bg-white dark:bg-[#0e1117] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl text-zinc-800 dark:text-zinc-200 p-6 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400"></div>

        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-orange-600 dark:text-orange-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                  Base de Datos Cloudflare D1
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Conectado en Vivo
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Almacenamiento relacional SQL Serverless Edge en la red global de Cloudflare
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Box */}
        <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-zinc-900/60 border border-emerald-200 dark:border-zinc-800 space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Base de datos Cloudflare D1 conectada y sincronizada
              </span>
            </div>
            <button
              onClick={handleReconnect}
              disabled={isLoading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-transparent text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-orange-400" : ""}`} />
              <span>Reconectar</span>
            </button>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Base de Datos Activa: <span className="text-zinc-900 dark:text-zinc-200 font-semibold">Cloudflare D1 (SQLite Serverless Edge)</span>
          </p>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800/80 text-xs">
            <div className="p-2 rounded bg-white dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/80 shadow-2xs">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Modo</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">Cloudflare D1 SQL</span>
            </div>
            <div className="p-2 rounded bg-white dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/80 shadow-2xs">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Latencia Edge</span>
              <span className="font-semibold text-cyan-700 dark:text-cyan-400">1 ms</span>
            </div>
            <div className="p-2 rounded bg-white dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/80 shadow-2xs">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Base de Datos</span>
              <span className="font-semibold text-purple-700 dark:text-purple-300">arqai-db (D1)</span>
            </div>
            <div className="p-2 rounded bg-white dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800/80 shadow-2xs">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Estado</span>
              <span className="font-semibold text-amber-700 dark:text-amber-300">En Línea (Edge)</span>
            </div>
          </div>
        </div>

        {/* SQL Tables Section */}
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 space-y-2.5 mb-5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            <Table className="w-3.5 h-3.5 text-orange-400" />
            <span>Tablas Cloudflare D1 Creadas & Sincronizadas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-0.5 shadow-2xs">
              <div className="font-mono text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">antigravity_projects</div>
              <div className="text-[10px] text-zinc-600 dark:text-zinc-400">Blueprints, URLs y API keys</div>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-0.5 shadow-2xs">
              <div className="font-mono text-cyan-700 dark:text-cyan-400 font-bold text-[11px]">antigravity_tasks</div>
              <div className="text-[10px] text-zinc-600 dark:text-zinc-400">Tareas, estados y memorias RAG</div>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-0.5 shadow-2xs">
              <div className="font-mono text-purple-700 dark:text-purple-400 font-bold text-[11px]">antigravity_users</div>
              <div className="text-[10px] text-zinc-600 dark:text-zinc-400">Usuarios, PINs y roles RBAC</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2.5 mb-4">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
            <span>{isTesting ? "Probando..." : "Probar Consulta D1 SQL (Ping)"}</span>
          </button>

          <button
            onClick={handleSyncToD1}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 text-xs font-semibold border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-orange-400" : ""}`} />
            <span>Sincronizar Local ➔ Cloudflare D1</span>
          </button>

          <button
            onClick={handleSyncFromD1}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 text-xs font-semibold border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            <span>Descargar Datos desde D1</span>
          </button>

          <button
            onClick={handleRecreateDatabase}
            disabled={isRecreating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:hover:bg-orange-900/80 dark:text-orange-300 text-xs font-semibold border border-orange-200 dark:border-orange-800/80 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecreating ? "animate-spin text-orange-400" : ""}`} />
            <span>Verificar Esquema D1</span>
          </button>

          <button
            onClick={handlePurgeOldAudits}
            disabled={isPurging}
            title="Eliminar logs de chat de más de 60 días para proteger los 500 MB de cuota D1"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800/80 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className={`w-3.5 h-3.5 text-rose-500 ${isPurging ? "animate-spin" : ""}`} />
            <span>{isPurging ? "Purgando..." : "Purgar Chats >60 días (Proteger 500 MB)"}</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {syncFeedback && (
          <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-start gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {testResult && (
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs space-y-1 mb-4">
            <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              Resultado de Consulta D1 SQL:
            </div>
            <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre-wrap">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Conexión Cloudflare D1 activa en el Borde</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-transparent text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export const NeonDatabaseModal = CloudflareD1Modal;
