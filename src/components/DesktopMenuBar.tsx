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
  FolderGit2,
  ShieldAlert
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
  onOpenD1Modal: () => void;
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
  onOpenD1Modal,
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
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const closeDropdown = () => setActiveDropdown(null);

  return (
    <header className="bg-[#0d0f12] text-[#8b949e] border-b border-[#1a1d24] text-[12px] font-sans select-none flex items-center justify-between px-3 py-1.5 z-40 relative h-10 shrink-0">
      {/* Lado Izquierdo: Brand & Desktop Menus */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {/* Brand & Version Badge */}
        <div className="flex items-center gap-1.5 pr-2.5 border-r border-[#21262d] shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
          <span className="font-bold text-white tracking-tight text-[13px]">AgentOS</span>
          <span className="text-[10px] text-[#8b949e] font-mono px-1 py-0.2 rounded bg-[#161b22] border border-[#30363d]">
            v2.4
          </span>
        </div>

        {/* Desktop Menus */}
        <nav className="flex items-center gap-1 shrink-0">
          {/* Archivo */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('archivo')}
              className="px-2 py-1 rounded hover:bg-[#21262d] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              Archivo <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {activeDropdown === 'archivo' && (
              <div className="absolute left-0 mt-1 w-52 bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-1 z-50 text-[#c9d1d9]">
                <button
                  onClick={() => { onOpenNewProject(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#21262d] flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Nuevo Proyecto
                </button>
                <div className="h-px bg-[#30363d] my-1" />
                <button
                  onClick={() => { onOpenMyAccount(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#21262d] flex items-center gap-2 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Mi Cuenta & PIN
                </button>
              </div>
            )}
          </div>

          {/* Supervisor & Agentes */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('supervisor')}
              className="px-2 py-1 rounded hover:bg-[#21262d] hover:text-white flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <Cpu className="w-3 h-3" />
              <span>Supervisor</span> <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {activeDropdown === 'supervisor' && (
              <div className="absolute left-0 mt-1 w-56 bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-1 z-50 text-[#c9d1d9]">
                <button
                  onClick={() => { onOpenUserManual?.(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#21262d] flex items-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Manual de Usuario HITL
                </button>
                <button
                  onClick={() => { onOpenApiKeyOnboarding?.(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#21262d] flex items-center gap-2 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" /> API Keys & Onboarding
                </button>
                <button
                  onClick={() => { onOpenGatekeeper?.(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#21262d] flex items-center gap-2 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Gatekeeper & Kill Switch
                </button>
              </div>
            )}
          </div>

          {/* Memoria y RAG */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('memoria')}
              className="px-2 py-1 rounded hover:bg-[#21262d] hover:text-white flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              <Database className="w-3 h-3" />
              <span>Memoria y RAG</span> <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {activeDropdown === 'memoria' && (
              <div className="absolute left-0 mt-1 w-52 bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-1 z-50 text-[#c9d1d9]">
                <button
                  onClick={() => { onOpenD1Modal(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#21262d] flex items-center gap-2 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" /> Cloudflare D1 SQL
                </button>
                <button
                  onClick={() => { onOpenAuditHistory(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#21262d] flex items-center gap-2 cursor-pointer"
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
              className="px-2 py-1 rounded hover:bg-[#21262d] hover:text-white flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <FolderGit2 className="w-3 h-3" />
              <span>Agentes Git</span> <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {activeDropdown === 'git' && (
              <div className="absolute left-0 mt-1 w-52 bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-1 z-50 text-[#c9d1d9]">
                <button
                  onClick={() => { onOpenAuditHistory(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#21262d] flex items-center gap-2 cursor-pointer"
                >
                  <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" /> Registro de Auditoría
                </button>
              </div>
            )}
          </div>

          {/* Colaboración */}
          <div className="relative">
            <button
              onClick={() => onOpenAgentConnections()}
              className="px-2 py-1 rounded hover:bg-[#21262d] hover:text-white flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              <Users className="w-3 h-3" />
              <span>Colaboración</span>
            </button>
          </div>

          {/* Ayuda & Manual */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('ayuda')}
              className="px-2 py-1 rounded hover:bg-[#21262d] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              Ayuda <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {activeDropdown === 'ayuda' && (
              <div className="absolute left-0 mt-1 w-56 bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl py-1 z-50 text-[#c9d1d9]">
                <button
                  onClick={() => { onOpenUserManual?.(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#21262d] flex items-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" /> Manual de Usuario AgentOS
                </button>
                <button
                  onClick={() => { onOpenApiDocs(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#21262d] flex items-center gap-2 cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Especificaciones de la API
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Lado Derecho: Acciones Rápidas con Botones Píldora Compactos */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Píldora Manual de Usuario */}
        <button
          onClick={onOpenUserManual}
          title="Manual de Usuario & Especificaciones AgentOS"
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#063b27] border border-[#0e6245] text-emerald-300 hover:bg-[#084c32] transition-colors cursor-pointer text-[11px] font-medium"
        >
          <BookOpen className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="hidden md:inline">Manual</span>
        </button>

        {/* Píldora API Key & Onboarding */}
        <button
          onClick={onOpenApiKeyOnboarding}
          title="API Keys & Onboarding de Agentes"
          className="flex items-center gap-1 px-2 py-1 rounded bg-[#3b2d06] border border-[#6b500c] text-amber-300 hover:bg-[#4d3a08] transition-colors cursor-pointer text-[11px] font-mono"
        >
          <Key className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="hidden lg:inline">API Keys</span>
        </button>

        {/* Píldora Gatekeeper */}
        <button
          onClick={onOpenGatekeeper}
          title="ARQAI Gatekeeper & Kill Switch"
          className="p-1.5 rounded bg-[#3b0918] border border-[#63112a] text-rose-300 hover:bg-[#4c0c20] transition-colors cursor-pointer"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
        </button>

        {/* Píldora Cloudflare D1 */}
        <button
          onClick={onOpenD1Modal}
          title="Cloudflare D1 SQL Serverless"
          className="p-1.5 rounded bg-[#3b2009] border border-[#633a11] text-orange-300 hover:bg-[#4c2a0c] transition-colors cursor-pointer"
        >
          <Database className="w-3.5 h-3.5 text-orange-400" />
        </button>

        {/* Campana de Notificaciones */}
        <button
          onClick={onOpenNotifications}
          title="Notificaciones en Vivo"
          className="relative p-1.5 rounded bg-[#161b22] border border-[#30363d] text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          <Bell className="w-3.5 h-3.5 text-amber-400" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        {/* Switch de Tema */}
        <button
          onClick={toggleTheme}
          title="Alternar Tema Claro / Oscuro"
          className="p-1.5 rounded bg-[#161b22] border border-[#30363d] text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
        </button>

        {/* Botón Refrescar */}
        <button
          onClick={onRefresh}
          title="Sincronizar con Cloudflare D1"
          className="p-1.5 rounded bg-[#161b22] border border-[#30363d] text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
        </button>

        {/* Perfil de Usuario Compacto y Alineado */}
        <div className="flex items-center pl-1.5 border-l border-[#21262d] shrink-0">
          <button
            onClick={onOpenMyAccount}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] transition-all cursor-pointer max-w-[140px]"
            title="Mi Cuenta y Perfil"
          >
            <div className="w-4.5 h-4.5 rounded-full bg-[#1f6feb] border border-[#388bfd] flex items-center justify-center font-bold text-[9px] text-white shrink-0">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'E'}
            </div>
            <span className="font-semibold text-[11px] text-[#f0f6fc] truncate">
              {currentUser?.name || 'Elena Rostova'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
