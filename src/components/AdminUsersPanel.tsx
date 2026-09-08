import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ShieldCheck,
  Users,
  Clock,
  Key,
  Database,
  UserPlus,
  X,
  CheckCircle2,
  Lock,
  Mail,
  User as UserIcon,
  Trash2,
  AlertTriangle,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Activity,
  Calendar,
  Wifi,
  WifiOff,
  FolderGit2,
  Crown,
} from "lucide-react";
import { User } from "../types";
import { fetchUsers, registerUser, deleteUser } from "../services/api";

interface AdminUsersPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  currentUser?: User | null;
  refreshKey?: number;
}

export function AdminUsersPanel({
  isOpen = true,
  onClose,
  currentUser,
  refreshKey,
}: AdminUsersPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "online" | "offline" | "admin" | "user">("all");
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  // Modal para registrar nuevo usuario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [accessType, setAccessType] = useState("Acceso Full");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal para eliminar usuario
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, refreshKey]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers(currentUser?.id, currentUser?.pin);
      setUsers(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPin = (userId: string, userPin: string) => {
    navigator.clipboard.writeText(userPin);
    setCopiedPinId(userId);
    setTimeout(() => setCopiedPinId(null), 2000);
  };

  const togglePinVisibility = (userId: string) => {
    setShowPins((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleRegisterNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("El nombre de usuario es obligatorio.");
      return;
    }
    if (pin.length < 4 || pin.length > 6) {
      setFormError("El PIN o contraseña debe tener entre 4 y 6 dígitos numéricos.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const res = await registerUser(name.trim(), pin, email.trim(), accessType);
      if (res.success || res.user) {
        setSuccessMsg(res.message || `Usuario '${name}' registrado correctamente.`);
        setName("");
        setPin("");
        setEmail("");
        setAccessType("Acceso Full");
        await loadUsers();
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccessMsg(null);
        }, 1200);
      }
    } catch (err: any) {
      setFormError(err.message || "Error al guardar el usuario en la base de datos.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
      await loadUsers();
    } catch (err: any) {
      setDeleteError(err.message || "Error al eliminar el usuario de la base de datos.");
    } finally {
      setDeleting(false);
    }
  };

  // KPIs
  const totalUsers = users.length;
  const onlineUsersCount = useMemo(() => users.filter((u) => u.isOnline).length, [users]);
  const offlineUsersCount = totalUsers - onlineUsersCount;
  const totalProjects = useMemo(() => users.reduce((acc, u) => acc + (u.projectsCount || 0), 0), [users]);
  const newTodayCount = useMemo(() => {
    const today = new Date().toDateString();
    return users.filter((u) => u.createdAt && new Date(u.createdAt).toDateString() === today).length;
  }, [users]);

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.pin && u.pin.includes(q)) ||
        (u.accessType && u.accessType.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterTab === "online") return u.isOnline;
      if (filterTab === "offline") return !u.isOnline;
      if (filterTab === "admin") {
        return (
          u.name.toLowerCase() === "admin" ||
          (u.accessType && u.accessType.toLowerCase().includes("admin"))
        );
      }
      if (filterTab === "user") {
        return (
          u.name.toLowerCase() !== "admin" &&
          (!u.accessType || !u.accessType.toLowerCase().includes("admin"))
        );
      }
      return true;
    });
  }, [users, searchQuery, filterTab]);

  const formatActivityTime = (dateStr?: string) => {
    if (!dateStr) return "Sin actividad registrada";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const diffMs = Date.now() - d.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 60) return "Justo ahora";
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `Hace ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Hace ${diffHours} h`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `Hace ${diffDays} d`;
      return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const formatRegistrationDate = (dateStr?: string) => {
    if (!dateStr) return "Fecha no registrada";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  const panelContent = (
    <div className="fixed inset-0 z-[99999] bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#12151b] border border-zinc-200 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[92vh] overflow-hidden text-xs">
        {/* Encabezado Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/60 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  Directorio de Usuarios Registrados
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Crown className="w-3 h-3" />
                  <span>SUPER ADMIN</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Database className="w-3 h-3" />
                  <span>D1 SQL: antigravity_users</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Supervisa usuarios registrados, fecha exacta de registro, estado en tiempo real (online/offline) y actividad en Cloudflare D1.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
            <button
              onClick={loadUsers}
              disabled={loading}
              title="Refrescar datos en vivo"
              className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-500" : ""}`} />
              <span className="hidden sm:inline">Refrescar</span>
            </button>
            <button
              onClick={() => {
                setFormError(null);
                setSuccessMsg(null);
                setIsModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Registrar Usuario</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tarjetas KPI de Resumen */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-4 bg-zinc-50/50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800/80">
          <div className="p-3 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Usuarios</p>
              <p className="text-lg font-bold text-zinc-900 dark:text-white">{totalUsers}</p>
            </div>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">En Línea Ahora</p>
              <div className="flex items-center gap-1.5">
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{onlineUsersCount}</p>
                {onlineUsersCount > 0 && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Wifi className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Nuevos Hoy</p>
              <p className="text-lg font-bold text-sky-600 dark:text-sky-400">+{newTodayCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Proyectos Creados</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{totalProjects}</p>
            </div>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="p-3 bg-white dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, email, PIN o rol..."
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/80 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterTab("all")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                filterTab === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Todos ({totalUsers})
            </button>
            <button
              onClick={() => setFilterTab("online")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                filterTab === "online"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Online ({onlineUsersCount})</span>
            </button>
            <button
              onClick={() => setFilterTab("offline")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                filterTab === "offline"
                  ? "bg-zinc-700 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Offline ({offlineUsersCount})
            </button>
            <button
              onClick={() => setFilterTab("admin")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                filterTab === "admin"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Admins
            </button>
            <button
              onClick={() => setFilterTab("user")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                filterTab === "user"
                  ? "bg-zinc-700 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Usuarios
            </button>
          </div>
        </div>

        {/* Contenido / Tabla */}
        <div className="flex-1 overflow-y-auto">
          {loading && users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
              <Users className="w-8 h-8 mb-3 animate-pulse text-indigo-500 opacity-60" />
              <p className="text-xs">Consultando base de datos Cloudflare D1...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-14 text-rose-500">
              <AlertTriangle className="w-7 h-7 mb-2 text-rose-500" />
              <p className="text-xs font-semibold">{error}</p>
              <button
                onClick={loadUsers}
                className="mt-3 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer text-xs"
              >
                Reintentar
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
              <Users className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">No se encontraron usuarios con los criterios actuales.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/70 border-b border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="px-4 py-2.5 whitespace-nowrap">Usuario & Rol</th>
                    <th className="px-4 py-2.5 whitespace-nowrap">Estado Online</th>
                    <th className="px-4 py-2.5 whitespace-nowrap">Última Actividad</th>
                    <th className="px-4 py-2.5 whitespace-nowrap">Fecha Registro</th>
                    <th className="px-4 py-2.5 whitespace-nowrap">Email</th>
                    <th className="px-4 py-2.5 whitespace-nowrap">PIN / Clave</th>
                    <th className="px-4 py-2.5 whitespace-nowrap text-center">Proyectos</th>
                    <th className="px-4 py-2.5 whitespace-nowrap text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                  {filteredUsers.map((user) => {
                    const isSuperAdmin =
                      user.name.toLowerCase() === "admin" ||
                      (user.accessType && user.accessType.toLowerCase().includes("admin"));
                    const isSelf = currentUser && (currentUser.id === user.id || (currentUser.name?.toLowerCase() === "admin" && user.name?.toLowerCase() === "admin"));
                    const isPinVisible = showPins[user.id];

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors group"
                      >
                        {/* Usuario & Rol */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                              isSuperAdmin
                                ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700/60"
                                : "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800"
                            }`}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
                                <span>{user.name}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                    Tú
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                                  isSuperAdmin
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                                }`}>
                                  {user.accessType || (isSuperAdmin ? "Super Admin" : "Usuario")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Estado Online */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {user.isOnline ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                              </span>
                              <span>En Línea</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                              <span>Desconectado</span>
                            </span>
                          )}
                        </td>

                        {/* Última Actividad */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                            <Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <div className="flex flex-col">
                              <span className="font-medium text-[11px] truncate max-w-[200px]" title={user.lastActivity}>
                                {user.lastActivity || "Conexión a la plataforma"}
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                {formatActivityTime(user.lastActiveAt)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Fecha de Registro */}
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                          <div className="flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span className="font-mono text-[11px]">{formatRegistrationDate(user.createdAt)}</span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                          {user.email ? (
                            <div className="flex items-center space-x-1 text-zinc-700 dark:text-zinc-300">
                              <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                              <span className="truncate max-w-[150px]">{user.email}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic text-[10px]">No registrado</span>
                          )}
                        </td>

                        {/* PIN / Contraseña */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700/80 w-fit">
                            <Key className="w-3 h-3 text-zinc-400 mr-0.5" />
                            <span className="font-mono text-zinc-800 dark:text-zinc-200 tracking-wider text-[11px] select-all">
                              {isPinVisible ? user.pin : "••••••"}
                            </span>
                            <button
                              onClick={() => togglePinVisibility(user.id)}
                              title={isPinVisible ? "Ocultar PIN" : "Ver PIN"}
                              className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer ml-1"
                            >
                              {isPinVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => handleCopyPin(user.id, user.pin)}
                              title="Copiar PIN"
                              className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                            >
                              {copiedPinId === user.id ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Proyectos */}
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            <FolderGit2 className="w-3 h-3" />
                            <span>{user.projectsCount || 0}</span>
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <button
                            onClick={() => {
                              setDeleteError(null);
                              setUserToDelete(user);
                            }}
                            disabled={isSuperAdmin && user.name.toLowerCase() === "admin"}
                            title={
                              isSuperAdmin && user.name.toLowerCase() === "admin"
                                ? "La cuenta principal del Super Admin no puede ser eliminada"
                                : "Eliminar usuario de Cloudflare D1"
                            }
                            className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-colors border ${
                              isSuperAdmin && user.name.toLowerCase() === "admin"
                                ? "opacity-30 cursor-not-allowed text-zinc-400 border-zinc-200 dark:border-zinc-800"
                                : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border-rose-200 dark:border-rose-900/40 cursor-pointer"
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer con info de estado */}
        <div className="px-5 py-2.5 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/70 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>Sincronizado con Cloudflare D1 en tiempo real</span>
          </div>
          <div>
            Mostrando {filteredUsers.length} de {totalUsers} usuarios registrados
          </div>
        </div>
      </div>

      {/* Submodal Registrar Nuevo Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-5 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#151922] border border-zinc-300 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden shrink-0">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60">
              <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 text-sm">
                <UserPlus className="w-4 h-4 text-emerald-500" />
                <span>Registrar Nuevo Usuario en Cloudflare D1</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterNewUser} className="p-5 space-y-3.5">
              {formError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-500 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Nombre de Usuario <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  PIN / Contraseña Numérica (4 a 6 dígitos) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-mono tracking-widest text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[10px] text-zinc-400">PIN de acceso exclusivo entre 4 y 6 números.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Correo Electrónico <span className="text-zinc-400 font-normal">(Opcional)</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Tipo de Acceso / Rol
                </label>
                <select
                  value={accessType}
                  onChange={(e) => setAccessType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Acceso Full">Acceso Full (Estándar)</option>
                  <option value="Desarrollador">Desarrollador</option>
                  <option value="Observador">Observador</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim() || pin.length < 4}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? "Guardando en D1..." : "Guardar Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submodal Confirmar Eliminación */}
      {userToDelete && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-5 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#151922] border border-zinc-300 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden shrink-0">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-rose-50/60 dark:bg-rose-950/30">
              <h3 className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Confirmar Eliminación de Usuario</span>
              </h3>
              <button
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              {deleteError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <p className="text-xs text-zinc-700 dark:text-zinc-300">
                ¿Estás seguro de que deseas eliminar permanentemente a este usuario de la base de datos Cloudflare D1?
              </p>

              <div className="bg-zinc-50 dark:bg-zinc-900/80 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Usuario:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{userToDelete.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Correo:</span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">{userToDelete.email || "No registrado"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">PIN:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">{userToDelete.pin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Proyectos:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{userToDelete.projectsCount || 0} proyectos</span>
                </div>
              </div>

              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-600 dark:text-amber-400">
                ⚠️ <strong>Atención:</strong> Esta acción borrará permanentemente sus credenciales de acceso y desconectará cualquier sesión activa.
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  disabled={deleting}
                  className="px-3.5 py-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteUser}
                  disabled={deleting}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {deleting ? "Eliminando..." : "Sí, Eliminar Usuario"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(panelContent, document.body);
}
