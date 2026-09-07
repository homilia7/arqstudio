import React, { useState } from "react";
import {
  X,
  History,
  Clock,
  User,
  Bot,
  Globe,
  Download,
  Trash2,
  CheckCircle2,
  Lock,
  AlertCircle,
  Code2,
} from "lucide-react";
import { ChangeLogEntry } from "../types";
import { X as XIcon } from "lucide-react";
import * as api from "../services/api";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ChangeLogEntry[];
  onClearHistory: () => Promise<void>;
  onDeleteSingleHistory?: (id: string) => Promise<void>;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onDeleteSingleHistory,
}) => {
  if (!isOpen) return null;

  const [filterAuthor, setFilterAuthor] = useState<string>("all");
  const [isClearing, setIsClearing] = useState(false);

  const filteredHistory = history.filter((item) => {
    if (filterAuthor === "all") return true;
    return item.author === filterAuthor;
  });

  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `antigravity_changelog_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleClear = async () => {
    if (!confirm("¿Deseas limpiar todo el registro del historial?")) return;
    try {
      setIsClearing(true);
      await onClearHistory();
    } finally {
      setIsClearing(false);
    }
  };

  const getAuthorBadge = (author: ChangeLogEntry["author"]) => {
    switch (author) {
      case "antigravity_ai":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Bot className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>Antigravity AI</span>
          </span>
        );
      case "human":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <User className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Usuario (QA Humano)</span>
          </span>
        );
      case "api":
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Code2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span>API Externa</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            <span>Sistema</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/70 backdrop-blur-xs flex justify-end">
      <div className="bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-900 border-l border-zinc-300 dark:border-zinc-200 dark:border-zinc-800 w-full max-w-xl h-full shadow-2xl flex flex-col transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-100/80 dark:bg-zinc-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-900 dark:text-white tracking-tight">
                Historial de Cambios & Auditoría
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-600 dark:text-zinc-400">
                Registro inmutable de acciones realizadas por ti y por Antigravity
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-2.5 border-b border-zinc-200 dark:border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-900 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-1">
            <span className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 text-[11px] mr-1">Filtrar:</span>
            <button
              onClick={() => setFilterAuthor("all")}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                filterAuthor === "all"
                  ? "bg-zinc-800 dark:bg-slate-700 text-zinc-900 dark:text-white font-semibold"
                  : "text-zinc-600 dark:text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              Todos ({history.length})
            </button>
            <button
              onClick={() => setFilterAuthor("antigravity_ai")}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                filterAuthor === "antigravity_ai"
                  ? "bg-indigo-600 dark:bg-indigo-500 text-zinc-900 dark:text-white font-semibold"
                  : "text-zinc-600 dark:text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              IA
            </button>
            <button
              onClick={() => setFilterAuthor("human")}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                filterAuthor === "human"
                  ? "bg-emerald-600 dark:bg-emerald-500 text-zinc-900 dark:text-white font-semibold"
                  : "text-zinc-600 dark:text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              Humano
            </button>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleExportJson}
              title="Descargar registro en JSON"
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-700 dark:text-zinc-200 rounded border border-zinc-300 dark:border-zinc-700 text-[11px] font-medium transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Exportar JSON</span>
            </button>
            <button
              onClick={handleClear}
              disabled={isClearing || history.length === 0}
              title="Limpiar registro"
              className="p-1 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Timeline List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-100/50 dark:bg-zinc-950/40">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 text-xs">
              No hay registros de historial en esta vista.
            </div>
          ) : (
            filteredHistory.map((item) => {
              const formattedTime = new Date(item.timestamp).toLocaleString(
                "es-ES",
                {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }
              );

              return (
                <div
                  key={item.id}
                  className="bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-200 dark:border-zinc-800 rounded-lg p-3 space-y-2 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-900 dark:text-white block">
                        {item.taskTitle}
                      </span>
                      <div className="flex items-center space-x-2 text-[11px] text-zinc-500 dark:text-zinc-600 dark:text-zinc-400">
                        <Clock className="w-3 h-3 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500" />
                        <span>{formattedTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getAuthorBadge(item.author)}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm("¿Estás seguro de que deseas eliminar este registro del historial?")) {
                            if (onDeleteSingleHistory) {
                              await onDeleteSingleHistory(item.id);
                            } else {
                              await api.deleteHistoryEntry(item.id);
                            }
                          }
                        }}
                        title="Eliminar este cambio del historial"
                        aria-label="Eliminar cambio"
                        className="text-zinc-900 dark:text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 p-1 rounded transition-all cursor-pointer font-black text-xs shadow border border-rose-500 hover:scale-105"
                      >
                        <XIcon className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-100 dark:bg-zinc-950/60 p-2.5 rounded border border-zinc-300/80 dark:border-zinc-200 dark:border-zinc-800/80">
                    {item.details}
                  </p>

                  {item.workUrl && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-zinc-500 dark:text-zinc-600 dark:text-zinc-400">
                      <Globe className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">URL asociada:</span>
                      <a
                        href={
                          item.workUrl.startsWith("http")
                            ? item.workUrl
                            : `https://${item.workUrl}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-xs font-mono"
                      >
                        {item.workUrl}
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
