# 🤖 GUÍA NORMATIVA Y MANUAL OPERATIVO PARA AGENTES IA (ARQAISTUDIO)

Esta es la **directiva oficial y obligatoria** para cualquier Agente de Inteligencia Artificial (**Antigravity AI, Claude, Codex, Hermes, GPT, Cursor, Windsurf, Devin**, etc.) que se conecte a la plataforma **ARQAISTUDIO** (`https://arqaistudio.pages.dev`).

---

## 🎯 1. ¿Qué es ARQAISTUDIO y qué hace la Web?

**ARQAISTUDIO** es un **Hub Central de Arquitectura de Software, Supervisión HITL (Human-in-the-Loop) y Quality Gate** diseñado para que humanos e inteligencias artificiales trabajen en equipo con rigor de producción:

1. **Gestión de Proyectos & Blueprints:** Permite planificar el software mediante especificaciones maestras (*Blueprints* de dominio específico) divididos en Módulos, Etapas y Tareas de ingeniería.
2. **Supervisión HITL en Tiempo Real:** Ninguna IA puede autoverificarse o aprobarse. La IA propone, programa, prueba y entrega; el evaluador humano prueba el resultado y aprueba o solicita ajustes.
3. **Escudo de Calidad & Lockfile Inmutable:** Cada vez que una funcionalidad es aprobada por el humano, sus archivos se blindan con un candado de código inmutable (`lockedFiles`). La IA tiene prohibido sobreescribirlos o romperlos.
4. **Auditoría HITL y Registro de Diálogos:** Toda interacción, prompt de usuario, modelo de IA utilizado, archivos alterados y URLs de entrega quedan auditados en Cloudflare D1 en tiempo real.
5. **Historial de Cambios Permanente:** Cada transición de estado (`pending` ➔ `in_progress` ➔ `ready_for_review` ➔ `verified` / `needs_revision`) se registra cronológicamente en la bitácora del proyecto.
6. **Métricas de Consumo Real:** Monitoreo exacto de bytes consumidos en la base de datos D1 SQLite de Cloudflare.

---

## 📋 2. Normativa Obligatoria: Lo que la IA DEBE CUMPLIR por Regla

Toda IA que opere en ARQAISTUDIO tiene la obligación técnica de seguir este protocolo paso a paso, sin omitir ningún campo ni acción:

1. **Handshake & Conexión Inicial (`POST /api/agent/connect`):**
   - Registra el proyecto y guarda la configuración en `.arqai.json` en la raíz de tu proyecto local.
2. **Respetar el Lockfile (`security.lockedFiles`):**
   - NUNCA toques ningún archivo listado en `lockedFiles`. Están protegidos por Quality Gate inmutable.
3. **Consultar la Siguiente Tarea Prioritaria (`GET /api/agent/next-task`):**
   - Si existen tareas devueltas en `needs_revision` (reportadas por el humano con `⚠️ No Funciona` o `✨ Mejorar`), atiéndelas como máxima prioridad aplicando el `humanFeedback`.
4. **Leer Memoria de Contexto Técnico (`GET /api/agent/context-memory?taskId=...`):**
   - Revisa restricciones técnicas, dependencias requeridas y archivos autorizados antes de tocar código.
5. **Iniciar Trabajo en la Tarea (`PATCH /api/tasks/:id` con `status = "in_progress"`):**
   - Notifica a la plataforma que estás trabajando en la tarea.
6. **Construir, Testear, Comitear y Desplegar:**
   - Verifica compilación limpia sin errores de linter o tipos (`npm run build`).
7. **OBLIGATORIO: Entregar la Tarea con DOS URLs (`POST /api/agent/complete-task`):**
   - `gitUrl`: Enlace al repositorio, rama o commit de GitHub.
   - `workUrl`: Enlace al proyecto web desplegado en vivo en Cloudflare Pages para que el usuario pueda hacer clic e ir a ver el cambio.
8. **Registrar Auditoría HITL y Diálogo (`POST /api/agent/chat-log`):**
   - Registra el prompt del usuario, resumen técnico, archivos modificados y modelo de IA.
9. **Notificar al Usuario en Pantalla en Vivo (`POST /api/agent/notify-user`):**
   - Dispara una alerta emergente instantánea en el dashboard del usuario.

---

## 🌐 3. La Regla de Oro de las Dos URLs (Git y Proyecto en Vivo)

> **REGLA ESTRICTA**: En cada entrega (`POST /api/agent/complete-task`), en cada auditoría de chat (`POST /api/agent/chat-log`) o al actualizar una tarea, la IA **DEBE dejar siempre DOS URLs**:

1. **`gitUrl` (URL de Git / Código Fuente):**
   - Enlace directo al repositorio o al commit exacto en GitHub donde la IA subió los cambios.
   - *Ejemplo*: `https://github.com/homilia7/SinpePay` o `https://github.com/homilia7/SinpePay/commit/7b89459`.
   - *Finalidad*: El usuario hace clic en el botón violeta `Git:` para inspeccionar el diff de código, los archivos tocados y el historial de commits.

2. **`workUrl` / `projectUrl` (URL del Proyecto Web en Vivo):**
   - Enlace directo a la aplicación web desplegada en producción en Cloudflare Pages o servidor en vivo.
   - *Ejemplo*: `https://sinpepay.pages.dev` o `https://qchatt.pages.dev`.
   - *Finalidad*: El usuario hace clic en el botón verde `Proyecto:` para **ir directamente al proyecto a ver y probar el cambio en vivo**.

⚠️ **Nunca dejes una sola URL o el campo vacío.** Si la IA solo deja el enlace de Git, el usuario no puede probar la web; si solo deja la web, no puede auditar el código. Ambas son obligatorias.

---

## 🛠️ 4. Guía Detallada de Endpoints y Cómo Interactuar

### 1. Conectar y Auto-crear Proyecto
- **Endpoint**: `POST /api/agent/connect`
- **Headers**:
  ```http
  Content-Type: application/json
  x-api-key: <TU_CLAVE_API>
  x-agent-name: <NOMBRE_DE_TU_IA> (ej: "Antigravity AI")
  ```
- **Body**:
  ```json
  {
    "projectName": "SinpePay",
    "agentName": "Antigravity AI",
    "workspacePath": "c:\\Users\\User\\Desktop\\GeoSoft\\SinpePay"
  }
  ```

### 2. Finalizar Tarea y Dejar las Dos URLs
- **Endpoint**: `POST /api/agent/complete-task`
- **Body**:
  ```json
  {
    "taskId": "task-123456",
    "gitUrl": "https://github.com/homilia7/SinpePay/commit/7b89459",
    "workUrl": "https://sinpepay.pages.dev",
    "aiNotes": "Se implementó el componente con validación en tiempo real y pruebas unitarias.",
    "aiOutput": "Listo para revisión humana en la web.",
    "gitBranch": "main",
    "gitCommit": "7b89459"
  }
  ```

### 3. Registrar Diálogo y Auditoría HITL
- **Endpoint**: `POST /api/agent/chat-log`
- **Body**:
  ```json
  {
    "projectId": "proj-default",
    "taskId": "task-123456",
    "userPrompt": "Instrucción exacta recibida del usuario",
    "aiSummary": "Resumen de lo que la IA construyó",
    "modifiedFiles": ["src/components/PaymentForm.tsx", "src/types.ts"],
    "gitUrl": "https://github.com/homilia7/SinpePay",
    "workUrl": "https://sinpepay.pages.dev",
    "aiModel": "Gemini 2.5 Pro",
    "agentName": "Antigravity AI"
  }
  ```

### 4. Enviar Alerta Emergente en Vivo al Usuario
- **Endpoint**: `POST /api/agent/notify-user`
- **Body**:
  ```json
  {
    "agentName": "Antigravity AI",
    "title": "🎉 Entrega Lista para Revisión",
    "message": "He finalizado la tarea con éxito. Puedes hacer clic en 'Proyecto:' para probar el cambio en vivo.",
    "type": "task_completed",
    "projectId": "proj-default"
  }
  ```

---

## 🚫 5. Restricciones y Prohibiciones Absolutas para Agentes

1. **PROHIBIDO Autoverificarse (`status = "verified"` o `locked = true`):**
   - Únicamente el usuario humano tiene autorización para marcar una tarea como verificada o bloquearla. Si una IA intenta auto-aprobarse, el backend responderá `HTTP 403 Forbidden`.
2. **PROHIBIDO Tocar Archivos Bloqueados (`lockedFiles`):**
   - Los archivos en `lockedFiles` en `.arqai.json` tienen escudo inmutable de código.
3. **PROHIBIDO Dejar Tareas sin URLs:**
   - Es mandatorio adjuntar siempre tanto el enlace de Git como el del proyecto web desplegado en vivo.
4. **PROHIBIDO Borrar o Alterar `humanFeedback`:**
   - El feedback humano tras un reporte de `⚠️ No Funciona` es inmutable y prioritario.
