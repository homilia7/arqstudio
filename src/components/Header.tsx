import React from "react";
import { Bot, History, Code2, RefreshCw, Sun, Moon, Database, Sparkles, Network, User, ShieldCheck, Bell, Activity, Radio } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenChangelog?: () => void;
  onOpenApiDocs: () => void;
  onOpenCloudflareD1Modal?: () => void;
  onOpenAutoArchitecture?: () => void;
  onOpenAgentConnections?: () => void;
  activeAgentsCount?: number;
  hasActiveApi?: boolean;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  onOpenMyAccount?: () => void;
  onOpenAdminUsers?: () => void;
  currentUser?: { name: string; pin?: string } | null;
  neonStatus?: any;
  onRefresh: () => void;
  isRefreshing: boolean;
  pendingReviewsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  onOpenChangelog,
  onOpenApiDocs,
  onOpenCloudflareD1Modal,
  onOpenAutoArchitecture,
  onOpenAgentConnections,
  activeAgentsCount = 0,
  hasActiveApi = true,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  onOpenMyAccount,
  onOpenAdminUsers,
  currentUser,
  neonStatus,
  onRefresh,
  isRefreshing,
  pendingReviewsCount,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-gradient-to-r from-purple-100/90 via-emerald-100/90 to-sky-100/90 dark:from-indigo-950/95 dark:via-emerald-950/95 dark:to-purple-950/95 border-b border-indigo-200/80 dark:border-indigo-800/60 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-5 py-2 shadow-sm transition-colors">
      <div className="w-full max-w-[100%] flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-bold text-xs sm:text-base text-zinc-900 dark:text-white tracking-tight">
                ARQ AI
              </h1>
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 hidden md:block">
              Control de Instrucciones, Revisión Web y Bloqueo de Tareas
            </p>
          </div>
        </div>

        {/* Action Buttons & Status Indicators */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5 sm:pb-0 scrollbar-none touch-pan-x shrink-0">
          {/* Status Group */}
          <div className="flex items-center gap-1 sm:gap-1.5">

            {/* Pending Reviews Badge */}
            {pendingReviewsCount > 0 && (
              <div className="h-6 inline-flex items-center gap-1.5 px-2 rounded-md text-[10.5px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 whitespace-nowrap animate-pulse select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>{pendingReviewsCount} por revisar</span>
              </div>
            )}
          </div>

          {/* Controls & Quick Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
              aria-label="Cambiar tema claro u oscuro"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-600" />
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Recargar datos"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isRefreshing ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""
                }`}
              />
            </button>

            {/* Auto Architecture Button (if present) */}
            {onOpenAutoArchitecture && (
              <button
                id="header-btn-auto-architecture"
                onClick={onOpenAutoArchitecture}
                className="h-7 inline-flex items-center gap-1 px-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-200 animate-pulse shrink-0" />
                <span>Auto AI</span>
              </button>
            )}

            {/* Agent Connections / API ACTIVA Indicator */}
            {onOpenAgentConnections && (
              <button
                onClick={onOpenAgentConnections}
                title="API Activa: Ver agentes conectados y gestionar permisos de acceso"
                className="h-7 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 dark:border-emerald-500/40 shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>API ACTIVA</span>
                {activeAgentsCount !== undefined && activeAgentsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-600 text-white font-black">
                    {activeAgentsCount}
                  </span>
                )}
              </button>
            )}

            {/* Agent Notifications Mailbox */}
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                title="Buzón de Notificaciones de Agentes IA"
                className={`h-7 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap relative shrink-0 ${
                  unreadNotificationsCount > 0
                    ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-xs ring-1 ring-rose-400/40 hover:bg-rose-100 dark:hover:bg-rose-900/60"
                    : "text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-transparent"
                }`}
              >
                <div className="relative">
                  <Bell className={`w-3.5 h-3.5 shrink-0 ${unreadNotificationsCount > 0 ? "text-rose-600 dark:text-rose-400 animate-bounce" : "text-zinc-500 dark:text-zinc-400"}`} />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600 ring-2 ring-white dark:ring-zinc-900" />
                    </span>
                  )}
                </div>
                <span>Buzón IA</span>
                {unreadNotificationsCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-rose-600 text-white font-black rounded-full text-[9px] uppercase shadow-xs animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Historial de Cambios por Proyecto */}
            {onOpenChangelog && (
              <button
                onClick={onOpenChangelog}
                title="Ver Historial de Cambios por Proyecto"
                className="h-7 inline-flex items-center gap-1 px-2 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800/80 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <History className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="hidden xl:inline">Historial Cambios</span>
                <span className="xl:hidden">Historial</span>
              </button>
            )}

            {/* Connect Antigravity API */}
            <button
              onClick={onOpenApiDocs}
              title="Instrucciones y endpoints para conectar Antigravity"
              className="h-7 inline-flex items-center gap-1 px-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
              <span className="hidden xl:inline">Conectar Antigravity (API)</span>
              <span className="xl:hidden">Conectar API</span>
            </button>

            {/* My Account Button (if present) */}
            {onOpenMyAccount && (
              <button
                onClick={onOpenMyAccount}
                title="Configuración de Mi Cuenta y PIN de Acceso"
                className="h-7 inline-flex items-center gap-1 px-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-zinc-200/80 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap border border-zinc-300/80 dark:border-zinc-700/60 shrink-0"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[8px] shrink-0">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-2.5 h-2.5" />}
                </div>
                <span className="hidden sm:inline font-semibold">{currentUser?.name || "Mi Cuenta"}</span>
              </button>
            )}

            {/* Admin Users Button */}
            {onOpenAdminUsers && (
              <button
                onClick={onOpenAdminUsers}
                title="Administración de Usuarios del Sistema"
                className="h-7 inline-flex items-center gap-1 px-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="hidden sm:inline">Usuarios</span>
              </button>
            )}

            {/* Audit History Button */}
            <button
              onClick={onOpenHistory}
              title="Historial de auditoría y eventos"
              className="h-7 inline-flex items-center gap-1 px-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <History className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="hidden sm:inline">Auditoría</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

