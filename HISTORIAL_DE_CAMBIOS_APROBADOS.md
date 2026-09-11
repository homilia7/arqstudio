# ðŸ“‹ HISTORIAL DE CAMBIOS APROBADOS Y VERIFICADOS

> ðŸ›‘ **ATENCIÃ“N / ADVERTENCIA ESTRICTA PARA AGENTES IA Y DESARROLLADORES:**
> **TODOS LOS CAMBIOS LISTADOS EN ESTE DOCUMENTO ESTÃ�N FUNCIONANDO CORRECTAMENTE, HAN SIDO APROBADOS Y VERIFICADOS EN PRODUCCIÃ“N (`https://arqai.pages.dev`).**
> **NO TOCAR, NO REVERTIR, NO DESHACER NI ALTERAR NINGUNA DE ESTAS FUNCIONALIDADES EN ENTRADAS O EDICIONES FUTURAS DE CÃ“DIGO.**

---

## 1. ðŸ”’ Aislamiento Completo del Historial de Cambios & AuditorÃ­a por Usuario
* **Estado:** âœ… APROBADO Y FUNCIONANDO CORRECTAMENTE â€” NO TOCAR.
* **Fecha y Hora:** 3 de Septiembre, 2026 â€” 04:30 PM (GMT-6)
* **DescripciÃ³n del Cambio:**
  * Se implementÃ³ el filtrado estricto por `user_id` en el endpoint `GET /api/history` y `DELETE /api/history` usando un `JOIN` entre `antigravity_history` y `antigravity_projects`.
  * Cada usuario (incluyendo usuarios nuevos sin proyectos) solo puede ver y administrar sus propios registros de historial de auditorÃ­a.
  * Se agregÃ³ una doble capa de seguridad en `App.tsx` que filtra el historial en cliente asegurando que ningÃºn usuario vea actividades de otros usuarios.
* **Archivos Involucrados:**
  * `functions/api/[[path]].ts` (Endpoint GET/DELETE `/api/history`)
  * `src/services/api.ts` (`fetchHistory`, `clearHistory`)
  * `src/App.tsx` (`loadData`, `handleClearHistory`)

---

## 2. ðŸ‘¤ AtribuciÃ³n Correcta del Creador de Proyectos (Nombre Real vs CODEX AI)
* **Estado:** âœ… APROBADO Y FUNCIONANDO CORRECTAMENTE â€” NO TOCAR.
* **Fecha y Hora:** 3 de Septiembre, 2026 â€” 05:15 PM (GMT-6)
* **DescripciÃ³n del Cambio:**
  * Al crear un proyecto desde la interfaz de usuario, se envÃ­a el nombre del usuario activo (ej: `ANDREA1`) y se registra en la base de datos `antigravity_notifications` y `antigravity_history`.
  * La notificaciÃ³n flotante y el BuzÃ³n de Notificaciones muestran el nombre real de la persona que creÃ³ el proyecto (`ðŸ‘¤ ANDREA1`) con icono de usuario en lugar de atribuirlo a "CODEX AI".
  * Se actualizaron los registros previos en Cloudflare D1 (`arqai-db`).
* **Archivos Involucrados:**
  * `functions/api/[[path]].ts` (`POST /api/projects`, `GET /api/notifications`)
  * `src/App.tsx` (`handleCreateProject`, banner de notificaciÃ³n)
  * `src/services/api.ts` (`createProject`)
  * `src/components/NotificationsDrawer.tsx` (Renderizado de notificaciones e icono de usuario)

---

## 3. ðŸŽ¯ Centrado y Posicionamiento Superior del Modal "Crear Nuevo Proyecto"
* **Estado:** âœ… APROBADO Y FUNCIONANDO CORRECTAMENTE â€” NO TOCAR.
* **Fecha y Hora:** 3 de Septiembre, 2026 â€” 05:40 PM (GMT-6)
* **DescripciÃ³n del Cambio:**
  * El modal de creaciÃ³n de proyectos se posicionÃ³ en la parte **superior-centro** de la pantalla (`items-start justify-center pt-12 sm:pt-16`) con capa mÃ¡xima (`z-[9999]`), apareciendo inmediatamente al dar clic sin necesidad de hacer scroll en la web.
* **Archivos Involucrados:**
  * `src/components/ProjectConfigBar.tsx`

---

## 4. ðŸš€ DesactivaciÃ³n de Tareas AutomÃ¡ticas al Crear Proyecto Manualmente
* **Estado:** âœ… APROBADO Y FUNCIONANDO CORRECTAMENTE â€” NO TOCAR.
* **Fecha y Hora:** 3 de Septiembre, 2026 â€” 06:10 PM (GMT-6)
* **DescripciÃ³n del Cambio:**
  * La casilla de auto-generaciÃ³n de Blueprint y Plan de trabajo estructurado viene **desmarcada por defecto** (`autoGenerateBlueprint: false`).
  * Los proyectos creados por el usuario nacen completamente limpios sin generar 11 tareas ni 5 mÃ³dulos automÃ¡ticos.
