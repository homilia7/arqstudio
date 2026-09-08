import React, { useState, useEffect } from 'react';
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
  ShieldAlert,
  LogOut,
  Settings,
  HelpCircle,
  FileCode,
  Layers,
  MessageSquare,
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
  onOpenChatAudit?: () => void;
  onOpenUserManual?: () => void;
  onOpenApiKeyOnboarding?: () => void;
  onOpenCloudflareEdge?: () => void;
  onOpenGatekeeper?: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onLogout?: () => void;
  unreadNotificationsCount: number;
  isAdminUsersView?: boolean;
  isChatAuditView?: boolean;
}

export const DesktopMenuBar: React.FC<DesktopMenuBarProps> = ({
  currentUser,
  activeProject,
  allProjects,
  onSelectProject,
  onOpenNewProject,
  onOpenMyAccount,
  onOpenAdminUsers,
  isAdminUsersView,
  isChatAuditView,
  onOpenApiDocs,
  onOpenAgentConnections,
  onOpenNotifications,
  onOpenD1Modal,
  onOpenAuditHistory,
  onOpenChatAudit,
  onOpenUserManual,
  onOpenApiKeyOnboarding,
  onOpenCloudflareEdge,
  onOpenGatekeeper,
  onRefresh,
  isRefreshing,
  onLogout,
  unreadNotificationsCount,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const closeDropdown = () => setActiveDropdown(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDropdown();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Invisible backdrop to close dropdown when clicking outside */}
      {activeDropdown && (
        <div 
          className="fixed inset-0 z-40 bg-transparent cursor-default" 
          onClick={closeDropdown} 
        />
      )}

      <header className="bg-white dark:bg-[#0b0d10] text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-[#1c2027] text-[12px] font-sans select-none flex items-center justify-between px-3 h-9 z-50 relative shrink-0 overflow-visible shadow-xs dark:shadow-none">
        
        {/* Lado Izquierdo: Brand & Menús del IDE */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-visible">
          
          {/* Logo & Versión */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-zinc-200 dark:border-zinc-800 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
            <span className="font-bold text-zinc-900 dark:text-white tracking-tight text-[12px]">AgentOS</span>
            <span className="text-[9px] text-zinc-600 dark:text-zinc-400 font-mono px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              v2.4
            </span>
          </div>

          {/* Menús de Navegación Tipo Desktop */}
          <nav className="flex items-center gap-0.5 shrink-0">
            
            {/* 1. Archivo */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('archivo')}
                className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer font-medium ${
                  activeDropdown === 'archivo'
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs dark:shadow-inner font-semibold'
                    : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800/60'
                }`}
              >
                <span>Archivo</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${activeDropdown === 'archivo' ? 'rotate-180 text-white' : 'opacity-60'}`} />
              </button>
              
              {activeDropdown === 'archivo' && (
                <div className="absolute left-0 mt-0.5 w-64 bg-white dark:bg-[#12151b] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl py-1 z-50 text-zinc-800 dark:text-zinc-200 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => { onOpenNewProject(); closeDropdown(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 cursor-pointer transition-colors font-bold"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>+ Crear Nuevo Proyecto</span>
                  </button>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />
                  
                  <div className="px-3 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Mis Proyectos ({allProjects.length})
                  </div>
                  <div className="max-h-48 overflow-y-auto py-0.5">
                    {allProjects.map((p) => {
                      const isSelected = activeProject?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => { onSelectProject(p); closeDropdown(); }}
                          className={`w-full text-left px-3 py-1.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-300 font-bold'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FolderGit2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate">{p.name}</span>
                          </div>
                          {isSelected && <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">Activo</span>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />
                  <button
                    onClick={() => { onOpenMyAccount(); closeDropdown(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mi Cuenta & PIN</span>
                  </button>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />
                  <button
                    onClick={() => { closeDropdown(); onLogout?.(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 flex items-center gap-2 cursor-pointer transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. Supervisor */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('supervisor')}
                className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer font-medium ${
                  activeDropdown === 'supervisor'
                    ? 'bg-emerald-50 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 shadow-xs dark:shadow-inner font-semibold'
                    : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800/60'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supervisor</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${activeDropdown === 'supervisor' ? 'rotate-180 text-emerald-400' : 'opacity-60'}`} />
              </button>

              {activeDropdown === 'supervisor' && (
                <div className="absolute left-0 mt-0.5 w-60 bg-white dark:bg-[#12151b] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl py-1 z-50 text-zinc-800 dark:text-zinc-200 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => { onOpenUserManual?.(); closeDropdown(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Manual de Usuario HITL</span>
                  </button>
                  <button
                    onClick={() => { onOpenApiKeyOnboarding?.(); closeDropdown(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>API Keys & Onboarding IA</span>
                  </button>
                  <button
                    onClick={() => { onOpenChatAudit?.(); closeDropdown(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span>Historial de Chat & Modelos IA</span>
                  </button>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />
                  <button
                    onClick={() => { onOpenGatekeeper?.(); closeDropdown(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-800/80 text-rose-300 hover:text-rose-200 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    <span>Gatekeeper & Kill Switch</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Memoria y RAG */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('memoria')}
                className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer font-medium ${
                  activeDropdown === 'memoria'
                    ? 'bg-purple-50 dark:bg-zinc-800 text-purple-700 dark:text-purple-300 shadow-xs dark:shadow-inner font-semibold'
                    : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800/60'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-purple-400" />
                <span>Memoria & RAG</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${activeDropdown === 'memoria' ? 'rotate-180 text-purple-400' : 'opacity-60'}`} />
              </button>

              {activeDropdown === 'memoria' && (
                <div className="absolute left-0 mt-0.5 w-56 bg-white dark:bg-[#12151b] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl py-1 z-50 text-zinc-800 dark:text-zinc-200 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => { onOpenD1Modal(); closeDropdown(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Database className="w-3.5 h-3.5 text-orange-400" />
                    <span>Cloudflare D1 SQL Database</span>
                  </button>
                  <button
                    onClick={() => { onOpenAuditHistory(); closeDropdown(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Lockfile historial.md</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Agentes Git */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('git')}
                className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer font-medium ${
                  activeDropdown === 'git'
                    ? 'bg-cyan-50 dark:bg-zinc-800 text-cyan-700 dark:text-cyan-300 shadow-xs dark:shadow-inner font-semibold'
                    : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800/60'
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Agentes Git</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${activeDropdown === 'git' ? 'rotate-180 text-cyan-400' : 'opacity-60'}`} />
              </button>

              {activeDropdown === 'git' && (
                <div className="absolute left-0 mt-0.5 w-52 bg-white dark:bg-[#12151b] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl py-1 z-50 text-zinc-800 dark:text-zinc-200 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => { onOpenAuditHistory(); closeDropdown(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Registro de Auditoría & Diffs</span>
                  </button>
                </div>
              )}
            </div>

            {/* 5. Colaboración */}
            <button
              onClick={() => onOpenAgentConnections()}
              className="px-2.5 py-1 rounded text-xs text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800/60 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Colaboración</span>
            </button>

            {/* 6. Ayuda */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('ayuda')}
                className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer font-medium ${
                  activeDropdown === 'ayuda'
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs dark:shadow-inner font-semibold'
                    : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800/60'
                }`}
              >
                <span>Ayuda</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${activeDropdown === 'ayuda' ? 'rotate-180 text-white' : 'opacity-60'}`} />
              </button>

              {activeDropdown === 'ayuda' && (
                <div className="absolute left-0 mt-0.5 w-56 bg-white dark:bg-[#12151b] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl py-1 z-50 text-zinc-800 dark:text-zinc-200 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => { onOpenUserManual?.(); closeDropdown(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Manual de Usuario AgentOS</span>
                  </button>
                  <button
                    onClick={() => { onOpenApiDocs(); closeDropdown(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Especificaciones de la API</span>
                  </button>
                </div>
              )}
            </div>

          </nav>
        </div>

        {/* Lado Derecho: Píldoras de Estado y Perfil */}
        <div className="flex items-center gap-1 shrink-0">
          
          {/* Píldora Manual */}
          <button
            onClick={onOpenUserManual}
            title="Manual de Usuario & Especificaciones AgentOS"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:border-emerald-800/80 dark:text-emerald-300 dark:hover:bg-emerald-900/90 transition-colors cursor-pointer text-[11px] font-medium"
          >
            <BookOpen className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="hidden md:inline">Manual</span>
          </button>

          {/* Píldora API Keys */}
          <button
            onClick={onOpenApiKeyOnboarding}
            title="API Keys & Onboarding de Agentes"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/70 dark:border-amber-800/80 dark:text-amber-300 dark:hover:bg-amber-900/90 transition-colors cursor-pointer text-[11px] font-mono"
          >
            <Key className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="hidden lg:inline">API Keys</span>
          </button>

          {/* Píldora Gatekeeper */}
          <button
            onClick={onOpenGatekeeper}
            title="ARQAI Gatekeeper & Kill Switch"
            className="p-1 rounded bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/70 dark:border-rose-800/80 dark:text-rose-300 dark:hover:bg-rose-900 transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </button>

          {/* Píldora Cloudflare D1 */}
          <button
            onClick={onOpenD1Modal}
            title="Cloudflare D1 SQL Serverless"
            className="p-1 rounded bg-orange-50 border border-orange-200 text-orange-800 hover:bg-orange-100 dark:bg-orange-950/70 dark:border-orange-800/80 dark:text-orange-300 dark:hover:bg-orange-900 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-orange-400" />
          </button>

          {/* Botón Directorio de Usuarios (Super Admin) */}
          {(currentUser?.name?.toLowerCase() === 'admin' || currentUser?.accessType?.toLowerCase()?.includes('admin')) && (
            <button
              onClick={onOpenAdminUsers}
              title="Directorio de Usuarios Registrados & Consumo Real (Super Admin)"
              className={`px-2 py-1 rounded border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                isAdminUsersView
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:border-indigo-800/80 dark:text-indigo-300 dark:hover:bg-indigo-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Usuarios & DB</span>
            </button>
          )}

          {/* Botón Historial de Chat & Modelo IA */}
          {onOpenChatAudit && (
            <button
              onClick={onOpenChatAudit}
              title="Historial de Chat & Modelo de IA (Auditoría HITL)"
              className={`px-2 py-1 rounded border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                isChatAuditView
                  ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                  : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/70 dark:border-blue-800/80 dark:text-blue-300 dark:hover:bg-blue-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Historial Chat</span>
            </button>
          )}

          {/* Campana de Notificaciones */}
          <button
            onClick={onOpenNotifications}
            title="Notificaciones en Vivo"
            className="relative p-1 rounded hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Switch de Tema */}
          <button
            onClick={toggleTheme}
            title="Alternar Tema Claro / Oscuro"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
          </button>

          {/* Botón Refrescar */}
          <button
            onClick={onRefresh}
            title="Sincronizar con Cloudflare D1"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Perfil de Usuario con Menú Desplegable */}
          <div className="relative pl-1 border-l border-zinc-200 dark:border-zinc-800 shrink-0">
            <button
              onClick={() => toggleDropdown('user-profile')}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer max-w-[150px] ${
                activeDropdown === 'user-profile'
                  ? 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700'
                  : 'bg-zinc-50 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
              }`}
              title="Opciones de Cuenta"
            >
              <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-[9px] text-white shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <span className="font-semibold text-[11px] text-zinc-800 dark:text-zinc-200 truncate">
                {currentUser?.name || 'Admin'}
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${activeDropdown === 'user-profile' ? 'rotate-180 text-white' : 'opacity-60'}`} />
            </button>

            {activeDropdown === 'user-profile' && (
              <div className="absolute right-0 mt-0.5 w-48 bg-white dark:bg-[#12151b] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl py-1 z-50 text-zinc-800 dark:text-zinc-200 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800 text-[11px]">
                  <p className="font-bold text-zinc-900 dark:text-white truncate">{currentUser?.name || 'Admin'}</p>
                  <p className="text-[10px] text-zinc-400 font-mono capitalize">{currentUser?.accessType || 'superadmin'}</p>
                </div>
                <button
                  onClick={() => { onOpenMyAccount(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 cursor-pointer transition-colors text-xs"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mi Cuenta & PIN</span>
                </button>
                <button
                  onClick={() => { onOpenAdminUsers(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 cursor-pointer transition-colors text-xs"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Gestionar Usuarios</span>
                </button>
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />
                <button
                  onClick={() => { closeDropdown(); onLogout?.(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 flex items-center gap-2 cursor-pointer transition-colors text-xs font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </header>
    </>
  );
};
