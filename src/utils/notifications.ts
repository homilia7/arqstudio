/**
 * ARQAI - Sistema de Notificaciones de Escritorio y Alertas Sonoras
 * - Emite sonido (chime agradable con Web Audio API sin dependencias de archivos).
 * - Muestra notificaciones nativas del navegador (Web Notifications API).
 * - Registra y sincroniza avisos de tareas completadas.
 */

const STORAGE_KEY = "arqai_desktop_notifications_enabled";
const SOUND_KEY = "arqai_sound_notifications_enabled";

/**
 * Reproduce un sonido de campana / chime cristalino de doble tono sintetizado
 * con Web Audio API (D5: 587.33Hz -> A5: 880Hz).
 * No requiere descargar ningún archivo MP3/WAV, latencia cero, 100% offline.
 */
export function playNotificationSound(): void {
  try {
    if (typeof window === "undefined") return;
    const soundEnabled = localStorage.getItem(SOUND_KEY) !== "false";
    if (!soundEnabled) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    const playChime = (freq: number, startTime: number, duration: number, peakVolume = 0.25) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      // Suave curva de ataque y caída exponencial natural
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(peakVolume, startTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    };

    // Tono 1: D5 (587.33 Hz)
    playChime(587.33, now, 0.35, 0.28);
    // Tono 2 armónico más alto: A5 (880.00 Hz) con ligera resonancia
    playChime(880.00, now + 0.14, 0.55, 0.22);
  } catch (err) {
    console.warn("No se pudo reproducir el sonido de notificación:", err);
  }
}

export function isSoundNotificationEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SOUND_KEY) !== "false";
}

export function setSoundNotificationEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOUND_KEY, enabled ? "true" : "false");
}

export function isDesktopNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getDesktopNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isDesktopNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export function isDesktopNotificationEnabledByUser(): boolean {
  if (!isDesktopNotificationSupported()) return false;
  if (Notification.permission !== "granted") return false;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored !== "false";
}

export function setDesktopNotificationEnabledByUser(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
}

export async function requestDesktopNotificationPermission(): Promise<boolean> {
  if (!isDesktopNotificationSupported()) {
    console.warn("Este navegador no soporta la Web Notifications API.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setDesktopNotificationEnabledByUser(true);
      playNotificationSound();
      showDesktopNotification("🔔 Notificaciones de ARQAI activadas", {
        body: "Recibirás alertas sonoras y avisos en el navegador cuando tus tareas se completen.",
        tag: "arqai-welcome-notif",
      });
      return true;
    } else {
      setDesktopNotificationEnabledByUser(false);
      return false;
    }
  } catch (error) {
    console.error("Error solicitando permisos de notificación:", error);
    return false;
  }
}

export interface ShowDesktopNotificationOptions {
  body: string;
  tag?: string;
  data?: any;
  icon?: string;
  requireInteraction?: boolean;
  onClick?: () => void;
}

export function showDesktopNotification(
  title: string,
  options?: ShowDesktopNotificationOptions
): Notification | null {
  if (!isDesktopNotificationSupported()) return null;
  if (Notification.permission !== "granted") return null;
  if (!isDesktopNotificationEnabledByUser()) return null;

  try {
    const defaultIcon = "/favicon.ico";
    const notification = new Notification(title, {
      body: options?.body || "",
      icon: options?.icon || defaultIcon,
      tag: options?.tag || `arqai-notif-${Date.now()}`,
      requireInteraction: options?.requireInteraction ?? false,
      data: options?.data,
    });

    notification.onclick = (event) => {
      event.preventDefault();
      try {
        window.focus();
      } catch (e) {}
      if (options?.onClick) {
        options.onClick();
      }
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn("No se pudo emitir la notificación de escritorio:", err);
    return null;
  }
}

/**
 * Disparador unificado para cuando una tarea es terminada:
 * 1. Reproduce el sonido de aviso.
 * 2. Emite la notificación nativa de escritorio del navegador.
 */
export function notifyTaskFinished(taskTitle: string, agentName?: string, projectName?: string): void {
  // 1. Sonido siempre
  playNotificationSound();

  // 2. Notificación del navegador
  const agent = agentName || "Antigravity AI";
  const project = projectName ? ` en ${projectName}` : "";
  showDesktopNotification(`✅ Tarea Terminada: ${taskTitle}`, {
    body: `Completada por ${agent}${project}. Lista para revisión en tu Buzón.`,
    tag: `task-finished-${encodeURIComponent(taskTitle).slice(0, 30)}`,
  });
}
