import React, { useState } from "react";
import { 
  BookOpen, Search, X, Shield, Cpu, Database, 
  GitBranch, CheckCircle2, Cloud, Key, Keyboard, ChevronRight,
  AlertTriangle, Terminal, Layers, Bot, Globe, ListChecks, Ban
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
      icon: <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      content: (
        <div className="space-y-4 text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed">
          <div className="p-3.5 rounded-lg bg-emerald-50/50 dark:bg-zinc-900/90 border border-emerald-200 dark:border-zinc-800 space-y-2 text-zinc-800 dark:text-zinc-300">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Filosofía Human-in-the-Loop (HITL)
            </h3>
            <p>
              <strong className="text-zinc-900 dark:text-zinc-100">AgentOS Supervisor</strong> es un entorno de escritorio profesional para la orquestación y control estricto de <strong className="text-emerald-700 dark:text-emerald-400">agentes de software autónomos</strong>. Su principio rector es el paradigma <strong className="text-zinc-900 dark:text-zinc-100">Human-in-the-Loop (HITL)</strong>: la IA propone código, planes y componentes, pero <em>ningún cambio se consolida</em> en el repositorio o en la memoria técnica sin la revisión y aprobación explícita de un supervisor humano.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
            <div className="p-3 rounded bg-emerald-50/40 dark:bg-zinc-900 border border-emerald-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 space-y-1">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold block">1. Propuesta de Tareas</span>
              <p className="text-zinc-600 dark:text-zinc-400">El agente genera planes estructurados derivados de un Blueprint específico del dominio.</p>
            </div>
            <div className="p-3 rounded bg-amber-50/40 dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 space-y-1">
              <span className="text-amber-700 dark:text-amber-400 font-bold block">2. Sandbox & TDD</span>
              <p className="text-zinc-600 dark:text-zinc-400">Las pruebas unitarias y linter AST se ejecutan de forma aislada antes de solicitar revisión.</p>
            </div>
            <div className="p-3 rounded bg-blue-50/40 dark:bg-zinc-900 border border-blue-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 space-y-1">
              <span className="text-blue-700 dark:text-blue-400 font-bold block">3. Aprobación o Rechazo</span>
              <p className="text-zinc-600 dark:text-zinc-400">El supervisor humano aprueba, solicita cambios o revierte con un solo clic.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "rag-memory",
      category: "2. Memoria & Inmutabilidad",
      title: "Memoria RAG de Doble Capa & Lockfile",
      icon: <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      content: (
        <div className="space-y-4 text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed">
          <p>
            El sistema implementa una arquitectura de memoria dual diseñada específicamente para optimizar la calidad de respuesta del LLM y evitar alucinaciones:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 rounded bg-amber-50/50 dark:bg-zinc-900 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-zinc-200 space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="font-bold text-amber-800 dark:text-amber-300">Lockfile: historial.md (Inmutable)</h4>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">
                Almacena el registro cronológico estricto de requerimientos aprobados. Tiene regla de oro de inmutabilidad: el agente puede leerlo como verdad absoluta, pero nunca puede sobrescribir ni modificar entradas pasadas.
              </p>
            </div>

            <div className="p-3 rounded bg-purple-50/50 dark:bg-zinc-900 border border-purple-200 dark:border-purple-900/60 text-purple-900 dark:text-zinc-200 space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="font-bold text-purple-800 dark:text-purple-300">RAG Vectorial (STM + LTM)</h4>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">
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
      icon: <GitBranch className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      content: (
        <div className="space-y-4 text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed">
          <p>
            Cada ciclo de ejecución agéntico genera una firma criptográfica inmutable con diff visual de código, métricas de tokens y verificación linter:
          </p>
          <div className="space-y-2.5 text-[11px]">
            <div className="p-3 rounded bg-emerald-50/40 dark:bg-zinc-900 border border-emerald-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 space-y-1">
              <h4 className="font-bold text-emerald-700 dark:text-emerald-400">Diff Viewer Unificado</h4>
              <p className="text-zinc-600 dark:text-zinc-400">Permite inspeccionar línea por línea qué archivos modificó la IA antes de confirmar cambios en la rama principal.</p>
            </div>
            <div className="p-3 rounded bg-rose-50/40 dark:bg-zinc-900 border border-rose-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 space-y-1">
              <h4 className="font-bold text-rose-700 dark:text-rose-400">Rollback Inmediato (Git Revert)</h4>
              <p className="text-zinc-600 dark:text-zinc-400">Si un ciclo introduce una regresión, el botón de Rollback restaura el estado anterior preservando el grafo completo de auditoría.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "dod-safety",
      category: "4. Calidad & Estándares",
      title: "Definition of Done (DoD) & Freno de Emergencia",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      content: (
        <div className="space-y-4 text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed">
          <p>
            Para que una tarea se considere completada por el agente, debe satisfacer los criterios de aceptación deterministas:
          </p>
          <div className="p-3.5 rounded-lg bg-emerald-50/40 dark:bg-zinc-900 border border-emerald-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 space-y-2 text-[11px]">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Criterios Obligatorios de DoD:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-zinc-700 dark:text-zinc-400">
              <li>Pruebas unitarias TDD ejecutadas con éxito (0 fallos).</li>
              <li>Validación estática de sintaxis y arquitectura con linter AST estricto.</li>
              <li>Generación de Walkthrough técnico con decisiones arquitectónicas.</li>
              <li>Límite de 5 intentos automáticos antes de activar el <strong className="text-rose-600 dark:text-rose-400">Freno de Emergencia</strong>.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "security-edge",
      category: "5. Seguridad & Cloud",
      title: "ARQAI Gatekeeper & Cloudflare Edge",
      icon: <Cloud className="w-4 h-4 text-orange-600 dark:text-orange-400" />,
      content: (
        <div className="space-y-4 text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed">
          <p>
            Infraestructura Edge Native distribuida sin servidor, cero latencia y alta concurrencia:
          </p>
          <div className="space-y-3 text-[11px]">
            <div className="p-3 rounded bg-rose-50/40 dark:bg-zinc-900 border border-rose-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  ARQAI Gatekeeper & Kill Switch
                </h4>
                {onOpenGatekeeper && (
                  <button
                    onClick={onOpenGatekeeper}
                    className="px-2 py-0.5 rounded bg-white hover:bg-rose-50 text-rose-700 text-[10px] border border-rose-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-700 cursor-pointer font-medium"
                  >
                    Abrir Gatekeeper
                  </button>
                )}
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">
                Monitorea en tiempo real el consumo de tokens, llamadas a la API y cuenta con un <strong className="text-zinc-900 dark:text-zinc-200">Kill Switch de Emergencia</strong> para detener instantáneamente cualquier agente descontrolado.
              </p>
            </div>

            <div className="p-3 rounded bg-orange-50/40 dark:bg-zinc-900 border border-orange-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-orange-700 dark:text-orange-400 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4" />
                  Ecosistema Cloudflare Edge Native
                </h4>
                {onOpenCloudflare && (
                  <button
                    onClick={onOpenCloudflare}
                    className="px-2 py-0.5 rounded bg-white hover:bg-orange-50 text-orange-800 text-[10px] border border-orange-300 dark:bg-orange-950/60 dark:hover:bg-orange-900 dark:text-orange-300 dark:border-orange-800/80 cursor-pointer font-medium"
                  >
                    Abrir Cloudflare
                  </button>
                )}
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">
                Sincronización con servicios de borde: <strong className="text-zinc-900 dark:text-zinc-200">Cloudflare Pages Functions</strong> (cálculo serverless), <strong className="text-zinc-900 dark:text-zinc-200">D1</strong> (SQL relacional SQLite), <strong className="text-zinc-900 dark:text-zinc-200">Vectorize</strong> (base vectorial distribuida) y <strong className="text-zinc-900 dark:text-zinc-200">SSE</strong> (Streaming en tiempo real).
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
      icon: <Keyboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      content: (
        <div className="space-y-4 text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed">
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 space-y-2">
            <h4 className="font-bold text-zinc-900 dark:text-white">Atajos de Teclado Globales:</h4>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
                <span className="text-zinc-800 dark:text-zinc-300 font-sans">Ejecutar Bucle Agéntico</span>
                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 border border-zinc-300 dark:border-zinc-700 font-bold">F5</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
                <span className="text-zinc-800 dark:text-zinc-300 font-sans">Nuevo Proyecto / Historial</span>
                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 font-bold">Ctrl + N</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
                <span className="text-zinc-800 dark:text-zinc-300 font-sans">Limpiar Memoria a Corto Plazo (STM)</span>
                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-amber-700 dark:text-amber-400 border border-zinc-300 dark:border-zinc-700 font-bold">Ctrl + K</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded bg-amber-50/40 dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                API Keys & Onboarding de Agentes
              </h4>
              {onOpenApiKey && (
                <button
                  onClick={onOpenApiKey}
                  className="px-2 py-0.5 rounded bg-white hover:bg-amber-50 text-amber-800 text-[10px] border border-amber-300 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-300 dark:border-amber-800/80 cursor-pointer font-medium"
                >
                  Ver API Keys
                </button>
              )}
            </div>
            <p className="text-zinc-700 dark:text-zinc-400">
              Conecta scripts externos de IA (Antigravity, Codex, Hermes, Claude) proveyendo la URL base <code className="text-emerald-700 dark:text-emerald-400 font-mono font-semibold">https://arqaistudio.pages.dev/api</code> y cabeceras <code className="text-amber-700 dark:text-amber-300 font-mono font-semibold">x-api-key</code>.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "agent-guide",
      category: "0. Protocolo Oficial de Agentes IA",
      title: "Guía Normativa para Agentes IA",
      icon: <Bot className="w-4 h-4 text-violet-600 dark:text-violet-400" />,
      content: (
        <div className="space-y-4 text-xs text-zinc-800 dark:text-zinc-300 leading-relaxed">

          {/* Header */}
          <div className="p-3.5 rounded-lg bg-violet-50/60 dark:bg-violet-950/30 border border-violet-300 dark:border-violet-800 space-y-1.5">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              ¿Qué es ARQAISTUDIO?
            </h3>
            <p className="text-zinc-700 dark:text-zinc-400">
              <strong className="text-zinc-900 dark:text-zinc-100">ARQAISTUDIO</strong> es una plataforma de <strong className="text-violet-700 dark:text-violet-400">orquestación de Agentes IA</strong> con supervisión humana (HITL).
              Los agentes reciben tareas, las ejecutan, registran su historial de acciones y esperan aprobación del supervisor antes de marcarlas como completadas.
              La URL base de la API es <code className="font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded">https://arqaistudio.pages.dev/api</code>.
            </p>
          </div>

          {/* Protocolo de Pasos Obligatorios */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <ListChecks className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Protocolo Obligatorio de Pasos para Agentes
            </h4>
            <div className="grid grid-cols-1 gap-1.5 text-[11px]">
              {[
                { step: "0", color: "indigo", title: "Paso Cero: Leer Contexto → CONTEXTO_PROYECTO.md", desc: "Al abrir cualquier chat nuevo, absorber el estado del proyecto en <25 líneas para arrancar de inmediato sin gastar tokens." },
                { step: "1", color: "emerald", title: "Conectar → POST /api/agent/connect", desc: "Enviar agentId, projectId, agentName, model. Guardar el token devuelto." },
                { step: "2", color: "blue", title: "Obtener Proyecto → GET /api/projects/:id", desc: "Leer contexto del proyecto: nombre, descripción, stack tecnológico." },
                { step: "3", color: "violet", title: "Obtener Tarea → GET /api/tasks?projectId=:id&status=pending", desc: "Seleccionar la primera tarea pendiente. Registrar su taskId." },
                { step: "4", color: "amber", title: "Reclamar Tarea → PATCH /api/tasks/:id", desc: 'Cambiar status a "in_progress". Incluir agentId en el body.' },
                { step: "5", color: "orange", title: "Registrar Chat → POST /api/agent/chat-log", desc: "Loggear cada acción significativa durante la ejecución." },
                { step: "6", color: "pink", title: "Completar Tarea → POST /api/agent/complete-task", desc: "Enviar OBLIGATORIAMENTE: gitUrl (GitHub) + workUrl (URL pública del deploy)." },
                { step: "7", color: "cyan", title: "Actualizar Contexto → CONTEXTO_PROYECTO.md", desc: "Actualizar el archivo local (<25 líneas) y sincronizarlo con POST /api/projects/:id/context." },
                { step: "8", color: "teal", title: "Crear Historial → POST /api/history", desc: "Registrar el resumen técnico de lo que se hizo, con ambas URLs." },
                { step: "9", color: "indigo", title: "Crear Notificación → POST /api/notifications", desc: "Avisar al supervisor que la tarea está lista para revisión." },
                { step: "10", color: "red", title: "Desconectar → POST /api/agent/disconnect", desc: "Liberar la conexión una vez completado el ciclo." },
              ].map(({ step, color, title, desc }) => (
                <div key={step} className={`flex gap-2.5 p-2.5 rounded bg-${color}-50/40 dark:bg-zinc-900 border border-${color}-200 dark:border-zinc-800`}>
                  <span className={`shrink-0 w-5 h-5 rounded-full bg-${color}-600 dark:bg-${color}-700 text-white text-[10px] font-bold flex items-center justify-center`}>{step}</span>
                  <div>
                    <span className={`font-mono font-bold text-${color}-800 dark:text-${color}-400 block`}>{title}</span>
                    <span className="text-zinc-600 dark:text-zinc-400">{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Regla del Límite de 40.000 Tokens */}
          <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 space-y-1.5">
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              Regla de Límite de 40.000 Tokens (Rotación de Chat)
            </h4>
            <p className="text-zinc-700 dark:text-zinc-400">
              Para garantizar respuestas ultrarrápidas y ahorrar costos, si la conversación de la IA supera los <strong className="text-zinc-900 dark:text-zinc-100">40.000 tokens</strong> (o ~15 a 18 turnos), la IA DEBE incluir esta alerta al final de su mensaje:
            </p>
            <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-300 font-mono">
              🟡 <strong>Aviso de Rendimiento:</strong> Esta sesión ya acumula ~40.000 tokens. El contexto del proyecto está seguro en <code>CONTEXTO_PROYECTO.md</code>. Te sugiero cerrar este chat y abrir uno nuevo para mantener velocidad y ahorro de tokens.
            </div>
          </div>

          {/* Regla de las 2 URLs */}
          <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 space-y-1.5">
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5" />
              Regla de Oro: DOS URLs por Tarea
            </h4>
            <p className="text-zinc-700 dark:text-zinc-400">
              En cada tarea completada el agente <strong className="text-zinc-900 dark:text-zinc-100">DEBE entregar exactamente dos URLs</strong>:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-violet-50/60 dark:bg-zinc-900 border border-violet-200 dark:border-violet-900/60 space-y-0.5">
                <div className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                  <span className="font-bold text-violet-800 dark:text-violet-400">gitUrl</span>
                </div>
                <span className="text-zinc-600 dark:text-zinc-400">URL del commit en GitHub — ej: <code className="font-mono text-[10px]">https://github.com/org/repo/commit/abc123</code></span>
              </div>
              <div className="p-2 rounded bg-emerald-50/60 dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/60 space-y-0.5">
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-emerald-800 dark:text-emerald-400">workUrl</span>
                </div>
                <span className="text-zinc-600 dark:text-zinc-400">URL pública del deploy en vivo — ej: <code className="font-mono text-[10px]">https://mi-proyecto.pages.dev</code></span>
              </div>
            </div>
          </div>

          {/* Endpoints rápidos */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Referencia Rápida de Endpoints
            </h4>
            <div className="grid grid-cols-1 gap-1 text-[10px] font-mono">
              {[
                { method: "GET",  path: "/api/projects/:id/context", color: "indigo", note: "Consultar último contexto del proyecto" },
                { method: "POST", path: "/api/projects/:id/context", color: "cyan",   note: "Guardar nuevo snapshot de contexto" },
                { method: "POST", path: "/api/agent/connect", color: "emerald", note: "Conexión y autenticación" },
                { method: "GET",  path: "/api/agent/guide",   color: "violet",  note: "Esta guía en formato JSON" },
                { method: "GET",  path: "/api/projects/:id",  color: "blue",    note: "Detalle del proyecto" },
                { method: "GET",  path: "/api/tasks",         color: "blue",    note: "Listar tareas del proyecto" },
                { method: "POST", path: "/api/tasks",         color: "emerald", note: "Crear nueva tarea" },
                { method: "PATCH",path: "/api/tasks/:id",     color: "amber",   note: "Actualizar estado/progreso" },
                { method: "POST", path: "/api/agent/chat-log",color: "orange",  note: "Registrar acción de chat" },
                { method: "POST", path: "/api/agent/complete-task", color: "pink", note: "Marcar tarea completada (con gitUrl + workUrl)" },
                { method: "POST", path: "/api/history",       color: "teal",    note: "Crear entrada en historial" },
                { method: "POST", path: "/api/notifications", color: "indigo",  note: "Notificar al supervisor" },
                { method: "POST", path: "/api/agent/disconnect", color: "red",  note: "Cerrar conexión del agente" },
              ].map(({ method, path, color, note }) => (
                <div key={path} className={`flex items-center gap-2 p-1.5 rounded bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800`}>
                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-${color}-100 dark:bg-${color}-950/60 text-${color}-800 dark:text-${color}-400 border border-${color}-300 dark:border-${color}-800`}>{method}</span>
                  <code className="text-zinc-800 dark:text-zinc-300 flex-1">{path}</code>
                  <span className="text-zinc-500 dark:text-zinc-500 text-right">{note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prohibiciones */}
          <div className="p-3 rounded-lg bg-red-50/60 dark:bg-red-950/20 border border-red-300 dark:border-red-900 space-y-1.5">
            <h4 className="text-xs font-bold text-red-800 dark:text-red-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Ban className="w-3.5 h-3.5" />
              Prohibiciones Absolutas
            </h4>
            <ul className="space-y-1 text-[11px] text-red-800 dark:text-red-300">
              {[
                "No omitir la lectura de CONTEXTO_PROYECTO.md al iniciar un nuevo chat.",
                "No exceder ~40.000 tokens en la sesión sin alertar proactivamente al usuario para rotar chat.",
                "No marcar una tarea como completada sin gitUrl Y workUrl.",
                "No omitir el registro en /api/agent/chat-log durante la ejecución.",
                "No completar tareas sin pasar por el flujo HITL (ready_for_review → aprobación).",
                "No eliminar ni modificar datos de otros agentes o proyectos.",
                "No operar sin token de autenticación válido (x-api-key).",
                "No inventar URLs: deben ser URLs reales y funcionales.",
                "No saltarse la creación del historial (/api/history) tras completar una tarea.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="shrink-0 mt-0.5 w-3.5 h-3.5 rounded-full bg-red-200 dark:bg-red-900/60 flex items-center justify-center text-[8px] font-bold text-red-800 dark:text-red-400">{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* JSON endpoint hint */}
          <div className="p-2.5 rounded bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700 text-[10px] font-mono text-zinc-700 dark:text-zinc-400">
            💡 Esta guía también está disponible en JSON para IAs: <code className="text-emerald-700 dark:text-emerald-400">GET /api/agent/guide</code> · <code className="text-violet-700 dark:text-violet-400">GET /api/agent/normativa</code>
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
      <div className="bg-white dark:bg-[#0e1117] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl text-zinc-800 dark:text-zinc-200 w-full max-w-4xl h-[88vh] max-h-[750px] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-[#16191f] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                Manual de Usuario & Especificaciones AgentOS
                <span className="text-[10px] font-mono font-normal px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  v2.4
                </span>
              </h2>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Guía completa de arquitectura, supervisión HITL, memoria RAG y especificaciones agénticas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two column layout */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* Left Navigation Bar */}
          <div className="w-full md:w-72 bg-zinc-50 dark:bg-[#12151b] border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0">
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar en el manual..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[#090b0e] border border-zinc-300 dark:border-zinc-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
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
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80 font-bold shadow-2xs"
                        : "text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 border border-transparent font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {section.icon}
                      <span className="truncate">{section.title}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />}
                  </button>
                );
              })}
            </div>

            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-[#090b0e]/60 text-[11px] space-y-1 text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center justify-between">
                <span>Versión:</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-300 font-semibold">2.4.0 (Autonomous)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Plataforma:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">Cloudflare D1 + Pages</span>
              </div>
            </div>
          </div>

          {/* Right Content Panel */}
          <div className="flex-1 bg-white dark:bg-[#090b0e] overflow-y-auto p-4 sm:p-6 flex flex-col">
            <div className="pb-3 mb-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold block mb-0.5">
                  {activeSection.category}
                </span>
                <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  {activeSection.icon}
                  {activeSection.title}
                </h1>
              </div>
            </div>

            <div className="flex-1">
              {activeSection.content}
            </div>

            <div className="pt-4 mt-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
              <span>AgentOS HITL Supervisor Documentation</span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-transparent text-xs font-semibold transition-colors cursor-pointer"
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
