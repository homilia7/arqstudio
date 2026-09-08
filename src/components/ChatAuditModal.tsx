import React, { useEffect, useState, useMemo } from "react";
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
  Cpu,
  PlusCircle,
  Filter,
  Search,
  Zap,
} from "lucide-react";
import { ChatAuditEntry, Project, TaskItem } from "../types";
import {
  fetchChatLogs,
  verifyAndLockTask,
  rejectTask,
  syncLockfile,
  createChatLog,
} from "../services/api";

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

  // Filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [modelFilter, setModelFilter] = useState<string>("all");

  // Submodal para registrar nueva consulta
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newPrompt, setNewPrompt] = useState("");
  const [newAiSummary, setNewAiSummary] = useState("");
  const [newModel, setNewModel] = useState("Gemini 2.5 Pro");
  const [newAgentName, setNewAgentName] = useState("Antigravity AI");
  const [newFiles, setNewFiles] = useState("");
  const [newWorkUrl, setNewWorkUrl] = useState(currentProject?.mainUrl || "");
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const loadAuditLogs = async () => {
    if (!currentProject?.id) return;
    setLoading(true);
    try {
      const data = await fetchChatLogs(currentProject.id, currentTask?.id);
      setLogs(Array.isArray(data) ? data : []);
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

  const handleRegisterChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject?.id || !newPrompt.trim()) return;
    setRegistering(true);
    setRegisterError(null);
    try {
      const modifiedFilesList = newFiles
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const created = await createChatLog({
        projectId: currentProject.id,
        taskId: currentTask?.id,
        userPrompt: newPrompt.trim(),
        aiSummary: newAiSummary.trim() || undefined,
        modifiedFiles: modifiedFilesList,
        workUrl: newWorkUrl.trim() || undefined,
        agentName: newAgentName,
        aiModel: newModel,
      });

      setIsRegisterOpen(false);
      setNewPrompt("");
      setNewAiSummary("");
      setNewFiles("");
      await loadAuditLogs();
      setSelectedEntry(created);
    } catch (err: any) {
      setRegisterError(err.message || "Error al registrar la consulta en el historial.");
    } finally {
      setRegistering(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper para insignias de Modelo de IA
  const getModelBadge = (modelName?: string) => {
    const m = (modelName || "Gemini 2.5 Pro").toUpperCase();
    if (m.includes("GEMINI")) {
      return {
        label: modelName || "Gemini 2.5 Pro",
        classes: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
        provider: "Google DeepMind",
      };
    }
    if (m.includes("CLAUDE")) {
      return {
        label: modelName || "Claude 3.7 Sonnet",
        classes: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
        provider: "Anthropic",
      };
    }
    if (m.includes("GPT") || m.includes("O3")) {
      return {
        label: modelName || "GPT-4o",
        classes: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        provider: "OpenAI",
      };
    }
    if (m.includes("DEEPSEEK")) {
      return {
        label: modelName || "DeepSeek R1",
        classes: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
        provider: "DeepSeek AI",
      };
    }
    return {
      label: modelName || "IA Model",
      classes: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/30",
      provider: "AI Engine",
    };
  };

  // Agrupación por Día
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

  // Filtrado de logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        log.userPrompt.toLowerCase().includes(q) ||
        (log.aiSummary && log.aiSummary.toLowerCase().includes(q)) ||
        (log.agentName && log.agentName.toLowerCase().includes(q)) ||
        (log.aiModel && log.aiModel.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (modelFilter !== "all") {
        const m = (log.aiModel || "Gemini").toLowerCase();
        if (!m.includes(modelFilter.toLowerCase())) return false;
      }

      return true;
    });
  }, [logs, searchQuery, modelFilter]);

  const groupedLogs = useMemo(() => {
    return filteredLogs.reduce<{ [day: string]: ChatAuditEntry[] }>((acc, log) => {
      const key = getDayGroupLabel(log.createdAt);
      if (!acc[key]) acc[key] = [];
      acc[key].push(log);
      return acc;
    }, {});
  }, [filteredLogs]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-zinc-950/80 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white dark:bg-[#12151b] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-xs">
        {/* Header Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-800 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  Historial de Chat & Modelo IA (Auditoría HITL)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                  Quality Gate
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-medium">
                  Organizado por Día
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Proyecto: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{currentProject?.name || "Activo"}</span>
                {currentTask && (
                  <> • Tarea: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{currentTask.title}</span></>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Registrar Consulta</span>
            </button>
            <button
              onClick={loadAuditLogs}
              title="Recargar bitácora de chat"
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-500" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de Filtros por Modelo y Búsqueda */}
        <div className="px-5 py-2.5 bg-zinc-50/50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en el chat o modelo..."
              className="w-full pl-7 pr-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-[10px] text-zinc-400 uppercase font-bold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Modelo:
            </span>
            <button
              onClick={() => setModelFilter("all")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                modelFilter === "all"
                  ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Todos ({logs.length})
            </button>
            <button
              onClick={() => setModelFilter("gemini")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                modelFilter === "gemini"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100"
              }`}
            >
              Gemini
            </button>
            <button
              onClick={() => setModelFilter("claude")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                modelFilter === "claude"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-100"
              }`}
            >
              Claude
            </button>
            <button
              onClick={() => setModelFilter("gpt")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                modelFilter === "gpt"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100"
              }`}
            >
              GPT-4o
            </button>
            <button
              onClick={() => setModelFilter("deepseek")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                modelFilter === "deepseek"
                  ? "bg-sky-600 text-white"
                  : "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 hover:bg-sky-100"
              }`}
            >
              DeepSeek
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: Entries Grouped by Day */}
          <div className="w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/30">
            <div className="flex items-center justify-between px-2 py-0.5 text-[11px]">
              <span className="font-semibold text-zinc-500 uppercase tracking-wider">
                Días de Actividad ({Object.keys(groupedLogs).length})
              </span>
              <span className="font-mono text-zinc-400">
                {filteredLogs.length} chats
              </span>
            </div>

            {loading && logs.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Cargando bitácora de chat...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No hay diálogos con los filtros actuales.
              </div>
            ) : (
              Object.keys(groupedLogs).map((dayKey) => {
                const dayEntries = groupedLogs[dayKey];
                return (
                  <div key={dayKey} className="space-y-1.5">
                    {/* Encabezado del Día */}
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-md text-[11px] font-bold text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 shadow-2xs">
                      <span className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="truncate">{dayKey}</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white dark:bg-zinc-900 text-indigo-700 dark:text-indigo-300 font-mono font-bold border border-zinc-200 dark:border-zinc-700">
                        {dayEntries.length} {dayEntries.length === 1 ? "chat" : "chats"}
                      </span>
                    </div>

                    {/* Entries for this day */}
                    <div className="space-y-1.5 pl-1">
                      {dayEntries.map((entry) => {
                        const isSelected = selectedEntry?.id === entry.id;
                        const badge = getModelBadge(entry.aiModel);

                        return (
                          <button
                            key={entry.id}
                            onClick={() => setSelectedEntry(entry)}
                            className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-white dark:bg-zinc-800 border-indigo-500 shadow-sm ring-1 ring-indigo-500/20"
                                : "bg-white/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              <span
                                className={`text-[9px] font-medium px-1.5 py-0.2 rounded-full ${
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

                            <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-tight">
                              {entry.userPrompt}
                            </p>

                            {/* Píldora del Modelo IA registrado */}
                            <div className="flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                              <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded border flex items-center gap-1 ${badge.classes}`}>
                                <Cpu className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{badge.label}</span>
                              </span>
                              {entry.agentName && (
                                <span className="text-[9px] text-zinc-400 font-mono truncate max-w-[90px]">
                                  {entry.agentName}
                                </span>
                              )}
                            </div>
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
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-white dark:bg-[#12151b]">
            {selectedEntry ? (
              <>
                {/* Header / Info Bar con Modelo de IA Prominente */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Modelo IA Tag */}
                    {(() => {
                      const badge = getModelBadge(selectedEntry.aiModel);
                      return (
                        <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 text-xs font-bold ${badge.classes}`}>
                          <Cpu className="w-3.5 h-3.5" />
                          <span>Modelo IA: {badge.label}</span>
                          <span className="text-[10px] opacity-70 font-normal font-sans">({badge.provider})</span>
                        </div>
                      );
                    })()}

                    {/* Agente */}
                    <div className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Agente: {selectedEntry.agentName || "Antigravity AI"}</span>
                    </div>

                    {/* Fecha y Hora */}
                    <div className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 text-[11px] font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(selectedEntry.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedEntry.workUrl && (
                      <a
                        href={selectedEntry.workUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Ver URL en Vivo</span>
                      </a>
                    )}
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `HUMANO: ${selectedEntry.userPrompt}\n\nMODELO IA: ${selectedEntry.aiModel || "Gemini 2.5 Pro"} (${selectedEntry.agentName || "Antigravity"})\n\nRESPUESTA TÉCNICA: ${selectedEntry.aiSummary || "Sin resumen"}\n\nURL: ${selectedEntry.workUrl || "N/A"}`,
                          selectedEntry.id
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedId === selectedEntry.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar Diálogo</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSyncLockfile}
                      disabled={syncingLockfile}
                      className="inline-flex items-center gap-1 px-2.5 py-1 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      title="Sincronizar candados de archivos con el conector local .arqai.json"
                    >
                      <ArrowRightLeft className={`w-3 h-3 ${syncingLockfile ? "animate-spin" : ""}`} />
                      <span>{syncingLockfile ? "Sincronizando..." : "Sync .arqai.json"}</span>
                    </button>
                  </div>
                </div>

                {syncStatus && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{syncStatus}</span>
                  </div>
                )}

                {/* Tarjeta Prompt del Humano */}
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-400">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Instrucción / Consulta del Humano en el Chat:</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                    {selectedEntry.userPrompt}
                  </p>
                </div>

                {/* Tarjeta Respuesta Técnica y Modelo IA */}
                <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-400">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      <span>Respuesta Técnica y Cambios Realizados por la IA:</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                      Ejecutado por: {selectedEntry.aiModel || "Gemini 2.5 Pro"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed font-mono bg-white/60 dark:bg-zinc-900/60 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    {selectedEntry.aiSummary || "Sin resumen técnico registrado."}
                  </p>
                </div>

                {/* Archivos Afectados */}
                {selectedEntry.modifiedFiles && selectedEntry.modifiedFiles.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Archivos Afectados ({selectedEntry.modifiedFiles.length}):</span>
                      <span className="text-[11px] text-zinc-400 font-normal">
                        (Al aprobar, entrarán al escudo inmutable con candado)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEntry.modifiedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                        >
                          <Lock className="w-3 h-3 text-amber-500" />
                          <span>{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quality Gate / Validación Humana */}
                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Comentarios de Validación Humana (Quality Gate):
                  </label>
                  <textarea
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    placeholder="Escribe notas de aprobación o detalles específicos del ajuste solicitado a la IA..."
                    rows={2}
                    className="w-full text-xs p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  />

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleReject(selectedEntry)}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Rechazar / Pedir Ajustes</span>
                    </button>
                    <button
                      onClick={() => handleApprove(selectedEntry)}
                      disabled={actionLoading}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Aprobar y Proteger Código</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-xs py-16">
                <Sparkles className="w-10 h-10 mb-2 text-indigo-400 opacity-40" />
                <p>Selecciona un diálogo de la izquierda para ver el historial y el modelo de IA utilizado.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submodal Registrar Consulta de Chat Manualmente */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#151922] border border-zinc-300 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60">
              <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 text-sm">
                <PlusCircle className="w-4 h-4 text-indigo-500" />
                <span>Registrar Consulta en el Historial del Chat</span>
              </h3>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterChat} className="p-5 space-y-3.5 text-xs">
              {registerError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{registerError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Instrucción / Prompt del Humano <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="Escribe lo que el usuario consultó o solicitó en el chat..."
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Modelo de IA Utilizado</span>
                  </label>
                  <select
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  >
                    <option value="Gemini 2.5 Pro">Gemini 2.5 Pro (DeepMind)</option>
                    <option value="Gemini 2.5 Flash">Gemini 2.5 Flash (DeepMind)</option>
                    <option value="Claude 3.7 Sonnet">Claude 3.7 Sonnet (Anthropic)</option>
                    <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                    <option value="GPT-4o">GPT-4o (OpenAI)</option>
                    <option value="o3-mini">o3-mini (OpenAI)</option>
                    <option value="DeepSeek R1">DeepSeek R1</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Agente Ejecutor</span>
                  </label>
                  <input
                    type="text"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    placeholder="Antigravity AI, Claude, Jules..."
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Respuesta Técnica de la IA / Cambios Realizados
                </label>
                <textarea
                  rows={2}
                  value={newAiSummary}
                  onChange={(e) => setNewAiSummary(e.target.value)}
                  placeholder="Detalles de código o lógica implementada por la IA..."
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Archivos Afectados (Opcional)</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Separados por comas</span>
                </label>
                <input
                  type="text"
                  value={newFiles}
                  onChange={(e) => setNewFiles(e.target.value)}
                  placeholder="src/App.tsx, functions/api/[[path]].ts"
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                  URL de Trabajo / Prueba en Vivo (Opcional)
                </label>
                <input
                  type="text"
                  value={newWorkUrl}
                  onChange={(e) => setNewWorkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-3.5 py-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={registering || !newPrompt.trim()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {registering ? "Guardando en Historial..." : "Guardar en Historial"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
