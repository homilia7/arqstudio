// Extend Window for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechSession {
  stop: () => void;
}

export interface SpeechRecognitionOptions {
  onTranscript: (fullText: string) => void;
  onListeningChange: (isListening: boolean) => void;
  onError?: (error: any) => void;
  lang?: string;
}

/**
 * Verifica si el navegador soporta SpeechRecognition (Web Speech API)
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Inicia una sesión de reconocimiento de voz que agrega el texto dictado
 * al texto base previo sin duplicar mensajes ni palabras.
 */
export function startSpeechRecognitionSession(
  initialBaseText: string,
  options: SpeechRecognitionOptions
): SpeechSession | null {
  if (typeof window === "undefined") return null;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    options.onListeningChange(false);
    return null;
  }

  try {
    const recognition = new SpeechRecognition();
    recognition.lang = options.lang || "es-ES";
    recognition.continuous = true;
    recognition.interimResults = true;

    // Limpiamos texto base de posibles marcadores o espacios sobrantes
    const base = initialBaseText.replace(/\s*⌛.*$/, "").trim();

    recognition.onresult = (event: any) => {
      let sessionFinal = "";
      let sessionInterim = "";

      // event.results contiene la lista completa de resultados de la sesión actual
      for (let i = 0; i < event.results.length; i++) {
        const item = event.results[i];
        const transcript = item[0]?.transcript || "";
        if (item.isFinal) {
          sessionFinal +=
            (sessionFinal && !sessionFinal.endsWith(" ") && !transcript.startsWith(" ")
              ? " "
              : "") + transcript;
        } else {
          sessionInterim +=
            (sessionInterim && !sessionInterim.endsWith(" ") && !transcript.startsWith(" ")
              ? " "
              : "") + transcript;
        }
      }

      // Combinar texto finalizado con lo que actualmente se está pronunciando (interim)
      let sessionTranscript = sessionFinal.trim();
      if (sessionInterim.trim()) {
        sessionTranscript = sessionTranscript
          ? `${sessionTranscript} ${sessionInterim.trim()}`
          : sessionInterim.trim();
      }

      // Concatenar con el texto que ya existía antes de iniciar la grabación
      const fullText = base
        ? sessionTranscript
          ? `${base} ${sessionTranscript}`
          : base
        : sessionTranscript;

      options.onTranscript(fullText);
    };

    recognition.onend = () => {
      options.onListeningChange(false);
    };

    recognition.onerror = (e: any) => {
      console.warn("Speech recognition warning/error:", e);
      options.onListeningChange(false);
      options.onError?.(e);
    };

    recognition.start();
    options.onListeningChange(true);

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch {}
        options.onListeningChange(false);
      },
    };
  } catch (err) {
    console.error("Error starting speech recognition:", err);
    options.onListeningChange(false);
    options.onError?.(err);
    return null;
  }
}
