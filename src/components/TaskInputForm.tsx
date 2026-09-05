import React, { useState } from "react";
import {
  Send,
  Sparkles,
  Bot,
  Link,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { Project } from "../types";

interface TaskInputFormProps {
  activeProject: Project | null;
  onAddTask: (data: {
    projectId: string;
    title?: string;
    instruction: string;
    workUrl?: string;
    assignedAgent?: string;
  }) => Promise<void>;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || !activeProject) return;

    try {
      setIsSubmitting(true);
      await onAddTask({
        projectId: activeProject.id,
        title: title.trim() || undefined,
        instruction: instruction.trim(),
        workUrl: workUrl.trim() || activeProject.mainUrl || undefined,
        assignedAgent: agentName,
      });

      // Limpiar formulario
      setInstruction("");
      setTitle("");
      setWorkUrl("");
      setShowAdvanced(false);
    } catch (err) {
      console.error("Error al agregar tarea:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickTemplates = [
    "Crear botón de inicio de sesión con Google y diseño responsivo",
    "Optimizar SEO, meta tags y velocidad de carga de la web",
    "Corregir error de responsive en vista móvil para la tabla de datos",
    "Integrar pasarela de pago con confirmación vía webhook",
  ];

  return (
    <div className="bg-slate-100/90 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 rounded-lg shadow-sm p-4 sm:p-5 relative overflow-hidden transition-colors">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Instrucción para la IA (Antigravity)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Escribe o pega lo que la IA debe ejecutar, modificar o crear en la web
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenApiDocs}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium hover:underline flex items-center space-x-1 cursor-pointer"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Ver cómo la IA se conecta vía API</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Input de la Instrucción */}
        <div>
          <textarea
            id="instruction-input"
            rows={3}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Ejemplo: 'Crea una sección de testimonios de clientes con slider automático y asegúrate de que funcione en móviles. Al terminar, déjame la URL de preview para verificarla...'"
            className="w-full bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-slate-100 dark:focus:bg-slate-800 transition-all resize-y font-mono"
            required
          />
        </div>

        {/* Plantillas rápidas */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs text-slate-500 scrollbar-none">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
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
              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded whitespace-nowrap border border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors text-[11px] cursor-pointer"
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
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center space-x-1 font-medium transition-colors cursor-pointer"
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700">
            {/* Título opcional */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <FileText className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>Título Corto</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Fix Navbar móvil"
                className="w-full bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* URL Específica */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <Link className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>URL Específica de Trabajo</span>
              </label>
              <input
                type="text"
                value={workUrl}
                onChange={(e) => setWorkUrl(e.target.value)}
                placeholder={activeProject?.mainUrl || "https://..."}
                className="w-full bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Agente */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <Bot className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>Agente Asignado</span>
              </label>
              <select
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 text-center sm:text-left">
            La tarea se agregará a la lista y estará disponible inmediatamente para Antigravity vía API.
          </span>
          <button
            type="submit"
            disabled={isSubmitting || !instruction.trim()}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "Enviando..." : "Asignar Instrucción a la IA"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
