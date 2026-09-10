import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Sparkles,
  Bot,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
  Image,
  Clipboard,
  X
} from "lucide-react";
import { Project } from "../types";

interface TaskInputFormProps {
  activeProject: Project | null;
  onAddTask: (
    title: string,
    instruction: string,
    assignedAgent?: string,
    branch?: string,
    imageRefs?: string[]
  ) => Promise<void>;
  onOpenApiDocs: () => void;
}

export const TaskInputForm: React.FC<TaskInputFormProps> = ({
  activeProject,
  onAddTask,
  onOpenApiDocs,
}) => {
  const [instruction, setInstruction] = useState("");
  const [title, setTitle] = useState("");
  const [workUrl, setWorkUrl] = useState("");
  const [agentName, setAgentName] = useState("Antigravity AI");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── Imágenes de referencia ──
  const [pastedImages, setPastedImages] = useState<string[]>([]);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // ── Voz ──
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("El dictado por voz requiere Google Chrome, Microsoft Edge o Safari con permisos de micrófono habilitados.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    try {
      const rec = new SpeechRecognition();
      rec.lang = "es-ES";
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInstruction((prev) => {
          const base = prev.replace(/\s*⌛.*$/, "").trimEnd();
          return base + (base ? " " : "") + transcript;
        });
      };
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  const addImageFromFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPastedImages((prev) => (prev.length < 6 ? [...prev, dataUrl] : prev));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleTextareaPaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) addImageFromFile(file);
          return;
        }
      }
    },
    [addImageFromFile]
  );

  const handlePasteFromClipboard = async () => {
    try {
      const clipItems = await (navigator.clipboard as any).read();
      for (const item of clipItems) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            addImageFromFile(new File([blob], "imagen.png", { type }));
            return;
          }
        }
      }
      fileInputRef.current?.click();
    } catch {
      fileInputRef.current?.click();
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      Array.from(e.dataTransfer.files).forEach(addImageFromFile);
    },
    [addImageFromFile]
  );

  const removeImage = (idx: number) =>
    setPastedImages((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || !activeProject) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    try {
      setIsSubmitting(true);
      let finalInstruction = instruction.replace(/\s*⌛.*$/, "").trim();
      if (pastedImages.length > 0) {
        finalInstruction +=
          `\n\n[REFERENCIAS VISUALES: ${pastedImages.length} imagen(es) adjunta(s). ` +
          `Observa colores, disposición y componentes para guiar tu implementación.]`;
      }

      await onAddTask(
        title.trim() || instruction.trim().slice(0, 50),
        finalInstruction,
        agentName,
        "main",
        pastedImages.length > 0 ? pastedImages : undefined
      );

      setInstruction("");
      setTitle("");
      setWorkUrl("");
      setPastedImages([]);
      setShowAdvanced(false);
    } catch (err) {
      console.error("Error al agregar tarea:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickTemplates = [
    "Crear botón de inicio de sesión con PIN y diseño responsivo",
    "Optimizar SEO, meta tags y velocidad de carga de la web",
    "Corregir error de responsive en vista móvil para la tabla",
    "Integrar pasarela de pago con confirmación vía webhook",
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-4 sm:p-5 relative overflow-hidden transition-colors">
      <div className="flex items-center justify-between mb-3 border-b border-zinc-300 dark:border-zinc-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-zinc-800 border border-emerald-200 dark:border-zinc-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Instrucción para la IA (Antigravity)
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Escribe, dicta por voz 🎙️ o pega fotos 🖼️ como referencia para la IA
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenApiDocs}
          className="text-xs text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium flex items-center space-x-1 cursor-pointer transition-colors"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Ver cómo la IA se conecta vía API</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Toolbar: Micrófono y Pegar Imagen */}
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          {/* Botón Micrófono */}
          <button
            type="button"
            onClick={toggleVoice}
            title={isListening ? "Detener dictado por voz" : "Dictar instrucción por voz"}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-xs ${
              isListening
                ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-700 animate-pulse ring-2 ring-rose-400"
                : "bg-zinc-50 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:text-emerald-600 hover:border-emerald-400"
            }`}
          >
            {isListening ? (
              <>
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                <MicOff className="w-3.5 h-3.5 text-white" />
                <span>Detener voz</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Dictar por voz</span>
              </>
            )}
          </button>

          {/* Botón Pegar Imagen */}
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            disabled={pastedImages.length >= 6}
            title="Pegar imagen del portapapeles (o Ctrl+V en el texto)"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-zinc-50 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:text-emerald-600 hover:border-emerald-400 transition-all cursor-pointer disabled:opacity-40"
          >
            <Clipboard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Pegar imagen</span>
          </button>

          {/* Botón Adjuntar Imagen */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={pastedImages.length >= 6}
            title="Seleccionar foto desde archivo"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-zinc-50 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:text-emerald-600 hover:border-emerald-400 transition-all cursor-pointer disabled:opacity-40"
          >
            <Image className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Adjuntar foto</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              Array.from(e.target.files || []).forEach(addImageFromFile);
              e.target.value = "";
            }}
          />

          {pastedImages.length > 0 && (
            <span className="ml-auto text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              📎 {pastedImages.length}/6 fotos adjuntas
            </span>
          )}
        </div>

        {/* Input de la Instrucción con Drag & Drop */}
        <div
          ref={dropZoneRef}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`relative rounded-lg transition-all ${isDragOver ? "ring-2 ring-emerald-500" : ""}`}
        >
          {isDragOver && (
            <div className="absolute inset-0 z-10 bg-emerald-500/10 border-2 border-dashed border-emerald-500 rounded-lg flex items-center justify-center pointer-events-none">
              <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center gap-2">
                <Image className="w-5 h-5" />
                Suelta la imagen aquí
              </div>
            </div>
          )}

          <textarea
            id="instruction-input"
            rows={4}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onPaste={handleTextareaPaste}
            placeholder={
              isListening
                ? "🎙️ Escuchando... habla ahora para dictar la instrucción"
                : "Ej: 'Crea una sección de testimonios de clientes con slider automático.' — Puedes dictar por voz 🎙️ o pegar imágenes directamente (Ctrl+V)..."
            }
            className={`w-full bg-zinc-50 dark:bg-zinc-800 border focus:ring-1 focus:ring-emerald-500 rounded-lg p-3 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-500 focus:bg-white dark:focus:bg-zinc-900 transition-all resize-y font-mono ${
              isListening
                ? "border-rose-400 dark:border-rose-600 focus:border-rose-400"
                : "border-zinc-300 dark:border-zinc-700 focus:border-emerald-500"
            }`}
            required
          />

          {isListening && (
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 bg-rose-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow pointer-events-none">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
              </span>
              GRABANDO
            </div>
          )}
        </div>

        {/* Galería de miniaturas */}
        {pastedImages.length > 0 && (
          <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40">
            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Image className="w-3 h-3" />
              Referencias visuales para la IA ({pastedImages.length}/6 máx.)
            </p>
            <div className="flex flex-wrap gap-2">
              {pastedImages.map((src, idx) => (
                <div key={idx} className="relative group shrink-0">
                  <img
                    src={src}
                    alt={`Referencia ${idx + 1}`}
                    onClick={() => window.open(src, "_blank")}
                    className="w-16 h-16 object-cover rounded-lg border-2 border-emerald-300 dark:border-emerald-700 shadow-sm cursor-pointer hover:border-emerald-500 transition-colors"
                    title="Clic para ver completa"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                  <span className="absolute bottom-0.5 left-0 right-0 text-center text-[8px] text-white font-bold bg-black/50 pointer-events-none rounded-b-lg">
                    Foto {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plantillas rápidas */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs text-zinc-500 scrollbar-none">
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
            Ejemplos rápidos:
          </span>
          {quickTemplates.map((template, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInstruction(template);
                if (!title) setTitle(template.substring(0, 35) + "...");
              }}
              className="px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded whitespace-nowrap border border-zinc-200 dark:border-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-colors text-[11px] cursor-pointer"
            >
              {template.length > 32 ? template.substring(0, 30) + "..." : template}
            </button>
          ))}
        </div>

        {/* Opciones avanzadas toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center space-x-1 font-medium transition-colors cursor-pointer"
          >
            {showAdvanced ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            <span>
              {showAdvanced
                ? "Ocultar detalles adicionales"
                : "Añadir título específico, URL de rama o selector de Agente"}
            </span>
          </button>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded border border-zinc-200 dark:border-zinc-700">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                Título Corto
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Fix Navbar móvil"
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                Agente Asignado
              </label>
              <select
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="Antigravity AI">Antigravity AI (Principal)</option>
                <option value="Antigravity Coder v2">Antigravity Coder v2</option>
                <option value="Gemini QA Agent">Gemini QA Agent</option>
                <option value="Custom API Agent">Custom API Agent</option>
              </select>
            </div>
          </div>
        )}

        {/* Botón de Enviar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 text-center sm:text-left">
            {pastedImages.length > 0
              ? `📎 ${pastedImages.length} foto(s) adjunta(s) como referencia visual para la IA.`
              : "La tarea se agregará a la lista y estará disponible inmediatamente para el agente vía API."}
          </span>
          <button
            type="submit"
            disabled={isSubmitting || !instruction.trim()}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "Enviando..." : "Asignar Instrucción a la IA"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
