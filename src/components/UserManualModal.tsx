import React, { useState } from "react";
import { 
  BookOpen, Search, X, Shield, Cpu, Database, 
  GitBranch, CheckCircle2, Cloud, Key, Keyboard, ChevronRight,
  AlertTriangle, Terminal, Layers
} from "lucide-react";

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApiKey?: () => void;
  onOpenCloudflare?: () => void;
  onOpenGatekeeper?: () => void;
}

export const UserManualModal: React.FC<UserManualModalProps> = ({
  isOpen,
  onClose,
  onOpenApiKey,
  onOpenCloudflare,
  onOpenGatekeeper
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTabId, setActiveTabId] = useState("hitl-agentos");

  if (!isOpen) return null;

  const sections = [
    {
      id: "hitl-agentos",
      category: "1. Paradigma Fundamental",
      title: "¿Qué es AgentOS Supervisor & HITL?",
      icon: <Cpu className="w-4 h-4 text-emerald-400" />,
      content: (
        <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
          <div className="p-3.5 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Filosofía Human-in-the-Loop (HITL)
            </h3>
            <p>
              <strong className="text-zinc-100">AgentOS Supervisor</strong> es un entorno de escritorio profesional para la orquestación y control estricto de <strong className="text-emerald-400">agentes de software autónomos</strong>. Su principio rector es el paradigma <strong className="text-zinc-100">Human-in-the-Loop (HITL)</strong>: la IA propone código, planes y componentes, pero <em>ningún cambio se consolida</em> en el repositorio o en la memoria técnica sin la revisión y aprobación explícita de un supervisor humano.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
            <div className="p-3 rounded bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-emerald-400 font-bold block">1. Propuesta de Tareas</span>
              <p className="text-zinc-400">El agente genera planes estructurados derivados de un Blueprint específico del dominio.</p>
            </div>
            <div className="p-3 rounded bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-amber-400 font-bold block">2. Sandbox & TDD</span>
              <p className="text-zinc-400">Las pruebas unitarias y linter AST se ejecutan de forma aislada antes de solicitar revisión.</p>
            </div>
            <div className="p-3 rounded bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-blue-400 font-bold block">3. Aprobación o Rechazo</span>
              <p className="text-zinc-400">El supervisor humano aprueba, solicita cambios o revierte con un solo clic.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "rag-memory",
      category: "2. Memoria & Inmutabilidad",
      title: "Memoria RAG de Doble Capa & Lockfile",
      icon: <Database className="w-4 h-4 text-purple-400" />,
      content: (
        <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
          <p>
            El sistema implementa una arquitectura de memoria dual diseñada específicamente para optimizar la calidad de respuesta del LLM y evitar alucinaciones:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 rounded bg-zinc-900 border border-amber-900/60 space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-amber-300">Lockfile: historial.md (Inmutable)</h4>
              </div>
              <p className="text-zinc-400">
                Almacena el registro cronológico estricto de requerimientos aprobados. Tiene regla de oro de inmutabilidad: el agente puede leerlo como verdad absoluta, pero nunca puede sobrescribir ni modificar entradas pasadas.
              </p>
            </div>

            <div className="p-3 rounded bg-zinc-900 border border-purple-900/60 space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h4 className="font-bold text-purple-300">RAG Vectorial (STM + LTM)</h4>
              </div>
              <p className="text-zinc-400">
                Segmentación inteligente: Memoria a Corto Plazo (STM) para la tarea en ejecución y Memoria a Largo Plazo (LTM) indexada vectorialmente para recuperar decisiones arquitectónicas históricas.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "audit-rollbacks",
      category: "3. Trazabilidad & Git",
      title: "Registro de Auditoría & Rollbacks",
      icon: <GitBranch className="w-4 h-4 text-blue-400" />,
      content: (
        <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
          <p>
            Cada ciclo de ejecución agéntico genera una firma criptográfica inmutable con diff visual de código, métricas de tokens y verificación linter:
          </p>
          <div className="space-y-2.5 text-[11px]">
            <div className="p-3 rounded bg-zinc-900 border border-zinc-800 space-y-1">
              <h4 className="font-semibold text-emerald-400">Diff Viewer Unificado</h4>
              <p className="text-zinc-400">Permite inspeccionar línea por línea qué archivos modificó la IA antes de confirmar cambios en la rama principal.</p>
            </div>
            <div className="p-3 rounded bg-zinc-900 border border-zinc-800 space-y-1">
              <h4 className="font-semibold text-rose-400">Rollback Inmediato (Git Revert)</h4>
              <p className="text-zinc-400">Si un ciclo introduce una regresión, el botón de Rollback restaura el estado anterior preservando el grafo completo de auditoría.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "dod-safety",
      category: "4. Calidad & Estándares",
      title: "Definition of Done (DoD) & Freno de Emergencia",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      content: (
        <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
          <p>
            Para que una tarea se considere completada por el agente, debe satisfacer los criterios de aceptación deterministas:
          </p>
          <div className="p-3 rounded bg-zinc-900 border border-zinc-800 space-y-2 text-[11px]">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Criterios Obligatorios de DoD:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-zinc-400">
              <li>Pruebas unitarias TDD ejecutadas con éxito (0 fallos).</li>
              <li>Validación estática de sintaxis y arquitectura con linter AST estricto.</li>
              <li>Generación de Walkthrough técnico con decisiones arquitectónicas.</li>
              <li>Límite de 5 intentos automáticos antes de activar el <strong className="text-rose-400">Freno de Emergencia</strong>.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "security-edge",
      category: "5. Seguridad & Cloud",
      title: "ARQAI Gatekeeper & Cloudflare Edge",
      icon: <Cloud className="w-4 h-4 text-orange-400" />,
      content: (
        <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
          <p>
            Infraestructura Edge Native distribuida sin servidor, cero latencia y alta concurrencia:
          </p>
          <div className="space-y-3 text-[11px]">
            <div className="p-3 rounded bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  ARQAI Gatekeeper & Kill Switch
                </h4>
                {onOpenGatekeeper && (
                  <button
                    onClick={onOpenGatekeeper}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] border border-zinc-700 cursor-pointer"
                  >
                    Abrir Gatekeeper
                  </button>
                )}
              </div>
              <p className="text-zinc-400">
                Monitorea en tiempo real el consumo de tokens, llamadas a la API y cuenta con un <strong className="text-zinc-200">Kill Switch de Emergencia</strong> para detener instantáneamente cualquier agente descontrolado.
              </p>
            </div>

            <div className="p-3 rounded bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-orange-400 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4" />
                  Ecosistema Cloudflare Edge Native
                </h4>
                {onOpenCloudflare && (
                  <button
                    onClick={onOpenCloudflare}
                    className="px-2 py-0.5 rounded bg-orange-950/60 hover:bg-orange-900 text-orange-300 text-[10px] border border-orange-800/80 cursor-pointer"
                  >
                    Abrir Cloudflare
                  </button>
                )}
              </div>
              <p className="text-zinc-400">
                Sincronización con servicios de borde: <strong className="text-zinc-200">Cloudflare Pages Functions</strong> (cálculo serverless), <strong className="text-zinc-200">D1</strong> (SQL relacional SQLite), <strong className="text-zinc-200">Vectorize</strong> (base vectorial distribuida) y <strong className="text-zinc-200">SSE</strong> (Streaming en tiempo real).
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "shortcuts",
      category: "6. Referencia Rápida",
      title: "Atajos de Teclado & API Keys",
      icon: <Keyboard className="w-4 h-4 text-emerald-400" />,
      content: (
        <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2">
            <h4 className="font-bold text-white">Atajos de Teclado Globales:</h4>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between p-1.5 rounded bg-zinc-950 border border-zinc-800/80">
                <span className="text-zinc-300">Ejecutar Bucle Agéntico</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700 font-bold">F5</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-zinc-950 border border-zinc-800/80">
                <span className="text-zinc-300">Nuevo Proyecto / Historial</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold">Ctrl + N</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-zinc-950 border border-zinc-800/80">
                <span className="text-zinc-300">Limpiar Memoria a Corto Plazo (STM)</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700 font-bold">Ctrl + K</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded bg-zinc-900 border border-zinc-800 space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                API Keys & Onboarding de Agentes
              </h4>
              {onOpenApiKey && (
                <button
                  onClick={onOpenApiKey}
                  className="px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900 text-amber-300 text-[10px] border border-amber-800/80 cursor-pointer"
                >
                  Ver API Keys
                </button>
              )}
            </div>
            <p className="text-zinc-400">
              Conecta scripts externos de IA (Antigravity, Codex, Hermes, Claude) proveyendo la URL base <code className="text-emerald-400">https://arqaistudio.pages.dev/api</code> y cabeceras <code className="text-amber-300">x-api-key</code>.
            </p>
          </div>
        </div>
      )
    }
  ];

  const filteredSections = sections.filter(
    s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
         s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSection = sections.find(s => s.id === activeTabId) || sections[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#0e1117] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-4xl h-[88vh] max-h-[750px] flex flex-col overflow-hidden text-zinc-200">
        
        {/* Modal Header */}
        <div className="px-4 py-3 bg-[#16191f] border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Manual de Usuario & Especificaciones AgentOS
                <span className="text-[10px] font-mono font-normal px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  v2.4
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Guía completa de arquitectura, supervisión HITL, memoria RAG y especificaciones agénticas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two column layout */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* Left Navigation Bar */}
          <div className="w-full md:w-72 bg-[#12151b] border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col shrink-0">
            <div className="p-3 border-b border-zinc-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar en el manual..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#090b0e] border border-zinc-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredSections.map((section) => {
                const isActive = activeTabId === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveTabId(section.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-md text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isActive
                        ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 font-medium"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {section.icon}
                      <span className="truncate">{section.title}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-emerald-400" />}
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t border-zinc-800 bg-[#090b0e]/60 text-[11px] space-y-1 text-zinc-400">
              <div className="flex items-center justify-between">
                <span>Versión:</span>
                <span className="font-mono text-zinc-300">2.4.0 (Autonomous)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Plataforma:</span>
                <span className="font-mono text-emerald-400">Cloudflare D1 + Pages</span>
              </div>
            </div>
          </div>

          {/* Right Content Panel */}
          <div className="flex-1 bg-[#090b0e] overflow-y-auto p-4 sm:p-6 flex flex-col">
            <div className="pb-3 mb-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block mb-0.5">
                  {activeSection.category}
                </span>
                <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  {activeSection.icon}
                  {activeSection.title}
                </h1>
              </div>
            </div>

            <div className="flex-1">
              {activeSection.content}
            </div>

            <div className="pt-4 mt-6 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-500">
              <span>AgentOS HITL Supervisor Documentation</span>
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs border border-zinc-700 cursor-pointer"
              >
                Cerrar Manual
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
