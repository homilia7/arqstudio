import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  MessageSquare,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Lock,
  Clock,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  FileCode,
  Sparkles,
  RefreshCw,
  Calendar,
  ArrowRightLeft,
  Download,
} from "lucide-react";
import { ChatAuditEntry, Project, TaskItem } from "../types";
import { fetchChatLogs, verifyAndLockTask, rejectTask, syncLockfile } from "../services/api";

interface ChatAuditModalProps {
  onClose: () => void;
  currentProject?: Project | null;
  currentTask?: TaskItem | null;
  onTaskUpdated?: (updatedTask: TaskItem) => void;
}

export const ChatAuditModal: React.FC<ChatAuditModalProps> = ({
  onClose,
  currentProject,
  currentTask,
  onTaskUpdated,
}) => {
  const [logs, setLogs] = useState<ChatAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<ChatAuditEntry | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [syncingLockfile, setSyncingLockfile] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const loadAuditLogs = async () => {
    if (!currentProject?.id) return;
    setLoading(true);
    try {
      const data = await fetchChatLogs(currentProject.id, currentTask?.id);
      setLogs(data);
      if (data.length > 0) {
        setSelectedEntry(data[0]);
      }
    } catch (e) {
      console.error("Error loading chat audit logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [currentProject?.id, currentTask?.id]);

  const handleSyncLockfile = async () => {
    if (!currentProject?.id) return;
    setSyncingLockfile(true);
    try {
      const res = await syncLockfile(currentProject.id, currentProject.lockedFiles);
      setSyncStatus(`¡Sincronizado! ${res.lockedFiles.length} archivos protegidos.`);
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (e: any) {
      setSyncStatus("Error al sincronizar: " + (e.message || e));
      setTimeout(() => setSyncStatus(null), 3000);
    } finally {
      setSyncingLockfile(false);
    }
  };

  const handleApprove = async (entry: ChatAuditEntry) => {
    if (!entry.taskId) {
      alert("Este registro no está vinculado a una tarea específica para aprobación formal.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await verifyAndLockTask(
        entry.taskId,
        feedbackNote || "Aprobado desde la Auditoría de Diálogo Humano-IA. Archivos protegidos con Quality Gate."
      );
      if (onTaskUpdated && res.task) onTaskUpdated(res.task);
      await loadAuditLogs();
      alert("✅ Funcionalidad verificada y archivos blindados con candado inmutable.");
    } catch (e: any) {
      alert("Error al verificar: " + (e.message || e));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (entry: ChatAuditEntry) => {
    if (!entry.taskId) {
      alert("Este registro no está vinculado a una tarea específica para rechazo formal.");
      return;
    }
    if (!feedbackNote.trim()) {
      alert("Por favor ingresa un comentario explicando los ajustes necesarios para la IA.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await rejectTask(entry.taskId, feedbackNote);
      if (onTaskUpdated && res.task) onTaskUpdated(res.task);
      await loadAuditLogs();
      alert("⚠️ Tarea marcada para revisión y corrección técnica.");
    } catch (e: any) {
      alert("Error al rechazar: " + (e.message || e));
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Agrupación de registros por Día / Fecha
  const getDayGroupLabel = (isoDateStr: string) => {
    try {
      const d = new Date(isoDateStr);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      const isToday = d.toDateString() === today.toDateString();
      const isYesterday = d.toDateString() === yesterday.toDateString();

      const dateLabel = d.toLocaleDateString("es-ES", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      if (isToday) return `Hoy (${dateLabel})`;
      if (isYesterday) return `Ayer (${dateLabel})`;
      return dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
    } catch {
      return "Historial Anterior";
    }
  };

  const groupedLogs = logs.reduce<{ [day: string]: ChatAuditEntry[] }>((acc, log) => {
    const key = getDayGroupLabel(log.createdAt);
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Auditoría de Diálogo & Verificación Humana (HITL)
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  Quality Gate
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Proyecto: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentProject?.name || "Activo"}</span>
                {currentTask && (
                  <> • Tarea: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentTask.title}</span></>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAuditLogs}
              title="Recargar bitácora"
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: List of entries grouped by Day */}
          <div className="w-full md:w-80 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-3 space-y-3 bg-slate-50/50 dark:bg-slate-950/30">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Días de Actividad ({Object.keys(groupedLogs).length})
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {logs.length} registros
              </span>
            </div>

            {loading && logs.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                Cargando registros...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No hay diálogos registrados aún para este proyecto.
              </div>
            ) : (
              Object.keys(groupedLogs).map((dayKey) => {
                const dayEntries = groupedLogs[dayKey];
                return (
                  <div key={dayKey} className="space-y-1.5">
                    {/* Day Header Accordion Badge */}
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-md text-[11px] font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs">
                      <span className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="truncate">{dayKey}</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 font-mono font-bold border border-slate-200 dark:border-slate-700">
                        {dayEntries.length} {dayEntries.length === 1 ? "chat" : "chats"}
                      </span>
                    </div>

                    {/* Entries under this day */}
                    <div className="space-y-1.5 pl-1">
                      {dayEntries.map((entry) => {
                        const isSelected = selectedEntry?.id === entry.id;
                        return (
                          <button
                            key={entry.id}
                            onClick={() => setSelectedEntry(entry)}
                            className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                              isSelected
                                ? "bg-white dark:bg-slate-800 border-indigo-500 shadow-sm ring-1 ring-indigo-500/20"
                                : "bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                  entry.status === "verified"
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                    : entry.status === "needs_revision"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                                    : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                                }`}
                              >
                                {entry.status === "verified" ? "Aprobado" : entry.status === "needs_revision" ? "Revisión" : "Pendiente"}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                              {entry.userPrompt}
                            </p>
                            {entry.agentName && (
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-1 font-mono">
                                <Bot className="w-2.5 h-2.5" />
                                {entry.agentName}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Selected Entry Detail */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white dark:bg-slate-900">
            {selectedEntry ? (
              <>
                {/* Status bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {selectedEntry.status === "verified" ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        Calidad Aprobada & Archivos Blindados
                      </div>
                    ) : selectedEntry.status === "needs_revision" ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        Requiere Ajustes por la IA
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        <Clock className="w-4 h-4" />
                        Pendiente de Validación Humana
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedEntry.workUrl && (
                      <a
                        href={selectedEntry.workUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Probar URL en Vivo
                      </a>
                    )}
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `HUMANO: ${selectedEntry.userPrompt}\n\nIA: ${selectedEntry.aiSummary || "Sin resumen"}\n\nURL: ${selectedEntry.workUrl || "N/A"}`,
                          selectedEntry.id
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium rounded-lg transition-colors"
                    >
                      {copiedId === selectedEntry.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ¡Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copiar Diálogo
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleSyncLockfile}
                      disabled={syncingLockfile}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      title="Sincronizar candados de archivos con el conector local .arqai.json"
                    >
                      <ArrowRightLeft className={`w-3.5 h-3.5 ${syncingLockfile ? "animate-spin" : ""}`} />
                      <span>{syncingLockfile ? "Sincronizando..." : "Sincronizar .arqai.json"}</span>
                    </button>
                  </div>
                </div>

                {syncStatus && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{syncStatus}</span>
                  </div>
                )}

                {/* Human Prompt Card */}
                <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">
                    <User className="w-4 h-4" />
                    Instrucción del Humano en el Chat
                  </div>
                  <p className="text-xs md:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {selectedEntry.userPrompt}
                  </p>
                </div>

                {/* AI Summary Card */}
                <div className="p-4 rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-2">
                    <Bot className="w-4 h-4" />
                    Respuesta Técnica y Cambios Realizados por la IA
                  </div>
                  <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-mono">
                    {selectedEntry.aiSummary || "Sin resumen técnico proporcionado."}
                  </p>
                </div>

                {/* Modified Files Section */}
                {selectedEntry.modifiedFiles && selectedEntry.modifiedFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Archivos Afectados ({selectedEntry.modifiedFiles.length})
                      <span className="text-[11px] text-slate-400 font-normal">
                        (Al aprobar, entrarán al escudo inmutable con candado)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.modifiedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          <Lock className="w-3 h-3 text-amber-500" />
                          <span>{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Human Feedback & Approval Gate */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Comentarios de Validación Humana (Quality Gate):
                  </label>
                  <textarea
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    placeholder="Escribe notas de aprobación o detalles específicos del ajuste solicitado a la IA..."
                    rows={2}
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleReject(selectedEntry)}
                      disabled={actionLoading}
                      className="px-4 py-2 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      Rechazar / Pedir Ajustes
                    </button>
                    <button
                      onClick={() => handleApprove(selectedEntry)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Aprobar y Proteger Código
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Sparkles className="w-10 h-10 mb-2 text-indigo-400 opacity-40" />
                Selecciona un registro de la izquierda para auditarlo en vivo.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
