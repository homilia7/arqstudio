import React, { useEffect, useState } from "react";
import { ShieldCheck, Users, Clock, Key, Database, UserPlus, X, CheckCircle2, Lock, Mail, User as UserIcon, Trash2, AlertTriangle } from "lucide-react";
import { User } from "../types";
import { fetchUsers, registerUser, deleteUser } from "../services/api";

interface AdminUsersPanelProps {
  currentUser?: User | null;
  refreshKey?: number;
}

export function AdminUsersPanel({ currentUser, refreshKey }: AdminUsersPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [refreshKey]);

  // New User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [accessType, setAccessType] = useState("Acceso Full");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Delete User Confirmation Modal State
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers(currentUser?.id, currentUser?.pin);
      setUsers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("El nombre de usuario es obligatorio.");
      return;
    }
    if (pin.length < 4 || pin.length > 6) {
      setFormError("El PIN o contraseña debe tener entre 4 y 6 dígitos.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const res = await registerUser(name, pin, email, accessType);
      if (res.success || res.user) {
        setSuccessMsg(res.message || `Usuario '${name}' registrado correctamente.`);
        setName("");
        setPin("");
        setEmail("");
        setAccessType("Acceso Full");
        loadUsers();
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccessMsg(null);
        }, res.isLocalFallback ? 8000 : 1500);
      }
    } catch (err: any) {
      setFormError(err.message || "Error al guardar el usuario en la base de datos.");
    } finally {
      setSubmitting(false);
    }
  };

  const CONFIRM_DELETE_USER = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
      loadUsers();
    } catch (err: any) {
      setDeleteError(err.message || "Error al eliminar el usuario de la base de datos.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
        <Users className="w-8 h-8 mb-4 animate-pulse opacity-50" />
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-rose-500">
        <p>{error}</p>
        <button
          onClick={loadUsers}
          className="mt-4 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm transition-colors">
      <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Panel de Administración: Usuarios</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium inline-flex items-center gap-1">
              <Database className="w-3 h-3" /> Tabla SQL: antigravity_users
            </span>
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 mt-1">
            Supervisa los accesos, credenciales y elimina usuarios registrados en la base de datos Cloudflare D1 SQL / Cloudflare D1.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-500 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
            <Users className="w-4 h-4 mr-1 text-zinc-600 dark:text-zinc-400" />
            {users.length} {users.length === 1 ? "Usuario" : "Usuarios"}
          </div>
          <button
            onClick={() => {
              setFormError(null);
              setSuccessMsg(null);
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Usuario</span>
          </button>
        </div>
      </div>

      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 font-semibold uppercase tracking-wider">
              <th className="px-6 py-3 whitespace-nowrap">Nombre de Usuario</th>
              <th className="px-6 py-3 whitespace-nowrap">Correo Electrónico</th>
              <th className="px-6 py-3 whitespace-nowrap">PIN / Contraseña</th>
              <th className="px-6 py-3 whitespace-nowrap">API Key</th>
              <th className="px-6 py-3 whitespace-nowrap">Fecha de Registro</th>
              <th className="px-6 py-3 whitespace-nowrap text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-600 dark:text-zinc-400">
                  No hay usuarios registrados en la base de datos.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold mr-3 border border-indigo-200 dark:border-indigo-800">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      {user.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-600 dark:text-zinc-600 dark:text-zinc-400">
                    {user.email ? user.email : <span className="text-zinc-600 dark:text-zinc-400 italic">No proporcionado</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-zinc-600 dark:text-zinc-300 font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded inline-flex border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200">
                      <Key className="w-3 h-3 mr-1.5 opacity-60" />
                      {user.pin}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-mono text-xs bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded inline-flex border border-indigo-200 dark:border-indigo-800">
                      {user.apiKey || `arqai_sec_${user.pin || "1234"}_${(user.id || "usr").slice(-4)}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-500 dark:text-zinc-600 dark:text-zinc-400 text-xs">
                    <div className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 opacity-60" />
                      {user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => {
                        setDeleteError(null);
                        setUserToDelete(user);
                      }}
                      title="Eliminar usuario"
                      className="inline-flex items-center justify-center p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer border border-rose-200 dark:border-rose-900/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para Registrar Nuevo Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-3 sm:p-5 pt-4 sm:pt-10 overflow-y-auto bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden shrink-0">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-100/50 dark:bg-zinc-900/50">
              <h3 className="font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2 text-base">
                <UserPlus className="w-5 h-5 text-emerald-500" />
                Registrar Nuevo Usuario en SQL
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterNewUser} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-500 flex items-center gap-2">
                  <span>{formError}</span>
                </div>
              )}

              {successMsg && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  successMsg.includes("ALERTA") 
                  ? "bg-amber-500/10 border border-amber-500/20 text-amber-500" 
                  : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                }`}>
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${successMsg.includes("ALERTA") ? "text-amber-500" : "text-emerald-500"}`} />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Nombre de Usuario <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. María Rodríguez"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  PIN / Contraseña (hasta 6 dígitos) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-600 dark:text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm font-mono tracking-widest text-zinc-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Correo Electrónico <span className="text-zinc-600 dark:text-zinc-400 font-normal">(Opcional)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-600 dark:text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Tipo de Acceso
                </label>
                <select
                  value={accessType}
                  onChange={(e) => setAccessType(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Acceso Full">Acceso Full</option>
                  <option value="Desarrollador">Desarrollador</option>
                  <option value="Observador">Observador</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-zinc-600 dark:text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim() || pin.length !== 4}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? "Guardando en SQL..." : "Guardar Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Eliminar Usuario (Posicionado Arriba en Pantalla) */}
      {userToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-3 sm:p-5 pt-4 sm:pt-10 overflow-y-auto bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-100 dark:bg-zinc-900 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden shrink-0 animate-scale-up">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-rose-50/50 dark:bg-rose-950/30">
              <h3 className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 text-base">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Confirmar Eliminación de Usuario</span>
              </h3>
              <button
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {deleteError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-500 flex items-center gap-2">
                  <span>{deleteError}</span>
                </div>
              )}

              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                ¿Estás seguro de que deseas eliminar a este usuario de la plataforma?
              </p>

              <div className="bg-zinc-100 dark:bg-zinc-800/60 p-4 rounded-xl border border-zinc-300 dark:border-zinc-700 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-600 dark:text-zinc-400">Usuario:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-100">{userToDelete.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-600 dark:text-zinc-400">Correo:</span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-mono">{userToDelete.email || "No registrado"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-600 dark:text-zinc-400">PIN:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">{userToDelete.pin}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-600 dark:text-amber-400">
                ⚠️ <strong>Atención:</strong> Esta acción eliminará permanentemente las credenciales y el acceso del usuario en la base de datos SQL. No se podrá deshacer.
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  disabled={deleting}
                  className="px-4 py-2 text-zinc-600 dark:text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={CONFIRM_DELETE_USER}
                  disabled={deleting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
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
}

