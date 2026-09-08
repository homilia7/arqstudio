import React, { useState } from "react";
import { Key, Copy, Check, Terminal, ExternalLink, X, ShieldAlert, Sparkles } from "lucide-react";

interface ApiKeyOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  projectName?: string;
  apiKey?: string;
}

export const ApiKeyOnboardingModal: React.FC<ApiKeyOnboardingModalProps> = ({
  isOpen,
  onClose,
  projectId = "proj-default",
  projectName = "ARQAISTUDIO Core",
  apiKey = "arqai_sec_1234_main"
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedBoth, setCopiedBoth] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!isOpen) return null;

  const baseUrl = "https://arqaistudio.pages.dev/api";

  const systemPrompt = `CONECTA ESTE PROYECTO AUTÓNOMAMENTE A ARQAISTUDIO:
1. Ejecuta POST ${baseUrl}/agent/connect con:
   Header: 'x-api-key': '${apiKey}'
   Body: { "projectName": "${projectName}", "agentName": "Antigravity AI" }
2. Guarda la respuesta recibida en la raíz de tu proyecto local bajo el archivo '.arqai.json'.
3. Consulta fragmentos RAG en GET ${baseUrl}/agent/rag-context?projectId=${projectId} para ahorrar tokens.
4. NUNCA toques ningún archivo que aparezca en 'security.lockedFiles' (.arqai.json). Tienen Quality Gate inmutable.
5. REGLA OBLIGATORIA DE ENTREGABLES (DOS URLs POR TAREA/ACCIÓN):
   En cada tarea o acción completada (POST ${baseUrl}/agent/complete-task o POST ${baseUrl}/agent/chat-log), DEBES proporcionar obligatoriamente DOS URLs:
   - 'gitUrl': URL del repositorio o commit de Git (ej: https://github.com/homilia7/${projectName})
   - 'workUrl' / 'projectUrl': URL del proyecto web en vivo (ej: https://sinpepay.pages.dev) para que el evaluador humano pueda hacer clic e ir directamente al proyecto a ver el cambio en directo.`;

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const copyEndpoint = () => {
    navigator.clipboard.writeText(baseUrl);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const copyBoth = () => {
    const combinedText = `Endpoint: ${baseUrl}\nClave API: ${apiKey}\nID Proyecto: ${projectId}`;
    navigator.clipboard.writeText(combinedText);
    setCopiedBoth(true);
    setTimeout(() => setCopiedBoth(false), 2000);
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(systemPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0e1117] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl text-zinc-800 dark:text-zinc-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-[#16191f] border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                Credenciales de API & Onboarding de Agentes
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50 font-bold">
                  Agentes Autónomos
                </span>
              </h2>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Credenciales para conectar IAs externas (Antigravity, Codex, Hermes, Claude) al proyecto: <strong className="text-zinc-900 dark:text-zinc-200">{projectName}</strong>
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

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs text-zinc-800 dark:text-zinc-300">
          
          {/* Key Box */}
          <div className="p-3.5 rounded-lg bg-amber-50/30 dark:bg-[#12151b] border border-amber-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                Copiar clave
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {/* Botón Individual: Copiar Clave */}
                <button
                  onClick={copyKey}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                  title="Copiar únicamente la clave API"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                  <span>{copiedKey ? "¡Clave Copiada!" : "Copiar Clave"}</span>
                </button>

                {/* Botón Conjunto: Copiar Clave y Endpoint Juntos */}
                <button
                  onClick={copyBoth}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-500 border border-amber-600 text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  title="Copiar la clave API y el endpoint juntos en el portapapeles"
                >
                  {copiedBoth ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                  <span>{copiedBoth ? "¡Clave + Endpoint Copiados!" : "Copiar Clave y Endpoint (Juntos)"}</span>
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded bg-white dark:bg-[#090b0e] border border-amber-200 dark:border-zinc-800 font-mono text-xs text-amber-800 dark:text-amber-300 font-bold select-all break-all shadow-2xs flex items-center justify-between">
              <span>{apiKey}</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-600 dark:text-zinc-400 font-mono pt-1 border-t border-amber-200/50 dark:border-zinc-800/60">
              <div className="flex items-center gap-1.5">
                <span>Endpoint Base: <code className="text-zinc-800 dark:text-zinc-200 font-semibold">{baseUrl}</code></span>
                <button
                  onClick={copyEndpoint}
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer rounded transition-colors"
                  title="Copiar solo el Endpoint"
                >
                  {copiedEndpoint ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <span>Project ID: <code className="text-zinc-800 dark:text-zinc-200 font-semibold">{projectId}</code></span>
            </div>
          </div>

          {/* System Prompt for AI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Prompt de Conexión para Agentes IA
              </span>
              <button
                onClick={copyPrompt}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 dark:border-emerald-800/80 dark:text-emerald-300 text-xs transition-colors cursor-pointer font-bold shadow-2xs"
              >
                {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPrompt ? "¡Prompt Copiado!" : "Copiar Prompt Completo"}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-lg bg-zinc-50 dark:bg-[#090b0e] border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto select-all">
              {systemPrompt}
            </pre>
          </div>

          {/* Steps */}
          <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-2 text-[11px]">
            <span className="font-bold text-zinc-900 dark:text-zinc-200">Protocolo de Endpoints REST:</span>
            <div className="space-y-1.5 font-mono text-zinc-700 dark:text-zinc-400">
              <div><span className="text-emerald-700 dark:text-emerald-400 font-bold">POST</span> /api/agent/connect <span className="text-zinc-500 font-sans">- Handshake 1-clic y auto-creación</span></div>
              <div><span className="text-blue-700 dark:text-blue-400 font-bold">POST</span> /api/agent/chat-log <span className="text-zinc-500 font-sans">- Auditoría HITL y Quality Gate</span></div>
              <div><span className="text-purple-700 dark:text-purple-400 font-bold">GET</span> /api/agent/rag-context?projectId={projectId} <span className="text-zinc-500 font-sans">- Memoria RAG (ahorro tokens)</span></div>
              <div><span className="text-amber-700 dark:text-amber-400 font-bold">POST</span> /api/agent/notify-user <span className="text-zinc-500 font-sans">- Notificación en pantalla</span></div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-[#16191f] border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-transparent text-xs font-semibold transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