* **Archivos Involucrados:**
  * `src/App.tsx` (`handleCreateProject`)
  * `src/components/ProjectConfigBar.tsx` (`autoGenBlueprint`)

---

## 5. ðŸ“¬ BuzÃ³n de Notificaciones Integrado (Mailbox Modal) y EliminaciÃ³n al Clic
* **Estado:** âœ… APROBADO Y FUNCIONANDO CORRECTAMENTE â€” NO TOCAR.
* **Fecha y Hora:** 3 de Septiembre, 2026 â€” 06:35 PM (GMT-6)
* **DescripciÃ³n del Cambio:**
  * Al hacer clic en la notificaciÃ³n del banner flotante, esta desaparece por completo del flujo activo para no volver a aparecer repetidamente al recargar o consultar.
  * Todas las notificaciones recibidas se almacenan en el **BuzÃ³n de Notificaciones** (`NotificationsDrawer.tsx`), accesible desde el botÃ³n de campana con contador en la barra superior.
  * El modal del BuzÃ³n de Notificaciones se despliega centrado en la parte superior del viewport.
* **Archivos Involucrados:**
  * `src/components/NotificationsDrawer.tsx`
  * `src/components/Header.tsx`
  * `src/App.tsx`
  * `functions/api/[[path]].ts` (`/api/notifications/mark-all-read`, `/api/notifications/clear`)

---

## 6. ðŸ“œ Nueva SecciÃ³n Web: Historial de Cambios por Proyecto
* **Estado:** âœ… APROBADO Y FUNCIONANDO CORRECTAMENTE â€” NO TOCAR.
* **Fecha y Hora:** 3 de Septiembre, 2026 â€” 06:50 PM (GMT-6)
* **DescripciÃ³n del Cambio:**
  * Se creÃ³ una pestaÃ±a/secciÃ³n dedicada llamada **"Historial de Cambios"** en la navegaciÃ³n principal de la web.
  * Muestra la lista interactiva de modificaciones realizadas por la IA y usuarios, organizadas por el proyecto activo.
  * Permite filtrar por autor (`ðŸ¤– Agente IA` vs `ðŸ‘¤ Usuario`), buscar por texto, agregar notas de cambios manualmente y **exportar la lista completa a un archivo Markdown (`.md`)**.
* **Archivos Involucrados:**
  * `src/components/ProjectChangelogView.tsx` (Componente UI creado)
  * `src/App.tsx` (PestaÃ±a principal y estado `changelog`)
  * `src/services/api.ts` (`addChangelogEntry`)

---

## 7. ðŸ“œ PÃ¡gina Independiente: Historial de Cambios Aprobados por Proyecto
* **Estado:** âœ… APROBADO Y FUNCIONANDO CORRECTAMENTE â€” NO TOCAR.
* **Fecha y Hora:** 3 de Septiembre, 2026 â€” 07:15 PM (GMT-6)
* **DescripciÃ³n del Cambio:**
  * Se implementÃ³ una **PÃ¡gina Independiente** (`ChangelogStandalonePage.tsx`) fuera del tablero principal.
  * Permite la **creaciÃ³n y selecciÃ³n de proyectos de historial de cambios independientes** (con nombre y descripciÃ³n personalizados).
  * Es **exclusiva para funcionalidades construidas por la IA y aprobadas por el humano** (`âœ… Aprobado por Humano`).
  * Los cambios se ordenan en una **lista cronolÃ³gica acumulativa de arriba hacia abajo**.
  * Al verificar/aprobar cualquier tarea realizada por la IA (`POST /api/tasks/:id/verify`), se genera de forma automÃ¡tica el registro de la funcionalidad aprobada en esta pÃ¡gina.
* **Archivos Involucrados:**
  * `src/components/ChangelogStandalonePage.tsx` (PÃ¡gina independiente creada)
  * `src/App.tsx` (Enrutado `currentView: 'board' | 'changelog_page'`)
  * `functions/api/[[path]].ts` (`POST /api/tasks/:id/verify`)

---

## 8. ðŸ“‹ BotÃ³n Unificado para Copiar Base URL + API Key Juntas
* **Estado:** âœ… APROBADO Y FUNCIONANDO CORRECTAMENTE â€” NO TOCAR.
* **Fecha y Hora:** 3 de Septiembre, 2026 â€” 06:52 PM (GMT-6)
* **DescripciÃ³n del Cambio:**
  * Se agregÃ³ un botÃ³n unificado de copiado `Copiar (Base URL + API Key)` en el modal de Instrucciones/API (`ApiDocumentationModal.tsx`) y en la barra de configuraciÃ³n del proyecto (`ProjectConfigBar.tsx`).
  * Permite copiar simultÃ¡neamente la `Base URL` y la `API Key` del proyecto en el portapapeles con un Ãºnico clic para configurar rÃ¡pidamente Antigravity, Cursor, Claude o cualquier cliente.
* **Archivos Involucrados:**
  * `src/components/ApiDocumentationModal.tsx`
  * `src/components/ProjectConfigBar.tsx`

