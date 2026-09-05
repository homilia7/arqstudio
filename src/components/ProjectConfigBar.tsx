import React, { useState, useEffect } from "react";
import {
  FolderGit2,
  Globe,
  ExternalLink,
  Save,
  Check,
  KeyRound,
  Copy,
  Plus,
  Sparkles,
  Trash2,
  AlertTriangle,
  Code2,
  FolderPlus,
  Database,
  History,
  GitFork,
  BarChart3,
} from "lucide-react";
import { Project, TaskItem } from "../types";

interface ProjectConfigBarProps {
  projects: Project[];
  activeProject: Project | null;
  tasks?: TaskItem[];
  currentUser?: { accessType?: string; name?: string } | null;
  onSelectProject: (project: Project) => void;
  onUpdateProject: (
    id: string,
    data: { name?: string; mainUrl?: string; description?: string }
  ) => Promise<void>;
  onCreateProject: (
    name: string,
    mainUrl: string,
    description?: string,
    autoGenerateBlueprint?: boolean
  ) => Promise<void>;
  onCloneProject?: (id: string) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onDeleteAllProjects?: () => Promise<void>;
  onLoadSampleTemplate?: () => Promise<void>;
  onOpenManualArchitecture?: () => void;
  onOpenAutoArchitecture?: () => void;
  onOpenChangelog?: () => void;
}

