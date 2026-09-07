import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  BrainCircuit,
  X,
  Plus,
  Trash2,
  Save,
  Check,
  FileCode,
  ShieldAlert,
  Layers,
  Sparkles,
  Bot,
  Package,
  Copy,
} from "lucide-react";
import { TaskItem, TaskContextMemory } from "../types";

interface ContextMemoryModalProps {
  task: TaskItem | null;
  isOpen?: boolean;
  onClose: () => void;
  onSaveContextMemory?: (
    taskId: string,
    memory: TaskContextMemory
  ) => Promise<void>;
  onSaveContext?: (
    taskId: string,
    memory: TaskContextMemory
  ) => Promise<void>;
}

export const ContextMemoryModal: React.FC<ContextMemoryModalProps> = ({
  task,
  isOpen = true,
  onClose,
  onSaveContextMemory,
  onSaveContext,
}) => {
  const [techReqs, setTechReqs] = useState<string[]>([]);
  const [affectedFiles, setAffectedFiles] = useState<string[]>([]);
  const [rules, setRules] = useState<string[]>([]);
  const [deps, setDeps] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");

  const [newReq, setNewReq] = useState("");
  const [newFile, setNewFile] = useState("");
  const [newRule, setNewRule] = useState("");
  const [newDep, setNewDep] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (task && task.contextMemory) {
      setTechReqs(task.contextMemory.technicalRequirements || []);
      setAffectedFiles(task.contextMemory.affectedFiles || []);
      setRules(task.contextMemory.rulesConstraints || []);
      setDeps(task.contextMemory.dependencies || []);
      setNotes(task.contextMemory.notes || "");
    } else {
      setTechReqs([]);
      setAffectedFiles([]);
      setRules([]);
      setDeps([]);
      setNotes("");
    }
  }, [task]);

  if (!task || (isOpen === false)) return null;

  const saveFn = onSaveContextMemory || onSaveContext;

  const handleSave = async () => {
    if (!saveFn || !task) return;
    try {
      setIsSaving(true);
      await saveFn(task.id, {
        technicalRequirements: techReqs,
        affectedFiles,
        rulesConstraints: rules,
        dependencies: deps,
        notes,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    val: string,
    setVal: (v: string) => void
  ) => {
    if (!val.trim()) return;
    if (!list.includes(val.trim())) {
      setList([...list, val.trim()]);
    }
    setVal("");
  };

  const removeItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setList(list.filter((_, i) => i !== index));
  };

  const copyContextSummary = () => {
    const summary = [
      `🧠 MEMORIA DE CONTEXTO TÉCNICO - Tarea: "${task.title}"`,
      `Instrucción: ${task.instruction}`,
      techReqs.length > 0 ? `\n📌 Requerimientos:\n` + techReqs.map((r) => `- ${r}`).join("\n") : "",
      affectedFiles.length > 0 ? `\n📁 Archivos afectados:\n` + affectedFiles.map((f) => `- ${f}`).join("\n") : "",
      rules.length > 0 ? `\n⚠️ Reglas y restricciones:\n` + rules.map((ru) => `- ${ru}`).join("\n") : "",
      notes ? `\n📝 Notas:\n${notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-zinc-950/70 backdrop-blur-xs">
      <div className="bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col transition-colors">
        {/* Header */}
        <div className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800/60 border-b border-zinc-300 dark:border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-md bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-900 dark:text-white tracking-tight flex items-center space-x-1.5">
                <span>Memoria de Contexto Técnico</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Antigravity Memory
                </span>
              </h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 truncate max-w-md">
                Tarea: "{task.title}"
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={copyContextSummary}
              title="Copiar resumen"
              className="p-1 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors flex items-center space-x-1 text-xs font-semibold cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] text-emerald-600 font-bold">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="text-[10px] hidden sm:inline">Copiar</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body - COMPACTO SIN SCROLL (2 COLUMNAS) */}
        <div className="p-3 sm:p-4 space-y-2.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Columna Izquierda: Requerimientos & Archivos */}
            <div className="space-y-2.5">
              {/* Requerimientos Técnicos */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Layers className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>Requerimientos del Sistema:</span>
                  </span>
                  <span className="text-[9px] text-zinc-600 dark:text-zinc-400">({techReqs.length})</span>
                </label>
                <div className="flex space-x-1">
                  <input
                    type="text"
                    value={newReq}
                    onChange={(e) => setNewReq(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      addItem(techReqs, setTechReqs, newReq, setNewReq)
                    }
                    placeholder="Ej: Contraste WCAG AA, responsivo..."
                    className="flex-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-600 dark:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => addItem(techReqs, setTechReqs, newReq, setNewReq)}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-zinc-900 dark:text-white text-xs font-semibold rounded flex items-center space-x-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 max-h-14 overflow-hidden pt-0.5">
                  {techReqs.map((req, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-[10px] text-zinc-700 dark:text-zinc-300"
                    >
                      <span className="truncate max-w-[140px]">{req}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(techReqs, setTechReqs, idx)}
                        className="text-zinc-600 dark:text-zinc-400 hover:text-rose-500 cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  {techReqs.length === 0 && (
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 italic">Sin requerimientos</span>
                  )}
                </div>
              </div>

              {/* Archivos Afectados */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <FileCode className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>Archivos / Rutas Afectadas:</span>
                  </span>
                  <span className="text-[9px] text-zinc-600 dark:text-zinc-400">({affectedFiles.length})</span>
                </label>
                <div className="flex space-x-1">
                  <input
                    type="text"
                    value={newFile}
                    onChange={(e) => setNewFile(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      addItem(affectedFiles, setAffectedFiles, newFile, setNewFile)
                    }
                    placeholder="Ej: src/components/Navbar.tsx..."
                    className="flex-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-600 dark:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => addItem(affectedFiles, setAffectedFiles, newFile, setNewFile)}
                    className="px-2 py-1 bg-zinc-800 dark:bg-slate-700 hover:bg-slate-700 text-zinc-900 dark:text-white text-xs font-semibold rounded flex items-center space-x-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 max-h-14 overflow-hidden pt-0.5">
                  {affectedFiles.map((file, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded text-[10px] font-mono text-amber-800 dark:text-amber-300"
                    >
                      <span className="truncate max-w-[140px]">{file}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(affectedFiles, setAffectedFiles, idx)}
                        className="text-amber-400 hover:text-rose-500 cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  {affectedFiles.length === 0 && (
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 italic">Sin archivos asignados</span>
                  )}
                </div>
              </div>
            </div>

            {/* Columna Derecha: Reglas & Dependencias */}
            <div className="space-y-2.5">
              {/* Reglas & Limitaciones */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                    <span>Reglas y Restricciones:</span>
                  </span>
                  <span className="text-[9px] text-zinc-600 dark:text-zinc-400">({rules.length})</span>
                </label>
                <div className="flex space-x-1">
                  <input
                    type="text"
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      addItem(rules, setRules, newRule, setNewRule)
                    }
                    placeholder="Ej: No modificar server.ts..."
                    className="flex-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-600 dark:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => addItem(rules, setRules, newRule, setNewRule)}
                    className="px-2 py-1 bg-zinc-800 dark:bg-slate-700 hover:bg-slate-700 text-zinc-900 dark:text-white text-xs font-semibold rounded flex items-center space-x-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 max-h-14 overflow-hidden pt-0.5">
                  {rules.map((rule, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 rounded text-[10px] text-rose-800 dark:text-rose-300"
                    >
                      <span className="truncate max-w-[140px]">{rule}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(rules, setRules, idx)}
                        className="text-rose-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  {rules.length === 0 && (
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 italic">Sin reglas declaradas</span>
                  )}
                </div>
              </div>

              {/* Dependencias */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Package className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>Dependencias & Librerías:</span>
                  </span>
                  <span className="text-[9px] text-zinc-600 dark:text-zinc-400">({deps.length})</span>
                </label>
                <div className="flex space-x-1">
                  <input
                    type="text"
                    value={newDep}
                    onChange={(e) => setNewDep(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      addItem(deps, setDeps, newDep, setNewDep)
                    }
                    placeholder="Ej: lucide-react, motion..."
                    className="flex-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-600 dark:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => addItem(deps, setDeps, newDep, setNewDep)}
                    className="px-2 py-1 bg-zinc-800 dark:bg-slate-700 hover:bg-slate-700 text-zinc-900 dark:text-white text-xs font-semibold rounded flex items-center space-x-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 max-h-14 overflow-hidden pt-0.5">
                  {deps.map((dep, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded text-[10px] font-mono text-indigo-800 dark:text-indigo-300"
                    >
                      <span className="truncate max-w-[140px]">{dep}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(deps, setDeps, idx)}
                        className="text-indigo-400 hover:text-rose-500 cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  {deps.length === 0 && (
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 italic">Sin dependencias</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notas Persistentes de Contexto */}
          <div className="space-y-1 pt-1">
            <label className="block text-[10px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center space-x-1">
              <Bot className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>Notas Persistentes para Antigravity:</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas clave para que Antigravity recuerde decisiones de arquitectura..."
              className="w-full px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-600 dark:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-tight resize-none font-mono"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800/60 border-t border-zinc-300 dark:border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer shadow-2xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-zinc-900 dark:text-white text-xs font-bold rounded transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3 h-3" />
            <span>{isSaving ? "Guardando..." : "Guardar Ficha"}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