---

## 9. ðŸ†• Registro de Usuarios Nuevos con Panel Limpio de 0 Proyectos Iniciales
* **Estado:** âœ… APROBADO Y FUNCIONANDO CORRECTAMENTE â€” NO TOCAR.
* **Fecha y Hora:** 3 de Septiembre, 2026 â€” 07:01 PM (GMT-6)
* **DescripciÃ³n del Cambio:**
  * Se eliminÃ³ la creaciÃ³n automÃ¡tica de proyectos por defecto ("Proyecto de [Nombre]") al registrarse una nueva cuenta de usuario.
  * Los nuevos usuarios que se registran e inician sesiÃ³n por primera vez llegan a la web con su panel de proyectos completamente en **0**, mostrando la interfaz vacÃ­a y el botÃ³n destacado `+ Nuevo Proyecto` para que creen manualmente su primer espacio de trabajo.
* **Archivos Involucrados:**
  * `functions/api/[[path]].ts` (Registro de usuario en Cloudflare D1)
  * `server/apiApp.ts` (Registro de usuario en servidor Express)

---

## 10. ðŸ§¹ Limpieza Total para Cuentas Nuevas: Vista Tareas & JerarquÃ­a por MÃ³dulos y Etapas en 0
* **Estado:** âœ… APROBADO Y FUNCIONANDO CORRECTAMENTE â€” NO TOCAR.
* **Fecha y Hora:** 3 de Septiembre, 2026 â€” 07:20 PM (GMT-6)
* **DescripciÃ³n del Cambio:**
  * Se ajustÃ³ el filtrado estricto en cliente (`App.tsx`) y backend (`functions/api/[[path]].ts`) para que cuando una cuenta de usuario sea nueva (0 proyectos creados / `activeProject === null`), las vistas **"Vista Tareas"** y **"Vista MÃ³dulos & Etapas (JerarquÃ­a)"** permanezcan **100% vacÃ­as** (`0 Tareas`, `0 MÃ³dulos`, `0 Etapas`).
  * Evita la filtraciÃ³n de datos de muestra o plantillas previas entre usuarios, garantizando una cuenta totalmente limpia y en blanco desde el primer inicio de sesiÃ³n.
* **Archivos Involucrados:**
  * `src/App.tsx` (Filtrado estricto `activeTasks`, `activeModules`, `activeStages`)
  * `functions/api/[[path]].ts` (Filtrado de `GET /api/modules` y `GET /api/stages` por `projectId` y `userId`)

---

## 12. ðŸ“¬ Posicionamiento Superior del Modal "BuzÃ³n de Notificaciones" en Celulares
* **Estado:** âœ… APROBADO Y FUNCIONANDO CORRECTAMENTE â€” NO TOCAR.
* **Fecha y Hora:** 3 de Septiembre, 2026 â€” 07:31 PM (GMT-6)
* **DescripciÃ³n del Cambio:**
  * Se ajustÃ³ el modal del BuzÃ³n de Notificaciones (`NotificationsDrawer.tsx`) para posicionarse en la **parte superior-centro** (`items-start justify-center pt-4 sm:pt-14 z-[9999]`).
  * Al hacer clic en el botÃ³n de notificaciones desde un celular o tablet, el buzÃ³n aparece inmediatamente visible arriba en pantalla sin necesidad de hacer scroll.
* **Archivos Involucrados:**
  * `src/components/NotificationsDrawer.tsx`

---

## 13. âš¡ Posicionamiento Superior y Elevado del Modal "Generador Inteligente de Blueprint & Plan" en Celulares
* **Estado:** âœ… APROBADO Y FUNCIONANDO CORRECTAMENTE â€” NO TOCAR.
* **Fecha y Hora:** 3 de Septiembre, 2026 â€” 07:36 PM (GMT-6)
* **DescripciÃ³n del Cambio:**
  * Se elevÃ³ al tope superior de la pantalla (`items-start justify-center pt-2 sm:pt-4 my-0 z-[9999]`) el modal del Generador Inteligente de Blueprint (`PlanGeneratorModal.tsx`).
  * Al hacer clic en "Desglosar con IA" o abrir la ventana desde dispositivos mÃ³viles, el formulario queda ubicado en el extremo superior de la pantalla del celular para un acceso inmediato.
* **Archivos Involucrados:**
  * `src/components/PlanGeneratorModal.tsx`

---

