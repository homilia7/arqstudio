import React, { useState, useEffect } from 'react';
import { X, User, Mail, Calendar, Shield, CheckCircle2, LogOut, KeyRound, Eye, EyeOff, Copy, Check } from 'lucide-react';
import * as api from '../services/api';

interface MyAccountProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onUpdateUser: (user: any) => void;
  onLogout?: () => void;
}

export const MyAccount: React.FC<MyAccountProps> = ({ isOpen, onClose, user, onUpdateUser, onLogout }) => {
  const activeUser = user || {
    id: "usr-admin-1",
    name: "Super Admin",
    email: "admin@arqai.dev",
    pin: "1234",
    accessType: "admin",
    createdAt: new Date().toISOString(),
  };

  const [email, setEmail] = useState(activeUser?.email || '');
  const [pin, setPin] = useState(activeUser?.pin || '');
  const [showPin, setShowPin] = useState(true);
  const [copiedPin, setCopiedPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (activeUser?.email) {
      setEmail(activeUser.email);
    }
    if (activeUser?.pin) {
      setPin(activeUser.pin);
    } else if (activeUser?.id) {
      api.getUserProfile(activeUser.id).then((res) => {
        if (res?.user?.pin) {
          setPin(res.user.pin);
          onUpdateUser({ ...activeUser, pin: res.user.pin });
        }
      }).catch(() => {});
    }
  }, [activeUser?.id, activeUser?.pin, activeUser?.email]);

  if (!isOpen) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg('');
    try {
      const res = await api.updateUserEmail(activeUser.id, email);
      if (res.success || res.user) {
        onUpdateUser(res.user || { ...activeUser, email });
        setSuccessMsg('Correo actualizado correctamente');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      alert(err.message || "Error al actualizar correo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPin = () => {
    if (!pin) return;
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Reciente';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-zinc-950/80 backdrop-blur-md flex items-start justify-center p-4 pt-14 sm:pt-20 overflow-y-auto">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl shadow-2xl overflow-hidden text-xs shrink-0">
        {/* Header Compacto */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <h2 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
            <User className="w-4 h-4 text-indigo-400" /> Mi Cuenta
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo Compacto */}
        <div className="p-3.5 space-y-3">
          {/* Ficha de Usuario y PIN */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-950/60 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Usuario</p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">{activeUser.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Rol</p>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-1.5 py-0.5 rounded">
                  {activeUser.accessType || 'user'}
                </span>
              </div>
            </div>

            {/* PIN de Acceso */}
            <div className="p-2.5 bg-indigo-50/40 dark:bg-zinc-950/80 rounded-lg border border-indigo-200 dark:border-indigo-500/30">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                    PIN de Acceso (4 Dígitos)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="p-0.5 px-1.5 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-transparent transition text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPin ? "Ocultar" : "Ver"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPin}
                    disabled={!pin}
                    className="p-0.5 px-1.5 text-zinc-700 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-300 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-transparent transition text-[10px] flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    {copiedPin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPin ? "Copiado" : "Copiar"}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded border border-indigo-200 dark:border-indigo-500/20 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  {(pin || activeUser.pin || '1234').split('').slice(0, 4).map((digit: string, idx: number) => (
                    <span
                      key={idx}
                      className="w-6 h-7 rounded bg-indigo-50 dark:bg-zinc-950 border border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-sm flex items-center justify-center"
                    >
                      {showPin ? digit : '•'}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400 text-right">
                  Clave personal de acceso
                </span>
              </div>
            </div>

            {/* Fecha de Registro */}
            <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-950/40 rounded border border-zinc-200 dark:border-zinc-800/80">
              <Calendar className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400 shrink-0" />
              <span className="text-[10px] text-zinc-600 dark:text-zinc-400">Registrado el:</span>
              <span className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200">{formatDate(activeUser.createdAt)}</span>
            </div>
          </div>

          {/* Formulario de Actualizar Correo */}
          <form onSubmit={handleUpdate} className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <div>
              <label className="block text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-indigo-500 text-xs"
                  placeholder="tu@correo.com"
                />
              </div>
            </div>

            {successMsg && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || email === (activeUser.email || '')}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-md transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isLoading ? 'Guardando...' : 'Guardar Correo'}
            </button>
          </form>

          {/* Cerrar Sesión */}
          {onLogout && (
            <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onLogout) onLogout();
                }}
                className="w-full py-2 px-3 rounded-md border border-rose-200 hover:border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:border-red-500/30 dark:hover:border-red-500/60 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 dark:hover:text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