export const ProjectConfigBar: React.FC<ProjectConfigBarProps> = ({
  projects,
  activeProject,
  tasks = [],
  currentUser,
  onSelectProject,
  onUpdateProject,
  onCreateProject,
  onCloneProject,
  onDeleteProject,
  onDeleteAllProjects,
  onLoadSampleTemplate,
  onOpenManualArchitecture,
  onOpenAutoArchitecture,
  onOpenChangelog,
}) => {
  const [name, setName] = useState(activeProject?.name || "");
  const [mainUrl, setMainUrl] = useState(activeProject?.mainUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const isAdmin = currentUser?.accessType === "admin" || currentUser?.name === "Super Admin" || currentUser?.name === "ADMIN";

  const activeProjectTasks = activeProject ? tasks.filter((t) => t.projectId === activeProject.id) : [];
  const totalTasks = activeProjectTasks.length;
  const verifiedTasks = activeProjectTasks.filter((t) => t.status === "verified" || t.locked).length;
  const completionPercentage = totalTasks > 0 ? Math.round((verifiedTasks / totalTasks) * 100) : 0;
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjUrl, setNewProjUrl] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [autoGenBlueprint, setAutoGenBlueprint] = useState(false);

  useEffect(() => {
    if (activeProject) {
      setName(activeProject.name);
      setMainUrl(activeProject.mainUrl);
    } else {
      setName("");
      setMainUrl("");
    }
  }, [activeProject]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !name.trim()) return;

    try {
      setIsSaving(true);
      await onUpdateProject(activeProject.id, {
        name: name.trim(),
        mainUrl: mainUrl.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyApiKey = () => {
    if (!activeProject) return;
    navigator.clipboard.writeText(activeProject.apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyBoth = () => {
    if (!activeProject) return;
    const originUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const text = `Base URL: ${originUrl}\nAPI Key: ${activeProject.apiKey}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    await onCreateProject(
      newProjName.trim(),
      newProjUrl.trim() || "http://localhost:3000",
      newProjDesc.trim(),
      autoGenBlueprint
    );
    setNewProjName("");
    setNewProjUrl("");
    setNewProjDesc("");
    setAutoGenBlueprint(false);
    setShowNewModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!activeProject) return;
    try {
      setIsDeleting(true);
      await onDeleteProject(activeProject.id);
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Error al eliminar proyecto:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDeleteAll = async () => {
    if (!onDeleteAllProjects) return;
    try {
      setIsDeletingAll(true);
      await onDeleteAllProjects();
      setShowDeleteAllModal(false);
    } catch (err) {
      console.error("Error al eliminar todos los proyectos:", err);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleLoadTemplateClick = async () => {
    if (!onLoadSampleTemplate) return;
    try {
      setIsLoadingTemplate(true);
      await onLoadSampleTemplate();
    } catch (err) {
      console.error("Error al cargar plantilla:", err);
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  // ESTADO: CUANDO NO HAY PROYECTO ACTIVO (0 PROYECTOS)
  if (!activeProject) {
    return (
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-900/50 shadow-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping"></div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                ¡Bienvenido a ARQAI Hub! Sin proyectos creados
              </h3>
              <p className="text-xs text-slate-300">
                Haz clic en el botón animado para registrar tu primer proyecto y conectar tu Agente de IA.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">


            {/* BOTÓN DE NUEVO PROYECTO CON ANIMACIÓN DE COLORES PARPADEANTE */}
            <button
              onClick={() => setShowNewModal(true)}
              className="text-xs sm:text-sm text-white font-black inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 rounded-xl shadow-lg shadow-purple-500/40 animate-pulse ring-4 ring-purple-400/50 transition-all transform hover:scale-105 cursor-pointer uppercase tracking-wider"
            >
              <FolderPlus className="w-4.5 h-4.5 text-white animate-bounce" />
              <span>+ Nuevo Proyecto</span>
            </button>
          </div>
        </div>

        {/* Modal Nuevo Proyecto */}
        {showNewModal && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-start justify-center p-4 pt-14 sm:pt-20 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl shrink-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Crear Nuevo Proyecto</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Configura un nuevo espacio para que Antigravity trabaje y reporte sus cambios.
              </p>
              <form onSubmit={handleCreateNew} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nombre del Proyecto *
                  </label>
                  <input
                    type="text"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    placeholder="Ej: App de Reservas para Servicios, CRM Portal..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Idea Base / Descripción del Proyecto</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">Recomendado para IA</span>
                  </label>
                  <textarea
                    rows={3}
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    placeholder="Ej: Aplicación de reservas para servicios. Los clientes eligen servicio, fecha y hora disponible y confirman. El admin gestiona horarios, bloqueos y citas..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    URL Principal del Proyecto
                  </label>
                  <input
                    type="text"
                    value={newProjUrl}
                    onChange={(e) => setNewProjUrl(e.target.value)}
                    placeholder="http://localhost:3000 o https://staging.myshop.ai/admin"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-900 dark:text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>

                <div className="p-2.5 bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 rounded-lg flex items-center space-x-2.5 cursor-pointer" onClick={() => setAutoGenBlueprint(!autoGenBlueprint)}>
                  <input
                    type="checkbox"
                    id="autoGenBlueprint1"
                    checked={autoGenBlueprint}
                    onChange={(e) => setAutoGenBlueprint(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="autoGenBlueprint1" className="text-xs text-indigo-900 dark:text-indigo-200 font-medium cursor-pointer select-none">
                    Generar automáticamente <strong>Blueprint</strong> y <strong>Plan de Trabajo estructurado</strong>
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-sm transition-colors cursor-pointer flex items-center space-x-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Crear Proyecto</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  const hasUnsavedChanges =
    name !== activeProject.name || mainUrl !== activeProject.mainUrl;

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 text-slate-200 text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 space-y-1.5">
        {/* FILA 1: TOOLBAR MINIMALISTA UNIFICADO ("BOTONES SOLO DE LETRAS EN PEQUEÑO") */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-[11.5px]">
          {/* Selector y Acciones en Texto */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center space-x-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                PROYECTO:
              </span>
              <select
                value={activeProject.id}
                onChange={(e) => {
                  const found = projects.find((p) => p.id === e.target.value);
                  if (found) onSelectProject(found);
                }}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer max-w-[180px] sm:max-w-xs truncate border-b border-slate-700 hover:border-indigo-400 py-0.5"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowNewModal(true)}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center space-x-1 cursor-pointer py-0.5 px-1 rounded hover:bg-slate-800"
            >
              <Plus className="w-3 h-3" />
              <span>+ Nuevo</span>
            </button>

            {onCloneProject && activeProject && (
              <button
                onClick={async () => {
                  try {
                    setIsCloning(true);
                    await onCloneProject(activeProject.id);
                  } finally {
                    setIsCloning(false);
                  }
                }}
                disabled={isCloning}
                title="Clonar este proyecto"
                className="text-xs font-semibold text-slate-300 hover:text-indigo-400 transition-colors flex items-center space-x-1 cursor-pointer py-0.5 px-1 rounded hover:bg-slate-800"
              >
                <GitFork className="w-3 h-3 text-indigo-400" />
                <span>{isCloning ? "Clonando..." : "Clonar"}</span>
              </button>
            )}

            {onOpenAutoArchitecture && (
              <button
                id="btn-auto-architecture-antigravity"
                onClick={onOpenAutoArchitecture}
                title="Generar arquitectura automática con IA"
                className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center space-x-1 cursor-pointer py-0.5 px-1 rounded hover:bg-slate-800"
              >
                <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                <span>Auto AI</span>
              </button>
            )}
          </div>

          {/* Avance Compacto */}
          <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-300">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Avance: {completionPercentage}%</span>
            <span className="text-[10px] text-slate-400 font-normal">({verifiedTasks}/{totalTasks})</span>
            <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden shrink-0">
              <div
                className="bg-emerald-400 h-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* API Key & Borrado Solo Texto */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-400">
              <KeyRound className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>Key:</span>
              <span className="text-slate-200 font-medium">
                {activeProject.apiKey.substring(0, 10)}...
              </span>
              <button
                onClick={handleCopyBoth}
                title="Copiar Base URL + API Key juntas"
                className="text-indigo-400 hover:text-indigo-300 font-sans font-semibold transition-colors flex items-center space-x-1 cursor-pointer ml-1 text-[11px]"
              >
                {copiedKey ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copiadas!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar URL + Key</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => setShowDeleteModal(true)}
              title="Eliminar este proyecto"
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center space-x-1 cursor-pointer py-0.5 px-1 rounded hover:bg-rose-950/40"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>Eliminar</span>
            </button>

            {onDeleteAllProjects && projects.length > 0 && (
              <button
                onClick={() => setShowDeleteAllModal(true)}
                title="Borrar TODOS los proyectos"
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center space-x-1 cursor-pointer py-0.5 px-1 rounded hover:bg-rose-950/40"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Borrar Todos ({projects.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* FILA 2: METADATOS SLIM INLINE (NOMBRE & URL WEB) */}
        <form
          onSubmit={handleSave}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-1 border-t border-slate-800/60 text-[11px]"
        >
          <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 min-w-[280px]">
            {/* Input Nombre */}
            <div className="flex items-center space-x-1.5 flex-1 min-w-[180px]">
              <span className="font-bold text-slate-400 shrink-0">Nombre:</span>
              <input
                type="text"
                id="project-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del proyecto..."
                className="w-full bg-slate-950/60 border border-slate-800 rounded px-2 py-0.5 text-xs text-white font-medium focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {/* Input URL Web */}
            <div className="flex items-center space-x-1.5 flex-1 min-w-[220px]">
              <span className="font-bold text-slate-400 shrink-0">URL Web:</span>
              <div className="relative w-full">
                <input
                  type="text"
                  id="project-url-input"
                  value={mainUrl}
                  onChange={(e) => setMainUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950/60 border border-slate-800 rounded px-2 pr-6 py-0.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                {mainUrl && (
                  <a
                    href={mainUrl.startsWith("http") ? mainUrl : `https://${mainUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-400 transition-colors"
                    title="Abrir URL Web"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Botón Guardar Solo Texto */}
          <button
            type="submit"
            disabled={isSaving || !hasUnsavedChanges}
            className={`text-xs font-bold transition-colors cursor-pointer py-0.5 px-2 rounded flex items-center space-x-1 ${
              savedSuccess
                ? "text-emerald-400"
                : hasUnsavedChanges
                ? "text-indigo-400 hover:text-indigo-300"
                : "text-slate-500 cursor-not-allowed"
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>¡Guardado!</span>
              </>
            ) : isSaving ? (
              <span>Guardando...</span>
            ) : (
              <>
                <Save className="w-3 h-3" />
                <span>{hasUnsavedChanges ? "Guardar" : "Sincronizado"}</span>
              </>
            )}
          </button>
        </form>

        {/* Modal Nuevo Proyecto */}
      {showNewModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-start justify-center p-4 pt-12 sm:pt-16 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl shrink-0 my-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Crear Nuevo Proyecto</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Configura un nuevo espacio para que Antigravity trabaje y reporte sus cambios.
            </p>
            <form onSubmit={handleCreateNew} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre del Proyecto *
                </label>
                <input
                  type="text"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="Ej: App de Reservas para Servicios, CRM Portal..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Idea Base / Descripción del Proyecto</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">Recomendado para IA</span>
                </label>
                <textarea
                  rows={3}
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Ej: Aplicación de reservas para servicios. Los clientes eligen servicio, fecha y hora disponible y confirman. El admin gestiona horarios, bloqueos y citas..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  URL Principal del Proyecto
                </label>
                <input
                  type="text"
                  value={newProjUrl}
                  onChange={(e) => setNewProjUrl(e.target.value)}
                  placeholder="http://localhost:3000 o https://staging.myshop.ai/admin"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-900 dark:text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div className="p-2.5 bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 rounded-lg flex items-center space-x-2.5 cursor-pointer" onClick={() => setAutoGenBlueprint(!autoGenBlueprint)}>
                <input
                  type="checkbox"
                  id="autoGenBlueprint2"
                  checked={autoGenBlueprint}
                  onChange={(e) => setAutoGenBlueprint(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="autoGenBlueprint2" className="text-xs text-indigo-900 dark:text-indigo-200 font-medium cursor-pointer select-none">
                  Generar automáticamente <strong>Blueprint</strong> y <strong>Plan de Trabajo estructurado</strong>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-sm transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Crear Proyecto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Borrado de Proyecto */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-start justify-center p-4 pt-14 sm:pt-20 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4 shrink-0">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  ¿Eliminar proyecto "{activeProject.name}"?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Estás a punto de eliminar este proyecto. Se borrarán de forma definitiva todos los <span className="font-semibold text-rose-600 dark:text-rose-400">módulos, etapas, tareas y registros de control de calidad</span> asociados.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded p-3 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-medium text-slate-800 dark:text-slate-200">
                ⚠️ Esta acción es permanente y no se puede deshacer.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded shadow-sm transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Eliminando..." : "Sí, Eliminar Proyecto"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Borrado de TODOS los Proyectos */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-start justify-center p-4 pt-14 sm:pt-20 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 shrink-0">
            <div className="flex items-start space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ¿Borrar TODOS los proyectos ({projects.length})?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Esta acción eliminará <span className="font-bold text-rose-600 dark:text-rose-400">todos los proyectos, módulos, etapas, tareas y registros de control de calidad</span>. El área de trabajo quedará completamente vacía.
                </p>
              </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg p-3 text-xs text-rose-800 dark:text-rose-300">
              <p className="font-semibold flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4 mr-1 shrink-0" />
                <span>Atención: Acción irreversible</span>
              </p>
              <p className="text-[11px] mt-1 text-rose-700 dark:text-rose-400">
                La plataforma quedará en estado inicial sin proyectos registrados.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={() => setShowDeleteAllModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={handleConfirmDeleteAll}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingAll ? "Borrando todo..." : "Sí, Borrar Todos los Proyectos"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
