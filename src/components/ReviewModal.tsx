import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ExternalLink,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Globe,
  Bot,
  Sparkles,
  FileCheck,
  CheckSquare,
  Square,
  Plus,
  GitBranch,
  GitCommit,
  Mic,
  MicOff,
  Image,
  Clipboard,
} from "lucide-react";
import { TaskItem } from "../types";

interface ReviewModalProps {
  task: TaskItem | null;
  onClose: () => void;
  onVerify: (taskId: string, notes?: string) => Promise<void>;
  onReject: (taskId: string, feedback: string, imageRefs?: string[]) => Promise<void>;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  task,
  onClose,
  onVerify,
  onReject,
}) => {
  if (!task) return null;

  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados para voz e imágenes en el rechazo de la revisión
  const [rejectImages, setRejectImages] = useState<string[]>([]);
  const [isListeningReject, setIsListeningReject] = useState(false);
  const rejectFileInputRef = useRef<HTMLInputElement>(null);
  const rejectRecognitionRef = useRef<any>(null);

  const toggleVoiceReject = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Dictado por voz no disponible en este navegador.");
      return;
    }
    if (isListeningReject) {
      rejectRecognitionRef.current?.stop();
      setIsListeningReject(false);
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
        setFeedback((prev) => {
          const base = prev.replace(/\s*⌛.*$/, "").trimEnd();
          return base + (base ? " " : "") + text;
        });
      };
      rec.onend = () => setIsListeningReject(false);
      rec.onerror = () => setIsListeningReject(false);
      rec.start();
      rejectRecognitionRef.current = rec;
      setIsListeningReject(true);
    } catch {
      setIsListeningReject(false);
    }
  };

  const addRejectImageFromFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setRejectImages((prev) => (prev.length < 4 ? [...prev, dataUrl] : prev));
    };
    reader.readAsDataURL(file);
  };

  const handleRejectPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) addRejectImageFromFile(file);
        return;
      }
    }
  };

  const handleRejectPasteFromClipboard = async () => {
    try {
      const clipItems = await (navigator.clipboard as any).read();
      for (const item of clipItems) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            addRejectImageFromFile(new File([blob], "evidencia-error.png", { type }));
            return;
          }
        }
      }
      rejectFileInputRef.current?.click();
    } catch {
      rejectFileInputRef.current?.click();
    }
  };

  // Checklist de Comprobación de Calidad
  const [checkItems, setCheckItems] = useState([
    { id: "c1", label: "La web cumple exactamente con la instrucción solicitada", checked: false },
    { id: "c2", label: "El diseño visual, colores y tipografía se ven correctos", checked: false },
    { id: "c3", label: "Se probó la navegación y responsividad (móvil y desktop)", checked: false },
    { id: "c4", label: "No presenta errores visuales ni enlaces rotos", checked: false },
  ]);
  const [newCheckText, setNewCheckText] = useState("");

  const toggleCheck = (id: string) => {
    setCheckItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleAddCheckItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckText.trim()) return;
    setCheckItems((prev) => [
      ...prev,
      { id: "custom-" + Date.now(), label: newCheckText.trim(), checked: false },
    ]);
    setNewCheckText("");
  };

  const checkedCount = checkItems.filter((i) => i.checked).length;
  const allChecked = checkedCount === checkItems.length && checkItems.length > 0;

  const workUrl =
    task.workUrl.startsWith("http") ? task.workUrl : `https://${task.workUrl}`;

  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      await onVerify(task.id, notes.trim() || undefined);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() && rejectImages.length === 0) return;

    try {
      setIsProcessing(true);
      let finalFeedback = feedback.trim();
      if (rejectImages.length > 0) {
        finalFeedback += `\n\n[CAPTURAS DEL FALLO ADJUNTAS: ${rejectImages.length} imagen(es) de evidencia adjunta(s)]`;
      }
      await onReject(task.id, finalFeedback, rejectImages);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col transition-colors">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
              <FileCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Revisión y Control de Calidad
                </h2>
                {task.locked && (
                  <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Bloqueada</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-md">
                Tarea: "{task.title}"
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body - COMPACTO SIN SCROLL */}
        <div className="p-3 sm:p-4 space-y-2.5">
          {/* OBSERVACIONES HUMANAS REGISTRADAS (NO FUNCIONA) */}
          {task.humanFeedback && (
            <div className="bg-rose-950/90 border border-rose-800 rounded p-2.5 space-y-1 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>Observación Registrada:</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-900 text-rose-200 font-bold border border-rose-700">
                  Pendiente Corrección
                </span>
              </div>
              <p className="text-white text-xs font-semibold whitespace-pre-wrap bg-slate-900/80 p-2 rounded border border-rose-900/80 font-mono">
                {task.humanFeedback}
              </p>
            </div>
          )}

          {/* BARRA DE LA URL DE TRABAJO */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 rounded p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5 min-w-0">
              <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-[11px] font-mono font-medium text-slate-800 dark:text-slate-200 truncate">
                {task.workUrl || "No se ha especificado una URL"}
              </span>
            </div>

            {task.workUrl && (
              <a
                href={workUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] rounded shadow-2xs transition-colors shrink-0 cursor-pointer"
              >
                <span>Abrir Web</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>

          {/* CHECKLIST COMPACTO */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded p-2.5 space-y-1.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Checklist Rápido de Calidad
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {checkedCount}/{checkItems.length} comprobados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {checkItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`flex items-center space-x-1.5 p-1.5 rounded border cursor-pointer select-none transition-all ${
                    item.checked
                      ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <button type="button" className="text-emerald-600 dark:text-emerald-400 shrink-0">
                    {item.checked ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                  <span className={`text-[11px] truncate ${item.checked ? "line-through opacity-80" : "font-medium"}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Comparativa Compacta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded p-2 space-y-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                Instrucción Asignada:
              </span>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-mono leading-tight max-h-16 overflow-y-auto">
                {task.instruction}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded p-2 space-y-1">
              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                Entrega / Reporte IA:
              </span>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-mono leading-tight max-h-16 overflow-y-auto">
                {task.aiNotes || task.aiOutput || "Completado y desplegado."}
              </p>
            </div>
          </div>

          {/* Formulario de Rechazo si se activa */}
          {showRejectForm && (
            <form
              onSubmit={handleReject}
              className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded p-2.5 space-y-2 animate-fadeIn"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-rose-800 dark:text-rose-300 text-xs font-bold">
                  <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                  <span>¿Qué necesita corregir la IA?</span>
                </div>
                {rejectImages.length > 0 && (
                  <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                    📎 {rejectImages.length}/4 capturas
                  </span>
                )}
              </div>

              {/* Toolbar: Micrófono y Pegar Imagen */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleVoiceReject}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                    isListeningReject
                      ? "bg-rose-600 text-white border-rose-600 animate-pulse"
                      : "bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100"
                  }`}
                >
                  {isListeningReject ? (
                    <>
                      <MicOff className="w-2.5 h-2.5" />
                      <span>Detener Voz</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-2.5 h-2.5 text-rose-500" />
                      <span>Dictar por Voz</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRejectPasteFromClipboard}
                  disabled={rejectImages.length >= 4}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-40"
                >
                  <Clipboard className="w-2.5 h-2.5 text-rose-500" />
                  <span>Pegar Captura</span>
                </button>

                <button
                  type="button"
                  onClick={() => rejectFileInputRef.current?.click()}
                  disabled={rejectImages.length >= 4}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-40"
                >
                  <Image className="w-2.5 h-2.5 text-rose-500" />
                  <span>Adjuntar Imagen</span>
                </button>

                <input
                  ref={rejectFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    Array.from(e.target.files || []).forEach(addRejectImageFromFile);
                    e.target.value = "";
                  }}
                />
              </div>

              <textarea
                autoFocus
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                onPaste={handleRejectPaste}
                rows={2}
                placeholder="Indica qué falló o falta por ajustar... (puedes dictar por voz o presionar Ctrl+V para pegar capturas)"
                className="w-full bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 rounded p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              />

              {/* Miniaturas de capturas adjuntas */}
              {rejectImages.length > 0 && (
                <div className="flex flex-wrap gap-2 p-1.5 bg-rose-100/60 dark:bg-rose-950/60 rounded border border-rose-300/60 dark:border-rose-800/60">
                  {rejectImages.map((src, idx) => (
                    <div key={idx} className="relative group shrink-0">
                      <img
                        src={src}
                        alt={`Captura ${idx + 1}`}
                        onClick={() => window.open(src, "_blank")}
                        className="w-12 h-12 object-cover rounded border border-rose-400 dark:border-rose-700 shadow-sm cursor-pointer hover:border-rose-600 transition-colors"
                        title="Clic para ver completa"
                      />
                      <button
                        type="button"
                        onClick={() => setRejectImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || (!feedback.trim() && rejectImages.length === 0)}
                  className="px-3 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded shadow-2xs transition-colors cursor-pointer"
                >
                  {isProcessing ? "Enviando..." : "Enviar a la IA"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between gap-2">
          <div>
            {!showRejectForm && (
              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                <span>Requiere Correcciones</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded shadow-2xs transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={isProcessing}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isProcessing ? "Bloqueando..." : "Marcar como Completado & Bloquear"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

