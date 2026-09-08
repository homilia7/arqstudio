import React, { useEffect, useState, useMemo } from "react";
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
  FolderGit2,
  Crown,
  HardDrive,
  BarChart2,
  PieChart,
  ArrowUpDown,
  FileCode,
  Layers,
  Sparkles,
  Info,
  MessageSquare,
  Bell,
  ArrowLeft,
} from "lucide-react";
import { User, DatabaseStorageStats } from "../types";
import { fetchUsers, registerUser, deleteUser, fetchDatabaseStorageStats, cleanMockData } from "../services/api";

interface AdminUsersPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  currentUser?: User | null;
  refreshKey?: number;
}

function formatBytesPrecise(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function AdminUsersPanel({
  isOpen = true,
  onClose,
  currentUser,
  refreshKey,
}: AdminUsersPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [dbStats, setDbStats] = useState<DatabaseStorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "online" | "offline" | "admin" | "user">("all");
  const [sortByStorage, setSortByStorage] = useState<boolean>(false);
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  // Modal para ver desglose de almacenamiento del usuario
  const [userForStorageDetail, setUserForStorageDetail] = useState<User | null>(null);

  // Modal para ver desglose global de la base de datos
  const [isDbBreakdownOpen, setIsDbBreakdownOpen] = useState(false);

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
  const [deleteSuccessNotice, setDeleteSuccessNotice] = useState<string | null>(null);

  const [cleaningMock, setCleaningMock] = useState(false);

  const handleCleanMockData = async () => {
    if (!window.confirm("¿Deseas purgar de la base de datos todos los chats de prueba y registros de conexión simulados? Solo quedarán datos 100% reales.")) {
      return;
    }
    setCleaningMock(true);
    try {
      await cleanMockData();
      await loadData();
      alert("✅ Datos de prueba y simulados purgados exitosamente. Las cuentas están 100% limpias.");
    } catch (err: any) {
      alert("Error al limpiar datos: " + (err.message || err));
    } finally {
      setCleaningMock(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, refreshKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        fetchUsers(currentUser?.id, currentUser?.pin),
        fetchDatabaseStorageStats(),
      ]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      if (statsData) setDbStats(statsData);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al cargar los datos del panel.");
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
        await loadData();
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
      const deletedName = userToDelete.name;
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
      setDeleteSuccessNotice(`✅ El usuario '${deletedName}' y todos sus datos asociados fueron eliminados permanentemente.`);
      setTimeout(() => setDeleteSuccessNotice(null), 4500);
      await loadData();
    } catch (err: any) {
      setDeleteError(err.message || "Error al eliminar el usuario de la base de datos.");
    } finally {
      setDeleting(false);
    }
  };

  // KPIs
  const totalUsers = users.length;
  const onlineUsersCount = useMemo(() => users.filter((u) => u.isOnline).length, [users]);
  const totalProjects = useMemo(() => users.reduce((acc, u) => acc + (u.projectsCount || 0), 0), [users]);
  const newTodayCount = useMemo(() => {
    const today = new Date().toDateString();
    return users.filter((u) => u.createdAt && new Date(u.createdAt).toDateString() === today).length;
  }, [users]);

  // Almacenamiento total acumulado de todos los usuarios
  const totalAccumulatedUserBytes = useMemo(() => {
    return users.reduce((acc, u) => acc + (u.storage?.totalBytes || 0), 0);
  }, [users]);

  // Filtrado y ordenamiento de usuarios
  const filteredAndSortedUsers = useMemo(() => {
    let result = users.filter((u) => {
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

    if (sortByStorage) {
      result = [...result].sort((a, b) => (b.storage?.totalBytes || 0) - (a.storage?.totalBytes || 0));
    }

    return result;
  }, [users, searchQuery, filterTab, sortByStorage]);

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
    <div className="flex-1 w-full bg-zinc-50 dark:bg-[#07090c] text-zinc-800 dark:text-zinc-200 flex flex-col overflow-y-auto animate-fade-in pb-12">
      {/* Barra de navegación superior / Breadcrumb */}
      <div className="bg-white/90 dark:bg-[#0b0d10]/90 backdrop-blur-sm border-b border-zinc-200 dark:border-[#1c2027] px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors font-semibold text-xs cursor-pointer group shadow-2xs"
              title="Volver a los Proyectos y Flujo de Trabajo"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 text-indigo-500" />
              <span>← Volver al Espacio de Trabajo</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="text-zinc-400 font-mono">AgentOS</span>
            <span>/</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">Panel de Administración</span>
            <span>/</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900/60 text-[11px]">
              Directorio & Base de Datos SQL
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 font-mono hidden md:inline">Entorno Cloudflare D1 Serverless</span>
        </div>
      </div>

      {/* Main Page Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        <div className="bg-white dark:bg-[#12151b] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col text-xs">
          {/* Encabezado Superior */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/60 gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 rounded-xl flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
                    Directorio de Usuarios & Consumo Real de Base de Datos
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <Crown className="w-3 h-3" />
                    <span>SUPER ADMIN</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Database className="w-3 h-3" />
                    <span>Cloudflare D1 SQL</span>
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Supervisa el almacenamiento real consumido por cada usuario, capacidad total acumulada y actividad en tiempo real.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setIsDbBreakdownOpen(true)}
                className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="Ver desglose completo de tablas en Cloudflare D1"
              >
                <PieChart className="w-3.5 h-3.5 text-indigo-500" />
                <span>Desglose D1</span>
              </button>
              <button
                onClick={handleCleanMockData}
                disabled={cleaningMock}
                title="Purgar chats de prueba y datos simulados de Cloudflare D1"
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className={`w-3.5 h-3.5 ${cleaningMock ? "animate-spin" : ""}`} />
                <span className="hidden md:inline">Purgar Simulados</span>
              </button>
              <button
                onClick={loadData}
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
                  title="Volver al Espacio de Trabajo / Proyectos"
                  className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Volver</span>
                </button>
              )}
            </div>
          </div>

        {/* MONITOR PRINCIPAL: Capacidad Real & Almacenamiento Acumulado de la Base de Datos */}
        <div className="p-4 bg-gradient-to-r from-indigo-50/50 via-zinc-50 to-purple-50/50 dark:from-indigo-950/20 dark:via-zinc-900/40 dark:to-purple-950/20 border-b border-zinc-200 dark:border-zinc-800/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm shrink-0">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                    Almacenamiento Acumulado en Base de Datos D1
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold">
                    {dbStats?.totalStorageFormatted || "Calculando..."} utilizado
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Capacidad de este Proyecto: <strong className="text-zinc-700 dark:text-zinc-300 font-mono">{dbStats?.maxCapacityFormatted || "500.0 MB"} (Cloudflare Free Tier)</strong> • Acumulado total de usuarios: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{formatBytesPrecise(totalAccumulatedUserBytes)}</strong> • Consumo total en D1: <strong className="text-purple-600 dark:text-purple-400 font-mono">{dbStats?.totalStorageFormatted || "0 B"}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Uso Real de 500 MB
                </span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {dbStats ? `${dbStats.usagePercentage.toFixed(4)}%` : "0.00%"}
                </span>
              </div>
              <button
                onClick={() => setIsDbBreakdownOpen(true)}
                className="px-2.5 py-1.5 bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer border border-indigo-200 dark:border-zinc-700 flex items-center gap-1.5 text-xs font-semibold shadow-xs"
                title="Ver desglose general de todas las tablas de la base de datos"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Desglose Global D1</span>
              </button>
            </div>
          </div>

          {/* Barra de Progreso Visual de Capacidad hacia 500 MB */}
          <div className="space-y-1.5">
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(
                    0.6,
                    Math.min(100, dbStats?.usagePercentage || 0)
                  )}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10.5px] text-zinc-500 dark:text-zinc-400 font-mono">
              <span>0 MB</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200/60 dark:border-indigo-800/60">
                {dbStats?.totalStorageFormatted || formatBytesPrecise(totalAccumulatedUserBytes)} consumidos de {dbStats?.maxCapacityFormatted || "500.0 MB"}
              </span>
              <span>{dbStats?.maxCapacityFormatted || "500.0 MB"} límite</span>
            </div>
          </div>

          {/* Pastillas de Resumen por Tipo de Datos */}
          <div className="flex items-center gap-2 mt-2.5 overflow-x-auto text-[11px] text-zinc-600 dark:text-zinc-400">
            <span className="text-[10px] uppercase font-bold text-zinc-400 mr-1">Tablas SQL:</span>
            {dbStats?.tables.map((tbl) => (
              <span
                key={tbl.name}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0 font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>{tbl.displayName}:</span>
                <strong className="text-zinc-900 dark:text-zinc-200 font-mono">{tbl.formatted}</strong>
              </span>
            ))}
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
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Usuarios (Datos)</p>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                {formatBytesPrecise(totalAccumulatedUserBytes)}
              </p>
              <span className="text-[10px] text-zinc-400">Acumulado real</span>
            </div>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Base Datos (D1)</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400 font-mono">
                {dbStats?.totalStorageFormatted || "0 B"}
              </p>
              <span className="text-[10px] text-zinc-400">de {dbStats?.maxCapacityFormatted || "500.0 MB"} asignados</span>
            </div>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Notificación de eliminación exitosa */}
        {deleteSuccessNotice && (
          <div className="mx-5 my-2.5 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between animate-fade-in shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span className="font-medium">{deleteSuccessNotice}</span>
            </div>
            <button
              onClick={() => setDeleteSuccessNotice(null)}
              className="p-1 hover:bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 cursor-pointer transition"
              title="Cerrar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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
              Offline
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

            {/* Botón de Ordenar por Consumo de Almacenamiento */}
            <button
              onClick={() => setSortByStorage(!sortByStorage)}
              className={`ml-2 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 border ${
                sortByStorage
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/80 dark:border-indigo-700 dark:text-indigo-300 font-bold"
                  : "bg-zinc-100 border-zinc-200 dark:bg-zinc-800/70 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
              }`}
              title="Ordenar por usuarios con mayor consumo de almacenamiento en la base de datos"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>{sortByStorage ? "Orden: Mayor Consumo" : "Ordenar por Consumo"}</span>
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
                onClick={loadData}
                className="mt-3 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer text-xs"
              >
                Reintentar
              </button>
            </div>
          ) : filteredAndSortedUsers.length === 0 ? (
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
                    <th className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                        <HardDrive className="w-3 h-3" />
                        <span>Consumo en Base de Datos</span>
                      </div>
                    </th>
                    <th className="px-4 py-2.5 whitespace-nowrap">Última Actividad</th>
                    <th className="px-4 py-2.5 whitespace-nowrap">Fecha Registro</th>
                    <th className="px-4 py-2.5 whitespace-nowrap">Email</th>
                    <th className="px-4 py-2.5 whitespace-nowrap">PIN / Clave</th>
                    <th className="px-4 py-2.5 whitespace-nowrap text-center">Proyectos</th>
                    <th className="px-4 py-2.5 whitespace-nowrap text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                  {filteredAndSortedUsers.map((user) => {
                    const isProtectedAdmin = user.id === "usr-admin-1" || user.name.toLowerCase() === "admin";
                    const isSuperAdmin =
                      isProtectedAdmin ||
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

                        {/* Consumo Real en Base de Datos */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setUserForStorageDetail(user)}
                              className="text-left group/storage hover:opacity-90 transition-opacity cursor-pointer p-1 -m-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                              title="Haz clic para abrir el desglose detallado de este usuario"
                            >
                              <div className="flex items-center space-x-1.5">
                                <span className="font-mono font-bold text-zinc-900 dark:text-white text-xs group-hover/storage:text-indigo-600 dark:group-hover/storage:text-indigo-400 transition-colors">
                                  {user.storage ? formatBytesPrecise(user.storage.totalBytes) : "0 B"}
                                </span>
                                {(!user.storage || user.storage.totalBytes === 0) ? (
                                  <span className="text-[9.5px] font-mono text-zinc-400 dark:text-zinc-500 font-medium bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded border border-zinc-200 dark:border-zinc-700">
                                    Limpio
                                  </span>
                                ) : (
                                  <span className="text-[9.5px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-200 dark:border-indigo-800" title={`Representa el ${user.storage.percentageOfDb}% de los datos activos`}>
                                    {user.storage.percentageOfDb}% activo
                                  </span>
                                )}
                              </div>
                              {/* Barra relativa de almacenamiento */}
                              <div className="w-28 bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 mt-1 overflow-hidden">
                                <div
                                  className="bg-indigo-500 h-1.5 rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(100, Math.max((user.storage?.totalBytes || 0) > 0 ? 5 : 0, user.storage?.percentageOfDb || 0))}%`,
                                  }}
                                />
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setUserForStorageDetail(user)}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors cursor-pointer border border-indigo-200/80 dark:border-indigo-800/80 flex items-center gap-1 text-[10px] font-semibold shrink-0"
                              title="Ver desglose detallado de consumo"
                            >
                              <Info className="w-3 h-3 text-indigo-500" />
                              <span>Desglose</span>
                            </button>
                          </div>
                        </td>

                        {/* Última Actividad */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                            <Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <div className="flex flex-col">
                              <span className="font-medium text-[11px] truncate max-w-[190px]" title={user.lastActivity}>
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
                              <span className="truncate max-w-[140px]">{user.email}</span>
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
                            disabled={isProtectedAdmin}
                            title={
                              isProtectedAdmin
                                ? "La cuenta principal del Super Admin no puede ser eliminada"
                                : `Eliminar usuario '${user.name}' de Cloudflare D1`
                            }
                            className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-colors border ${
                              isProtectedAdmin
                                ? "opacity-25 cursor-not-allowed text-zinc-400 border-zinc-200 dark:border-zinc-800"
                                : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border-rose-200 dark:border-rose-900/40 cursor-pointer hover:shadow-xs"
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

        {/* Footer con info de estado y total acumulado */}
        <div className="px-5 py-2.5 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/70 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>Sincronizado con Cloudflare D1 SQL en tiempo real</span>
            <span>Total Usuarios: <strong className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">{formatBytesPrecise(totalAccumulatedUserBytes)}</strong></span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span>Total DB: <strong className="text-purple-600 dark:text-purple-400 font-mono font-bold">{dbStats?.totalStorageFormatted || "Calculando..."}</strong> ({dbStats ? `${dbStats.usagePercentage.toFixed(4)}%` : "0%"} de {dbStats?.maxCapacityFormatted || "500.0 MB"})</span>
          </div>
          <div>
            Mostrando {filteredAndSortedUsers.length} de {totalUsers} usuarios registrados
          </div>
        </div>
      </div>

      {/* Submodal Desglose de Consumo por Usuario */}
      {userForStorageDetail && (() => {
        const uTotal = userForStorageDetail.storage?.totalBytes || 0;
        const bk = userForStorageDetail.storage?.breakdown;
        const counts = userForStorageDetail.storage?.counts;

        const projBytes = bk?.projectsBytes || 0;
        const tasksBytes = bk?.tasksBytes || 0;
        const chatBytes = bk?.chatBytes || 0;
        const connsBytes = bk?.connectionsBytes || 0;
        const histBytes = bk?.historyBytes || 0;
        const notifBytes = bk?.notificationsBytes || 0;
        const profBytes = bk?.userProfileBytes || 0;

        const calcPercent = (bytes: number) => {
          if (!uTotal || !bytes) return "0.0";
          return ((bytes / uTotal) * 100).toFixed(1);
        };

        const projPct = parseFloat(calcPercent(projBytes));
        const tasksPct = parseFloat(calcPercent(tasksBytes));
        const chatPct = parseFloat(calcPercent(chatBytes));
        const connsPct = parseFloat(calcPercent(connsBytes));
        const histPct = parseFloat(calcPercent(histBytes));
        const notifPct = parseFloat(calcPercent(notifBytes));
        const profPct = parseFloat(calcPercent(profBytes));

        return (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-xs animate-fade-in">
            <div className="bg-white dark:bg-[#151922] border border-zinc-300 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-[340px] w-full overflow-hidden shrink-0">
              {/* Header compacto */}
              <div className="px-3.5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/70">
                <div className="flex items-center space-x-2 min-w-0">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="font-bold text-zinc-900 dark:text-white text-xs truncate">
                    Desglose: <span className="text-indigo-600 dark:text-indigo-400">{userForStorageDetail.name}</span>
                  </span>
                </div>
                <button
                  onClick={() => setUserForStorageDetail(null)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 space-y-2.5">
                {/* Tarjeta Resumen y Barra Multicolor */}
                <div className="p-2.5 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[8.5px] uppercase font-bold text-zinc-500 dark:text-zinc-400 block leading-tight">
                        Consumo Usuario
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                          {userForStorageDetail.storage ? formatBytesPrecise(uTotal) : "0 B"}
                        </span>
                        <span className="text-[9px] text-zinc-400 font-mono">
                          ({uTotal} B)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[8.5px] uppercase font-bold text-zinc-500 dark:text-zinc-400 block leading-tight">
                        Impacto DB
                      </span>
                      <div className="flex items-baseline justify-end gap-1 mt-0.5">
                        <span className="text-sm font-black text-purple-600 dark:text-purple-400 font-mono">
                          {userForStorageDetail.storage?.percentageOfDb || 0}%
                        </span>
                        <span className="text-[9px] text-zinc-400 font-mono">
                          de {dbStats?.totalStorageFormatted || "DB activa"}
                        </span>
                      </div>
                      <div className="text-[8.5px] text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                        {((uTotal / (500 * 1024 * 1024)) * 100).toFixed(4)}% de 500 MB
                      </div>
                    </div>
                  </div>

                  {/* Barra Segmentada Multicolor */}
                  <div className="space-y-1">
                    <div className="w-full h-1.5 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex shadow-inner">
                      {projPct > 0 && <div style={{ width: `${projPct}%` }} className="bg-purple-500 h-full" />}
                      {tasksPct > 0 && <div style={{ width: `${tasksPct}%` }} className="bg-indigo-500 h-full" />}
                      {chatPct > 0 && <div style={{ width: `${chatPct}%` }} className="bg-blue-500 h-full" />}
                      {connsPct > 0 && <div style={{ width: `${connsPct}%` }} className="bg-emerald-500 h-full" />}
                      {histPct > 0 && <div style={{ width: `${histPct}%` }} className="bg-amber-500 h-full" />}
                      {notifPct > 0 && <div style={{ width: `${notifPct}%` }} className="bg-rose-500 h-full" />}
                      {profPct > 0 && <div style={{ width: `${profPct}%` }} className="bg-zinc-500 h-full" />}
                    </div>

                    {/* Mini Etiquetas de categorías activas */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[8.5px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                      {projPct > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          <span>Proyectos ({projPct}%)</span>
                        </span>
                      )}
                      {tasksPct > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <span>Tareas ({tasksPct}%)</span>
                        </span>
                      )}
                      {chatPct > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span>Chat ({chatPct}%)</span>
                        </span>
                      )}
                      {connsPct > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Conexiones ({connsPct}%)</span>
                        </span>
                      )}
                      {histPct > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>Historial ({histPct}%)</span>
                        </span>
                      )}
                      {notifPct > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>Notif. ({notifPct}%)</span>
                        </span>
                      )}
                      {profPct > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                          <span>Perfil ({profPct}%)</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lista detallada de consumos por tabla */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[9px] text-zinc-400 font-bold uppercase tracking-wider px-1 mb-0.5">
                    <span>Tabla / Tipo de Dato</span>
                    <span>Consumo</span>
                  </div>

                  {/* 1. Proyectos */}
                  <div className="px-2.5 py-1 bg-zinc-50/80 dark:bg-zinc-900/60 rounded-md border border-zinc-200/70 dark:border-zinc-800/70 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FolderGit2 className="w-3 h-3 text-purple-500 shrink-0" />
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 text-[10.5px] truncate">
                        Proyectos & Blueprint
                      </span>
                      <span className="text-[9px] text-zinc-400 font-mono shrink-0">({counts?.projects || 0})</span>
                    </div>
                    <div className="text-right shrink-0 pl-1">
                      {projBytes > 0 ? (
                        <span className="font-mono text-[10.5px] font-bold text-zinc-900 dark:text-zinc-100">
                          {formatBytesPrecise(projBytes)} <span className="text-[9px] font-normal text-purple-600 dark:text-purple-400">({projPct}%)</span>
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">-</span>
                      )}
                    </div>
                  </div>

                  {/* 2. Tareas */}
                  <div className="px-2.5 py-1 bg-zinc-50/80 dark:bg-zinc-900/60 rounded-md border border-zinc-200/70 dark:border-zinc-800/70 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileCode className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 text-[10.5px] truncate">
                        Tareas & Entregables
                      </span>
                      <span className="text-[9px] text-zinc-400 font-mono shrink-0">({counts?.tasks || 0})</span>
                    </div>
                    <div className="text-right shrink-0 pl-1">
                      {tasksBytes > 0 ? (
                        <span className="font-mono text-[10.5px] font-bold text-zinc-900 dark:text-zinc-100">
                          {formatBytesPrecise(tasksBytes)} <span className="text-[9px] font-normal text-indigo-600 dark:text-indigo-400">({tasksPct}%)</span>
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">-</span>
                      )}
                    </div>
                  </div>

                  {/* 3. Historial Chat */}
                  <div className="px-2.5 py-1 bg-zinc-50/80 dark:bg-zinc-900/60 rounded-md border border-zinc-200/70 dark:border-zinc-800/70 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MessageSquare className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 text-[10.5px] truncate">
                        Historial de Chat & IA
                      </span>
                      <span className="text-[9px] text-zinc-400 font-mono shrink-0">({counts?.chatAudits || 0})</span>
                    </div>
                    <div className="text-right shrink-0 pl-1">
                      {chatBytes > 0 ? (
                        <span className="font-mono text-[10.5px] font-bold text-zinc-900 dark:text-zinc-100">
                          {formatBytesPrecise(chatBytes)} <span className="text-[9px] font-normal text-blue-600 dark:text-blue-400">({chatPct}%)</span>
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">-</span>
                      )}
                    </div>
                  </div>

                  {/* 4. Conexiones */}
                  <div className="px-2.5 py-1 bg-zinc-50/80 dark:bg-zinc-900/60 rounded-md border border-zinc-200/70 dark:border-zinc-800/70 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Activity className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 text-[10.5px] truncate">
                        Conexiones & Actividad
                      </span>
                      <span className="text-[9px] text-zinc-400 font-mono shrink-0">({counts?.connections || 0})</span>
                    </div>
                    <div className="text-right shrink-0 pl-1">
                      {connsBytes > 0 ? (
                        <span className="font-mono text-[10.5px] font-bold text-zinc-900 dark:text-zinc-100">
                          {formatBytesPrecise(connsBytes)} <span className="text-[9px] font-normal text-emerald-600 dark:text-emerald-400">({connsPct}%)</span>
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">-</span>
                      )}
                    </div>
                  </div>

                  {/* 5. Historial de Cambios */}
                  <div className="px-2.5 py-1 bg-zinc-50/80 dark:bg-zinc-900/60 rounded-md border border-zinc-200/70 dark:border-zinc-800/70 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 text-[10.5px] truncate">
                        Historial de Cambios
                      </span>
                      <span className="text-[9px] text-zinc-400 font-mono shrink-0">({counts?.history || 0})</span>
                    </div>
                    <div className="text-right shrink-0 pl-1">
                      {histBytes > 0 ? (
                        <span className="font-mono text-[10.5px] font-bold text-zinc-900 dark:text-zinc-100">
                          {formatBytesPrecise(histBytes)} <span className="text-[9px] font-normal text-amber-600 dark:text-amber-400">({histPct}%)</span>
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">-</span>
                      )}
                    </div>
                  </div>

                  {/* 6. Notificaciones */}
                  <div className="px-2.5 py-1 bg-zinc-50/80 dark:bg-zinc-900/60 rounded-md border border-zinc-200/70 dark:border-zinc-800/70 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Bell className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 text-[10.5px] truncate">
                        Notificaciones
                      </span>
                      <span className="text-[9px] text-zinc-400 font-mono shrink-0">({counts?.notifications || 0})</span>
                    </div>
                    <div className="text-right shrink-0 pl-1">
                      {notifBytes > 0 ? (
                        <span className="font-mono text-[10.5px] font-bold text-zinc-900 dark:text-zinc-100">
                          {formatBytesPrecise(notifBytes)} <span className="text-[9px] font-normal text-rose-600 dark:text-rose-400">({notifPct}%)</span>
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">-</span>
                      )}
                    </div>
                  </div>

                  {/* 7. Perfil & Credenciales SQL */}
                  <div className="px-2.5 py-1 bg-zinc-50/80 dark:bg-zinc-900/60 rounded-md border border-zinc-200/70 dark:border-zinc-800/70 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <UserIcon className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 text-[10.5px] truncate">
                        Perfil & Credenciales SQL
                      </span>
                      <span className="text-[9px] text-zinc-400 font-mono shrink-0">(D1)</span>
                    </div>
                    <div className="text-right shrink-0 pl-1">
                      {profBytes > 0 ? (
                        <span className="font-mono text-[10.5px] font-bold text-zinc-900 dark:text-zinc-100">
                          {formatBytesPrecise(profBytes)} <span className="text-[9px] font-normal text-indigo-600 dark:text-indigo-400">({profPct}%)</span>
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">-</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Suma total: <strong className="font-mono text-zinc-700 dark:text-zinc-300 font-bold">{formatBytesPrecise(uTotal)}</strong>
                  </span>
                  <button
                    onClick={() => setUserForStorageDetail(null)}
                    className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Submodal Desglose Global de la Base de Datos Cloudflare D1 */}
      {isDbBreakdownOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-5 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#151922] border border-zinc-300 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden shrink-0">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60">
              <div className="flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm">
                  Desglose de Capacidad & Tablas Cloudflare D1 SQL
                </h3>
              </div>
              <button
                onClick={() => setIsDbBreakdownOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/80 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Total Almacenado:</span>
                  <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {dbStats?.totalStorageFormatted || "0 B"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Límite BD (Este Proyecto):</span>
                  <p className="text-lg font-black text-zinc-800 dark:text-zinc-100 font-mono">
                    {dbStats?.maxCapacityFormatted || "500.0 MB"}
                  </p>
                  <span className="text-[10px] text-zinc-400 font-mono">Cloudflare Free Tier</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-[11px] uppercase tracking-wider">
                  Tablas SQL en D1 Serverless:
                </h4>

                {dbStats?.tables.map((tbl) => (
                  <div
                    key={tbl.name}
                    className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{tbl.displayName}</span>
                        <span className="text-[10px] font-mono text-zinc-400">({tbl.name})</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-zinc-400 font-mono">{tbl.rows} filas</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{tbl.formatted}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">({tbl.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full"
                        style={{ width: `${Math.max(1, tbl.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setIsDbBreakdownOpen(false)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

              <div className="bg-zinc-50 dark:bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Usuario:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{userToDelete.name}</span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                      {userToDelete.accessType || "Usuario"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Correo Electrónico:</span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">{userToDelete.email || "No registrado"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">PIN de Acceso:</span>
                  <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-200/60 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[11px]">{userToDelete.pin}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Proyectos Asociados:</span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{userToDelete.projectsCount || 0} proyectos</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Almacenamiento a Liberar:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {userToDelete.storage?.formatted || "0 B"} ({userToDelete.storage?.percentageOfDb || 0}% de DB)
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-[11px] text-amber-700 dark:text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Acción irreversible en Cloudflare D1:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-200/90">
                  Esta acción eliminará de forma permanente las credenciales del usuario, todos sus proyectos y tareas asociadas, liberando su almacenamiento ocupado en la base de datos SQL.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  disabled={deleting}
                  className="px-3.5 py-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteUser}
                  disabled={deleting}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {deleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Eliminando de D1...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Sí, Eliminar Usuario</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );

  return panelContent;
}
