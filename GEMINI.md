# Reglas del Proyecto: ARQAISTUDIO (Diseño en Vivo, Despliegue en Tiempo Real & Memoria Protegida)

Este repositorio cuenta con la Skill global `diseno-en-vivo` y la regla de oro de **Memoria Protegida**.

## 🛑 Protocolo Obligatorio para Todo Chat / Sesión:
1. **Lectura Inmediata de Contexto (Ahorro de Tokens)**: Al abrir CUALQUIER chat nuevo, el asistente DEBE leer primero `CONTEXTO_PROYECTO.md` para conocer el estado actual y continuar de inmediato sin pedirle contexto al usuario.
2. **Consulta Previa del Historial**: ANTES de realizar cualquier edición o propuesta de código, todo chat/asistente DEBE leer el archivo `HISTORIAL_DE_CAMBIOS_APROBADOS.md`.
3. **Protección Absoluta de Lo Ya Funcionando**: Queda estrictamente PROHIBIDO modificar, refactorizar, revertir o romper cualquier funcionalidad, componente o flujo de trabajo registrado en `HISTORIAL_DE_CAMBIOS_APROBADOS.md`.
4. **Registro por Confirmación**: Solo agregar nuevas entradas a dicho historial cuando el usuario indique explícitamente *"Agrégalo al historial de cambios"*.
5. **Actualización Obligatoria de `CONTEXTO_PROYECTO.md` por Tarea Completada**: Tras finalizar y verificar una tarea, actualizar `CONTEXTO_PROYECTO.md` con el estado final (máximo 25 líneas).
6. **Alerta Proactiva de Límite de 40.000 Tokens**: Si la sesión de chat acumula aproximadamente 40.000 tokens (o ~15 a 18 turnos de trabajo intenso), la IA DEBE incluir al final de su mensaje la siguiente recomendación:
   > 🟡 **Aviso de Rendimiento (Límite 40.000 tokens alcanzado):**
   > *El estado actual y avances ya están guardados de forma segura en `CONTEXTO_PROYECTO.md`. Te recomiendo cerrar esta sesión y abrir un chat nuevo para ahorrar costos de tokens y mantener respuestas rápidas.*
7. **Sincronización Automática con ARQ AI Studio (Autónoma)**:
   - Al iniciar sesión y tras completar cualquier cambio o tarea:
     - Leer `.arqai.json`.
     - Si `sync.autoSync: true`, registrar la acción y el contexto en la API de ARQAISTUDIO (`https://arqaistudio.pages.dev/api`).
     - Entregar obligatoriamente las dos URLs: `gitUrl` (Git commit/repo) y `workUrl` (`https://arqaistudio.pages.dev`).
     - Ejecutar todo esto en segundo plano de manera automática sin pedirle al usuario que lo ordene.

---

## Protocolo Obligatorio para Todo Cambio Frontend / Diseño:
1. **Compilación Estática**: Tras modificar cualquier archivo de interfaz, ejecutar `npm run build` y verificar salida sin errores.
2. **Despliegue Directo a Cloudflare**: Desplegar de inmediato desde la raíz mediante API Token de Cloudflare (Pages project: `arqaistudio`):
   ```powershell
   npx wrangler pages deploy dist --project-name arqaistudio --branch main --commit-dirty=true
   ```
3. **Verificación en Vivo**: Leer la URL pública (`read_url_content`) para comprobar que el código nuevo está sirviéndose activamente en Edge.
4. **Sincronización Git**: Subir cambios a `origin main`.
5. **No declarar la tarea como terminada** sin haber completado los pasos anteriores.
