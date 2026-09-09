import React, { useState, useEffect, useCallback } from "react";
import { Project } from "../types";
import { 
  BookmarkCheck, Copy, Check, RefreshCw, ChevronDown, ChevronUp, 
  Sparkles, Terminal, ArrowRight, Shield, Zap
} from "lucide-react";

interface LiveProjectContextCardProps {
  activeProject: Project | null;
}

export const LiveProjectContextCard: React.FC<LiveProjectContextCardProps> = ({ activeProject }) => {
  const [contextMarkdown, setContextMarkdown] = useState<string>("");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [tokenWeight, setTokenWeight] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const fetchContext = useCallback(async () => {
    if (!activeProject?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${activeProject.id}/context`);
      if (res.ok) {
        const data = await res.json();
        if (data.context) {
          setContextMarkdown(data.context.contextMarkdown || "");
          setUpdatedAt(data.context.updatedAt || "");
          setTokenWeight(data.context.tokenWeight || Math.round((data.context.contextMarkdown || "").length / 4));
        }
      }
    } catch (e) {
      console.warn("Error cargando contexto en vivo:", e);
    } finally {
      setLoading(false);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  const handleCopy = () => {
    if (!contextMarkdown) return;
    navigator.clipboard.writeText(contextMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeProject) return null;

  // Extraer líneas clave para resumen rápido
  const lines = contextMarkdown.split("\n").filter(l => l.trim().length > 0);
  const lastTaskLine = lines.find(l => l.toLowerCase().includes("última tarea") || l.toLowerCase().includes("ultima tarea")) || "";
  const nextStepLine = lines.find(l => l.toLowerCase().includes("siguiente paso")) || "";

  return (
    <div className="rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 bg-gradient-to-r from-indigo-50/50 via-white to-violet-50/40 dark:from-indigo-950/20 dark:via-[#0c0f17] dark:to-violet-950/10 shadow-xs overflow-hidden transition-all">
      {/* Header */}
      <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-indigo-100 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400">
            <BookmarkCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                Contexto en Vivo de Sesión
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> Ahorro de Tokens
              </span>
              {tokenWeight > 0 && (
                <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                  ~{tokenWeight} tokens
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 truncate">
              {activeProject.name} · Sincronizado con <code className="font-mono text-[10px]">CONTEXTO_PROYECTO.md</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={fetchContext}
            disabled={loading}
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
            title="Refrescar contexto en vivo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          </button>

          <button
            onClick={handleCopy}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xs"
            }`}
            title="Copiar este contexto para pegarlo al arrancar un chat nuevo"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "¡Copiado!" : "Copiar para Nuevo Chat"}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
            title={isExpanded ? "Plegar tarjeta" : "Expandir tarjeta"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded ? (
        <div className="p-3.5 space-y-2.5 text-xs text-zinc-800 dark:text-zinc-300 animate-in fade-in duration-150">
          {/* Tarjetas rápidas de Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
            {lastTaskLine && (
              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-zinc-800 space-y-1">
                <span className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 uppercase text-[10px]">
                  <Check className="w-3 h-3" /> Última Tarea Completada
                </span>
                <p className="text-zinc-700 dark:text-zinc-300 font-medium">
                  {lastTaskLine.replace(/^[-*#\s]*(\*\*)?(Última Tarea Completada:?)?(\*\*)?/i, "").trim()}
                </p>
              </div>
            )}
            {nextStepLine && (
              <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-100 dark:border-zinc-800 space-y-1">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase text-[10px]">
                  <ArrowRight className="w-3 h-3" /> Siguiente Paso Inmediato
                </span>
                <p className="text-zinc-700 dark:text-zinc-300 font-medium">
                  {nextStepLine.replace(/^[-*#\s]*(\*\*)?(Siguiente Paso Inmediato:?)?(\*\*)?/i, "").trim()}
                </p>
              </div>
            )}
          </div>

          {/* Bloque Markdown Completo */}
          <div className="p-3 rounded-lg bg-zinc-950 text-zinc-200 border border-zinc-800 font-mono text-[11px] max-h-40 overflow-y-auto leading-relaxed select-all">
            <pre className="whitespace-pre-wrap font-mono">
              {contextMarkdown || "# Sin contexto registrado aún.\nInicia una tarea para generar el primer snapshot."}
            </pre>
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-500">
            <span>💡 La IA lee este resumen al abrir cualquier chat nuevo para ahorrar tokens.</span>
            {updatedAt && <span>Actualizado: {new Date(updatedAt).toLocaleString()}</span>}
          </div>
        </div>
      ) : (
        /* Vista compacta cuando está plegada */
        <div className="px-3.5 py-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">Próximo paso:</span>
            <span className="truncate">
              {nextStepLine.replace(/^[-*#\s]*(\*\*)?(Siguiente Paso Inmediato:?)?(\*\*)?/i, "").trim() || "Continuar con desarrollo del proyecto"}
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 shrink-0 ml-2">Clic para desplegar</span>
        </div>
      )}
    </div>
  );
};
