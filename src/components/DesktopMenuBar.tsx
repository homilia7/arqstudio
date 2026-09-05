import React, { useState } from 'react';
import { 
  Bot, 
  Terminal, 
  Database, 
  BookOpen, 
  Key, 
  Bell, 
  ShieldCheck, 
  Moon, 
  Sun, 
  RefreshCw, 
  Cpu, 
  CheckCircle2, 
  UserCheck, 
  Sparkles,
  ChevronDown
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
    <header className="h-10 bg-zinc-950 dark:bg-black border-b border-zinc-800 dark:border-zinc-800 flex items-center justify-between px-3 text-xs select-none relative z-50 text-zinc-300">
      {/* Lado Izquierdo: Marca de Sistema + Menús Desktop */}
      <div className="flex items-center gap-3">
        {/* Logo & Version */}
        <div className="flex items-center gap-2 font-bold text-zinc-100 dark:text-white pr-2 border-r border-zinc-800">
          <div className="w-5 h-5 rounded bg-gradient-to-tr from-emerald-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-sm">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="tracking-tight font-mono text-[13px]">ARQSTUDIO<span className="text-emerald-400 font-sans">.OS</span></span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-700 text-zinc-400 font-mono">v2.5</span>
        </div>

        {/* Menús de Escritorio */}
        <nav className="flex items-center gap-0.5 text-zinc-300">
          {/* Menú Archivo */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('archivo')}
              className="px-2 py-1 rounded hover:bg-zinc-800 hover:text-white flex items-center gap-1 transition-colors"
            >
              Archivo <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {activeDropdown === 'archivo' && (
              <div className="absolute left-0 mt-1 w-48 bg-zinc-900 border border-zinc-700 rounded-md shadow-2xl py-1 z-50 text-zinc-200">
                <button
                  onClick={() => { onOpenNewProject(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Nuevo Proyecto
                </button>
                <button
                  onClick={() => { onOpenMyAccount(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center gap-2"
                >
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> Mi Cuenta & PIN
                </button>
                <div className="my-1 border-t border-zinc-800" />
                <button
                  onClick={() => { onRefresh(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Recargar Datos
                </button>
              </div>
            )}
          </div>

          {/* Menú Proyecto */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('proyecto')}
              className="px-2 py-1 rounded hover:bg-zinc-800 hover:text-white flex items-center gap-1 transition-colors"
            >
              Proyecto <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {activeDropdown === 'proyecto' && (
              <div className="absolute left-0 mt-1 w-56 bg-zinc-900 border border-zinc-700 rounded-md shadow-2xl py-1 z-50 text-zinc-200">
                <div className="px-3 py-1 text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Seleccionar Activo:</div>
                <div className="max-h-48 overflow-y-auto">
                  {allProjects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { onSelectProject(p); closeDropdown(); }}
                      className={'w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center justify-between ' + (activeProject?.id === p.id ? 'bg-zinc-800/80 text-emerald-400 font-semibold' : '')}
                    >
                      <span className="truncate">{p.name}</span>
                      {activeProject?.id === p.id && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                    </button>
                  ))}
                </div>
                <div className="my-1 border-t border-zinc-800" />
                <button
                  onClick={() => { onOpenNewProject(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center gap-2 text-emerald-400"
                >
                  <span>+</span> Crear Otro Proyecto
                </button>
              </div>
            )}
          </div>

          {/* Menú Agente */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('agente')}
              className="px-2 py-1 rounded hover:bg-zinc-800 hover:text-white flex items-center gap-1 transition-colors"
            >
              Agente <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {activeDropdown === 'agente' && (
              <div className="absolute left-0 mt-1 w-52 bg-zinc-900 border border-zinc-700 rounded-md shadow-2xl py-1 z-50 text-zinc-200">
                <button
                  onClick={() => { onOpenAgentConnections(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Cpu className="w-3.5 h-3.5 text-violet-400" /> Conexiones de Agentes
                </button>
                <button
                  onClick={() => { onOpenApiDocs(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Skill & Endpoints API
                </button>
              </div>
            )}
          </div>

          {/* Menú Infraestructura */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('infra')}
              className="px-2 py-1 rounded hover:bg-zinc-800 hover:text-white flex items-center gap-1 transition-colors"
            >
              Infraestructura <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {activeDropdown === 'infra' && (
              <div className="absolute left-0 mt-1 w-52 bg-zinc-900 border border-zinc-700 rounded-md shadow-2xl py-1 z-50 text-zinc-200">
                <button
                  onClick={() => { onOpenNeonModal(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" /> Cloudflare D1 & Neon DB
                </button>
                <button
                  onClick={() => { onOpenAuditHistory(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Auditoría & Eventos
                </button>
                {currentUser?.role === 'superadmin' && (
                  <button
                    onClick={() => { onOpenAdminUsers(); closeDropdown(); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> Gestión de Usuarios
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Menú Ayuda */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('ayuda')}
              className="px-2 py-1 rounded hover:bg-zinc-800 hover:text-white flex items-center gap-1 transition-colors"
            >
              Ayuda <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {activeDropdown === 'ayuda' && (
              <div className="absolute left-0 mt-1 w-48 bg-zinc-900 border border-zinc-700 rounded-md shadow-2xl py-1 z-50 text-zinc-200">
                <button
                  onClick={() => { onOpenApiDocs(); closeDropdown(); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center gap-2"
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Guía de Integración
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Lado Derecho: Acciones rápidas + Perfil de Usuario */}
      <div className="flex items-center gap-2">
        {/* Conmutador de Tema Claro / Oscuro */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Cambiar a Tema Claro Técnico' : 'Cambiar a Modo Oscuro'}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-1"
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-300" />
          )}
        </button>

        {/* Botón Recargar */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Sincronizar con Cloudflare D1"
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <RefreshCw className={'w-3.5 h-3.5 ' + (isRefreshing ? 'animate-spin text-emerald-400' : '')} />
        </button>

        {/* Notificaciones */}
        <button
          onClick={onOpenNotifications}
          title="Buzón de Eventos de Agentes"
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors relative"
        >
          <Bell className="w-3.5 h-3.5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        {/* Perfil de Usuario con PIN */}
        <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
          <button
            onClick={onOpenMyAccount}
            className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 transition-all"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-[10px] text-white">
              {currentUser?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <p className="font-semibold text-[11px] text-zinc-200 truncate max-w-[90px]">
                {currentUser?.name || 'Andrés'}
              </p>
              <p className="text-[9px] text-emerald-400 font-mono">
                {currentUser?.role === 'superadmin' ? 'SuperAdmin' : 'QA Lead'}
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