## 14. ðŸ“Š Barra de Avance en Tiempo Real, Trazabilidad Git, ClonaciÃ³n de Proyectos, ExportaciÃ³n PDF y SanitizaciÃ³n de UI
* **Estado:** âœ… APROBADO Y FUNCIONANDO CORRECTAMENTE â€” NO TOCAR.
* **Fecha y Hora:** 3 de Septiembre, 2026 â€” 07:55 PM (GMT-6)
* **DescripciÃ³n del Cambio:**
  1. **Barra de Porcentaje de Avance del Proyecto:** Muestra en tiempo real la tasa de tareas verificadas y aprobadas (`(verifiedTasks / totalTasks) * 100%`) en `ProjectConfigBar.tsx` con barra indicadora de progreso.
  2. **Trazabilidad Git en Tiempo Real (`gitBranch` y `gitCommit`):** IntegraciÃ³n de los campos `gitBranch` y `gitCommit` en las tareas de la base de datos (Cloudflare D1 y Express), permitiendo a los agentes IA reportar la rama y commit exacto de cada entrega. Se visualizan distintivos visuales en `TaskCard.tsx` y `ReviewModal.tsx`.
  3. **ClonaciÃ³n InstantÃ¡nea de Proyectos:** ImplementaciÃ³n del endpoint `POST /api/projects/:id/clone` en backend (`functions/api/[[path]].ts` y `server/apiApp.ts`) y botÃ³n "Clonar" en `ProjectConfigBar.tsx` para duplicar la estructura de un proyecto existente con su blueprint en un solo clic.
  4. **ExportaciÃ³n de Reporte Ejecutivo (PDF / Imprimir):** Se agregÃ³ el botÃ³n "Imprimir / PDF" (`window.print()`) con diseÃ±o optimizado de impresiÃ³n en `ChangelogStandalonePage.tsx` y `ProjectChangelogView.tsx` para exportar reportes ejecutivos limpios desde el navegador.
  5. **SanitizaciÃ³n de Interfaz:** RestricciÃ³n del botÃ³n "Cargar Ejemplo" Ãºnicamente a usuarios con rol Administrador (`currentUser.accessType === 'admin'`).
* **Archivos Involucrados:**
  * `functions/api/[[path]].ts` (`POST /api/projects/:id/clone`, `POST /api/agent/complete-task`)
  * `server/apiApp.ts` (`POST /api/projects/:id/clone`, `POST /api/agent/complete-task`)
  * `src/services/api.ts` (`cloneProject`)
  * `src/types.ts` (`gitBranch`, `gitCommit` en `TaskItem`)
  * `src/components/ProjectConfigBar.tsx` (Barra de %, botÃ³n Clonar, restricciÃ³n admin de Cargar Ejemplo)
  * `src/components/TaskCard.tsx` & `src/components/ReviewModal.tsx` (Distintivos Git Branch / Commit)
  * `src/components/ChangelogStandalonePage.tsx` & `src/components/ProjectChangelogView.tsx` (Trigger Imprimir / PDF)
  * `src/App.tsx` (`handleCloneProject`, actualizaciÃ³n de props)

---

## 15. ðŸ”‘ Mapeo de API Keys Reales de Usuarios en Panel Admin & ðŸŽ¨ Barra Navegadora Superior con Degradado Suave
* **Estado:** âœ… APROBADO Y FUNCIONANDO CORRECTAMENTE â€” NO TOCAR.
* **Fecha y Hora:** 3 de Septiembre, 2026 â€” 08:50 PM (GMT-6)
* **DescripciÃ³n del Cambio:**
  1. **VisualizaciÃ³n de API Key Real por Usuario en Panel Admin:** Se agregÃ³ la columna "API Key" en la tabla de usuarios del Panel de AdministraciÃ³n (`AdminUsersPanel.tsx`). Muestra de forma transparente y sincronizada la clave API activa de cada usuario (resolviendo dinÃ¡micamente la API Key del proyecto del usuario o su fÃ³rmula asignada `arqai_sec_[pin]_[id]`), garantizando que coincida de forma 100% idÃ©ntica con la clave del modal de Instrucciones/API. NingÃºn usuario muestra el estado "No generada".
  2. **Barra Navegadora Superior con Degradado Suave (Morado + Verde + Azul):** Se rediseÃ±Ã³ el fondo de la barra de navegaciÃ³n principal (`Header.tsx`) integrando un degradado armonioso de tonos suave/pastel (`purple-emerald-sky` en modo claro y `indigo-emerald-purple` en modo oscuro).
  3. **VisualizaciÃ³n Completa del MenÃº en Computadora (PC):** Se expandiÃ³ la estructura contenedora a ancho completo (100%), permitiendo que todos los botones de navegaciÃ³n (`Auto AI`, `Agentes`, `BuzÃ³n IA`, `Historial`, `Conectar API`, `Usuarios`, `AuditorÃ­a`) se visualicen completos de extremo a extremo sin recortes ni truncados.
  4. **CorrecciÃ³n de Evento en BotÃ³n Agentes:** Se corrigiÃ³ la discrepancia del manejador de estado en `App.tsx` para que al pulsar el botÃ³n "Agentes" abra de inmediato la ventana modal del Historial de Conexiones de Agentes en tiempo real.
* **Archivos Involucrados:**
  * `src/components/AdminUsersPanel.tsx` (Columna API Key y fallback de fÃ³rmulas)
  * `src/components/Header.tsx` (Degradado multicolor suave, ancho 100% responsive, etiquetas optimizadas)
  * `src/App.tsx` (CorrecciÃ³n `setAgentConnectionsOpen(true)` y paso de props en Header)
  * `functions/api/[[path]].ts` (Endpoint GET `/api/users` resolviendo project API keys)
  * `server/apiApp.ts` (Endpoint GET `/api/users` resolviendo project API keys)

