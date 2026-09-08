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
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!isOpen) return null;

  const baseUrl = "https://arqaistudio.pages.dev/api";

  const systemPrompt = `Actuar como un Agente Autónomo subordinado a la plataforma de supervisión ARQAISTUDIO (v2.4 Full Autonomous).
Conéctate al centro de mando con las siguientes credenciales:
- Base URL: \${baseUrl}
- API Key: \${apiKey}
- Project ID: \${projectId}
- Protocolo: REST + WebSockets/SSE
- Lockfile obligatorio: historial.md (ESTRICTAMENTE INMUTABLE)
- Flujo: Genera "Lista de tareas" y "Plan de implementación" antes de escribir código. Al terminar, provee un "Walkthrough".
- Definition of Done (DoD): Ejecuta pruebas TDD deterministas y linter estricto. Máximo 5 intentos antes del Freno de Emergencia.
- Notificación obligatoria: POST \${baseUrl}/agent/notify-user con estado de progreso en vivo.`;

  const copyToClipboard = (text: string, isPrompt = false) => {
    navigator.clipboard.writeText(text);
    if (isPrompt) {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
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
          <div className="p-3.5 rounded-lg bg-amber-50/30 dark:bg-[#12151b] border border-amber-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-wider">Tu Clave API de Proyecto</span>
              <button
                onClick={() => copyToClipboard(apiKey)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-transparent text-xs font-semibold transition-colors cursor-pointer"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? "¡Copiada!" : "Copiar Clave"}</span>
              </button>
            </div>
            <div className="p-2.5 rounded bg-white dark:bg-[#090b0e] border border-amber-200 dark:border-zinc-800 font-mono text-xs text-amber-800 dark:text-amber-300 font-bold select-all break-all shadow-2xs">
              {apiKey}
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-500 font-mono">
              <span>Endpoint Base: <code className="text-zinc-800 dark:text-zinc-400 font-semibold">{baseUrl}</code></span>
              <span>Project ID: <code className="text-zinc-800 dark:text-zinc-400 font-semibold">{projectId}</code></span>
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
                onClick={() => copyToClipboard(systemPrompt, true)}
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
              <div><span className="text-emerald-700 dark:text-emerald-400 font-bold">GET</span> /api/agent/welcome <span className="text-zinc-500 font-sans">- Handshake y bienvenida</span></div>
              <div><span className="text-emerald-700 dark:text-emerald-400 font-bold">GET</span> /api/agent/next-task?projectId={projectId} <span className="text-zinc-500 font-sans">- Tarea asignada</span></div>
              <div><span className="text-blue-700 dark:text-blue-400 font-bold">POST</span> /api/projects/{projectId}/plan/batch <span className="text-zinc-500 font-sans">- Cargar plan JSON</span></div>
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
