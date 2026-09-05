import React, { useState } from "react";
import {
  Send,
  Sparkles,
  Bot,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Project } from "../types";

interface TaskInputFormProps {
  activeProject: Project | null;
  onAddTask: (
    title: string,
    instruction: string,
    assignedAgent?: string,
    branch?: string
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || !activeProject) return;

    try {
      setIsSubmitting(true);
      await onAddTask(
        title.trim() || instruction.trim().slice(0, 50),
        instruction.trim(),
        agentName,
        "main"
      );

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
    "Crear botón de inicio de sesión con PIN y diseño responsivo",
    "Optimizar SEO, meta tags y velocidad de carga de la web",
    "Corregir error de responsive en vista móvil para la tabla",
    "Integrar pasarela de pago con confirmación vía webhook",
  ];

  return (
    <div className="bg-zinc-200/90 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl shadow-sm p-4 sm:p-5 relative overflow-hidden transition-colors">
      <div className="flex items-center justify-between mb-3 border-b border-zinc-300 dark:border-zinc-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-300 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Instrucción para la IA (Antigravity)
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Escribe o pega lo que la IA debe ejecutar, modificar o crear en la web
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
        {/* Input de la Instrucción */}
        <div>
          <textarea
            id="instruction-input"
            rows={3}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Ejemplo: 'Crea una sección de testimonios de clientes con slider automático y asegúrate de que funcione en móviles. Al terminar, déjame la URL de preview para verificarla...'"
            className="w-full px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans leading-relaxed"
            required
          />
        </div>

        {/* Ejemplos Rápidos (Templates) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-zinc-500 mr-1">Ejemplos rápidos:</span>
          {quickTemplates.map((template, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInstruction(template)}
              className="text-[11px] bg-zinc-300/80 dark:bg-zinc-800 hover:bg-zinc-400 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 border border-zinc-400/60 dark:border-zinc-700/60 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              {template.slice(0, 30)}...
            </button>
          ))}
        </div>

        {/* Opciones Avanzadas */}
        <div className="pt-2 border-t border-zinc-300/80 dark:border-zinc-800/80">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center space-x-1 font-medium cursor-pointer"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>Añadir título específico, URL de rama o selector de Agente</span>
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 p-3 bg-zinc-100/90 dark:bg-zinc-950 rounded-lg border border-zinc-300 dark:border-zinc-800 animate-fadeIn">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Título Corto (Opcional):
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Integración Auth"
                  className="w-full px-2.5 py-1.5 bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  URL de Trabajo / Preview:
                </label>
                <input
                  type="url"
                  value={workUrl}
                  onChange={(e) => setWorkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-2.5 py-1.5 bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Agente Asignado:
                </label>
                <select
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="Antigravity AI">Antigravity AI (Lead)</option>
                  <option value="Gemini QA Agent">Gemini QA Agent</option>
                  <option value="Codex FullStack">Codex FullStack</option>
                  <option value="Hermes Swarm">Hermes Swarm</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer y Botón Enviar */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-zinc-500">
            La tarea se agregará a la lista y estará disponible inmediatamente para el agente vía API.
          </p>

          <button
            type="submit"
            disabled={isSubmitting || !instruction.trim() || !activeProject}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "Asignando..." : "Asignar Instrucción a la IA"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
