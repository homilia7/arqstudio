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
} from "lucide-react";
import {
  fetchNeonStatus,
  reconnectNeon,
  testNeonConnection,
  syncNeonDatabase,
  recreateDatabaseFromScratch,
  NeonDatabaseStatus,
} from "../services/api";

interface NeonDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const NeonDatabaseModal: React.FC<NeonDatabaseModalProps> = ({
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

  const handleSyncToNeon = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncNeonDatabase("to_neon");
      setSyncFeedback(res.message);
      await loadStatus();
    } catch (err: any) {
      setSyncFeedback(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncFromNeon = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncNeonDatabase("from_neon");
      setSyncFeedback(res.message);
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
    if (!window.confirm("¿Confirmas que deseas CREAR TODA LA BASE DE DATOS DESDE CERO? Se recrearán las tablas en Neon PostgreSQL (usuarios, contadores, clientes, comprobantes, antigravity) y se poblará la estructura modular limpia.")) {
      return;
    }
    setIsRecreating(true);
    setSyncFeedback(null);
    try {
      const res = await recreateDatabaseFromScratch();
      setSyncFeedback(res.message);
      if (onRefreshData) onRefreshData();
      await loadStatus();
    } catch (err: any) {
      setSyncFeedback(`Error al recrear base de datos: ${err.message}`);
    } finally {
      setIsRecreating(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div
      id="neon-database-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="neon-database-modal-card"
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Conexión con Neon PostgreSQL
                {status?.isConnected ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Conectado en Vivo
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Respaldo Local Activo
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                Almacenamiento persistente en la nube Serverless PostgreSQL para Antigravity
              </p>
            </div>
          </div>
          <button
            id="close-neon-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border ${
              status?.isConnected
                ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                : "bg-zinc-800/60 border-zinc-700 text-zinc-300"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Activity className="w-4 h-4" />
                  {status?.isConnected
                    ? "Base de datos Neon conectada y sincronizada"
                    : "Esperando credenciales de Neon"}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {status?.message || "Cargando estado de la conexión..."}
                </p>
              </div>

              <button
                onClick={handleReconnect}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-slate-700 text-zinc-200 border border-slate-600 rounded-lg transition disabled:opacity-50 shrink-0 ml-3"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                Reconectar
              </button>
            </div>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-lg">
              <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                Modo
              </div>
              <div className="mt-1 text-xs font-semibold text-white truncate">
                {status?.mode === "neon_api"
                  ? "Neon API"
                  : status?.mode === "database_url"
                  ? "DATABASE_URL"
                  : "Offline Store"}
              </div>
            </div>

            <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-lg">
              <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                Latencia Ping
              </div>
              <div className="mt-1 text-xs font-semibold text-white">
                {status?.latencyMs ? `${status.latencyMs} ms` : "N/A"}
              </div>
            </div>

            <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-lg">
              <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-purple-400" />
                Base de Datos
              </div>
              <div className="mt-1 text-xs font-semibold text-white truncate">
                {status?.databaseName || "neondb"}
              </div>
            </div>

            <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-lg">
              <div className="text-[11px] font-medium text-zinc-400 flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                Último Sync
              </div>
              <div className="mt-1 text-[11px] font-medium text-zinc-300 truncate">
                {status?.lastSyncAt
                  ? new Date(status.lastSyncAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "Pendiente"}
              </div>
            </div>
          </div>

          {/* Tablas activas en Neon */}
          <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Tablas PostgreSQL Creadas & Sincronizadas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs">
                <span className="font-mono font-bold text-emerald-400">antigravity_store</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">Persistencia y JSONB snapshot</p>
              </div>
              <div className="p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs">
                <span className="font-mono font-bold text-cyan-400">antigravity_projects</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">Blueprints, URLs y API keys</p>
              </div>
              <div className="p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs">
                <span className="font-mono font-bold text-purple-400">antigravity_tasks</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">Tareas, estados y memorias</p>
              </div>
            </div>
          </div>

          {/* Test & Sync Actions */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              id="test-neon-query-btn"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow transition disabled:opacity-50 cursor-pointer"
            >
              <Zap className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
              {isTesting ? "Consultando Neon..." : "Probar Consulta SQL (Ping)"}
            </button>

            <button
              id="sync-to-neon-btn"
              onClick={handleSyncToNeon}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-slate-700 text-zinc-200 border border-zinc-700 transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Sincronizando..." : "Sincronizar Local ➔ Neon"}
            </button>

            <button
              id="sync-from-neon-btn"
              onClick={handleSyncFromNeon}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-slate-700 text-zinc-200 border border-zinc-700 transition disabled:opacity-50 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-purple-400" />
              Descargar Datos desde Neon
            </button>

            <button
              id="recreate-db-scratch-btn"
              onClick={handleRecreateDatabase}
              disabled={isRecreating}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-rose-700 hover:bg-rose-600 text-white shadow transition disabled:opacity-50 cursor-pointer border border-rose-600"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRecreating ? "animate-spin" : ""}`} />
              {isRecreating ? "Creando BD desde cero..." : "Crear Toda la BD Desde Cero"}
            </button>
          </div>

          {/* Feedback messages */}
          {syncFeedback && (
            <div className="p-3 rounded-lg bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {testResult && (
            <div
              className={`p-3.5 rounded-lg border text-xs font-mono ${
                testResult.success
                  ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-300"
                  : "bg-red-950/30 border-red-800/60 text-red-300"
              }`}
            >
              {testResult.success ? (
                <div className="space-y-1">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    ¡Prueba exitosa! Latencia: {testResult.latencyMs}ms
                  </div>
                  <div>Base de datos: {testResult.result?.database}</div>
                  <div>Fecha servidor: {testResult.result?.now}</div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    Versión: {testResult.result?.version}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Error: {testResult.error}</span>
                </div>
              )}
            </div>
          )}

          {/* Configuración Secrets Guide */}
          <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-2 text-xs text-zinc-400">
            <div className="font-semibold text-zinc-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Configuración de la API de Neon en Secrets
            </div>
            <p className="leading-relaxed">
              El servidor lee automáticamente las credenciales desde el panel de{" "}
              <strong className="text-zinc-200">Settings &gt; Secrets</strong> de Google AI Studio:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
              <li>
                <strong className="text-emerald-400">NEON_API_KEY</strong>: Clave de API de gestión
                de Neon (obtenida en{" "}
                <a
                  href="https://console.neon.tech/app/settings/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 underline inline-flex items-center gap-0.5"
                >
                  console.neon.tech <ExternalLink className="w-2.5 h-2.5" />
                </a>
                ). Resuelve proyectos y crea la conexión automáticamente.
              </li>
              <li>
                <strong className="text-cyan-400">DATABASE_URL</strong> o{" "}
                <strong className="text-cyan-400">NEON_DATABASE_URL</strong>: Cadena de conexión
                directa PostgreSQL de Neon (ejemplo:{" "}
                <code className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-300">
                  postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require
                </code>
                ).
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <div className="text-xs text-zinc-400">
            {status?.isConnected ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Conexión Neon activa
              </span>
            ) : (
              <span className="text-zinc-400">
                Los cambios se guardan localmente y se replicarán al conectar Neon.
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-slate-700 text-white transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
