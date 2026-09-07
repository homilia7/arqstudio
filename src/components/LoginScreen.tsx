import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck, Mail, UserPlus, LogIn, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import * as api from '../services/api';

interface LoginScreenProps {
  onLogin: (user: any) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const resetForm = () => {
    setError('');
    setSuccessMessage('');
  };

  const triggerLoginSuccess = (user: any, msg: string) => {
    setSuccessMessage(msg);
    setIsExiting(true);
    setTimeout(() => {
      onLogin(user);
    }, 500);
  };

  // 1. INICIAR SESIÓN (NOMBRE + PIN)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Ingresa tu nombre de usuario.');
      return;
    }
    if (pin.length !== 4) {
      setError('El PIN debe tener 4 dígitos.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await api.loginUser(cleanName, pin, email);
      if (res.success && res.user) {
        triggerLoginSuccess(res.user, `¡Bienvenido, ${res.user.name}!`);
      } else {
        setError(res.error || 'Credenciales no válidas.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Verifica tu nombre y PIN.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. CREAR CUENTA NUEVA
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Ingresa un nombre de usuario.');
      return;
    }
    if (pin.length !== 4) {
      setError('El PIN debe tener 4 dígitos.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await api.registerUser(cleanName, pin, email);
      if (res.success && res.user) {
        triggerLoginSuccess(res.user, `¡Cuenta creada para ${res.user.name}!`);
      } else {
        setError(res.error || 'No se pudo crear la cuenta.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario en la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAdmin = () => {
    setName('admin');
    setPin('1234');
    setError('');
  };

  return (
    <div className={`min-h-screen bg-[#07090c] flex flex-col items-center justify-center p-3 transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
      <div className="w-full max-w-[340px] bg-white dark:bg-[#0e1117] border border-zinc-200 dark:border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl text-zinc-800 dark:text-zinc-200 overflow-hidden text-xs text-zinc-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Compact Header */}
        <div className="px-4 py-3.5 text-center border-b border-zinc-200 dark:border-zinc-800/80 bg-[#12151b] relative">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
              ARQAISTUDIO <span className="text-[10px] font-mono font-normal px-1 py-0.2 rounded bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-700">v2.4</span>
            </h1>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
            {authMode === 'login' ? 'Acceso al entorno de supervisión de agentes' : 'Registro de nuevo usuario en Cloudflare D1'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#090b0e] p-1 gap-1">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              resetForm();
            }}
            className={`flex-1 py-1 px-2.5 rounded text-[11px] font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'login'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-800/50'
            }`}
          >
            <LogIn className="w-3 h-3 text-emerald-400" />
            <span>Iniciar Sesión</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              resetForm();
            }}
            className={`flex-1 py-1 px-2.5 rounded text-[11px] font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'register'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-zinc-800/50'
            }`}
          >
            <UserPlus className="w-3 h-3 text-emerald-400" />
            <span>Crear Cuenta</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-3">
          {/* Alertas */}
          {error && (
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-md text-[11px] text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[11px] text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-snug">{successMessage}</div>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={authMode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="space-y-2.5">
            {/* Usuario */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <label className="text-zinc-300 font-medium">Usuario</label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={handleSelectAdmin}
                    className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    Llenar Admin (1234)
                  </button>
                )}
              </div>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-zinc-50 dark:bg-[#090b0e] border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 text-xs transition-colors"
                  placeholder="Ej: admin o tu nombre"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Email (Solo registro) */}
            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-300 font-medium">Correo Electrónico (Opcional)</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-zinc-50 dark:bg-[#090b0e] border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 text-xs transition-colors"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>
            )}

            {/* PIN */}
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-300 font-medium">PIN de Acceso (4 dígitos)</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-zinc-50 dark:bg-[#090b0e] border border-zinc-200 dark:border-zinc-800 rounded-md text-zinc-900 dark:text-white placeholder-zinc-500 tracking-[0.4em] font-mono focus:outline-none focus:border-emerald-500 text-xs transition-colors"
                  placeholder="••••"
                  maxLength={4}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !name.trim() || pin.length !== 4}
              className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-zinc-900 dark:text-white font-semibold rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs cursor-pointer shadow-xs"
            >
              <span>{isLoading ? 'Verificando...' : authMode === 'login' ? 'Ingresar al Workspace' : 'Crear Cuenta en D1'}</span>
              {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Footer note */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 text-center text-[10px] text-zinc-500">
            Cloudflare D1 SQL Serverless Edge Auth
          </div>
        </div>

      </div>
    </div>
  );
};