---

## 16. 🤖 Botón "Agentes": Apertura Instantánea de Ventana Flotante con Historial de Llamadas y Conexiones IA en Tiempo Real
* **Estado:** ✅ APROBADO Y FUNCIONANDO CORRECTAMENTE — NO TOCAR.
* **Fecha y Hora:** 3 de Septiembre, 2026 — 08:52 PM (GMT-6)
* **Descripción del Cambio:**
  * Al hacer clic en el botón **"Agentes"** (o *"Conexiones Agentes"*) de la barra navegadora superior, se abre de inmediato la ventana flotante (`AgentConnectionsModal.tsx`).
  * Muestra en tiempo real la bitácora oficial e historial completo de llamadas, solicitudes y conexiones de los Agentes de Inteligencia Artificial (Antigravity AI, CODEX, Claude, GPT, etc.), detallando fecha, hora exacta, nombre del agente y la acción ejecutada en el proyecto.
* **Archivos Involucrados:**
  * `src/App.tsx` (Manejador de evento `setAgentConnectionsOpen(true)`)
  * `src/components/Header.tsx` (Botón "Agentes")
  * `src/components/AgentConnectionsModal.tsx` (Ventana modal de conexiones de la IA)

---

## 17. Cambio de Nombre a ARQ AI
* **Estado:** ✅ APROBADO Y FUNCIONANDO CORRECTAMENTE - NO TOCAR.
* **Fecha y Hora:** 3 de Septiembre, 2026 - 09:03 PM (GMT-6)
* **Descripción del Cambio:**
  * Se cambió el nombre de la aplicación de "Antigravity Bridge v2.4" a "ARQ AI" en la cabecera (Header) y el pie de página (Footer) de la aplicación.
* **Archivos Involucrados:**
  * `src/components/Header.tsx`
  * `src/App.tsx`

---

## 18. Botón y Modal de Confirmación para Eliminar Usuarios en Panel Admin
* **Estado:** ✅ APROBADO Y FUNCIONANDO CORRECTAMENTE - NO TOCAR.
* **Fecha y Hora:** 3 de Septiembre, 2026 - 09:29 PM (GMT-6)
* **Descripción del Cambio:**
  * Se agregó una columna "Acciones" en la tabla de usuarios del Panel de Administración (`AdminUsersPanel.tsx`) con un botón de bote de basura rojo (`Trash2`) para eliminar usuarios individualmente uno por uno.
  * Al hacer clic en el botón de eliminar, se despliega una ventana flotante modal de confirmación con detalles del usuario (Nombre, Correo, PIN) exigiendo confirmación explícita antes de ejecutar el borrado en la base de datos SQL (Cloudflare D1 y Neon PostgreSQL).
  * Se creó el endpoint backend `DELETE /api/users/:id` y la función cliente `deleteUser()` en el servicio API.
* **Archivos Involucrados:**
  * `src/components/AdminUsersPanel.tsx` (Columna de acciones, botón de borrado e interfaz modal de confirmación)
  * `src/services/api.ts` (Función `deleteUser`)
  * `functions/api/[[path]].ts` (Endpoint `DELETE /api/users/:id` en Cloudflare D1)
  * `server/apiApp.ts` (Endpoint `DELETE /api/users/:id` en Express / Neon PostgreSQL)

---

## 19. 🔔 Atribución Real del Agente IA en Historial de Conexiones & Registro de Usuarios
* **Estado:** ✅ APROBADO Y FUNCIONANDO CORRECTAMENTE — NO TOCAR.
* **Fecha y Hora:** 4 de Septiembre, 2026 — 08:30 AM (GMT-6)
* **Descripción del Cambio:**
  * En el Historial de Conexiones de Agentes (API Real), se registra e identifica dinámicamente el agente específico que accedió o realizó la acción (ej. `CODEX`, `ANTIGRAVITY`, `QCHATT`, etc.) en lugar de utilizar nombres fijos.
  * Los registros de nuevos usuarios en la plataforma incluyen la alerta y atribución real del agente activo en ese momento.
* **Archivos Involucrados:**
  * `src/components/AgentConnectionsModal.tsx`
  * `functions/api/[[path]].ts`
  * `server/apiApp.ts`

---

## 20. ⚠️ Botones "No Funciona", "Mejorar", "Ver Observaciones" y Posicionamiento Superior ("Arriba Arriba")
* **Estado:** ✅ APROBADO Y FUNCIONANDO CORRECTAMENTE — NO TOCAR.
* **Fecha y Hora:** 4 de Septiembre, 2026 — 08:50 AM (GMT-6)
* **Descripción del Cambio:**
  * **Botones "No Funciona" y "Mejorar":** Se integraron botones interactivos con cajas de comentarios en las tarjetas de tareas para enviar retroalimentación directa a la IA sobre fallos u optimizaciones necesarias.
  * **Botón "Ver Observaciones":** Totalmente habilitado y funcional para revisar los comentarios y reportes de la comprobación humana.
  * **Posicionamiento Superior ("Arriba Arriba"):** Se reubicó el modal `ReviewModal.tsx` y los cuadros de comentarios en la parte superior del viewport y de la tarjeta (`items-start pt-3 sm:pt-5`), mostrándolos inmediatamente al tope de la pantalla.
