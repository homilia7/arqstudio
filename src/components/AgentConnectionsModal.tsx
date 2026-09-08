import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Network,
  Server,
  Calendar,
  Activity,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Bot,
  CheckCircle2,
  Radio,
} from "lucide-react";
import { AgentConnection, BlockedAgent, User } from "../types";
import {
  fetchAgentConnections,
  clearAgentConnections,
  fetchBlockedAgents,
  toggleBlockAgent,
} from "../services/api";

interface AgentConnectionsModalProps {
  onClose: () => void;
  currentUser?: User | null;
}

export const AgentConnectionsModal: React.FC<AgentConnectionsModalProps> = ({
  onClose,
  currentUser,
}) => {
  const [connections, setConnections] = useState<AgentConnection[]>([]);
  const [blockedAgents, setBlockedAgents] = useState<BlockedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [togglingAgent, setTogglingAgent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"agents" | "logs">("agents");

  const loadData = async () => {
    setLoading(true);
    try {
      const [connData, blockData] = await Promise.all([
        fetchAgentConnections(currentUser?.id),
        fetchBlockedAgents(currentUser?.id),
      ]);
      setConnections(Array.isArray(connData) ? connData : []);
      setBlockedAgents(Array.isArray(blockData) ? blockData : []);
    } catch (error) {
      console.error("Error loading agent connections & blocked list:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClearAll = async () => {
    if (
      window.confirm(
        "¿Estás seguro de borrar TODO el historial de conexiones de agentes para tu cuenta? Esta acción no se puede deshacer."
      )
    ) {
      setClearing(true);
      try {
        await clearAgentConnections(currentUser?.id);
        setConnections([]);
      } catch (error) {
        console.error("Error clearing agent connections:", error);
      } finally {
        setClearing(false);
      }
    }
  };

  const handleToggleBlock = async (agentName: string) => {
    setTogglingAgent(agentName);
    try {
      const res = await toggleBlockAgent(agentName, currentUser?.id);
      if (res.isBlocked) {
        setBlockedAgents((prev) => [
          ...prev,
          {
            id: "block-" + Date.now(),
            agentName,
            userId: currentUser?.id,
            blockedAt: new Date().toISOString(),
          },
        ]);
      } else {
        setBlockedAgents((prev) =>
          prev.filter(
            (b) => b.agentName.toUpperCase() !== agentName.toUpperCase()
          )
        );
      }
    } catch (error) {
      console.error("Error toggling agent block status:", error);
    } finally {
      setTogglingAgent(null);
    }
  };

  const isBlocked = (agentName: string) => {
    return blockedAgents.some(
      (b) => b.agentName.toUpperCase() === agentName.toUpperCase()
    );
  };

  // Extraer agentes únicos detectados
  const uniqueAgentMap = new Map<
    string,
    {
      name: string;
      lastSeen: string;
      requestsCount: number;
      lastProject?: string;
    }
  >();

  connections.forEach((c) => {
    const key = c.agentName.trim().toUpperCase();
    const existing = uniqueAgentMap.get(key);
    if (!existing) {
      uniqueAgentMap.set(key, {
        name: c.agentName,
        lastSeen: c.connectedAt,
        requestsCount: 1,
        lastProject: c.projectName,
      });
    } else {
      existing.requestsCount += 1;
      if (new Date(c.connectedAt) > new Date(existing.lastSeen)) {
        existing.lastSeen = c.connectedAt;
        if (c.projectName) existing.lastProject = c.projectName;
      }
    }
  });

  // Asegurar que agentes bloqueados que no tengan logs recientes también aparezcan
  blockedAgents.forEach((b) => {
    const key = b.agentName.trim().toUpperCase();
    if (!uniqueAgentMap.has(key)) {
      uniqueAgentMap.set(key, {
        name: b.agentName,
        lastSeen: b.blockedAt,
        requestsCount: 0,
      });
    }
  });

  const uniqueAgents = Array.from(uniqueAgentMap.values());

  const getAgentBadge = (name: string) => {
    const n = name.toUpperCase();
    if (n.includes("ANTIGRAVITY"))
      return "text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-300 dark:bg-indigo-950/80 dark:border-indigo-500/40";
    if (n.includes("CLOUDE") || n.includes("CLAUDE"))
      return "text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-950/80 dark:border-orange-500/40";
    if (n.includes("GPT"))
      return "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/80 dark:border-emerald-500/40";
    if (n.includes("HERMES"))
      return "text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-950/80 dark:border-sky-500/40";
    if (n.includes("CODEX"))
      return "text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950/80 dark:border-purple-500/40";
    return "text-zinc-700 bg-zinc-100 border-zinc-300 dark:text-zinc-300 dark:bg-zinc-900 dark:border-zinc-700";
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[88vh] shrink-0 overflow-hidden text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 rounded-lg flex items-center justify-center">
              <Radio className="w-4 h-4 animate-pulse text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                  Control de Agentes & Conexiones API
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>API ACTIVA</span>
                </span>
              </div>
              <p className="text-[10px] text-zinc-600 dark:text-zinc-400">
                Supervisa en vivo qué agentes IA están usando la API y bloquea o autoriza su acceso instantáneamente.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {connections.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={clearing}
                title="Borrar todo el historial de conexiones de tu cuenta"
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/80 dark:hover:bg-rose-900 dark:text-rose-300 dark:border-rose-800/80 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                <span className="hidden sm:inline">{clearing ? "Borrando..." : "Borrar Historial"}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-5 py-2 bg-zinc-50/80 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("agents")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "agents"
                  ? "bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-xs dark:bg-indigo-950/90 dark:text-indigo-300 dark:border-indigo-500/50"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Agentes Detectados ({uniqueAgents.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "logs"
                  ? "bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-xs dark:bg-indigo-950/90 dark:text-indigo-300 dark:border-indigo-500/50"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Bitácora de Peticiones ({connections.length})</span>
            </button>
          </div>

          <div className="text-[11px] text-zinc-600 dark:text-zinc-400 hidden sm:flex items-center gap-2">
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              {uniqueAgents.filter((a) => !isBlocked(a.name)).length} Autorizados
            </span>
            <span>•</span>
            <span className="text-rose-700 dark:text-rose-400 font-semibold">
              {blockedAgents.length} Bloqueados
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/30">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : activeTab === "agents" ? (
            /* LISTA DE AGENTES DETECTADOS Y BLOQUEO */
            <div className="space-y-2.5">
              {uniqueAgents.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-6 shadow-xs">
                  <Server className="w-10 h-10 text-zinc-400 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-800 dark:text-zinc-200 font-bold text-xs">
                    Ningún Agente se ha conectado por API aún.
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
                    Cuando un agente (Antigravity AI, Codex, Hermes, Claude, GPT, etc.) realice una petición HTTP a la API de ARQAI, aparecerá registrado aquí inmediatamente.
                  </p>
                </div>
              ) : (
                uniqueAgents.map((agent) => {
                  const blocked = isBlocked(agent.name);
                  const isToggling = togglingAgent === agent.name;

                  return (
                    <div
                      key={agent.name}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        blocked
                          ? "bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/60 dark:hover:border-rose-700/80"
                          : "bg-white dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                            blocked
                              ? "bg-rose-100 border-rose-200 text-rose-700 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-400"
                              : "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/80 dark:border-indigo-800 dark:text-indigo-400"
                          }`}
                        >
                          {blocked ? (
                            <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          ) : (
                            <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold border ${getAgentBadge(
                                agent.name
                              )}`}
                            >
                              {agent.name}
                            </span>
                            {blocked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-900/80 dark:text-rose-200 dark:border-rose-700">
                                <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                <span>ACCESO BLOQUEADO (HTTP 403)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800">
                                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>AUTORIZADO & ACTIVO</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-zinc-600 dark:text-zinc-400 flex-wrap">
                            <span>
                              <strong>{agent.requestsCount}</strong> peticiones registradas
                            </span>
                            <span>•</span>
                            <span>
                              Última actividad: <strong>{formatDate(agent.lastSeen)}</strong>
                            </span>
                            {agent.lastProject && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                                  Proyecto: {agent.lastProject}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* BOTÓN DE BLOQUEO / DESBLOQUEO */}
                      <div className="flex items-center shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleToggleBlock(agent.name)}
                          disabled={isToggling}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50 ${
                            blocked
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-sm"
                              : "bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 dark:text-rose-200 dark:border-rose-800"
                          }`}
                        >
                          {blocked ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>{isToggling ? "Procesando..." : "Desbloquear Acceso"}</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              <span>{isToggling ? "Procesando..." : "Bloquear Acceso"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* LISTA DE REGISTROS DE ACTIVIDAD DETALLADA */
            <div className="space-y-2">
              {connections.length === 0 ? (
                <div className="text-center py-10">
                  <Server className="w-10 h-10 text-zinc-400 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-800 dark:text-zinc-300 font-bold text-xs">
                    No hay registros de actividad aún.
                  </p>
                </div>
              ) : (
                connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="p-3 bg-white dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-zinc-900 border border-indigo-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Activity className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getAgentBadge(
                              conn.agentName
                            )}`}
                          >
                            {conn.agentName}
                          </span>
                          {isBlocked(conn.agentName) && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
                              Bloqueado
                            </span>
                          )}
                          {conn.projectName && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
                              Proyecto: {conn.projectName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                          {conn.actionDescription ||
                            "Ingresó a la web vía API REST y consultó el estado del proyecto."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-400 font-mono shrink-0 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800/80">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      <span>{formatDate(conn.connectedAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-1 text-[10px] text-zinc-600 dark:text-zinc-400 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 inline" />
            <span>ARQAI Gatekeeper: Bloqueo activo a nivel de Edge API</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors border border-zinc-300 dark:border-zinc-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
