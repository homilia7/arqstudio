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
  ArrowLeft,
  ShieldCheck,
  FolderPlus,
  Layers,
  Award,
  Printer,
  X,
  Trash2,
} from "lucide-react";
import { ChangeLogEntry, Project } from "../types";
import * as api from "../services/api";

interface ChangelogStandalonePageProps {
  projects: Project[];
  activeProject: Project | null;
  history: ChangeLogEntry[];
  onSelectProject: (project: Project) => void;
  onCreateNewProject: (name: string, mainUrl: string, description?: string) => Promise<void>;
  onAddApprovedChange: (entry: { title: string; details: string; action: string; workUrl?: string }) => Promise<void>;
  onDeleteApprovedChange?: (id: string) => Promise<void>;
  onBackToBoard: () => void;
  currentUser?: { name: string; id?: string } | null;
}

export const ChangelogStandalonePage: React.FC<ChangelogStandalonePageProps> = ({
  projects,
  activeProject,
  history,
  onSelectProject,
  onCreateNewProject,
  onAddApprovedChange,
  onDeleteApprovedChange,
  onBackToBoard,
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAuthor, setFilterAuthor] = useState<string>("all");
  
  // Modales
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showAddChangeModal, setShowAddChangeModal] = useState(false);
  
  // Campos Nuevo Proyecto de Historial
  const [newProjName, setNewProjName] = useState("");
  const [newProjUrl, setNewProjUrl] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [isCreatingProj, setIsCreatingProj] = useState(false);

  // Campos Nuevo Cambio Aprobado
  const [changeTitle, setChangeTitle] = useState("");
  const [changeDetails, setChangeDetails] = useState("");
  const [changeWorkUrl, setChangeWorkUrl] = useState("");
  const [isAddingChange, setIsAddingChange] = useState(false);

  // Filtrar cambios del proyecto activo
  const projectHistory = activeProject
    ? history.filter((item) => item.projectId === activeProject.id)
    : [];

  // Filtrar por búsqueda y autor
  const filteredHistory = projectHistory.filter((item) => {
    const matchesSearch =
      (item.taskTitle && item.taskTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.details && item.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.author && item.author.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterAuthor === "all") return matchesSearch;
    if (filterAuthor === "agent") {
      return (
        matchesSearch &&
        (item.author?.includes("AI") ||
          item.author?.includes("Bot") ||
          item.author?.includes("Antigravity") ||
          item.author?.includes("CODEX"))
      );
    }
    if (filterAuthor === "user") {
      return (
        matchesSearch &&
        !(
          item.author?.includes("AI") ||
          item.author?.includes("Bot") ||
          item.author?.includes("Antigravity") ||
          item.author?.includes("CODEX")
        )
      );
    }
    return matchesSearch;
  });

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    try {
      setIsCreatingProj(true);
      await onCreateNewProject(
        newProjName.trim(),
        newProjUrl.trim() || "https://arqai.pages.dev",
        newProjDesc.trim() || "Proyecto de Historial de Cambios Aprobados"
      );
      setNewProjName("");
      setNewProjUrl("");
      setNewProjDesc("");
      setShowCreateProjectModal(false);
    } catch (err) {
      console.error("Error creando proyecto de historial:", err);
    } finally {
      setIsCreatingProj(false);
    }
  };

  const handleAddChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeTitle.trim() || !activeProject) return;
    try {
      setIsAddingChange(true);
      await onAddApprovedChange({
        title: changeTitle.trim(),
        details: changeDetails.trim(),
        action: "feature_approved",
        workUrl: changeWorkUrl.trim() || undefined,
      });
      setChangeTitle("");
      setChangeDetails("");
      setChangeWorkUrl("");
      setShowAddChangeModal(false);
    } catch (err) {
      console.error("Error al registrar cambio aprobado:", err);
    } finally {
      setIsAddingChange(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!activeProject) return;

    let mdContent = `# 📜 HISTORIAL DE CAMBIOS APROBADOS DE FUNCIONALIDADES\n\n`;
    mdContent += `> **Proyecto:** \`${activeProject.name}\`  \n`;
    mdContent += `> **ID del Proyecto:** \`${activeProject.id}\`  \n`;
    mdContent += `> **Usuario Encargado:** ${currentUser?.name || "Humano"}  \n`;
    mdContent += `> **Fecha de Generación:** ${new Date().toLocaleString()}  \n\n`;
    mdContent += `---  \n\n`;

    if (filteredHistory.length === 0) {
      mdContent += `*No hay funcionalidades aprobadas en este proyecto aún.*\n`;
    } else {
      filteredHistory.forEach((h, index) => {
        const dateStr = new Date(h.timestamp).toLocaleString();
        mdContent += `### ${index + 1}. ✅ ${h.taskTitle || "Funcionalidad Aprobada"}\n`;
        mdContent += `- **Estado:** \`✅ Aprobado por Humano\`\n`;
        mdContent += `- **Fecha de Registro:** ${dateStr}\n`;
        mdContent += `- **Construido por:** ${h.author || "Agente IA"}\n`;
        mdContent += `- **Acción:** \`${h.action || "funcionalidad_completada"}\`\n`;
        if (h.details) mdContent += `- **Detalle del Cambio:** ${h.details}\n`;
        if (h.workUrl) mdContent += `- **Demostración / Vista:** [Ver Resultado](${h.workUrl})\n`;
        mdContent += `\n---\n\n`;
      });
    }

    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.setAttribute(
      "download",
      `HISTORIAL_CAMBIOS_APROBADOS_${activeProject.name.replace(/\s+/g, "_")}.md`
    );
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased">
      {/* Top Header Independiente de la Página de Historial */}
      <header className="bg-zinc-900/90 border-b border-zinc-800 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onBackToBoard}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-slate-700 text-zinc-200 rounded-lg text-[11px] font-bold transition-all flex items-center space-x-1.5 border border-zinc-700 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
            <span>Volver al Área de Trabajo</span>
          </button>

          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
              <History className="w-3.5 h-3.5" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-white flex items-center space-x-2 leading-tight">
                <span>Página de Historial de Cambios Aprobados</span>
                <span className="px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] uppercase font-black">
                  Exclusivo Aprobados
                </span>
              </h1>
              <p className="text-[10px] text-zinc-400 hidden sm:block leading-tight">
                Registro independiente de funcionalidades construidas por IA y aprobadas por el humano.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {activeProject && (
            <>
              <button
                onClick={() => window.print()}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-slate-700 text-zinc-200 rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center space-x-1.5 border border-zinc-700 cursor-pointer"
                title="Imprimir o Guardar como PDF Reporte Ejecutivo Visual"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Imprimir / PDF</span>
              </button>
              <button
                onClick={handleExportMarkdown}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center space-x-1.5 border border-indigo-400/30 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exportar .MD</span>
              </button>
            </>
          )}

          <button
            onClick={() => setShowCreateProjectModal(true)}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ Crear Proyecto de Historial</span>
          </button>
        </div>
      </header>

      {/* Main Content Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 space-y-3">
        {/* Selector de Proyecto de Historial & Información */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Seleccionar Proyecto de Historial de Cambios:
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {projects.length > 0 ? (
                <select
                  value={activeProject?.id || ""}
                  onChange={(e) => {
                    const found = projects.find((p) => p.id === e.target.value);
                    if (found) onSelectProject(found);
                  }}
                  className="bg-zinc-950 border border-zinc-700 text-white text-xs rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-bold cursor-pointer w-full sm:w-auto min-w-0 sm:min-w-[200px] truncate"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      📁 {p.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-rose-400 font-medium">
                  No hay proyectos registrados aún. ¡Crea uno a la derecha!
                </span>
              )}

              {activeProject && (
                <span className="px-2.5 py-0.5 bg-indigo-950/80 text-indigo-300 border border-indigo-800 rounded text-xs font-mono shrink-0">
                  {filteredHistory.length} funcionalidades aprobadas
                </span>
              )}
            </div>
          </div>

          {activeProject && (
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setShowAddChangeModal(true)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Registrar Cambio Aprobado</span>
              </button>
            </div>
          )}
        </div>

        {!activeProject ? (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">
              Crea o Selecciona un Proyecto para Ver su Historial de Cambios
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Haz clic en el botón superior "+ Crear Proyecto de Historial" para dar un nombre a tu proyecto y empezar a acumular las funcionalidades construidas y aprobadas.
            </p>
            <button
              onClick={() => setShowCreateProjectModal(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1.5"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Crear Mi Primer Proyecto de Historial</span>
            </button>
          </div>
        ) : (
          <>
            {/* Barra de Filtros & Búsqueda */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar en funcionalidades aprobadas..."
                  className="w-full pl-8 pr-2.5 py-1 bg-zinc-950 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <span className="text-xs text-zinc-400 font-medium">Filtrar Creador:</span>
                <select
                  value={filterAuthor}
                  onChange={(e) => setFilterAuthor(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="all">Todos los Registros</option>
                  <option value="agent">🤖 Agente IA</option>
                  <option value="user">👤 Usuario Humano</option>
                </select>
              </div>
            </div>

            {/* Stream Cronológico de Funcionalidades Aprobadas (Top to Bottom) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lista Cronológica de Cambios Aprobados ({filteredHistory.length})</span>
                </h2>
                <span className="text-[10px] text-zinc-500">Orden de Construcción (Más Reciente Primero)</span>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6 text-center space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">
                    Aún no hay cambios aprobados en "{activeProject.name}"
                  </h4>
                  <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
                    Conforme le des la orden a la IA de guardar en el historial o apruebes tareas completadas, irán apareciendo en esta lista de arriba hacia abajo.
                  </p>
                  <button
                    onClick={() => setShowAddChangeModal(true)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer inline-flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Primer Cambio Aprobado</span>
                  </button>
                </div>
              ) : (
                filteredHistory.map((item, index) => {
                  const isAgent =
                    item.author?.includes("AI") ||
                    item.author?.includes("Bot") ||
                    item.author?.includes("Antigravity") ||
                    item.author?.includes("CODEX");

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
                      className="bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 rounded-xl p-4 transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden group"
                    >
                      {/* Botón X de eliminación prominente en la esquina superior derecha */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm("¿Estás seguro de que deseas eliminar este cambio aprobado del historial?")) {
                            if (onDeleteApprovedChange) {
                              await onDeleteApprovedChange(item.id);
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

                      <div className="flex items-start space-x-3 min-w-0 pr-8 sm:pr-0">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                              isAgent
                                ? "bg-indigo-950/80 border-indigo-700 text-indigo-400"
                                : "bg-emerald-950/80 border-emerald-700 text-emerald-400"
                            }`}
                          >
                            {isAgent ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <span className="text-[9px] font-mono text-zinc-500 mt-0.5">#{filteredHistory.length - index}</span>
                        </div>

                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                              <span>✅ Aprobado por Humano</span>
                            </span>

                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border ${
                                isAgent
                                  ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                                  : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                              }`}
                            >
                              {item.author || "Sistema"}
                            </span>

                            <span className="text-[10px] text-zinc-400 flex items-center space-x-1">
                              <Clock className="w-2.5 h-2.5 text-zinc-500" />
                              <span>{dateStr}</span>
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-white leading-snug">
                            {item.taskTitle || "Funcionalidad Construida y Aprobada"}
                          </h3>

                          {item.details && (
                            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80">
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
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                          >
                            <Globe className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Ver Resultado</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>

      {/* Modal Crear Nuevo Proyecto de Historial */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 z-[9999] bg-zinc-950/80 backdrop-blur-md flex items-start justify-center p-4 pt-12 sm:pt-16 overflow-y-auto animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <FolderPlus className="w-5 h-5 text-emerald-400" />
              <span>Crear Nuevo Proyecto de Historial</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Asigna un nombre a este proyecto para agrupar y llevar el registro exclusivo de todos los cambios aprobados que la IA vaya construyendo.
            </p>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nombre del Proyecto de Historial *
                </label>
                <input
                  type="text"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="Ej: Historial Sistema ERP, App Movil V2, Módulo Pagos..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Descripción o Propósito del Historial
                </label>
                <textarea
                  rows={3}
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Descripción de qué funcionalidades se registran en este proyecto de historial..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateProjectModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 bg-zinc-800 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProj}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition-colors cursor-pointer"
                >
                  {isCreatingProj ? "Creando..." : "Crear Proyecto de Historial"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Nuevo Cambio Aprobado */}
      {showAddChangeModal && activeProject && (
        <div className="fixed inset-0 z-[9999] bg-zinc-950/80 backdrop-blur-md flex items-start justify-center p-4 pt-12 sm:pt-16 overflow-y-auto animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Registrar Cambio Aprobado en '{activeProject.name}'</span>
            </h3>

            <form onSubmit={handleAddChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Funcionalidad Construida y Aprobada *
                </label>
                <input
                  type="text"
                  value={changeTitle}
                  onChange={(e) => setChangeTitle(e.target.value)}
                  placeholder="Ej: Módulo de Autenticación con Google, Slider de Productos..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Explicación Técnica / Detalles del Trabajo Aprobado
                </label>
                <textarea
                  rows={3}
                  value={changeDetails}
                  onChange={(e) => setChangeDetails(e.target.value)}
                  placeholder="Describe los cambios específicos realizados por la IA y aprobados por el humano..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  URL de Vista / Demostración (Opcional)
                </label>
                <input
                  type="text"
                  value={changeWorkUrl}
                  onChange={(e) => setChangeWorkUrl(e.target.value)}
                  placeholder="https://staging.app.com/preview"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddChangeModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 bg-zinc-800 rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAddingChange}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition-colors cursor-pointer"
                >
                  {isAddingChange ? "Guardando..." : "Guardar Funcionalidad Aprobada"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