* **Archivos Involucrados:**
  * `src/components/ReviewModal.tsx`
  * `src/components/TaskCard.tsx`
  * `src/components/TaskList.tsx`

---

## 21. 🎯 Posicionamiento Superior Elevado ("Arriba Arriba") para "Confirmar Eliminación de Usuario"
* **Estado:** ✅ APROBADO Y FUNCIONANDO CORRECTAMENTE — NO TOCAR.
* **Fecha y Hora:** 4 de Septiembre, 2026 — 12:39 PM (GMT-6)
* **Descripción del Cambio:**
  * Se reubicó el modal emergente de confirmación de eliminación de usuario (`AdminUsersPanel.tsx`) a la parte superior de la pantalla (`items-start pt-4 sm:pt-10 z-[9999]`), alineándolo al tope del viewport justo debajo de la barra navegadora.
  * Al hacer clic en el botón de eliminar usuario (`Trash2`), la ventana emergente aparece inmediatamente visible arriba en pantalla, sin importar la posición de scroll ni el tamaño del dispositivo.
* **Archivos Involucrados:**
  * `src/components/AdminUsersPanel.tsx`


---

## 22. 🖥️ Barra de Proyectos Ultra Compacta y Minimalista ("Botones Solo de Texto en Pequeño")
* **Estado:** ✅ APROBADO Y FUNCIONANDO CORRECTAMENTE — NO TOCAR.
* **Fecha y Hora:** 4 de Septiembre, 2026 — 02:16 PM (GMT-6)
* **Descripción del Cambio:**
  * Se rediseñó la barra de configuración del proyecto (`ProjectConfigBar.tsx`) transformándola en una **franja minimalista de alta densidad visual**, reduciendo la altura vertical y eliminando fondos oscuros pesados o cajas abultadas.
  * **Botones Solo de Texto ("En Pequeñito"):** Todas las acciones (`+ Nuevo`, `Clonar`, `Auto AI`, `Copiar Key`, `Eliminar`, `Borrar Todos`) se convirtieron a botones estilizados de texto minimalista con iconos sutiles.
  * **Distribución Slim en 2 Filas Minimalistas:**
    1. *Fila 1 (Toolbar Ultra Compacto):* `PROYECTO: [Dropdown]` + `+ Nuevo` + `Clonar` + `Auto AI` | `📊 Avance: 0% (0/0)` | `🔑 Key:` `arqai_sec_...` `[Copiar URL + Key]` | `Eliminar` | `Borrar Todos`.
    2. *Fila 2 (Metadatos Inline Slim):* Inputs minimalistas de `Nombre:` y `URL Web:` en una única línea estilizada con indicador `Sincronizado`.
* **Archivos Involucrados:**
  * `src/components/ProjectConfigBar.tsx`

---

## 23. ❌ Eliminación Individual de Cambios Aprobados del Historial (Botón "X")
* **Estado:** ✅ APROBADO Y FUNCIONANDO CORRECTAMENTE — NO TOCAR.
* **Fecha y Hora:** 4 de Septiembre, 2026 — 02:08 PM (GMT-6)
* **Descripción del Cambio:**
  * Se agregó la posibilidad de **eliminar individualmente cualquier registro de la lista cronológica de cambios aprobados**.
  * Se incorporó un botón interactivo de **"X" (Eliminar)** en cada tarjeta de funcionalidad aprobada en `ChangelogStandalonePage.tsx` y `ProjectChangelogView.tsx`.
  * Al hacer clic en la "X" y confirmar, el usuario de la cuenta puede remover inmediatamente cualquier cambio que esté mal registrado o que ya no desee conservar.
  * Se implementó el soporte atómico en el backend (`DELETE /api/history/:id`) tanto en Cloudflare D1/Functions como en el servidor Express local.
* **Archivos Involucrados:**
  * `src/components/ChangelogStandalonePage.tsx`
  * `src/components/ProjectChangelogView.tsx`
  * `src/services/api.ts`
  * `src/App.tsx`
  * `functions/api/[[path]].ts`
  * `server/apiApp.ts`

---

## 24. 📅 Vista de Tareas Agrupadas por Día en Cada Proyecto
* **Estado:** ✅ APROBADO Y FUNCIONANDO CORRECTAMENTE — NO TOCAR.
* **Fecha y Hora:** 9 de Septiembre, 2026 — 09:20 PM (GMT-6)
* **Descripción del Cambio:**
  * Se incorporó el modo **"Vista por Día"** en el selector de vistas de `TaskList.tsx` junto a "Vista Tareas" y "Vista Módulos & Etapas".
  * Las tareas se agrupan cronológicamente por día (`createdAt`) en orden descendente con tarjetas de cabecera que indican *"Hoy • [Fecha]"*, *"Ayer • [Fecha]"* o la fecha completa legible.
  * Cada grupo diario muestra métricas instantáneas (total tareas asignadas, cuántas por revisar, cuántas verificadas y porcentaje de avance del día).
  * Soporta acordeón interactivo para colapsar y expandir días, y es 100% compatible con la búsqueda reactiva y los filtros de estado (Todas, Por Revisar, Requiere Ajuste, etc.).
