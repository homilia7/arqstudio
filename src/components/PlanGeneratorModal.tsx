import React, { useState } from "react";
import {
  Sparkles,
  X,
  Layers,
  ArrowRight,
  CheckCircle2,
  Bot,
  Lightbulb,
} from "lucide-react";
import { Project } from "../types";

interface PlanGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: Project | null;
  onGeneratePlan: (
    projectId: string,
    projectIdeaPrompt: string
  ) => Promise<void>;
}

export const PlanGeneratorModal: React.FC<PlanGeneratorModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  onGeneratePlan,
}) => {
  const [promptText, setPromptText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;

    try {
      setIsGenerating(true);
      await onGeneratePlan(
        activeProject ? activeProject.id : "proj-default",
        promptText.trim()
      );
      setPromptText("");
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-2 sm:p-4 pt-2 sm:pt-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col transition-colors my-0">
        {/* Header */}
        <div className="px-4 py-3.5 bg-slate-50/80 dark:bg-slate-950/70 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
                <span>Generador Inteligente de Blueprint & Plan de Trabajo</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  IA Architecture
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Genera un Blueprint estructurado y un plan de módulos específicos del dominio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleGenerate} className="p-4 sm:p-5 space-y-4">
          <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 rounded-lg space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">
              <Lightbulb className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Flujo de Generación de Blueprint y Plan de Trabajo</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Escribe la idea de tu proyecto. El agente sintetizará automáticamente el <strong>Blueprint completo</strong> (Prompt Maestro, Pantallas, Funciones, Conexiones) y generará el <strong>Plan de Trabajo técnico</strong>:
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300 pt-1 font-medium">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Blueprint Estructurado (PUT /api/.../blueprint)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Módulos Específicos del Dominio</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Etapas y Tareas Accionables</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Memoria Técnica por Tarea</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Describe la idea general de tu proyecto:
            </label>
            <textarea
              rows={4}
              required
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Ejemplo: Crear una aplicación web de reservas para servicios. Los clientes deben poder consultar disponibilidad, elegir servicio, seleccionar fecha y hora, confirmar una reserva y modificar o cancelar citas. Los administradores deben poder gestionar servicios, horarios, recursos, clientes, reservas, bloqueos de agenda y reportes básicos."
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isGenerating || !promptText.trim()}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded transition-colors shadow-sm flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Bot className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Desglosando Módulos...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Desglosar Proyecto en Módulos</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
