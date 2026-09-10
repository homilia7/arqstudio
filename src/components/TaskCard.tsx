import React, { useState, useRef, useEffect } from "react";
import {
  ExternalLink,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  Clock,
  Bot,
  Globe,
  Trash2,
  ChevronRight,
  Eye,
  Play,
  Sparkles,
  BrainCircuit,
  ListTodo,
  Check,
  GitBranch,
  GitCommit,
  AlertTriangle,
  X,
  Send,
  MessageSquare,
  FileCode,
  Mic,
  MicOff,
  Image,
  Clipboard,
} from "lucide-react";
import { TaskItem, TaskStatus, Project } from "../types";

interface TaskCardProps {
  task: TaskItem;
  activeProject?: Project | null;
  onReview: (task: TaskItem) => void;
  onQuickVerify: (taskId: string) => Promise<void>;
  onUnlock: (taskId: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onSimulate: (taskId: string, actionType: "start" | "complete") => void;
  onOpenContextMemory: (task: TaskItem) => void;
  onOpenChatAudit?: (task: TaskItem) => void;
  onRejectTask?: (taskId: string, feedback: string, imageRefs?: string[]) => Promise<void>;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  activeProject,
  onReview,
  onQuickVerify,
  onUnlock,
  onDelete,
  onSimulate,
  onOpenContextMemory,
  onOpenChatAudit,
  onRejectTask,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportComment, setReportComment] = useState("");
  const [showImproveModal, setShowImproveModal] = useState(false);
  const [improveComment, setImproveComment] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const reportBoxRef = useRef<HTMLDivElement>(null);
  const improveBoxRef = useRef<HTMLDivElement>(null);

  // Estados para "No Funciona"
  const [reportImages, setReportImages] = useState<string[]>([]);
  const [isListeningReport, setIsListeningReport] = useState(false);
  const reportFileInputRef = useRef<HTMLInputElement>(null);
  const reportRecognitionRef = useRef<any>(null);

  // Estados para "Mejorar"
  const [improveImages, setImproveImages] = useState<string[]>([]);
  const [isListeningImprove, setIsListeningImprove] = useState(false);
  const improveFileInputRef = useRef<HTMLInputElement>(null);
  const improveRecognitionRef = useRef<any>(null);

