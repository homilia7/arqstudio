import React, { useState } from "react";
import {
  X,
  Code2,
  Copy,
  Check,
  Terminal,
  Sparkles,
  Layers,
  BrainCircuit,
  AlertCircle,
  Key,
  Globe,
  FileCode,
  ShieldAlert,
  ArrowRight,
  ListTodo,
} from "lucide-react";
import { Project, User } from "../types";

interface ApiDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: Project | null;
  currentUser?: User | null;
}

export const ApiDocumentationModal: React.FC<ApiDocumentationModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  currentUser,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<"prompt" | "endpoints" | "workflow">("prompt");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCombined, setCopiedCombined] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState<string | null>(null);

  const originUrl =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const apiKey = activeProject?.apiKey || (currentUser ? `arqai_sec_${currentUser.pin}_${currentUser.id.slice(-4)}` : "arqai_sec_real_key");
  const projectId = activeProject?.id || "proj-default";
  const projectName = activeProject?.name || "Mi Proyecto Web";
  const mainUrl = activeProject?.mainUrl || originUrl;
  const combinedCredentials = `Base URL: ${originUrl}\nAPI Key: ${apiKey}`;

  const antigravitySystemPrompt = `Eres el Agente de Desarrollo de Inteligencia Artificial (Antigravity). Estás conectado al Hub Central de Arquitectura, QA y Gestión de Software en vivo.

CONFIGURACIÓN DE ACCESO Y CREDENCIALES:
- URL Base del Servidor API: ${originUrl}
- Usuario Propietario (Header "x-user-id"): ${currentUser?.id || "usr-user"} (${currentUser?.name || "Usuario"})
- API Key del Proyecto (Header "x-api-key"): ${apiKey}
- Proyecto Activo: "${projectName}" (ID: ${projectId})
- URL de Trabajo / Preview: ${mainUrl}

TU FLUJO AUTÓNOMO DE TRABAJO (PASO A PASO):
1. CONSULTAR TAREA PRIORITARIA:
   Haz una petición HTTP:
   GET ${originUrl}/api/agent/next-task?projectId=${projectId}
   - Si hay tareas marcadas por el usuario con observaciones ("needs_revision"), tendrán máxima prioridad ("high_correction") para que corrijas los errores que el humano detectó.
   - Si no hay correcciones pendientes, te devolverá la siguiente tarea en cola ("next_pending").

2. LEER MEMORIA DE CONTEXTO TÉCNICO (OBLIGATORIO ANTES DE TOCAR CÓDIGO):
   Haz una petición HTTP:
   GET ${originUrl}/api/agent/context-memory?taskId={TASK_ID}
   - Lee con atención:
     * technicalRequirements: Restricciones de diseño, accesibilidad (WCAG), CSS y comportamiento.
     * affectedFiles: Lista estricta de archivos a modificar (no toques otros sin justificación).
     * rulesConstraints: Límites y prohibiciones técnicas.
     * requiredDependencies: Paquetes y librerías permitidas.
     * persistentNotes: Decisiones de arquitectura tomadas en iteraciones previas.

3. NOTIFICAR INICIO DE TRABAJO:
   PATCH ${originUrl}/api/tasks/{TASK_ID}
   Headers: { "Content-Type": "application/json", "x-api-key": "${apiKey}" }
   Body JSON: { "status": "in_progress", "assignedAgent": "Antigravity AI" }

4. FINALIZAR Y REPORTAR RESULTADOS PARA REVISIÓN HUMANA:
   Cuando termines el código y verifiques que compila y funciona:
   POST ${originUrl}/api/agent/complete-task
   Headers: { "Content-Type": "application/json", "x-api-key": "${apiKey}" }
   Body JSON:
   {
     "taskId": "{TASK_ID}",
     "workUrl": "${mainUrl}",
     "aiNotes": "Explicación detallada de los archivos modificados, librerías añadidas y cómo se solucionó la tarea.",
     "aiOutput": "Resumen conciso para el usuario: listo para tu prueba en vivo en la web."
   }

5. DISPARAR NOTIFICACIÓN INSTANTÁNEA AL USUARIO EN PANTALLA:
   Cuando crees un proyecto, completes un módulo o finalices el trabajo completo, envía siempre una alerta emergente en vivo:
   POST ${originUrl}/api/agent/notify-user
   Headers: { "Content-Type": "application/json", "x-api-key": "${apiKey}" }
   Body JSON:
   {
     "agentName": "CODEX AI",
     "title": "🎉 Proyecto o Tarea Procesada con Éxito",
     "message": "El agente ha completado la construcción y la pantalla se ha actualizado automáticamente.",
     "type": "project_completed",
     "projectId": "${projectId}"
   }

SI EL USUARIO TE PIDE CREAR O DESGLOSAR EL PLAN DE ARQUITECTURA:
⚡ DIRECTIVA DE ORO OBLIGATORIA (CREACIÓN DE PLANES):
"Nunca generes un plan genérico. Primero crea un Blueprint específico del dominio del proyecto. Luego cada módulo, etapa y tarea debe derivarse directamente de ese Blueprint. Si una tarea podría servir para cualquier proyecto, reescríbela hasta que sea específica del producto solicitado."

1. Consulta o guarda el Blueprint estructurado del producto:
   PUT ${originUrl}/api/projects/${projectId}/blueprint
   GET ${originUrl}/api/projects/${projectId}/blueprint
2. Genera el Plan de Trabajo específico derivado directamente del Blueprint:
   POST ${originUrl}/api/projects/${projectId}/generate-plan-from-blueprint

REGLAS DE SEGURIDAD ESTRICTAS (PERMISOS HUMANOS & BLOQUEO):
- PROHIBIDO autoverificarse o aprobarse: Nunca envíes status="verified" ni locked=true. El servidor responderá con Error 403.
- PROHIBIDO editar el campo 'humanFeedback': Es la bitácora exclusiva del evaluador humano. Tu único estado final permitido es "ready_for_review".
- RESPETO A TAREAS BLOQUEADAS: Si una tarea tiene "locked": true, no debes modificarla bajo ninguna circunstancia.`;

  const curlNextTask = `curl -X GET "${originUrl}/api/agent/next-task?projectId=${projectId}" \\
  -H "x-api-key: ${apiKey}"`;

  const curlContext = `curl -X GET "${originUrl}/api/agent/context-memory?projectId=${projectId}" \\
  -H "x-api-key: ${apiKey}"`;

  const curlComplete = `curl -X POST "${originUrl}/api/agent/complete-task" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '{
    "taskId": "ID_DE_LA_TAREA",
    "workUrl": "${mainUrl}",
    "aiNotes": "Código implementado y probado con éxito.",
    "aiOutput": "Listo para revisión humana en la web."
  }'`;

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCurl(id);
    setTimeout(() => setCopiedCurl(null), 2000);
  };

  const allInOneText = `=== CREDENCIALES E INSTRUCCIONES ARQAI PARA AGENTES IA ===
URL de la Web / Staging: ${mainUrl}
URL Base de la API: ${originUrl}/api
API Key (Header "x-api-key"): ${apiKey}
Proyecto: "${projectName}" (ID: ${projectId})

--- PROMPT Y FLUJO COMPLETO DE INSTRUCCIONES ---
${antigravitySystemPrompt}`;

  const [copiedAll, setCopiedAll] = useState(false);

  return (
    <div className="fixed inset-0 z-[9999] bg-zinc-950/70 backdrop-blur-xs flex items-start justify-center p-3 sm:p-4 pt-8 sm:pt-12 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[88vh] transition-colors shrink-0">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-700 dark:text-indigo-400 shrink-0 shadow-2xs">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                  Instrucciones & API Key para Antigravity AI
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800">
                  v2.0 Full Autonomous
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Copia las credenciales y el prompt completo con 1 solo clic para pegárselo a Antigravity, Codex, Hermes o Claude.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Credentials Bar con Botón Todo en 1 */}
        <div className="bg-indigo-50/80 dark:bg-indigo-950/50 border-b border-indigo-100 dark:border-indigo-900/60 p-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-zinc-700 dark:text-zinc-300 font-semibold">Base URL:</span>
              <code className="font-mono text-[11px] bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-900/80 font-bold text-indigo-950 dark:text-indigo-200 shadow-2xs">
                {originUrl}
              </code>
            </div>

            <div className="flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-zinc-700 dark:text-zinc-300 font-semibold">API Key:</span>
              <code className="font-mono text-[11px] bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-md border border-amber-300 dark:border-amber-500/40 font-bold text-amber-800 dark:text-amber-300 shadow-2xs">
                {apiKey}
              </code>
            </div>

            {/* BOTÓN COPIAR (BASE URL + API KEY) EN 1 CLIC */}
            <button
              type="button"
              onClick={() => handleCopy(combinedCredentials, setCopiedCombined)}
              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-300 dark:border-amber-500/40 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              title="Copiar Base URL y API Key juntas en 1 solo clic"
            >
              {copiedCombined ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                  <span>¡Base URL + API Key Copiadas!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>Copiar (Base URL + API Key)</span>
                </>
              )}
            </button>
          </div>

          {/* BOTÓN MÁGICO DE COPIA TODO EN 1 CLIC */}
          <button
            type="button"
            onClick={() => handleCopy(allInOneText, setCopiedAll)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-black shadow-md shadow-emerald-900/20 dark:shadow-emerald-950/50 transition-all flex items-center space-x-2 cursor-pointer uppercase tracking-wider hover:scale-[1.02]"
          >
            {copiedAll ? (
              <>
                <Check className="w-4 h-4 text-emerald-100" />
                <span>¡Todo Copiado! Listo para Pegar</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-100" />
                <span>⚡ Copiar Todo en 1 Clic (URL + API Key + Prompt)</span>
              </>
            )}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 flex space-x-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("prompt")}
            className={`pb-2.5 flex items-center space-x-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === "prompt"
                ? "border-indigo-600 text-indigo-700 dark:text-indigo-400 font-bold"
                : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Prompt para Antigravity</span>
          </button>

          <button
            onClick={() => setActiveTab("endpoints")}
            className={`pb-2.5 flex items-center space-x-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === "endpoints"
                ? "border-indigo-600 text-indigo-700 dark:text-indigo-400 font-bold"
                : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Endpoints REST & cURL</span>
          </button>

          <button
            onClick={() => setActiveTab("workflow")}
            className={`pb-2.5 flex items-center space-x-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === "workflow"
                ? "border-indigo-600 text-indigo-700 dark:text-indigo-400 font-bold"
                : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Flujo de Trabajo del Agente</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs bg-white dark:bg-zinc-900">
          {activeTab === "prompt" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-1.5 text-zinc-800 dark:text-zinc-200 font-bold">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Copia y pega este texto completo en el chat o instrucciones de Antigravity:</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(antigravitySystemPrompt, setCopiedPrompt)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-200" />
                      <span>¡Prompt Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Prompt Completo</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="bg-zinc-900 dark:bg-zinc-950 p-4 rounded-xl text-[11px] font-mono text-zinc-100 overflow-x-auto border border-zinc-800 whitespace-pre-wrap leading-relaxed max-h-96 shadow-inner select-all">
                  {antigravitySystemPrompt}
                </pre>
              </div>

              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-900 dark:text-amber-300 flex items-start space-x-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Control Humano Garantizado:</strong> Antigravity tiene prohibido por servidor autoverificarse o aprobar tareas. Una vez que termine su trabajo, la tarea pasa al estado <code>ready_for_review</code> para que tú la pruebes en el navegador y decidas si aprobarla o devolverla con observaciones.
                </p>
              </div>
            </div>
          )}

          {activeTab === "endpoints" && (
            <div className="space-y-4">
              <p className="text-zinc-600 dark:text-zinc-400 text-xs">
                Endpoints REST optimizados para que Antigravity interactúe con el backlog y la memoria técnica en tiempo real:
              </p>

              {/* Endpoint 1: Siguiente tarea */}
              <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-[10px] border border-emerald-200 dark:border-transparent">
                      GET
                    </span>
                    <span className="font-mono text-zinc-900 dark:text-white font-bold text-xs">
                      /api/agent/next-task?projectId={projectId}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyCode("next", curlNextTask)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer font-semibold"
                  >
                    {copiedCurl === "next" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCurl === "next" ? "Copiado" : "Copiar cURL"}</span>
                  </button>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                  Devuelve la tarea prioritaria que Antigravity debe resolver. Si el usuario reportó errores en una tarea (<code>needs_revision</code>), se devuelve con máxima prioridad junto a las notas de observación.
                </p>
                <pre className="bg-zinc-900 dark:bg-zinc-950 p-2.5 rounded-lg text-[11px] font-mono text-indigo-300 border border-zinc-800 overflow-x-auto">
                  {curlNextTask}
                </pre>
              </div>

              {/* Endpoint 2: Memoria de contexto */}
              <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-[10px] border border-emerald-200 dark:border-transparent">
                      GET
                    </span>
                    <span className="font-mono text-zinc-900 dark:text-white font-bold text-xs">
                      /api/agent/context-memory?taskId=&#123;TASK_ID&#125;
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyCode("ctx", curlContext)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer font-semibold"
                  >
                    {copiedCurl === "ctx" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCurl === "ctx" ? "Copiado" : "Copiar cURL"}</span>
                  </button>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                  Retorna la ficha técnica de la tarea: lista de archivos afectados, requerimientos técnicos, dependencias y reglas que Antigravity debe respetar sin desviarse.
                </p>
                <pre className="bg-zinc-900 dark:bg-zinc-950 p-2.5 rounded-lg text-[11px] font-mono text-indigo-300 border border-zinc-800 overflow-x-auto">
                  {curlContext}
                </pre>
              </div>

              {/* Endpoint 3: Completar tarea */}
              <div className="bg-zinc-50 dark:bg-zinc-800/60 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 font-mono font-bold text-[10px] border border-indigo-200 dark:border-transparent">
                      POST
                    </span>
                    <span className="font-mono text-zinc-900 dark:text-white font-bold text-xs">
                      /api/agent/complete-task
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyCode("complete", curlComplete)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer font-semibold"
                  >
                    {copiedCurl === "complete" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCurl === "complete" ? "Copiado" : "Copiar cURL"}</span>
                  </button>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                  Antigravity notifica que finalizó la tarea. Se guardan las notas técnicas y la URL de prueba, y la tarea se marca como <code>ready_for_review</code>.
                </p>
                <pre className="bg-zinc-900 dark:bg-zinc-950 p-2.5 rounded-lg text-[11px] font-mono text-indigo-300 border border-zinc-800 overflow-x-auto">
                  {curlComplete}
                </pre>
              </div>

              {/* Endpoints Adicionales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400 text-[11px]">
                    PATCH /api/tasks/:id
                  </span>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] mt-1">
                    Permite a Antigravity marcar la tarea como <code>status: "in_progress"</code> al comenzar a escribir código.
                  </p>
                </div>

                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-400 text-[11px]">
                    PUT /api/projects/:id/blueprint
                  </span>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] mt-1">
                    Guarda el Blueprint estructurado (masterPrompt, generalFeatures, screens, connections, architecturalNotes) en Cloudflare D1.
                  </p>
                </div>

                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xs sm:col-span-2">
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400 text-[11px]">
                    POST /api/projects/:id/generate-plan-from-blueprint
                  </span>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] mt-1">
                    Genera el plan de trabajo específico por dominio con módulos, etapas y tareas con memoria técnica completa desde el Blueprint.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "workflow" && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900/60">
                <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-2 flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Ciclo de Vida Autónomo Antigravity + Humano</span>
                </h4>
                <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  Este flujo garantiza que la IA no trabaje a ciegas y que el usuario mantenga el 100% del control de calidad sin necesidad de supervisión manual en cada línea de código.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-zinc-900 dark:text-white text-xs">
                      Consulta Automática de Tareas
                    </h5>
                    <p className="text-zinc-600 dark:text-zinc-400 text-[11px] mt-0.5">
                      Antigravity consulta <code>/api/agent/next-task</code>. Si encuentra tareas que el usuario rechazó en pruebas anteriores (<code>needs_revision</code>), las atiende primero.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-zinc-900 dark:text-white text-xs">
                      Carga de Memoria de Contexto Técnico
                    </h5>
                    <p className="text-zinc-600 dark:text-zinc-400 text-[11px] mt-0.5">
                      Antes de tocar código, consulta <code>/api/agent/context-memory</code> para respetar archivos protegidos, librerías del proyecto y notas persistentes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xs">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-zinc-900 dark:text-white text-xs">
                      Ejecución y Entrega para Validación
                    </h5>
                    <p className="text-zinc-600 dark:text-zinc-400 text-[11px] mt-0.5">
                      Al completar su tarea, hace un POST a <code>/api/agent/complete-task</code>. La tarea pasa a <code>ready_for_review</code>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <h5 className="font-bold text-emerald-900 dark:text-emerald-300 text-xs">
                      Revisión Humana y Bloqueo Seguro
                    </h5>
                    <p className="text-zinc-700 dark:text-zinc-300 text-[11px] mt-0.5">
                      Tú pruebas la web con el botón "Revisar en Web". Si funciona, la apruebas y bloqueas (<code>locked: true</code>) para que la IA nunca la sobreescriba.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between">
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
            Seguridad reforzada con autenticación por <code>x-api-key</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-lg border border-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white dark:border-zinc-700 transition-colors shadow-2xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
