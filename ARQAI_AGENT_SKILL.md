# ARQAI Agent Skill & Integration Spec

## ⚡ REGLA DE ORO OBLIGATORIA PARA AGENTES (CREACIÓN DE PLANES)
> **Nunca generes un plan genérico. Primero crea un Blueprint específico del dominio del proyecto. Luego cada módulo, etapa y tarea debe derivarse directamente de ese Blueprint. Si una tarea podría servir para cualquier proyecto, reescríbela hasta que sea específica del producto solicitado.**

## 🌐 REGLA OBLIGATORIA DE ENTREGABLES: DOS URLs EN CADA TAREA Y ACCIÓN
> **Toda IA que se conecte a ARQAISTUDIO DEBE registrar obligatoriamente DOS URLs en cada tarea que haga y en cada acción completada:**
> 1. `gitUrl`: **URL del Git** (Repositorio, rama o commit en GitHub, ej: `https://github.com/homilia7/SinpePay` o `.../commit/7b89459`).
> 2. `workUrl` / `projectUrl`: **URL del Proyecto Web en Vivo** (Despliegue activo en Cloudflare Pages o Web, ej: `https://sinpepay.pages.dev`), para que cuando el evaluador humano haga clic ahí pueda ir inmediatamente al proyecto a ver y probar el cambio en vivo.

## 💾 REGLA OBLIGATORIA DE CONTEXTO POR HITOS & AHORRO DE TOKENS (`CONTEXTO_PROYECTO.md`)
> **Para ahorrar tokens y garantizar memoria continua entre sesiones sin releer historiales masivos:**
> 1. **Lectura de Arranque (Paso 0):** Al abrir cualquier nuevo chat, la IA DEBE leer `CONTEXTO_PROYECTO.md` en la raíz del proyecto para absorber el estado actual en menos de 25 líneas e iniciar de inmediato.
> 2. **Actualización por Tarea (Hito):** Al finalizar cualquier tarea (commit/deploy), la IA DEBE actualizar `CONTEXTO_PROYECTO.md` con el estado final (máximo 25 líneas).
> 3. **Alerta de Límite de 40.000 Tokens:** Si la sesión de chat acumula aproximadamente 40.000 tokens (o ~15 a 18 turnos de trabajo intenso), la IA DEBE añadir al final de su mensaje:
>    > 🟡 **Aviso de Rendimiento (Límite 40.000 tokens alcanzado):**
>    > *El estado actual y avances ya están guardados de forma segura en `CONTEXTO_PROYECTO.md`. Te recomiendo cerrar esta sesión y abrir un chat nuevo para ahorrar costos de tokens y mantener respuestas rápidas.*

---

## Overview
**ARQAISTUDIO** (`https://arqaistudio.pages.dev`) is an AI Task Hub & QA Verifier. As an AI Agent (Antigravity, Codex, Hermes, Claude, etc.), you can register your implementation plans, report task progress in real time, attach live work/preview URLs, and receive human feedback.

---

## 1. Authentication & Base URL
- **Base URL**: `https://arqaistudio.pages.dev/api` (or local `http://localhost:5173/api`)
- **Headers**:
  ```http
  Content-Type: application/json
  x-api-key: <PROJECT_API_KEY>
  x-agent-name: <YOUR_AGENT_NAME> (e.g. "Antigravity AI")
  ```

---

## 2. Agent Workflow Protocol

### Step 1: Intelligent Blueprint & Work Plan Generation

When the user creates a project or provides an idea, the AI Agent must generate a structured **Blueprint** and use it to build a domain-specific, non-generic **Work Plan**:

1. **Save / Update Project Blueprint**:
   ```http
   PUT /api/projects/:projectId/blueprint
   ```
   **Payload Body (Blueprint Schema)**:
   ```json
   {
     "masterPrompt": "Descripción amplia y clara del producto a construir.",
     "generalFeatures": [
       "Feature principal 1",
       "Feature principal 2",
       "Feature principal 3"
     ],
     "screens": [
       {
         "id": "scr-home",
         "name": "Nombre de pantalla",
         "path": "/ruta",
         "description": "Qué hace esta pantalla.",
         "features": [
           "Funcionalidad visible 1",
           "Funcionalidad visible 2"
         ]
       }
     ],
     "connections": [
       {
         "name": "Base de datos",
         "purpose": "Guardar entidades principales del sistema."
       }
     ],
     "architecturalNotes": "Notas técnicas, reglas críticas, restricciones y decisiones de arquitectura."
   }
   ```

