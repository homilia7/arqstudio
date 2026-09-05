import React, { useState } from 'react';
import { 
  BookOpen, 
  Key, 
  Shield, 
  Users, 
  Cloud, 
  Bell, 
  ChevronDown,
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  Database,
  Terminal,
  Cpu,
  FolderGit2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { User, Project } from '../types';

interface DesktopMenuBarProps {
  currentUser: User | null;
  activeProject: Project | null;
  allProjects: Project[];
  onSelectProject: (p: Project) => void;
  onOpenNewProject: () => void;
  onOpenMyAccount: () => void;
  onOpenAdminUsers: () => void;
  onOpenApiDocs: () => void;
  onOpenAgentConnections: () => void;
  onOpenNotifications: () => void;
  onOpenNeonModal: () => void;
  onOpenAuditHistory: () => void;
  onOpenUserManual?: () => void;
  onOpenApiKeyOnboarding?: () => void;
  onOpenCloudflareEdge?: () => void;
  onOpenGatekeeper?: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  unreadNotificationsCount: number;
}

export const DesktopMenuBar: React.FC<DesktopMenuBarProps> = ({
  currentUser,
  activeProject,
  allProjects,
  onSelectProject,
  onOpenNewProject,
  onOpenMyAccount,
  onOpenAdminUsers,
  onOpenApiDocs,
  onOpenAgentConnections,
  onOpenNotifications,
  onOpenNeonModal,
  onOpenAuditHistory,
  onOpenUserManual,
  onOpenApiKeyOnboarding,
  onOpenCloudflareEdge,
  onOpenGatekeeper,
  onRefresh,
  isRefreshing,
  unreadNotificationsCount,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const closeDropdown = () => setActiveDropdown(null);

  return (
    <header className="h-10 bg-[#0d0f12] dark:bg-[#0d0f12] border-b border-[#21262d] flex items-center justify-between px-3 text-xs select-none relative z-50 text-[#c9d1d9] font-sans">
      {/* Lado Izquierdo: Marca de Sistema + Menús Desktop */}
      <div className="flex items-center gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2 font-bold text-white pr-2 border-r border-[#21262d]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          <span className="tracking-tight font-semibold text-[13px] text-white">AgenteOS</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1c2128] border border-[#30363d] text-[#8b949e] font-mono">v2.4</span>
        </div>

        {/* Menús de Escritorio */}
        <nav className="flex items-center gap-0.5 text-[#c9d1d9]">
          {/* Archivo */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('archivo')}
              className="px-2 py-1 rounded hover:bg-[#21262d] hover:text-white flex items-center gap-1 transition-colors"
            >
              Archivo <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {activeDropdown === 'archivo' && (
              <div className="absolute left-0 mt-1 w-48 bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-1 z-50 text-[#c9d1d9]">
                <button
                  onClick={() => { onOpenNewProject(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#21262d] flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Nuevo Proyecto
                </button>
                <button
                  onClick={() => { onOpenMyAccount(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#21262d] flex items-center gap-2"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Mi Cuenta & PIN
                </button>
                <div className="my-1 border-t border-[#21262d]" />
                <button
                  onClick={() => { onRefresh(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#21262d] flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Sincronizar D1
                </button>
              </div>
            )}
          </div>

          {/* Agente */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('agente')}
              className="px-2 py-1 rounded hover:bg-[#21262d] hover:text-white flex items-center gap-1 transition-colors"
            >
              Agente <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {activeDropdown === 'agente' && (
              <div className="absolute left-0 mt-1 w-52 bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-1 z-50 text-[#c9d1d9]">
                <button
                  onClick={() => { onOpenAgentConnections(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#21262d] flex items-center gap-2"
                >
                  <Cpu className="w-3.5 h-3.5 text-violet-400" /> Conexiones de Agentes
                </button>
                <button
                  onClick={() => { onOpenApiDocs(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#21262d] flex items-center gap-2"
                >
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Skill & API Antigravity
                </button>
              </div>
            )}
          </div>

          {/* Memoria y RAG */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('memoria')}
              className="px-2 py-1 rounded hover:bg-[#21262d] hover:text-white flex items-center gap-1 transition-colors"
            >
              Memoria y RAG <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {activeDropdown === 'memoria' && (
              <div className="absolute left-0 mt-1 w-52 bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-1 z-50 text-[#c9d1d9]">
                <button
                  onClick={() => { onOpenNeonModal(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#21262d] flex items-center gap-2"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" /> Cloudflare D1 SQL
                </button>
                <button
                  onClick={() => { onOpenAuditHistory(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#21262d] flex items-center gap-2"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Lockfile historial.md
                </button>
              </div>
            )}
          </div>

          {/* Agentes Git */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('git')}
              className="px-2 py-1 rounded hover:bg-[#21262d] hover:text-white flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <FolderGit2 className="w-3 h-3" />
              <span>Agentes Git</span> <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {activeDropdown === 'git' && (
              <div className="absolute left-0 mt-1 w-48 bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-1 z-50 text-[#c9d1d9]">
                <button
                  onClick={() => { onOpenAuditHistory(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#21262d] flex items-center gap-2"
                >
                  <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" /> Commits Semánticos
                </button>
              </div>
            )}
          </div>

          {/* Colaboración */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('colab')}
              className="px-2 py-1 rounded hover:bg-[#21262d] hover:text-white flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <Users className="w-3 h-3" />
              <span>Colaboración</span> <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </div>

          {/* Vista */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('vista')}
              className="px-2 py-1 rounded hover:bg-[#21262d] hover:text-white flex items-center gap-1 transition-colors"
            >
              Vista <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </div>

          {/* Ayuda */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('ayuda')}
              className="px-2 py-1 rounded hover:bg-[#21262d] hover:text-white flex items-center gap-1 transition-colors"
            >
              Ayuda <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {activeDropdown === 'ayuda' && (
              <div className="absolute left-0 mt-1 w-48 bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-1 z-50 text-[#c9d1d9]">
                <button
                  onClick={() => { onOpenApiDocs(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#21262d] flex items-center gap-2"
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Documentación
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Lado Derecho: Iconos de Acción Encapsulados en Píldoras */}
      <div className="flex items-center gap-1.5">
        {/* Píldora Verde: Manual de Usuario */}
        <button
          onClick={onOpenUserManual}
          title="Manual de Usuario & Especificaciones AgentOS"
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#063b27] border border-[#0e6245] text-emerald-300 hover:bg-[#084c32] transition-colors cursor-pointer text-[11px] font-medium"
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Manual</span>
        </button>

        {/* Píldora Amarilla: API Keys & Onboarding */}
        <button
          onClick={onOpenApiKeyOnboarding}
          title="API Keys & Onboarding de Agentes"
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#3b2d06] border border-[#6b500c] text-amber-300 hover:bg-[#4d3a08] transition-colors cursor-pointer text-[11px] font-mono"
        >
          <Key className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">API Keys</span>
        </button>

        {/* Píldora Rosa: Gatekeeper */}
        <button
          onClick={onOpenGatekeeper}
          title="ARQAI Gatekeeper & Kill Switch"
          className="p-1.5 rounded-md bg-[#3b0918] border border-[#63112a] text-rose-300 hover:bg-[#4c0c20] transition-colors cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5 text-rose-400" />
        </button>

        {/* Píldora Naranja: Cloudflare Edge */}
        <button
          onClick={onOpenCloudflareEdge}
          title="Cloudflare Edge Native Telemetría"
          className="p-1.5 rounded-md bg-[#3b2009] border border-[#633a11] text-orange-300 hover:bg-[#4c2a0c] transition-colors cursor-pointer"
        >
          <Cloud className="w-3.5 h-3.5 text-orange-400" />
        </button>
        <button
          onClick={onOpenApiDocs}
          title="Documentación de la Skill"
          className="p-1.5 rounded-md bg-[#063b27] border border-[#0e6245] text-emerald-400 hover:bg-[#084c32] transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
        </button>

        {/* Píldora Amarilla: Keys / PIN */}
        <button
          onClick={onOpenMyAccount}
          title="Gestión de PIN & API Key"
          className="p-1.5 rounded-md bg-[#3b2d06] border border-[#6b500c] text-amber-400 hover:bg-[#4d3a08] transition-colors"
        >
          <Key className="w-3.5 h-3.5" />
        </button>

        {/* Píldora Verde-Azul: Seguridad */}
        <button
          onClick={onOpenNeonModal}
          title="Cloudflare D1 & Seguridad"
          className="p-1.5 rounded-md bg-[#09353b] border border-[#115b63] text-teal-400 hover:bg-[#0c444c] transition-colors"
        >
          <Shield className="w-3.5 h-3.5" />
        </button>

        {/* Píldora Azul: Multiplayer */}
        <button
          onClick={onOpenAgentConnections}
          title="Enjambre y Conexiones"
          className="p-1.5 rounded-md bg-[#0c2d48] border border-[#144f7d] text-blue-400 hover:bg-[#103a5c] transition-colors"
        >
          <Users className="w-3.5 h-3.5" />
        </button>

        {/* Píldora Naranja: Cloudflare Edge */}
        <button
          onClick={onRefresh}
          title="Cloudflare Edge Deployment"
          className="p-1.5 rounded-md bg-[#3b1d06] border border-[#6b350c] text-orange-400 hover:bg-[#4d2608] transition-colors"
        >
          <Cloud className="w-3.5 h-3.5" />
        </button>

        {/* Campana de Notificaciones */}
        <button
          onClick={onOpenNotifications}
          title="Notificaciones"
          className="p-1.5 rounded-md hover:bg-[#21262d] text-amber-400 hover:text-amber-300 transition-colors relative"
        >
          <Bell className="w-3.5 h-3.5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        {/* Conmutador Tema Claro/Oscuro */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo Claro Técnico' : 'Modo Oscuro AgentOS'}
          className="p-1.5 rounded-md hover:bg-[#21262d] text-zinc-400 hover:text-white transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-300" />}
        </button>

        {/* Perfil de Usuario Elena Rostova / Andrés */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#21262d]">
          <button
            onClick={onOpenMyAccount}
            className="flex items-center gap-2 px-2 py-1 rounded bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] transition-all"
          >
            <div className="w-5 h-5 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center font-bold text-[9px] text-[#58a6ff]">
              mi
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <p className="font-semibold text-[11px] text-[#f0f6fc]">
                {currentUser?.name || 'Elena Rostova'}
              </p>
              <p className="text-[9px] text-[#8b949e]">
                Laboratorio de Agentes Autónomos (Sede Central)
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
