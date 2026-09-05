import React, { useState } from "react";
import { FolderPlus, X, Sparkles, Globe } from "lucide-react";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (data: { name: string; description?: string; mainUrl?: string }) => Promise<void>;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mainUrl, setMainUrl] = useState("https://arqaistudio.pages.dev");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del proyecto es obligatorio.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreateProject({
        name: name.trim(),
        description: description.trim() || undefined,
        mainUrl: mainUrl.trim() || "https://arqaistudio.pages.dev",
      });
      setName("");
      setDescription("");
      setMainUrl("https://arqaistudio.pages.dev");
      onClose();
    } catch (err: any) {
      setError(err?.message || "Error al crear el proyecto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100 transition-colors">
        {/* Cabecera del Modal */}
        <div className="h-12 bg-zinc-200/90 dark:bg-zinc-950 px-4 flex items-center justify-between border-b border-zinc-300 dark:border-zinc-800">
          <div className="flex items-center gap-2 font-bold text-xs">
            <div className="w-6 h-6 rounded bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <FolderPlus className="w-3.5 h-3.5" />
            </div>
            <span>Crear Nuevo Proyecto</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-300 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
              Nombre del Proyecto <span className="text-emerald-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. QCHATT, PLATAFORMA IA, AGENTOS..."
              className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-medium"
              autoFocus
            />
          </div>

          {/* URL Web */}
          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
              URL Principal del Proyecto (Live Preview)
            </label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="url"
                value={mainUrl}
                onChange={(e) => setMainUrl(e.target.value)}
                placeholder="https://tu-proyecto.pages.dev"
                className="w-full pl-8 pr-3 py-2 bg-zinc-200 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-semibold mb-1">
              Idea Base / Descripción del Proyecto
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Breve descripción o requerimientos generales del producto..."
              className="w-full px-3 py-2 bg-zinc-200 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Footer de Acciones */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-300 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-300 dark:bg-zinc-800 hover:bg-zinc-400 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Creando..." : "Crear Proyecto"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