2. **Generate Work Plan from Blueprint**:
   ```http
   POST /api/projects/:projectId/generate-plan-from-blueprint
   ```
   *(Or POST `/api/antigravity/generate-plan` with `{ "projectId": "...", "projectIdeaPrompt": "..." }`)*

   The generated work plan automatically builds:
   - **Specific domain modules** (e.g. *Modelo de reservas y disponibilidad*, *Flujo cliente de reserva*, *Panel administrativo*, *Notificaciones*, *QA y accesibilidad* — never generic titles).
   - **Clear stages**.
   - **Actionable tasks with full technical context memory** (`technicalRequirements`, `affectedFiles`, `rulesConstraints`, `dependencies`, `notes`).
   - **Agent Skills Production Rules** (Auto-injected in `contextMemory`):
     - 🧪 **TDD & Testing**: Beyonce Rule ("If you liked it, you should have put a test on it").
     - 🛡️ **Hyrum's Law**: Strict API contract & JSON retrocompatibility.
     - 🚧 **Chesterton's Fence**: Architectural & security preservation without premature code deletion.
     - ✅ **Quality Gates**: Zero linter/compiler errors before requesting human QA review.

---

### Step 2: Batch Sync Custom Implementation Plan (Alternative)
When uploading a custom predefined plan, you can also push the full hierarchy via:
```http
POST /api/projects/:projectId/plan/batch
```
**Payload Body**:
```json
{
  "modules": [
    { "id": "mod-1", "title": "1. Autenticación y Usuarios", "order": 1 }
  ],
  "stages": [
    { "id": "stg-1", "moduleId": "mod-1", "title": "Fase 1: Backend", "order": 1 }
  ],
  "tasks": [
    {
      "id": "task-1",
      "moduleId": "mod-1",
      "stageId": "stg-1",
      "title": "Implementar Registro y Login en D1",
      "instruction": "Crear endpoints /api/auth/register y /api/auth/login",
      "subtasks": [
        { "id": "sub-1", "title": "Crear tabla antigravity_users", "completed": false }
      ],
      "contextMemory": {
        "technicalRequirements": ["SQLite/D1", "bcrypt/PIN"],
        "affectedFiles": ["server/apiApp.ts", "schema.sql"],
        "rulesConstraints": ["No hardcoding credentials"],
        "dependencies": ["wrangler"]
      }
    }
  ]
}
```

---

### Step 2: Fetch Next Pending Task
To know what to work on next:
```http
GET /api/projects/:projectId/next-task
```
**Response**:
```json
{
  "success": true,
  "hasMoreTasks": true,
  "task": {
    "id": "task-1",
    "title": "Implementar Registro y Login en D1",
    "status": "pending",
    "contextMemory": { ... }
  }
}
```

---

### Step 3: Start Working on Task
Before modifying files:
```http
POST /api/tasks/:taskId/start-by-ai
```
Sets `status = "in_progress"`.

---

### Step 4: Complete Task & Request Human QA Review
Once code is built, committed, and deployed/verified locally or on Cloudflare:
```http
POST /api/tasks/:taskId/complete-by-ai
```
*(Or `POST /api/agent/complete-task` with `taskId` in body)*

**Payload Body (Mandatory Dual URLs)**:
```json
{
  "gitUrl": "https://github.com/homilia7/SinpePay/commit/7b89459",
  "workUrl": "https://sinpepay.pages.dev",
  "aiOutput": "Endpoints de autenticación creados y validados.",
  "aiNotes": "Se agregaron tests unitarios y la tabla D1 fue migrada."
}
```
> **NOTA OBLIGATORIA**: Es imperativo proporcionar tanto `gitUrl` (enlace al repositorio o commit para revisar el código fuente) como `workUrl` (enlace a la web en vivo para ver el cambio desplegado). Ambos botones se mostrarán en la tarjeta para el usuario.

Sets `status = "ready_for_review"`.

---

### Step 5: Handle Human Feedback
If a human rejects a task after live QA review:
```http
GET /api/projects/:projectId/feedback
```
Tasks will have `status = "needs_revision"` and `humanFeedback` containing exact instructions on what to fix. Address the feedback and repeat **Step 3** and **Step 4**.

### Step 6: Dispatch Instant Real-Time User Notification
Whenever you create a project, complete a module, or finish all tasks, dispatch a live popup notification to the user's dashboard:
```http
POST /api/agent/notify-user
```
**Payload Body**:
```json
{
  "agentName": "CODEX AI",
  "title": "🎉 Proyecto Finalizado con Éxito",
  "message": "El agente ha completado la construcción y la pantalla se ha actualizado automáticamente.",
  "type": "project_completed",
  "projectId": "<PROJECT_ID>"
}
```

---

## 3. Strict Safety Rules for AI Agents
1. **Never attempt to self-approve or verify tasks (`status = "verified"` or `locked = true`).** Only human users have permission to verify and lock tasks.
2. **Respect `locked = true` tasks.** Never edit or delete a task that is locked.
3. **Always provide BOTH URLs (`gitUrl` and `workUrl` / `projectUrl`) in every task or action.** Never leave one missing: the user needs to inspect the code in Git AND open the live project in a browser to see the change in real time.
4. **Always update `CONTEXTO_PROYECTO.md` upon completing any task.** Keep it concise (<25 lines) with current state, last completed task, and immediate next step.
5. **Always alert the user when session exceeds ~40.000 tokens.** Recommend starting a fresh chat to maintain high performance and token economy.
