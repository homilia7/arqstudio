import React, { useState } from "react";
import { Shield, ShieldAlert, X, AlertOctagon, CheckCircle2, Lock, UserX, Cpu } from "lucide-react";

interface GatekeeperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GatekeeperModal: React.FC<GatekeeperModalProps> = ({
  isOpen,
  onClose
}) => {
  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [blockedAgents, setBlockedAgents] = useState<string[]>([]);
  const [agentInput, setAgentInput] = useState("");

  if (!isOpen) return null;

  const toggleKillSwitch = () => {
    setKillSwitchActive(!killSwitchActive);
  };

  const handleBlockAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentInput.trim()) return;
    if (!blockedAgents.includes(agentInput.trim().toUpperCase())) {
      setBlockedAgents([...blockedAgents, agentInput.trim().toUpperCase()]);
    }
    setAgentInput("");
  };

  const handleUnblock = (name: string) => {
    setBlockedAgents(blockedAgents.filter(a => a !== name));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0e1117] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl text-zinc-800 dark:text-zinc-200 w-full max-w-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-[#16191f] border-b border-zinc-200 dark:border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                  ARQAI Gatekeeper & Kill Switch
                </h2>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${killSwitchActive ? "bg-rose-950 text-rose-400 border border-rose-800 animate-pulse" : "bg-emerald-950 text-emerald-400 border border-emerald-800"}`}>
                  {killSwitchActive ? "EMERGENCIA: BLOQUEADO" : "OPERATIVO: SEGURO"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Control de acceso en caliente, desconexión de emergencia y aislamiento de agentes descontrolados.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs text-zinc-800 dark:text-zinc-300">
          
          {/* Emergency Kill Switch Button */}
          <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5 text-xs">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                Kill Switch Global de Emergencia
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Pausa de forma inmediata toda ejecución de LLM y rechaza cualquier petición agéntica entrante.
              </p>
            </div>
            <button
              onClick={toggleKillSwitch}
              className={`px-3 py-1.5 rounded font-bold text-xs transition-colors cursor-pointer ${
                killSwitchActive
                  ? "bg-rose-600 hover:bg-rose-700 text-zinc-900 dark:text-white"
                  : "bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 dark:bg-zinc-800 dark:hover:bg-rose-950 dark:text-zinc-300 dark:border-zinc-700 font-semibold"
              }`}
            >
              {killSwitchActive ? "Desactivar Freno" : "Activar Kill Switch"}
            </button>
          </div>

          {/* Block Specific Agent */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block">
              Bloquear Agente Específico
            </span>
            <form onSubmit={handleBlockAgent} className="flex gap-2">
              <input
                type="text"
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                placeholder="Ej: ROGUE_AGENT_AI"
                className="flex-1 bg-white dark:bg-[#12151b] border border-zinc-300 dark:border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-rose-500 font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Bloquear
              </button>
            </form>
          </div>

          {/* Blocked List */}
          <div className="p-3 rounded bg-zinc-50 dark:bg-[#12151b] border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block">Agentes Bloqueados ({blockedAgents.length}):</span>
            {blockedAgents.length === 0 ? (
              <p className="text-[11px] text-zinc-500 italic">No hay agentes bloqueados. Todos los agentes autorizados pueden operar.</p>
            ) : (
              <div className="space-y-1.5">
                {blockedAgents.map((agent) => (
                  <div key={agent} className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-[#090b0e] border border-zinc-200 dark:border-zinc-800 shadow-2xs text-xs font-mono">
                    <span className="text-rose-400 flex items-center gap-1.5">
                      <UserX className="w-3.5 h-3.5" />
                      {agent}
                    </span>
                    <button
                      onClick={() => handleUnblock(agent)}
                      className="text-[10px] text-zinc-600 dark:text-zinc-400 hover:text-emerald-400 cursor-pointer"
                    >
                      Desbloquear
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-[#16191f] border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-transparent text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
