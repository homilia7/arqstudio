import React, { useState } from "react";
import {
  X,
  Bell,
  CheckCheck,
  Trash2,
  Bot,
  User,
  FolderOpen,
  CheckCircle2,
  Clock,
  Inbox,
  Volume2,
  Check,
  Sparkles,
} from "lucide-react";
import { AgentNotification, Project } from "../types";
import {
  playNotificationSound,
  requestDesktopNotificationPermission,
} from "../utils/notifications";

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AgentNotification[];
  onMarkAllAsRead: () => Promise<void>;
  onMarkAsRead: (id: string) => Promise<void>;
  onDeleteNotification?: (id: string) => Promise<void>;
  onClearNotifications: () => Promise<void>;
  onSelectProjectById?: (projectId: string) => void;
  projects?: Project[];
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  onDeleteNotification,
  onClearNotifications,
  onSelectProjectById,
  projects = [],
}) => {
  if (!isOpen) return null;

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundTested, setSoundTested] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifs = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    return true;
  });

  const handleMarkAllRead = async () => {
    setIsProcessing(true);
    try {
      await onMarkAllAsRead();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("¿Deseas vaciar todo el buzón de notificaciones?")) return;
    setIsProcessing(true);
    try {
      await onClearNotifications();
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return "Justo ahora";
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) {
        return `Hoy ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      }
      return `${date.toLocaleDateString([], { day: "2-digit", month: "short" })} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-zinc-950/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 pt-4 sm:pt-14 overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-300 dark:border-zinc-800 flex items-center justify-between bg-zinc-100/80 dark:bg-zinc-900/80">
          <div className="flex items-center space-x-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              unreadCount > 0
                ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 ring-2 ring-rose-300 dark:ring-rose-800 animate-pulse"
                : "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            }`}>
              <Bell className={`w-4 h-4 ${unreadCount > 0 ? "text-rose-600 dark:text-rose-400 animate-bounce" : ""}`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-sm text-zinc-900 dark:text-white">
                  Buzón de Notificaciones
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider animate-pulse shadow-xs">
                    {unreadCount} nuevas
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Historial de alertas y avisos de tareas terminadas por tus Agentes IA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="px-4 py-2.5 bg-zinc-200/60 dark:bg-zinc-950/40 border-b border-zinc-300 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs border border-zinc-300 dark:border-zinc-700"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                filter === "unread"
                  ? "bg-rose-600 text-white shadow-xs border border-rose-700"
                  : unreadCount > 0
                    ? "text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-300 dark:border-rose-800"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              No leídas ({unreadCount})
            </button>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Botón Probar Sonido y Activar Notificaciones */}
            <button
              onClick={async () => {
                playNotificationSound();
                await requestDesktopNotificationPermission();
                setSoundTested(true);
                setTimeout(() => setSoundTested(false), 3000);
              }}
              title="Probar sonido de aviso y autorizar notificaciones en el navegador"
              className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded transition-all cursor-pointer shadow-xs"
            >
              {soundTested ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Volume2 className="w-3.5 h-3.5 text-rose-600 animate-pulse" />}
              <span>{soundTested ? "¡Sonido & Avisos OK!" : "Probar Sonido & Avisos"}</span>
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isProcessing}
                title="Marcar todas como leídas"
                className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-slate-700 border border-zinc-300 dark:border-zinc-700 rounded transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Leer todas</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClear}
                disabled={isProcessing}
                title="Vaciar buzón"
                className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vaciar</span>
              </button>
            )}
          </div>
        </div>

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredNotifs.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center px-4 text-zinc-600 dark:text-zinc-400">
              <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Inbox className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {filter === "unread"
                  ? "¡No tienes notificaciones pendientes!"
                  : "Tu buzón está vacío"}
              </p>
              <p className="text-xs max-w-xs text-zinc-500 dark:text-zinc-400">
                Cuando tus Agentes IA completen tareas o se actualice el proyecto, aparecerán registradas aquí con aviso sonoro y en el navegador.
              </p>
            </div>
          ) : (
            filteredNotifs.map((n) => {
              const matchedProj = projects.find((p) => p.id === n.projectId);
              const projectName = matchedProj ? matchedProj.name : n.projectId;

              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl border transition-all relative ${
                    !n.read
                      ? "bg-rose-50/90 dark:bg-rose-950/30 border-2 border-rose-500 dark:border-rose-600 shadow-md ring-1 ring-rose-400/40"
                      : "bg-zinc-100 dark:bg-zinc-800/60 border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700"
                  }`}
                >
                  {/* Top line: Agent, Badge & Date */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center space-x-2">
                      {!n.read && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                          🔴 NUEVA
                        </span>
                      )}
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        !n.read
                          ? "bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                      }`}>
                        {n.agentName && (n.agentName.includes("AI") || n.agentName.includes("Bot") || n.agentName.includes("Antigravity")) ? (
                          <Bot className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        ) : (
                          <User className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                        )}
                        <span>{n.agentName || "USUARIO"}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className="flex items-center space-x-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(n.createdAt)}</span>
                      </div>
                      {onDeleteNotification && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNotification(n.id);
                          }}
                          title="Eliminar notificación"
                          className="p-1 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Message */}
                  <h3 className={`font-extrabold text-xs mb-1 ${!n.read ? "text-rose-950 dark:text-rose-100" : "text-zinc-900 dark:text-white"}`}>
                    {n.title}
                  </h3>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {n.message}
                  </p>

                  {/* Bottom Footer: Project badge & Read action */}
                  <div className="mt-3 pt-2.5 border-t border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between gap-2">
                    {n.projectId ? (
                      <button
                        onClick={() => {
                          if (onSelectProjectById && n.projectId) {
                            onSelectProjectById(n.projectId);
                            onMarkAsRead(n.id);
                            onClose();
                          }
                        }}
                        className="inline-flex items-center space-x-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/60 transition-colors cursor-pointer"
                      >
                        <FolderOpen className="w-3 h-3 text-indigo-500" />
                        <span>Ver Proyecto: {projectName || "Activo"}</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    {!n.read && (
                      <button
                        onClick={() => onMarkAsRead(n.id)}
                        className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 hover:underline transition-colors cursor-pointer inline-flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>Marcar como leída</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