* **Archivos Involucrados:**
  * `src/components/TaskList.tsx`

---

## 25. 🔔 Notificaciones Nativas del Navegador (Desktop Web Notifications API)
* **Estado:** ✅ APROBADO Y FUNCIONANDO CORRECTAMENTE — NO TOCAR.
* **Fecha y Hora:** 9 de Septiembre, 2026 — 09:20 PM (GMT-6)
* **Descripción del Cambio:**
  * Se implementó el soporte para la **Web Notifications API nativa del navegador** (`browserNotifications.ts`) para emitir alertas de escritorio en Windows, macOS y Linux.
  * Permite al usuario recibir notificaciones con sonido y ventana flotante del sistema operativo cuando una IA completa una tarea (`ready_for_review`) o emite una alerta (`POST /api/agent/notify-user`), **incluso si tiene el navegador minimizado o está en otra pestaña**.
  * Al hacer clic sobre la notificación de escritorio, el navegador enfoca automáticamente la pestaña de ARQAI (`window.focus()`).
  * Se integró un interruptor de activación/desactivación y estado de permisos en el Buzón de Notificaciones (`NotificationsDrawer.tsx`).
* **Archivos Involucrados:**
  * `src/utils/browserNotifications.ts`
  * `src/components/NotificationsDrawer.tsx`
  * `src/App.tsx`

---

## 26. ⚡ ARQAI Task Runner (`[proyecto] arqt`), Centro de Control Modal y Regla de Inyección Directa a la Web
* **Estado:** ✅ APROBADO Y FUNCIONANDO CORRECTAMENTE — NO TOCAR.
* **Fecha y Hora:** 9 de Septiembre, 2026 — 09:20 PM (GMT-6)
* **Descripción del Cambio:**
  * **Comando Runner `[nombre-proyecto] arqt`:** Se formalizó la arquitectura y protocolo del comando de ejecución continua de tareas. Al ejecutar este comando, el agente IA consulta las tareas pendientes del proyecto, las procesa una por una secuencialmente (`in_progress` -> código -> validación -> `ready_for_review` -> notificación) y avanza automáticamente a la siguiente hasta completar la cola.
  * **Modal de Control `ArqtRunnerModal.tsx`:** Modal con estética IDE/AgentOS que muestra el comando exacto para copiar con un clic, métricas de cola en vivo, la tarjeta de la tarea actualmente en ejecución, botón de simulación manual y botón de copiado del prompt completo para cualquier agente IA.
  * **Acceso Rápido en Barra de Proyectos:** Botón estilizado `⚡ arqt` añadido en la barra compacta de configuración del proyecto (`ProjectConfigBar.tsx`).
  * **Regla Anti-Chat Bloat en `ARQAI_AGENT_SKILL.md`:** Prohibición estricta para que las IAs no vuelquen listas extensas de tareas en el chat de texto, sino que las inyecten directamente a la base de datos de ARQAI vía API (`/api/projects/:id/populate-plan` o `/api/tasks`) respondiendo solo un mensaje ejecutivo de confirmación con el comando `arqt`.
* **Archivos Involucrados:**
  * `src/components/ArqtRunnerModal.tsx`
  * `src/components/ProjectConfigBar.tsx`
  * `src/App.tsx`
  * `ARQAI_AGENT_SKILL.md`

---