  const toggleVoiceReport = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Dictado por voz no disponible en este navegador.");
      return;
    }
    if (isListeningReport) {
      reportRecognitionRef.current?.stop();
      setIsListeningReport(false);
      return;
    }
    try {
      const rec = new SpeechRecognition();
      rec.lang = "es-ES";
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (event: any) => {
        let text = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setReportComment((prev) => {
          const base = prev.replace(/\s*⌛.*$/, "").trimEnd();
          return base + (base ? " " : "") + text;
        });
      };
      rec.onend = () => setIsListeningReport(false);
      rec.onerror = () => setIsListeningReport(false);
      rec.start();
      reportRecognitionRef.current = rec;
      setIsListeningReport(true);
    } catch {
      setIsListeningReport(false);
    }
  };

  const toggleVoiceImprove = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Dictado por voz no disponible en este navegador.");
      return;
    }
    if (isListeningImprove) {
      improveRecognitionRef.current?.stop();
      setIsListeningImprove(false);
      return;
    }
    try {
      const rec = new SpeechRecognition();
      rec.lang = "es-ES";
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (event: any) => {
        let text = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setImproveComment((prev) => {
          const base = prev.replace(/\s*⌛.*$/, "").trimEnd();
          return base + (base ? " " : "") + text;
        });
      };
      rec.onend = () => setIsListeningImprove(false);
      rec.onerror = () => setIsListeningImprove(false);
      rec.start();
      improveRecognitionRef.current = rec;
      setIsListeningImprove(true);
    } catch {
      setIsListeningImprove(false);
    }
  };

  const addReportImageFromFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setReportImages((prev) => (prev.length < 4 ? [...prev, dataUrl] : prev));
    };
    reader.readAsDataURL(file);
  };

  const handleReportPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) addReportImageFromFile(file);
        return;
      }
    }
  };

  const handleReportPasteFromClipboard = async () => {
    try {
      const clipItems = await (navigator.clipboard as any).read();
      for (const item of clipItems) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            addReportImageFromFile(new File([blob], "error-screenshot.png", { type }));
            return;
          }
        }
      }
      reportFileInputRef.current?.click();
    } catch {
      reportFileInputRef.current?.click();
    }
  };

  const addImproveImageFromFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImproveImages((prev) => (prev.length < 4 ? [...prev, dataUrl] : prev));
    };
    reader.readAsDataURL(file);
  };

  const handleImprovePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) addImproveImageFromFile(file);
        return;
      }
    }
  };

  const handleImprovePasteFromClipboard = async () => {
    try {
      const clipItems = await (navigator.clipboard as any).read();
      for (const item of clipItems) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            addImproveImageFromFile(new File([blob], "mejora-screenshot.png", { type }));
            return;
          }
        }
      }
      improveFileInputRef.current?.click();
    } catch {
      improveFileInputRef.current?.click();
    }
  };

  useEffect(() => {
    if (showImproveModal && improveBoxRef.current) {
      improveBoxRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showImproveModal]);

  useEffect(() => {
    if (showReportModal && reportBoxRef.current) {
      reportBoxRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showReportModal]);

  const sanitizeUtf8Text = (str: string): string => {
    if (!str) return "";
    return str
      .replace(/Garanta/gi, "Garantía")
      .replace(/Sincronizacin/gi, "Sincronización")
      .replace(/automtica/gi, "automática")
      .replace(/implementacin/gi, "implementación")
      .replace(/resolucin/gi, "resolución")
      .replace(/ningn/gi, "ningún")
      .replace(/ñ/g, "ñ");
  };

  const getStatusBadge = (status: TaskStatus, locked: boolean) => {
    if (locked || status === "verified") {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>Verificado</span>
        </span>
      );
    }

    switch (status) {
      case "ready_for_review":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700 animate-pulse">
            <Eye className="w-3 h-3 text-amber-700 dark:text-amber-400" />
            <span>Listo para Revisión</span>
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Clock className="w-3 h-3 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span>En Progreso IA</span>
          </span>
        );
      case "needs_revision":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
            <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>Requiere Ajuste</span>
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            <Clock className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
            <span>Pendiente</span>
          </span>
        );
    }
  };

  const handleQuickVerifyClick = async () => {
    try {
      setIsVerifying(true);
      await onQuickVerify(task.id);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!confirm(`¿Eliminar la tarea "${task.title}"?`)) return;
    try {
      setIsDeleting(true);
      await onDelete(task.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedDate = new Date(task.createdAt).toLocaleString("es-ES", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const subtasks = task.subtasks || [];
  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;

  // 1. URL de Git (Repositorio o Commit de GitHub/GitLab)
  const resolvedGitUrl = (() => {
    if (task.gitUrl && task.gitUrl.trim()) return task.gitUrl.trim();
    if (task.workUrl && (task.workUrl.includes("github.com") || task.workUrl.includes("gitlab.com") || task.workUrl.includes("bitbucket.org"))) {
      return task.workUrl.trim();
    }
    if (activeProject?.gitUrl && activeProject.gitUrl.trim()) {
      const base = activeProject.gitUrl.trim().replace(/\/$/, "");
      if (task.gitCommit) return `${base}/commit/${task.gitCommit}`;
      return base;
    }
    if (activeProject?.mainUrl && (activeProject.mainUrl.includes("github.com") || activeProject.mainUrl.includes("gitlab.com"))) {
      const base = activeProject.mainUrl.trim().replace(/\/$/, "");
      if (task.gitCommit) return `${base}/commit/${task.gitCommit}`;
      return base;
    }
    if (activeProject?.name) {
      const name = activeProject.name.trim();
      const base = `https://github.com/homilia7/${name}`;
      if (task.gitCommit) return `${base}/commit/${task.gitCommit}`;
      return base;
    }
    return null;
  })();

  // 2. URL del Proyecto Web en Vivo (para ir a ver el cambio en tiempo real)
  const resolvedProjectUrl = (() => {
    if (task.projectUrl && task.projectUrl.trim()) return task.projectUrl.trim();
    if (task.workUrl && !task.workUrl.includes("github.com") && !task.workUrl.includes("gitlab.com") && !task.workUrl.includes("bitbucket.org")) {
      return task.workUrl.trim();
    }
    if (activeProject?.mainUrl && !activeProject.mainUrl.includes("github.com") && !activeProject.mainUrl.includes("gitlab.com")) {
      return activeProject.mainUrl.trim();
    }
    if (activeProject?.name) {
      const slug = activeProject.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (slug === "sinpepay") return "https://sinpepay.pages.dev";
      if (slug === "qchatt") return "https://qchatt.pages.dev";
      if (slug === "arqaistudio" || slug === "arqstudio") return "https://arqaistudio.pages.dev";
      if (activeProject.mainUrl) return activeProject.mainUrl.trim();
      return `https://${slug}.pages.dev`;
    }
    return null;
  })();

  return (
    <div
      className={`rounded-lg border transition-all duration-200 relative overflow-hidden ${
        task.locked
          ? "bg-zinc-200/70 dark:bg-zinc-900/40 border-zinc-300 dark:border-zinc-800"
          : task.status === "ready_for_review"
          ? "bg-[#edf1f7] dark:bg-zinc-900 border-amber-300 dark:border-amber-700/80 shadow-sm ring-1 ring-amber-200/50 dark:ring-amber-500/20"
          : task.status === "needs_revision"
          ? "bg-[#edf1f7] dark:bg-zinc-900 border-rose-300 dark:border-rose-700/80 shadow-sm ring-1 ring-rose-200/50 dark:ring-rose-500/20"
          : "bg-[#edf1f7] dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 hover:border-slate-400 dark:hover:border-zinc-700 shadow-sm"
      }`}
    >
      {/* Top Banner if ready for review */}
      {task.status === "ready_for_review" && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-800/60 px-3 py-1 flex items-center justify-between text-[11px] text-amber-900 dark:text-amber-200">
          <div className="flex items-center space-x-1.5 font-medium">
            <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="truncate">
              Antigravity completó el código. Haz clic en "Revisar Web" para probarla en vivo.
            </span>
          </div>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold shrink-0 ml-2 hidden sm:inline">
            Requiere tu visto bueno
          </span>
        </div>
      )}

      {/* Top Banner if needs revision */}
      {task.status === "needs_revision" && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200/80 dark:border-rose-800/60 px-3 py-1 flex items-center justify-between text-[11px] text-rose-900 dark:text-rose-200">
          <div className="flex items-center space-x-1.5 font-medium">
            <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="truncate">
              Marcada como "Revisada pero Incompleta". Antigravity procesará tus observaciones.
            </span>
          </div>
          <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold shrink-0 ml-2 hidden sm:inline">
            Pendiente de Corrección IA
          </span>
        </div>
      )}

      <div className="p-3 sm:p-3.5 space-y-2">
        {/* DESPLEGABLE DE OBSERVACIONES PARA REPORTAR NO FUNCIONA (ARRIBA DE TODO) */}
        {showReportModal && (
          <div ref={reportBoxRef} className="p-3 bg-rose-50 dark:bg-rose-950/90 border border-rose-200 dark:border-rose-800/90 rounded-lg space-y-2 mb-2 animate-fadeIn scroll-mt-16 text-rose-900 dark:text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <h4 className="text-xs font-bold text-rose-900 dark:text-white">
                  Reportar que NO Funciona (Enviar a Corrección Urgente IA)
                </h4>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 text-rose-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <p className="text-[11px] text-rose-700 dark:text-rose-200">
              Escribe o dicta qué falló y pega capturas de pantalla para que Antigravity aplique los ajustes.
            </p>

            {/* Toolbar: Micrófono y Pegar Imagen para Reporte de Fallo */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={toggleVoiceReport}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border transition-all cursor-pointer ${
                  isListeningReport
                    ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-500 animate-pulse ring-2 ring-rose-400"
                    : "bg-white dark:bg-zinc-800 hover:bg-rose-100 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700"
                }`}
              >
                {isListeningReport ? (
                  <>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                    </span>
                    <MicOff className="w-3 h-3" />
                    <span>Detener Voz</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                    <span>Dictar Voz</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReportPasteFromClipboard}
                disabled={reportImages.length >= 4}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border bg-white dark:bg-zinc-800 hover:bg-rose-100 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700 transition-all cursor-pointer disabled:opacity-40"
              >
                <Clipboard className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                <span>Pegar Captura</span>
              </button>

              <button
                type="button"
                onClick={() => reportFileInputRef.current?.click()}
                disabled={reportImages.length >= 4}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border bg-white dark:bg-zinc-800 hover:bg-rose-100 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700 transition-all cursor-pointer disabled:opacity-40"
              >
                <Image className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                <span>Adjuntar Foto</span>
              </button>

              <input
                ref={reportFileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  Array.from(e.target.files || []).forEach(addReportImageFromFile);
                  e.target.value = "";
                }}
              />

              {reportImages.length > 0 && (
                <span className="ml-auto text-xs font-semibold text-rose-600 dark:text-rose-300">
                  📎 {reportImages.length}/4 capturas
                </span>
              )}
            </div>

            <textarea
              autoFocus
              value={reportComment}
              onChange={(e) => setReportComment(e.target.value)}
              onPaste={handleReportPaste}
              placeholder="Ej: El botón de login no responde al hacer clic, o el diseño está roto en móvil... (Puedes dictar por voz o presionar Ctrl+V para pegar capturas)"
              className="w-full bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-900/80 rounded-lg p-2 text-xs text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-slate-500 focus:outline-none focus:border-rose-500 min-h-[65px]"
            />

            {/* Miniaturas de capturas de error adjuntas */}
            {reportImages.length > 0 && (
              <div className="flex flex-wrap gap-2 p-1.5 bg-rose-100/60 dark:bg-rose-950/60 rounded border border-rose-300/60 dark:border-rose-800/60">
                {reportImages.map((src, idx) => (
                  <div key={idx} className="relative group shrink-0">
                    <img
                      src={src}
                      alt={`Captura ${idx + 1}`}
                      onClick={() => window.open(src, "_blank")}
                      className="w-14 h-14 object-cover rounded border border-rose-400 dark:border-rose-700 shadow-sm cursor-pointer hover:border-rose-600 transition-colors"
                      title="Clic para ver completa"
                    />
                    <button
                      type="button"
                      onClick={() => setReportImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!reportComment.trim() && reportImages.length === 0) return;
                  setIsSubmittingReport(true);
                  try {
                    let finalMsg = reportComment.trim();
                    if (reportImages.length > 0) {
                      finalMsg += `\n\n[CAPTURAS DEL FALLO ADJUNTAS: ${reportImages.length} imagen(es) de evidencia adjunta(s)]`;
                    }
                    if (onRejectTask) {
                      await onRejectTask(task.id, finalMsg, reportImages);
                    }
                    setShowReportModal(false);
                    setReportComment("");
                    setReportImages([]);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsSubmittingReport(false);
                  }
                }}
                disabled={isSubmittingReport || (!reportComment.trim() && reportImages.length === 0)}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all shadow-sm"
              >
                <Send className="w-3 h-3" />
                <span>{isSubmittingReport ? "Enviando..." : "Enviar a Corrección"}</span>
              </button>
            </div>
          </div>
        )}

        {/* DESPLEGABLE DE OBSERVACIONES PARA MEJORAR (ARRIBA DE TODO) */}
        {showImproveModal && (
          <div ref={improveBoxRef} className="p-3 bg-purple-50 dark:bg-purple-950/90 border border-purple-200 dark:border-purple-800/90 rounded-lg space-y-2 mb-2 animate-fadeIn scroll-mt-16 text-purple-900 dark:text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <h4 className="text-xs font-bold text-white">
                  Solicitar Mejoras a la IA (Enviar a Refinamiento)
                </h4>
              </div>
              <button
                onClick={() => setShowImproveModal(false)}
                className="p-1 text-purple-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <p className="text-[11px] text-purple-700 dark:text-purple-200">
              Escribe o dicta qué aspectos deseas optimizar y pega imágenes como referencia de diseño.
            </p>

            {/* Toolbar: Micrófono y Pegar Imagen para Sugerencia de Mejora */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={toggleVoiceImprove}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border transition-all cursor-pointer ${
                  isListeningImprove
                    ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-500 animate-pulse ring-2 ring-purple-400"
                    : "bg-white dark:bg-zinc-800 hover:bg-purple-100 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700"
                }`}
              >
                {isListeningImprove ? (
                  <>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                    </span>
                    <MicOff className="w-3 h-3" />
                    <span>Detener Voz</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    <span>Dictar Voz</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleImprovePasteFromClipboard}
                disabled={improveImages.length >= 4}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border bg-white dark:bg-zinc-800 hover:bg-purple-100 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700 transition-all cursor-pointer disabled:opacity-40"
              >
                <Clipboard className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span>Pegar Imagen</span>
              </button>

              <button
                type="button"
                onClick={() => improveFileInputRef.current?.click()}
                disabled={improveImages.length >= 4}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border bg-white dark:bg-zinc-800 hover:bg-purple-100 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700 transition-all cursor-pointer disabled:opacity-40"
              >
                <Image className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span>Adjuntar Foto</span>
              </button>

              <input
                ref={improveFileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  Array.from(e.target.files || []).forEach(addImproveImageFromFile);
                  e.target.value = "";
                }}
              />

              {improveImages.length > 0 && (
                <span className="ml-auto text-xs font-semibold text-purple-600 dark:text-purple-300">
                  📎 {improveImages.length}/4 referencias
                </span>
              )}
            </div>

            <textarea
              autoFocus
              value={improveComment}
              onChange={(e) => setImproveComment(e.target.value)}
              onPaste={handleImprovePaste}
              placeholder="Ej: Añadir animaciones de carga más suaves, cambiar colores o layout... (Puedes dictar por voz o presionar Ctrl+V para pegar referencias)"
              className="w-full bg-white dark:bg-zinc-900 border border-purple-300 dark:border-purple-900/80 rounded-lg p-2 text-xs text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 min-h-[65px]"
            />

            {/* Miniaturas de imágenes de mejora adjuntas */}
            {improveImages.length > 0 && (
              <div className="flex flex-wrap gap-2 p-1.5 bg-purple-100/60 dark:bg-purple-950/60 rounded border border-purple-300/60 dark:border-purple-800/60">
                {improveImages.map((src, idx) => (
                  <div key={idx} className="relative group shrink-0">
                    <img
                      src={src}
                      alt={`Referencia ${idx + 1}`}
                      onClick={() => window.open(src, "_blank")}
                      className="w-14 h-14 object-cover rounded border border-purple-400 dark:border-purple-700 shadow-sm cursor-pointer hover:border-purple-600 transition-colors"
                      title="Clic para ver completa"
                    />
                    <button
                      type="button"
                      onClick={() => setImproveImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowImproveModal(false)}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!improveComment.trim() && improveImages.length === 0) return;
                  setIsSubmittingReport(true);
                  try {
                    let finalMsg = `✨ MEJORA SOLICITADA POR HUMANO: ${improveComment.trim()}`;
                    if (improveImages.length > 0) {
                      finalMsg += `\n\n[REFERENCIAS VISUALES DE LA MEJORA ADJUNTAS: ${improveImages.length} imagen(es) adjunta(s)]`;
                    }
                    if (onRejectTask) {
                      await onRejectTask(task.id, finalMsg, improveImages);
                    }
                    setShowImproveModal(false);
                    setImproveComment("");
                    setImproveImages([]);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsSubmittingReport(false);
                  }
                }}
                disabled={isSubmittingReport || (!improveComment.trim() && improveImages.length === 0)}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all shadow-sm"
              >
                <Send className="w-3 h-3" />
                <span>{isSubmittingReport ? "Enviando..." : "Enviar Sugerencia"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Header de la Tarjeta */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <div className="flex items-center space-x-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                {task.title}
              </h3>
              {task.locked && (
                <span
                  title="La IA sabe que esta tarea está completa y no la modificará"
                  className="text-emerald-600 dark:text-emerald-400 cursor-help"
                >
                  <Lock className="w-3 h-3" />
                </span>
              )}
            </div>
            <span className="text-zinc-300 dark:text-zinc-600 hidden sm:inline">•</span>
            <div className="flex items-center space-x-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="font-mono">{formattedDate}</span>
              <span>•</span>
              <span className="text-indigo-600 dark:text-indigo-400 flex items-center space-x-1 font-medium">
                <Bot className="w-3 h-3" />
                <span>{task.assignedAgent || "Antigravity AI"}</span>
              </span>
              {(task.gitBranch || task.gitCommit) && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-200 dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 border border-zinc-300 dark:border-zinc-700">
                    <GitBranch className="w-2.5 h-2.5 text-indigo-500" />
                    <span>{task.gitBranch || "main"}</span>
                    {task.gitCommit && (
                      <span className="text-zinc-500 dark:text-zinc-400 ml-0.5">
                        ({task.gitCommit.substring(0, 7)})
                      </span>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0 ml-auto">
            {getStatusBadge(task.status, task.locked)}
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              title="Eliminar tarea"
              className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Instrucción solicitada a la IA */}
        <div className="bg-zinc-50 dark:bg-zinc-800/70 rounded px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-800 dark:text-zinc-200">
          <div className="flex items-baseline space-x-2">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider shrink-0">
              Instrucción:
            </span>
            <p className="whitespace-pre-wrap leading-relaxed font-mono text-[11px] text-zinc-700 dark:text-zinc-300 break-words flex-1">
              {task.instruction}
            </p>
          </div>
        </div>

        {/* Referencias visuales en imágenes si existen */}
        {((task.imageRefs && task.imageRefs.length > 0) || (task.contextMemory?.imageRefs && task.contextMemory.imageRefs.length > 0)) && (
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded px-2.5 py-2 border border-emerald-200/60 dark:border-emerald-800/50">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1 mb-1.5">
              🖼️ Referencias visuales para la IA ({((task.imageRefs || task.contextMemory?.imageRefs) || []).length}):
            </span>
            <div className="flex flex-wrap gap-2">
              {((task.imageRefs || task.contextMemory?.imageRefs) || []).map((imgSrc, idx) => (
                <img
                  key={idx}
                  src={imgSrc}
                  alt={`Referencia ${idx + 1}`}
                  onClick={() => window.open(imgSrc, "_blank")}
                  className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border-2 border-emerald-300 dark:border-emerald-700 shadow-xs hover:border-emerald-500 cursor-pointer transition-all hover:scale-105"
                  title="Clic para ver en tamaño completo"
                />
              ))}
            </div>
          </div>
        )}

        {/* Subtareas Progress Bar & Drawer */}
        {subtasks.length > 0 && (
          <div className="bg-zinc-50 dark:bg-zinc-800/70 rounded px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-700/80 text-xs space-y-1">
            <div
              onClick={() => setShowSubtasks(!showSubtasks)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
                <ListTodo className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>Subtareas</span>
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                {completedSubtasksCount} / {subtasks.length} completadas
              </span>
            </div>

            <div className="w-full bg-zinc-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300"
                style={{
                  width: `${(completedSubtasksCount / subtasks.length) * 100}%`,
                }}
              ></div>
            </div>

            {showSubtasks && (
              <div className="pt-1.5 space-y-1 border-t border-zinc-300 dark:border-zinc-700 mt-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center space-x-1.5 text-[11px] text-zinc-700 dark:text-zinc-300"
                  >
                    <div
                      className={`w-3 h-3 rounded flex items-center justify-center border ${
                        st.completed
                          ? "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                          : "border-zinc-300 dark:border-slate-600 bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-800"
                      }`}
                    >
                      {st.completed && <Check className="w-2 h-2" />}
                    </div>
                    <span className={st.completed ? "line-through text-zinc-400 dark:text-zinc-500" : ""}>
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Output o Notas de Antigravity (si ya trabajó) */}
        {(task.aiNotes || task.aiOutput) && (
          <div className="bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/60 rounded px-2.5 py-1.5 text-xs">
            <div className="flex items-baseline space-x-2">
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider shrink-0 flex items-center space-x-1">
                <Bot className="w-3 h-3 inline mr-1" />
                <span>Respuesta IA:</span>
              </span>
              <div className="flex-1 min-w-0">
                {task.aiNotes && (
                  <p className="text-zinc-700 dark:text-zinc-300 text-[11px] font-mono leading-relaxed">
                    {sanitizeUtf8Text(task.aiNotes)}
                  </p>
                )}
                {task.aiOutput && (
                  <p className="text-zinc-600 dark:text-zinc-400 text-[10px] mt-0.5">{task.aiOutput}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Feedback humano si requiere ajuste */}
        {task.humanFeedback && task.status === "needs_revision" && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded px-2.5 py-1.5 text-xs space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>Observaciones del Humano:</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-900 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-800">
                🔒 Ficha Exclusiva
              </span>
            </div>
            <p className="text-rose-900 dark:text-rose-200 text-xs font-semibold">{task.humanFeedback}</p>
          </div>
        )}

        {/* Archivos Modificados / Protegidos */}
        {task.modifiedFiles && task.modifiedFiles.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 py-1 px-2 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <FileCode className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Archivos Protegidos ({task.modifiedFiles.length}):</span>
            </span>
            {task.modifiedFiles.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                <Lock className="w-2.5 h-2.5 text-amber-500" />
                {f}
              </span>
            ))}
          </div>
        )}

        {/* SECCIÓN DE URL DE TRABAJO, MEMORIA DE CONTEXTO & BOTÓN DE REVISIÓN */}
        <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          {/* Dual URLs Info: Git Repo & Live Project Web App */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* 1. URL de Git */}
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200/90 dark:border-purple-800/60 text-purple-900 dark:text-purple-300 min-w-0 max-w-[240px] shadow-2xs">
              <GitBranch className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="shrink-0 text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Git:</span>
              {resolvedGitUrl ? (
                <a
                  href={resolvedGitUrl.startsWith("http") ? resolvedGitUrl : `https://${resolvedGitUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 hover:underline truncate font-mono text-[11px] inline-flex items-center gap-0.5 font-semibold"
                  title={`Abrir Repositorio / Commit en GitHub: ${resolvedGitUrl}`}
                >
                  <span className="truncate">{resolvedGitUrl.replace(/^https?:\/\/(www\.)?github\.com\//, "")}</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0 ml-0.5" />
                </a>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500 text-[11px] italic">No asignada</span>
              )}
            </div>

            {/* 2. URL del Proyecto en Vivo (Ir al proyecto a ver el cambio) */}
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300 min-w-0 max-w-[260px] shadow-2xs">
              <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="shrink-0 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Proyecto:</span>
              {resolvedProjectUrl ? (
                <a
                  href={resolvedProjectUrl.startsWith("http") ? resolvedProjectUrl : `https://${resolvedProjectUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 hover:underline truncate font-mono text-[11px] inline-flex items-center gap-0.5 font-bold"
                  title={`Ir al Proyecto para ver el cambio en vivo: ${resolvedProjectUrl}`}
                >
                  <span className="truncate">{resolvedProjectUrl.replace(/^https?:\/\//, "")}</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0 ml-0.5" />
                </a>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500 text-[11px] italic">No asignada</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-1.5">
            {/* Botón para ver Auditoría de Diálogo Humano-IA */}
            {onOpenChatAudit && (
              <button
                onClick={() => onOpenChatAudit(task)}
                className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-blue-400 text-[11px] font-semibold rounded border border-blue-200 dark:border-zinc-700 shadow-2xs transition-colors cursor-pointer"
                title="Auditoría de Diálogo Humano-IA y Quality Gate"
              >
                <MessageSquare className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>Diálogo Chat</span>
              </button>
            )}

            {/* Botón para ver Ficha de Memoria de Contexto */}
            <button
              onClick={() => onOpenContextMemory(task)}
              className="inline-flex items-center space-x-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-indigo-400 text-[11px] font-semibold rounded border border-indigo-200 dark:border-zinc-700 shadow-2xs transition-colors cursor-pointer"
              title="Ficha de Memoria de Contexto Técnico para la IA"
            >
              <BrainCircuit className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>Memoria de Contexto</span>
            </button>

            {/* BOTÓN NO FUNCIONA */}
            <button
              onClick={() => {
                setShowReportModal(!showReportModal);
                setShowImproveModal(false);
              }}
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/90 dark:hover:bg-rose-900 dark:text-rose-300 text-[11px] font-bold rounded border border-rose-200 dark:border-rose-800/80 shadow-2xs transition-all cursor-pointer"
              title="Reportar que esta entrega NO funciona"
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>⚠️ No Funciona</span>
            </button>

            {/* BOTÓN MEJORAR */}
            <button
              onClick={() => {
                setShowImproveModal(!showImproveModal);
                setShowReportModal(false);
              }}
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/90 dark:hover:bg-purple-900 dark:text-purple-300 text-[11px] font-bold rounded border border-purple-200 dark:border-purple-800/80 shadow-2xs transition-all cursor-pointer"
              title="Solicitar mejoras a la IA"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>✨ Mejorar</span>
            </button>

            {/* BOTÓN PRINCIPAL DE REVISIÓN */}
            <button
              onClick={() => {
                onReview(task);
              }}
              className={`inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold rounded transition-all shadow-2xs cursor-pointer ${
                task.status === "ready_for_review"
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                  : task.status === "needs_revision"
                  ? "bg-rose-600 hover:bg-rose-500 text-white"
                  : "bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>
                {task.status === "ready_for_review"
                  ? "Revisar Web Ahora"
                  : task.status === "needs_revision"
                  ? "Ver Observaciones"
                  : "Inspeccionar"}
              </span>
              <ChevronRight className="w-3 h-3 opacity-70" />
            </button>

            {/* Botón rápido de Aprobar y Bloquear */}
            {/* Botón rápido de 1-Clic Aprobar */}
            {task.status === "ready_for_review" && (
              <button
                onClick={handleQuickVerifyClick}
                disabled={isVerifying}
                title="Aprobación instantánea con 1 clic y bloqueo Quality Gate"
                className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded shadow-sm ring-1 ring-emerald-400/40 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                <span>{isVerifying ? "Bloqueando..." : "✓ Aprobar 1-Clic"}</span>
              </button>
            )}

            {/* Si ya está bloqueada, botón para desbloquear */}
            {task.locked && (
              <button
                onClick={() => onUnlock(task.id)}
                title="Desbloquear tarea para permitir que la IA vuelva a editarla"
                className="inline-flex items-center space-x-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-600 dark:text-zinc-300 text-[11px] rounded border border-zinc-300 dark:border-zinc-700 shadow-2xs transition-colors cursor-pointer"
              >
                <Unlock className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
                <span>Desbloquear</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
