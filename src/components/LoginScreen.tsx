import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck, KeyRound, Mail, UserPlus, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';
import * as api from '../services/api';

interface LoginScreenProps {
  onLogin: (user: any) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'pin_only'>('login');
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
    }, 700);
  };

  // 1. INICIAR SESIÓN (NOMBRE + PIN)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Por favor ingresa tu nombre de usuario.');
      return;
    }
    if (pin.length !== 4) {
      setError('El PIN debe tener 4 dígitos numéricos.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await api.loginUser(cleanName, pin, email);
      if (res.success && res.user) {
        triggerLoginSuccess(res.user, `¡Bienvenido de nuevo, ${res.user.name}! Conectando sesión...`);
      } else {
        setError(res.error || 'Credenciales no válidas.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Verifica tu nombre y PIN.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. CREAR CUENTA NUEVA (REGISTRO INDEPENDIENTE - 0 PROYECTOS INICIALES)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Ingresa un nombre de usuario para tu cuenta.');
      return;
    }
    if (pin.length !== 4) {
      setError('Ingresa un PIN de acceso de 4 dígitos.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await api.registerUser(cleanName, pin, email);
      if (res.success && res.user) {
        triggerLoginSuccess(res.user, `¡Cuenta creada con éxito para ${res.user.name}! Ingresando...`);
      } else {
        setError(res.error || 'No se pudo crear la cuenta.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario en la base de datos.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. ACCESO RÁPIDO CON PIN ÚNICO
  const handlePinOnlySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError('Ingresa un PIN de 4 dígitos.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await api.loginWithPin(pin);
      if (res.success && res.user) {
        triggerLoginSuccess(res.user, `PIN validado para ${res.user.name}. Ingresando...`);
      }
    } catch (err: any) {
      setError(err.message || 'PIN no válido o colisión detectada.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAdmin = () => {
    setName('Administrador');
    setPin('1234');
    setError('');
  };

  return (
    <div className={`min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 transition-opacity duration-700 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-700 ${isExiting ? 'animate-slide-up-exit' : ''}`}>
        {/* Header */}
        <div className="p-6 text-center space-y-2 border-b border-zinc-800 bg-zinc-950/60">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">ARQAI Workspace</h1>
          <p className="text-xs text-zinc-400">
            {authMode === 'login' && 'Ingresa con tu Nombre y tu PIN para acceder a tus proyectos.'}
            {authMode === 'register' && 'Crea una cuenta nueva independiente con 0 proyectos iniciales.'}
            {authMode === 'pin_only' && 'Acceso directo con PIN (solo para códigos sin duplicados).'}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 p-1.5 gap-1">
          <button
            id="tab-btn-login"
            type="button"
            onClick={() => {
              setAuthMode('login');
              resetForm();
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'login'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Iniciar Sesión</span>
          </button>

          <button
            id="tab-btn-register"
            type="button"
            onClick={() => {
              setAuthMode('register');
              resetForm();
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'register'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Crear Cuenta</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Mensajes de error y éxito */}
          {error && (
            <div className="mb-5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* TAB 1: INICIAR SESIÓN */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                  <span>Nombre de Usuario</span>
                  <button
                    type="button"
                    onClick={handleSelectAdmin}
                    className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    Usar Admin
                  </button>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-zinc-500" />
                  </div>
                  <input
                    id="input-login-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                    placeholder="Ej. Carlos o Administrador"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">PIN de Acceso (4 Dígitos)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-zinc-500" />
                  </div>
                  <input
                    id="input-login-pin"
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-slate-600 tracking-[0.5em] font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                    placeholder="••••"
                    maxLength={4}
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl text-[11px] text-zinc-400 space-y-1">
                <div className="text-zinc-300 font-medium">💡 Cuentas y Contraseñas Independientes:</div>
                <p>
                  Dos usuarios pueden tener el mismo PIN (ej. 1234), pero su <strong>Nombre de Usuario</strong> identifica su cuenta y carga únicamente sus propios proyectos.
                </p>
              </div>

              <button
                id="btn-submit-login"
                type="submit"
                disabled={isLoading || !name.trim() || pin.length !== 4}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 cursor-pointer text-sm"
              >
                {isLoading ? 'Iniciando sesión...' : 'Ingresar al Workspace'}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="pt-2 flex items-center justify-between text-xs text-zinc-400">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('pin_only');
                    resetForm();
                  }}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  ¿Ingresar solo con PIN?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    resetForm();
                  }}
                  className="text-emerald-400 hover:underline cursor-pointer font-medium"
                >
                  ¿No tienes cuenta? Regístrate
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CREAR CUENTA NUEVA */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Nombre de Usuario <span className="text-emerald-400">* (Único)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-zinc-500" />
                  </div>
                  <input
                    id="input-register-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                    placeholder="Ej. Ana Lopez o Usuario2"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-[10px] text-zinc-500">
                  Este nombre distinguirá tu cuenta de las demás de forma única.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  PIN de Acceso <span className="text-emerald-400">* (4 Dígitos)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-zinc-500" />
                  </div>
                  <input
                    id="input-register-pin"
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-slate-600 tracking-[0.5em] font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                    placeholder="••••"
                    maxLength={4}
                    required
                  />
                </div>
                <p className="text-[10px] text-zinc-500">
                  Puedes elegir cualquier PIN de 4 números (incluso si otro usuario usa el mismo).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Correo Electrónico (Opcional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-zinc-500" />
                  </div>
                  <input
                    id="input-register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
              </div>

              {/* Regla de negocio explícita */}
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-[11px] text-zinc-300 space-y-1">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Garantía de Aislamiento de Datos:
                </div>
                <ul className="list-disc list-inside text-zinc-400 space-y-0.5">
                  <li>Inicias con <strong>0 proyectos</strong> en tu cuenta nueva.</li>
                  <li>Tus proyectos se guardan en la base de datos vinculados a tu usuario.</li>
                  <li>Al cerrar sesión y volver a loguearte, tus proyectos estarán ahí.</li>
                </ul>
              </div>

              <button
                id="btn-submit-register"
                type="submit"
                disabled={isLoading || !name.trim() || pin.length !== 4}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 cursor-pointer text-sm"
              >
                {isLoading ? 'Registrando en base de datos...' : 'Crear Cuenta y Entrar'}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    resetForm();
                  }}
                  className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  ¿Ya tienes cuenta creada? Inicia sesión aquí
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SOLO PIN (OPCIONAL / ACCESO RÁPIDO) */}
          {authMode === 'pin_only' && (
            <form onSubmit={handlePinOnlySubmit} className="space-y-4">
              <div className="space-y-2 text-center">
                <label className="text-xs font-medium text-zinc-300 block">
                  PIN de Acceso (4 Dígitos)
                </label>
                <div className="relative max-w-[220px] mx-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="w-4 h-4 text-emerald-500" />
                  </div>
                  <input
                    type="password"
                    autoFocus
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-slate-600 tracking-[0.6em] text-center font-mono text-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    placeholder="••••"
                    maxLength={4}
                    required
                  />
                </div>
                <p className="text-[11px] text-zinc-400 pt-1">
                  Nota: Si dos usuarios tienen el mismo PIN, deberás ingresar indicando tu Nombre de Usuario.
                </p>
              </div>

              <button
                id="btn-login-with-pin"
                type="submit"
                disabled={isLoading || pin.length !== 4}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 cursor-pointer text-sm"
              >
                {isLoading ? 'Verificando PIN...' : 'Ingresar con PIN'}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    resetForm();
                  }}
                  className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  ← Volver a Iniciar Sesión con Nombre y PIN
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