## 27. 🧠 Memoria RAG Semántica 100% Nativa en Cloudflare (Workers AI + Vectorize + D1) y Regla Permanente `arqt`
* **Estado:** ✅ APROBADO Y FUNCIONANDO CORRECTAMENTE — NO TOCAR.
* **Fecha y Hora:** 9 de Septiembre, 2026 — 09:50 PM (GMT-6)
* **Descripción del Cambio:**
  * **Motor RAG 100% Nativo en Cloudflare:** Implementado sin dependencias externas ni servicios de terceros, utilizando exclusivamente el ecosistema Cloudflare: modelo de embeddings `@cf/baai/bge-base-en-v1.5` en Workers AI (`env.AI`), almacenamiento e indexación vectorial en Cloudflare Vectorize (`env.VECTORIZE`, índice `arqai-vectors`), y persistencia de texto completo y metadatos en Cloudflare D1 (`antigravity_rag_entries`).
  * **Ahorro Masivo de Tokens (70% - 90%):** Los agentes IA ya no necesitan recibir todo el historial de cambios, tareas y código en bruto en cada interacción; ahora consultan semánticamente solo los fragmentos relevantes a su tarea mediante `POST /api/rag/search` o `GET /api/rag/context`.
  * **Fallback Local Determinista:** Implementación en `server/ragEngine.ts` con generación determinista de vectores de 768 dimensiones y similitud coseno para desarrollo local y tests sin fallos si se ejecuta en servidor Node/Express.
  * **Endpoints RAG Unificados:**
    * `POST /api/rag/search`: Búsqueda de similitud vectorial con filtrado por proyecto y tipo (`history`, `task`, `chat`).
    * `GET /api/rag/context`: Extracción de contexto optimizado y conciso listo para inyectar en prompts de agentes IA.
    * `POST /api/rag/index`: Indexación en tiempo real de nuevas tareas, revisiones o cambios aprobados.
    * `POST /api/rag/reindex`: Reindexación masiva de proyectos completos en un solo clic.
  * **Modal Interactivo `RagSearchModal.tsx`:** Acceso directo desde el botón `Memoria & RAG` en la cabecera (`Header.tsx`) con indicador visual de similitud semántica, desglose de métricas de ahorro de tokens y botón de reindexación instantánea.
  * **Regla Permanente de Antigravity:** Protocolo del comando runner `arqt` blindado como regla permanente en `.agents/rules/arqt-runner.md` y `AGENTS.md`.
* **Archivos Involucrados:**
  * `server/ragEngine.ts` (Motor RAG unificado para Cloudflare Workers AI + Vectorize)
  * `wrangler.toml` (Bindings `[ai]` y `[[vectorize]]`)
  * `schema.sql` (Tabla `antigravity_rag_entries` en D1)
  * `functions/api/[[path]].ts` (Endpoints RAG en Cloudflare Pages Functions)
  * `server/apiApp.ts` (Endpoints RAG en servidor Express / fallback)
  * `src/services/api.ts` (Funciones cliente `searchRag`, `fetchAgentRagContext`, `reindexRag`)
  * `src/components/RagSearchModal.tsx` (Modal de búsqueda semántica y reindexación)
  * `src/components/Header.tsx` (Botón interactivo `Memoria & RAG`)
  * `src/App.tsx` (Integración del modal de RAG)
  * `.agents/rules/arqt-runner.md` (Regla permanente de Antigravity)
  * `AGENTS.md` (Guía de integración de agentes)

---

## 28. 🛡️ Blindaje Total del Ciclo de Vida de Tareas, Autonormalización y Notificaciones en Vivo
* **Estado:** ✅ APROBADO Y FUNCIONANDO CORRECTAMENTE — NO TOCAR.
* **Fecha y Hora:** 11 de Septiembre, 2026 — 02:45 PM (GMT-6)
* **Descripción del Cambio:**
  * **Autonormalización Inmune en Backend (Cloudflare D1 + Express):** Cualquier actualización de tarea con estados erróneos como `"completed"`, `"done"`, `"finished"` o `"complete"` es automáticamente convertida por la API a `"ready_for_review"` ("Por revisar"). Esto evita que las tareas caigan en estados invisibles en el frontend.
  * **Disparo Automático de Notificaciones y Conexiones en Backend:** Cuando una tarea pasa a `"ready_for_review"`, la API en Cloudflare Pages Functions (`functions/api/[[path]].ts`) registra de forma autónoma la notificación en `antigravity_notifications` y el registro en el radar de `antigravity_agent_connections`. Incluso si el bot o agente IA olvida invocar `/api/agent/notify-user`, el sistema garantiza que el usuario reciba la alerta y vea la actividad en la web.
  * **Rutas Oficiales en Cloudflare Functions:** Se incorporaron los manejadores directos `POST /api/tasks/:id/start-by-ai` (marca `in_progress` y loguea radar) y `POST /api/tasks/:id/complete-by-ai` (marca `ready_for_review`, crea notificación y registra radar).
  * **Tolerancia y Normalización en Frontend (`src/services/api.ts`):** En caso de cualquier respuesta legacy, `fetchTasks` normaliza proactivamente cualquier estado `"completed"` a `"ready_for_review"` asegurando 100% de visibilidad en el panel "Por revisar".
  * **Reglas Inyectadas en Repositorios (`AGENTS.md`):** Se blindó `AGENTS.md` en proyectos clientes (como `Qchatt Jules Antigravity`) y en `C:\Users\User\SkillsVault\skills\arqai-setup\SKILL.md`, estableciendo la prohibición explícita de usar `completed` y la obligación de emitir `notify-user`.
* **Archivos Involucrados:**
  * `functions/api/[[path]].ts`
  * `server/apiApp.ts`
  * `src/services/api.ts`
  * `c:\Users\User\Desktop\GeoSoft\Jules Antigravity\Qchatt Jules Antigravity\AGENTS.md`
  * `c:\Users\User\Desktop\GeoSoft\Jules Antigravity\Qchatt Jules Antigravity\GEMINI.md`
  * `C:\Users\User\SkillsVault\skills\arqai-setup\SKILL.md`
  * `HISTORIAL_DE_CAMBIOS_APROBADOS.md`

