import React, { useState } from "react";
import {
  History,
  Bot,
  User,
  Clock,
  Download,
  Plus,
  Search,
  CheckCircle2,
  GitCommit,
  Globe,
  FileText,
  Sparkles,
  Printer,
  X,
  Trash2,
} from "lucide-react";
import { ChangeLogEntry, Project } from "../types";
import * as api from "../services/api";

interface ProjectChangelogViewProps {
  activeProject: Project | null;
  history: ChangeLogEntry[];
  onAddChangelogEntry?: (entry: { title: string; details: string; action: string }) => Promise<void>;
  onDeleteChangelogEntry?: (id: string) => Promise<void>;
}

export const ProjectChangelogView: React.FC<ProjectChangelogViewProps> = ({
  activeProject,
  history,
  onAddChangelogEntry,
  onDeleteChangelogEntry,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAuthor, setFilterAuthor] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!activeProject) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-900">
          <History className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          No hay ningún proyecto activo seleccionado
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Selecciona o crea un proyecto arriba para consultar su Historial de Cambios registrado por la IA.
        </p>
      </div>
    );
  }

  // Filtrar cambios pertenecientes únicamente al proyecto activo
  const projectHistory = history.filter(
    (item) => item.projectId === activeProject.id
  );

  const filteredHistory = projectHistory.filter((item) => {
    const matchesSearch =
      (item.taskTitle && item.taskTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.details && item.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.author && item.author.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterAuthor === "all") return matchesSearch;
    if (filterAuthor === "agent") {
      return matchesSearch && (item.author?.includes("AI") || item.author?.includes("Bot") || item.author?.includes("Antigravity") || item.author?.includes("CODEX"));
    }
    if (filterAuthor === "user") {
      return matchesSearch && !(item.author?.includes("AI") || item.author?.includes("Bot") || item.author?.includes("Antigravity") || item.author?.includes("CODEX"));
    }
    return matchesSearch;
  });

  const handleExportMarkdown = () => {
    let mdContent = `# 📋 Historial de Cambios - Proyecto: ${activeProject.name}\n\n`;
    mdContent += `> **ID del Proyecto:** \`${activeProject.id}\`  \n`;
    mdContent += `> **URL Principal:** ${activeProject.mainUrl}  \n`;
    mdContent += `> **Fecha de Exportación:** ${new Date().toLocaleString()}  \n\n`;
    mdContent += `---\n\n`;

    if (filteredHistory.length === 0) {
      mdContent += `*No se registraron cambios para este proyecto aún.*\n`;
    } else {
      filteredHistory.forEach((h, index) => {
        const dateStr = new Date(h.timestamp).toLocaleString();
        mdContent += `### ${index + 1}. ${h.taskTitle || "Cambio Registrado"}\n`;
        mdContent += `- **Fecha:** ${dateStr}\n`;
        mdContent += `- **Autor:** ${h.author || "Sistema"}\n`;
        mdContent += `- **Acción:** \`${h.action || "modificación"}\`\n`;
        if (h.details) mdContent += `- **Detalles:** ${h.details}\n`;
        if (h.workUrl) mdContent += `- **Enlace de Trabajo:** [Ver Resultado](${h.workUrl})\n`;
        mdContent += `\n---\n\n`;
      });
    }

    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.setAttribute("download", `HISTORIAL_CAMBIOS_${activeProject.name.replace(/\s+/g, "_")}.md`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      setIsSubmitting(true);
      if (onAddChangelogEntry) {
        await onAddChangelogEntry({
          title: newTitle.trim(),
          details: newDetails.trim(),
          action: "manual_changelog_entry",
        });
      }
      setNewTitle("");
      setNewDetails("");
      setShowAddModal(false);
    } catch (err) {
      console.error("Error guardando cambio:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PROYECTO: {activeProject.name}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {activeProject.id}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center space-x-2">
              <History className="w-6 h-6 text-indigo-400" />
              <span>Historial de Cambios Registrados por IA</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Registro cronológico de todas las modificaciones, archivos generados, correcciones y tareas completadas por la IA y usuarios en este proyecto.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm border border-slate-700 flex items-center space-x-2 cursor-pointer"
              title="Imprimir o Guardar como PDF Reporte Ejecutivo Visual"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={handleExportMarkdown}
              className="px-3.5 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm border border-indigo-400/30 flex items-center space-x-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar .MD</span>
            </button>
            {onAddChangelogEntry && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Cambio</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en el historial de cambios..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Autor:</span>
          <select
            value={filterAuthor}
            onChange={(e) => setFilterAuthor(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">Todos los Autores</option>
            <option value="agent">🤖 Agentes IA</option>
            <option value="user">👤 Usuarios</option>
          </select>

          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            {filteredHistory.length} registros
          </span>
        </div>
      </div>

      {/* List of Changelog Entries */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              No se encontraron cambios registrados para "{activeProject.name}"
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Los avances que realice la IA o que tú registres aparecerán en esta lista en tiempo real y quedarán guardados de forma permanente.
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isAgent = item.author?.includes("AI") || item.author?.includes("Bot") || item.author?.includes("Antigravity") || item.author?.includes("CODEX");
            const dateStr = new Date(item.timestamp).toLocaleString([], {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800/80 rounded-xl p-4 transition-all shadow-2xs hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden group"
              >
                {/* Botón X de eliminación prominente en la esquina superior derecha */}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm("¿Estás seguro de que deseas eliminar este registro de cambio?")) {
                      if (onDeleteChangelogEntry) {
                        await onDeleteChangelogEntry(item.id);
                      } else {
                        await api.deleteHistoryEntry(item.id);
                      }
                    }
                  }}
                  title="Eliminar este cambio del historial"
                  aria-label="Eliminar cambio"
                  className="absolute top-3 right-3 text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 p-1.5 rounded-lg transition-all cursor-pointer font-black text-sm z-30 flex items-center justify-center shadow-lg border border-rose-500 hover:scale-105"
                >
                  <X className="w-4 h-4 stroke-[3]" />
                </button>

                <div className="flex items-start space-x-3.5 overflow-hidden pr-8 sm:pr-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isAgent
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
                        : "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {isAgent ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                          isAgent
                            ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20"
                            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                        }`}
                      >
                        {isAgent ? <Sparkles className="w-3 h-3 mr-0.5" /> : <User className="w-3 h-3 mr-0.5" />}
                        <span>{item.author || "Sistema"}</span>
                      </span>

                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] rounded border border-slate-200 dark:border-slate-700">
                        {item.action || "actualización"}
                      </span>

                      <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{dateStr}</span>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {item.taskTitle || "Cambio Registrado"}
                    </h3>

                    {item.details && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80">
                        {item.details}
                      </p>
                    )}
                  </div>
                </div>

                {item.workUrl && (
                  <div className="shrink-0 self-end sm:self-center pt-2 sm:pt-0">
                    <a
                      href={item.workUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Ver Resultado</span>
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Registrar Cambio Manual */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-start justify-center p-4 pt-12 sm:pt-16 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <GitCommit className="w-4 h-4 text-emerald-600" />
              <span>Registrar Nuevo Cambio en {activeProject.name}</span>
            </h3>

            <form onSubmit={handleCreateEntry} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Título del Cambio / Avance *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Corrección de interfaz, integración de API, nuevo módulo..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Detalles / Explicación del Trabajo
                </label>
                <textarea
                  rows={3}
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  placeholder="Describe qué cambios se realizaron en el código o en la plataforma..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {isSubmitting ? "Guardando..." : "Guardar Cambio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
