// Intelligent Blueprint & Domain Work Plan Generator Engine
// ARQAI Architecture Engine

export interface ProjectScreen {
  id: string;
  name: string;
  path: string;
  description: string;
  features: string[];
}

export interface ProjectConnection {
  id?: string;
  name: string;
  purpose: string;
  type?: "database" | "auth" | "api" | "storage" | "webhook" | "other";
  configDetails?: string;
}

export interface ProjectBlueprint {
  masterPrompt: string;
  generalFeatures: string[];
  screens: ProjectScreen[];
  connections: ProjectConnection[];
  architecturalNotes: string;
  lastGeneratedPlanAt?: string;
}

export interface TaskContextMemory {
  technicalRequirements: string[];
  affectedFiles: string[];
  rulesConstraints: string[];
  dependencies: string[];
  notes: string;
}

export interface GeneratedTask {
  id?: string;
  moduleId?: string;
  stageId?: string;
  title: string;
  instruction: string;
  status?: string;
  subtasks?: { id: string; title: string; completed: boolean }[];
  contextMemory: TaskContextMemory;
}

export interface GeneratedStage {
  id?: string;
  moduleId?: string;
  title: string;
  description?: string;
  order?: number;
  tasks?: GeneratedTask[];
}

export interface GeneratedModule {
  id?: string;
  title: string;
  description?: string;
  order?: number;
  stages?: GeneratedStage[];
  tasks?: GeneratedTask[];
}

export interface GeneratedWorkPlan {
  modules: GeneratedModule[];
  stages: GeneratedStage[];
  tasks: GeneratedTask[];
}

/**
 * Enriquece la Memoria de Contexto (contextMemory) de una tarea con las reglas de ingeniería
 * de producción inspiradas en addyosmani/agent-skills: TDD, Beyonce Rule, Hyrum's Law, Chesterton's Fence y Quality Gates.
 */
export function enrichTaskContextWithAgentSkills(
  context: TaskContextMemory,
  taskTitle: string = "",
  taskInstruction: string = ""
): TaskContextMemory {
  const text = (taskTitle + " " + taskInstruction + " " + (context?.notes || "")).toLowerCase();

  const isBackendOrAPI = /endpoint|api|backend|express|server|route|controlador|auth|login|token|service/i.test(text);
  const isDatabase = /base de datos|database|d1|sql|tabla|esquema|schema|migration|postgre|neon|relacion/i.test(text);
  const isFrontendOrUI = /ui|componente|interfaz|pantalla|front|react|tailwind|vista|calendario|formulario|modal|css/i.test(text);
  const isTestingOrQA = /test|prueba|qa|verific|cobertura|vitest|jest|playwright|e2e/i.test(text);

  const reqs = new Set<string>(context?.technicalRequirements || []);
  const rules = new Set<string>(context?.rulesConstraints || []);
  const deps = new Set<string>(context?.dependencies || []);
  const files = new Set<string>(context?.affectedFiles || []);

  // 1. TDD & Testing (Beyonce Rule)
  if (isBackendOrAPI || isDatabase || isTestingOrQA) {
    reqs.add("🧪 TDD (Test-Driven Development): Escribir o preparar primero la prueba de integración automatizada antes de implementar la lógica nuclear.");
    rules.add("🎵 Beyonce Rule: Si la funcionalidad no está cubierta por un test automatizado que pase en verde, no se considera terminada.");
    if (!deps.has("Vitest") && !deps.has("Jest") && !deps.has("Playwright")) {
      deps.add("Vitest / Jest");
    }
  }

  // 2. Retrocompatibilidad & Contratos de API (Hyrum's Law)
  if (isBackendOrAPI) {
    rules.add("🛡️ Hyrum's Law: Preservar firmas de endpoints, nombres de propiedades JSON y firmas sin introducir breaking changes inesperados.");
  }

  // 3. Refactorización Segura & Estructura (Chesterton's Fence)
  if (isDatabase || isBackendOrAPI) {
    rules.add("🚧 Chesterton's Fence: No eliminar código existente, restricciones SQL ni middlewares sin entender y documentar el motivo original.");
  }

  // 4. Calidad de Interfaz & Accesibilidad (UX Engineering)
  if (isFrontendOrUI) {
    reqs.add("🎨 UI & Accessibility: Garantizar soporte para estados de carga (loading), estado vacío (empty state), manejo de errores y compatibilidad navegable por teclado (WCAG).");
    rules.add("📱 Responsive & Local State Scope: Mantener el estado transitorio localmente y asegurar legibilidad fluida en móviles y escritorio.");
  }

  // 5. Quality Gate & Verificación Obligatoria
  reqs.add("✅ Quality Gate: Verificar compilación estática sin errores (TypeScript/Linter) y ejecutar la suite de pruebas antes de solicitar revisión.");
  rules.add("🔒 Human QA Boundary: Solo el usuario humano puede verificar tareas (status = 'verified'). El agente solicita revisión con evidencia mediante status = 'ready_for_review'.");

  const existingNotes = context?.notes || "";
  const skillsNote = "📌 Agent Skills: Código de nivel producción con pruebas automatizadas, sin parches superficiales y con estricto control de tipos.";
  const combinedNotes = existingNotes
    ? existingNotes.includes("Agent Skills")
      ? existingNotes
      : `${existingNotes} | ${skillsNote}`
    : skillsNote;

  return {
    technicalRequirements: Array.from(reqs),
    affectedFiles: Array.from(files),
    rulesConstraints: Array.from(rules),
    dependencies: Array.from(deps),
    notes: combinedNotes,
  };
}

// ---------------------------------------------------------------------------
// 1. GENERADOR DE BLUEPRINT INTELIGENTE DESDE UNA IDEA
// ---------------------------------------------------------------------------
export async function generateBlueprintFromIdea(
  idea: string,
  projectName?: string,
  apiKey?: string
): Promise<ProjectBlueprint> {
  const cleanIdea = (idea || "").trim();
  const cleanName = (projectName || "Proyecto ARQAI").trim();

  // Si tenemos API Key de Gemini, intentamos generar vía LLM
  const geminiKey = apiKey || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : "");
  if (geminiKey && cleanIdea.length > 5) {
    try {
      const aiBlueprint = await callGeminiForBlueprint(cleanIdea, cleanName, geminiKey);
      if (aiBlueprint && aiBlueprint.masterPrompt && Array.isArray(aiBlueprint.screens) && aiBlueprint.screens.length > 0) {
        return aiBlueprint;
      }
    } catch (err) {
      console.warn("[BlueprintEngine] Fallback a generador semántico local:", err);
    }
  }

  // Generador Semántico de Alta Fidelidad por Dominio
  return synthesizeBlueprintByDomain(cleanIdea, cleanName);
}

// ---------------------------------------------------------------------------
// 2. GENERADOR DE PLAN DE TRABAJO NO GENÉRICO DESDE BLUEPRINT
// ---------------------------------------------------------------------------
export async function generateWorkPlanFromBlueprint(
  blueprint: ProjectBlueprint,
  projectId: string,
  apiKey?: string
): Promise<GeneratedWorkPlan> {
  // Si tenemos API Key de Gemini, intentamos generar vía LLM
  const geminiKey = apiKey || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : "");
  if (geminiKey && blueprint && blueprint.masterPrompt) {
    try {
      const aiPlan = await callGeminiForPlan(blueprint, projectId, geminiKey);
      if (aiPlan && aiPlan.modules?.length > 0 && aiPlan.tasks?.length > 0) {
        return aiPlan;
      }
    } catch (err) {
      console.warn("[BlueprintEngine] Fallback a sintetizador de plan local:", err);
    }
  }

  // Sintetizador de Plan de Trabajo No Genérico por Dominio
  return synthesizeWorkPlanFromBlueprint(blueprint, projectId);
}

// ---------------------------------------------------------------------------
// SINTETIZADOR DE BLUEPRINT POR DOMINIO
// ---------------------------------------------------------------------------
export function synthesizeBlueprintByDomain(idea: string, projectName: string): ProjectBlueprint {
  const lower = (idea + " " + projectName).toLowerCase();

  // Detectar categoría dominante
  const isBooking = /reserva|cita|booking|calendario|agenda|horario|disponibilidad|turno/i.test(lower);
  const isEcommerce = /tienda|ecommerce|e-commerce|producto|carrito|checkout|pago|comprar|catalogo|orden/i.test(lower);
  const isCRM = /crm|cliente|factura|contable|contabilidad|saas|suscripcion|empresa|lead|pipeline/i.test(lower);
  const isChat = /chat|soporte|ticket|mensaje|conversacion|bot|atencion|livechat/i.test(lower);
  const isHealth = /medico|clinica|paciente|salud|doctor|hospital|receta|historial|consulta/i.test(lower);
  const isFood = /restaurante|comida|delivery|menu|pedido|plato|cocina/i.test(lower);
  const isEdu = /curso|estudiante|clase|profesor|academia|leccion|evaluacion|lms/i.test(lower);

  if (isBooking) {
    return {
      masterPrompt: idea || `Crear una aplicación web de reservas para servicios. Los clientes deben poder consultar disponibilidad, elegir servicio, seleccionar fecha y hora, confirmar una reserva y modificar o cancelar citas. Los administradores deben poder gestionar servicios, horarios, recursos, clientes, reservas, bloqueos de agenda y reportes básicos.`,
      generalFeatures: [
        "Catálogo de servicios con duración, precio y descripción.",
        "Calendario de disponibilidad para seleccionar fecha y hora.",
        "Formulario de reserva con datos del cliente.",
        "Panel administrativo para gestionar reservas.",
        "Gestión de horarios, recursos y bloqueos.",
        "Estados de reserva: pendiente, confirmada, cancelada, completada y no presentada.",
        "Notificaciones de confirmación, cancelación y recordatorio.",
        "Reportes básicos de ocupación y reservas por periodo."
      ],
      screens: [
        {
          id: "scr-home",
          name: "Inicio y servicios",
          path: "/",
          description: "Pantalla inicial donde el cliente ve los servicios disponibles.",
          features: [
            "Listado de servicios",
            "Filtros por categoría",
            "Botón para iniciar reserva"
          ]
        },
        {
          id: "scr-booking",
          name: "Flujo de reserva",
          path: "/reservar",
          description: "Pantalla para elegir servicio, fecha, hora y confirmar datos.",
          features: [
            "Selector de servicio",
            "Calendario accesible",
            "Horarios disponibles",
            "Resumen antes de confirmar",
            "Validación contra doble reserva"
          ]
        },
        {
          id: "scr-admin",
          name: "Panel administrador",
          path: "/admin",
          description: "Panel para gestionar servicios, horarios, clientes y reservas.",
          features: [
            "CRUD de servicios",
            "Agenda diaria y semanal",
            "Cambio de estado de reservas",
            "Bloqueos de agenda",
            "Reportes básicos"
          ]
        }
      ],
      connections: [
        {
          name: "Base de datos",
          purpose: "Guardar servicios, recursos, clientes, reservas, disponibilidad y bloqueos.",
          type: "database"
        },
        {
          name: "Email transaccional",
          purpose: "Enviar confirmaciones, cancelaciones y recordatorios.",
          type: "api"
        }
      ],
      architecturalNotes: "Separar módulos de cliente, administración y disponibilidad. La regla crítica es evitar doble reserva para el mismo recurso en el mismo bloque horario. Mantener diseño responsive, accesibilidad WCAG, validaciones claras y estados de error/vacío."
    };
  }

  if (isEcommerce) {
    return {
      masterPrompt: idea || `Desarrollar una tienda en línea moderna con catálogo de productos por categorías, carrito de compras reactivo, cálculo de costos de envío, integración de pasarela de pago segura y panel de administración para control de inventario y pedidos.`,
      generalFeatures: [
        "Catálogo de productos con imágenes, variantes de tamaño/color y stock en tiempo real.",
        "Carrito de compras persistente con cálculo automático de subtotales, impuestos y envío.",
        "Checkout ágil con validación de dirección y múltiples métodos de pago.",
        "Panel de administración para gestión de productos, inventario y estados de pedidos.",
        "Seguimiento de pedidos por código único para el cliente.",
        "Diseño 100% responsivo optimizado para compras desde móviles."
      ],
      screens: [
        {
          id: "scr-home",
          name: "Tienda y Catálogo",
          path: "/",
          description: "Escaparate principal con productos destacados y filtros.",
          features: ["Buscador instantáneo", "Filtro por precio y categoría", "Añadido rápido al carrito"]
        },
        {
          id: "scr-product",
          name: "Detalle del Producto",
          path: "/producto/:id",
          description: "Ficha técnica completa con selector de variantes y galería.",
          features: ["Galería de imágenes con zoom", "Selector de variantes y cantidad", "Reseñas de compradores"]
        },
        {
          id: "scr-cart-checkout",
          name: "Carrito & Checkout",
          path: "/checkout",
          description: "Pasos de confirmación de pedido, dirección de envío y pasarela de pago.",
          features: ["Resumen de orden", "Formulario de envío validado", "Integración de pago seguro"]
        },
        {
          id: "scr-admin",
          name: "Panel de Gestión de Órdenes e Inventario",
          path: "/admin",
          description: "Panel para que los administradores despachen pedidos y actualicen stock.",
          features: ["Lista de órdenes con cambio de estado", "Control de stock mínimo y alertas", "Métricas de ventas"]
        }
      ],
      connections: [
        { name: "Base de datos", purpose: "Guardar productos, variantes, stock, pedidos y clientes.", type: "database" },
        { name: "Pasarela de pago", purpose: "Procesar transacciones con webhook de verificación.", type: "api" }
      ],
      architecturalNotes: "Control de concurrencia en stock durante el checkout. Desacoplamiento de pasarela mediante webhooks idempotentes. Carrito sincronizado en cliente y base de datos."
    };
  }

  if (isCRM) {
    return {
      masterPrompt: idea || `Construir un software SaaS / CRM administrativo para gestión integral de clientes, seguimiento de oportunidades comerciales, emisión de presupuestos y control de tareas del equipo con roles de usuario diferenciados.`,
      generalFeatures: [
        "Autenticación multi-usuario con roles diferenciados (Admin, Ejecutivo, Auditor).",
        "Directorio centralizado de clientes y contactos con historial de interacciones.",
        "Pipeline de oportunidades en vista Kanban interactiva.",
        "Módulo de presupuestos y emisión de comprobantes en PDF/Excel.",
        "Registro de auditoría y métricas de desempeño por ejecutivo."
      ],
      screens: [
        {
          id: "scr-dashboard",
          name: "Tablero Principal de Métricas",
          path: "/",
          description: "Métricas clave de ventas, conversiones y tareas pendientes.",
          features: ["Gráficos de ventas", "Alertas de seguimiento urgente", "Resumen de actividad"]
        },
        {
          id: "scr-clients",
          name: "Directorio de Clientes",
          path: "/clientes",
          description: "Gestión completa de cartera de clientes y fichas de contacto.",
          features: ["Buscador y filtros avanzados", "Ficha técnica de cliente", "Historial de notas y llamadas"]
        },
        {
          id: "scr-pipeline",
          name: "Pipeline de Ventas (Kanban)",
          path: "/pipeline",
          description: "Flujo de oportunidades arrastrables por etapas comerciales.",
          features: ["Tablero Kanban drag & drop", "Cálculo de valor estimado por etapa", "Cierre ganado/perdido"]
        },
        {
          id: "scr-admin",
          name: "Configuración y Usuarios",
          path: "/admin",
          description: "Administración de usuarios, roles, empresas y permisos.",
          features: ["Gestión de usuarios y accesos", "Personalización de etapas", "Registro de auditoría"]
        }
      ],
      connections: [
        { name: "Base de datos", purpose: "Almacenar organizaciones, usuarios, clientes, deals y notas.", type: "database" },
        { name: "Generador de reportes", purpose: "Exportación de datos a PDF y Excel.", type: "other" }
      ],
      architecturalNotes: "Seguridad basada en Row Level Security (RLS) y RBAC estricto. Separar capa de servicios de datos de la UI. Auditoría automática de cambios en entidades sensibles."
    };
  }

  // Dominio Genérico Contextualizado
  const words = idea.split(/\s+/).filter(w => w.length > 3);
  const mainSubject = words.slice(0, 3).join(" ") || projectName;

  return {
    masterPrompt: idea || `Construir una solución digital completa para ${projectName}, optimizada para ofrecer una experiencia fluida, arquitectura modular, gestión de datos segura y panel de control administrativo.`,
    generalFeatures: [
      `Gestión integral y flujo principal de ${mainSubject}.`,
      "Diseño responsivo de alta densidad con soporte para móviles y escritorio.",
      "Control de estados en tiempo real con validaciones y alertas contextuales.",
      "Panel administrativo centralizado para supervisión y configuración.",
      "Persistencia de datos estructurados con historial de cambios y auditoría."
    ],
    screens: [
      {
        id: "scr-home",
        name: `Inicio y Exploración de ${projectName}`,
        path: "/",
        description: `Vista principal para acceder a las opciones y operaciones clave de ${mainSubject}.`,
        features: ["Tablero de bienvenida", "Accesos rápidos a flujos clave", "Resumen de actividad reciente"]
      },
      {
        id: "scr-main-flow",
        name: `Flujo Principal de ${projectName}`,
        path: "/operaciones",
        description: `Módulo central donde los usuarios interactúan y procesan los registros de ${mainSubject}.`,
        features: ["Formularios de captura validados", "Listados con filtros y ordenamiento", "Acciones de edición y borrado seguro"]
      },
      {
        id: "scr-admin",
        name: "Panel Administrativo y Reportes",
        path: "/admin",
        description: "Área de gestión para supervisar métricas, usuarios y configuración global.",
        features: ["Configuración del sistema", "Reportes de rendimiento", "Gestión de permisos"]
      }
    ],
    connections: [
      { name: "Base de datos", purpose: `Guardar entidades principales y registros de ${mainSubject}.`, type: "database" },
      { name: "Servicio de notificaciones", purpose: "Alertas al usuario y eventos del sistema.", type: "api" }
    ],
    architecturalNotes: `Arquitectura modular en capas: capa de presentación en React, servicios de API desacoplados y persistencia en base de datos. Garantizar validaciones en cliente y servidor, manejo consistente de errores y accesibilidad WCAG.`
  };
}

// ---------------------------------------------------------------------------
// SINTETIZADOR DE PLAN DE TRABAJO NO GENÉRICO DESDE BLUEPRINT
// ---------------------------------------------------------------------------
export function synthesizeWorkPlanFromBlueprint(
  blueprint: ProjectBlueprint,
  projectId: string
): GeneratedWorkPlan {
  const master = (blueprint.masterPrompt || "").toLowerCase();
  const isBooking = /reserva|cita|booking|calendario|agenda|horario|disponibilidad/i.test(master);
  const isEcommerce = /tienda|ecommerce|e-commerce|producto|carrito|checkout|pago/i.test(master);

  let rawModules: {
    title: string;
    description: string;
    stages: {
      title: string;
      description: string;
      tasks: {
        title: string;
        instruction: string;
        subtasks: string[];
        contextMemory: TaskContextMemory;
      }[];
    }[];
  }[] = [];

  if (isBooking) {
    rawModules = [
      {
        title: "Modelo de reservas y disponibilidad",
        description: "Esquema de base de datos, relaciones de servicios, horarios y motor de cálculo de disponibilidad horaria sin solapamiento.",
        stages: [
          {
            title: "Esquema de datos y reglas de solapamiento",
            description: "Diseño de tablas en D1/PostgreSQL y restricciones de integridad.",
            tasks: [
              {
                title: "Crear esquema de servicios, recursos y reservas",
                instruction: "Definir tablas para servicios (duración, precio), recursos (especialistas/salas) y reservas con restricción única de horario.",
                subtasks: [
                  "Definir tabla 'services' con campos duration_minutes, price, active",
                  "Definir tabla 'bookings' con inicio, fin, estado y relación con cliente",
                  "Crear índice compuesto para búsquedas ultra-rápidas por rango de fecha"
                ],
                contextMemory: {
                  technicalRequirements: [
                    "Evitar dobles reservas mediante restricción de rango temporal o bloqueo lógico.",
                    "El cálculo de fin de cita debe ser: start_time + duration_minutes.",
                    "Soportar zonas horarias consistentes (UTC ISO-8601)."
                  ],
                  affectedFiles: ["server/d1.ts", "schema.sql", "src/types.ts"],
                  rulesConstraints: [
                    "No permitir reservas en el pasado.",
                    "No modificar humanFeedback en las tareas.",
                    "No marcar como verified sin revisión humana."
                  ],
                  dependencies: ["Cloudflare D1", "SQLite", "TypeScript"],
                  notes: "Módulo base sobre el que dependen el cliente y el panel de administración."
                }
              },
              {
                title: "Motor de cálculo de slots de disponibilidad",
                instruction: "Implementar endpoint y función que calcule los horarios libres cruzando horario de atención, reservas existentes y bloqueos.",
                subtasks: [
                  "Generar slots cada 15/30/60 minutos según la duración del servicio",
                  "Filtrar slots que colisionen con reservas activas o bloqueos",
                  "Endpoint GET /api/availability?date=YYYY-MM-DD&serviceId=..."
                ],
                contextMemory: {
                  technicalRequirements: [
                    "Debe devolver array de strings ['09:00', '09:30', '10:00'] listos para la UI.",
                    "Ocultar o deshabilitar horarios no disponibles.",
                    "Tiempo de respuesta menor a 50ms."
                  ],
                  affectedFiles: ["server/apiApp.ts", "functions/api/[[path]].ts", "src/services/api.ts"],
                  rulesConstraints: ["Validar disponibilidad antes de confirmar."],
                  dependencies: ["date-fns", "TypeScript"],
                  notes: "Función nuclear para garantizar que nunca ocurra sobreventa de turnos."
                }
              }
            ]
          }
        ]
      },
      {
        title: "Flujo cliente de reserva",
        description: "Experiencia de usuario para seleccionar servicio, navegar calendario de fechas y confirmar su cita.",
        stages: [
          {
            title: "Catálogo y selección de fecha/hora",
            description: "Interfaz reactiva con selector de servicio y calendario de días disponibles.",
            tasks: [
              {
                title: "Construir calendario de disponibilidad",
                instruction: "Crear la interfaz y la lógica para mostrar días y horarios disponibles según servicio, recurso y bloqueos existentes.",
                subtasks: [
                  "Renderizar componente de calendario mensual navegable",
                  "Cargar y destacar días con horarios libres",
                  "Selector de horario en cuadrícula con estado seleccionado/ocupado"
                ],
                contextMemory: {
                  technicalRequirements: [
                    "El calendario debe ser navegable por teclado.",
                    "Debe ocultar o deshabilitar horarios no disponibles.",
                    "Debe validar disponibilidad antes de confirmar."
                  ],
                  affectedFiles: [
                    "src/modules/bookings/*",
                    "src/lib/availability/*",
                    "src/components/calendar/*"
                  ],
                  rulesConstraints: [
                    "No permitir doble reserva del mismo recurso en el mismo horario.",
                    "No editar humanFeedback.",
                    "No marcar tareas como verified automáticamente."
                  ],
                  dependencies: [
                    "date-fns",
                    "React",
                    "Tailwind"
                  ],
                  notes: "Esta tarea pertenece al flujo cliente de reserva."
                }
              },
              {
                title: "Formulario de datos de cliente y confirmación",
                instruction: "Desarrollar formulario con nombre, teléfono, email, notas especiales y emisión de token de confirmación.",
                subtasks: [
                  "Validación de campos obligatorios en tiempo real",
                  "Envío POST /api/bookings con reserva en estado 'pending' o 'confirmed'",
                  "Pantalla de éxito con resumen, código de cita y botón para guardar en calendario"
                ],
                contextMemory: {
                  technicalRequirements: [
                    "Manejo de estados de carga (loading spinners) y prevención de doble submit.",
                    "Generar código alfanumérico amigable (ej. RSV-7842).",
                    "Persistir reserva en base de datos de inmediato."
                  ],
                  affectedFiles: ["src/components/BookingConfirmation.tsx", "src/services/api.ts"],
                  rulesConstraints: ["No bloquear la UI en caso de error de red; mostrar retry."],
                  dependencies: ["React", "Tailwind"],
                  notes: "Paso final del cliente antes de recibir su notificación."
                }
              }
            ]
          }
        ]
      },
      {
        title: "Panel administrativo",
        description: "Herramientas maestras para el personal y administradores: gestión de servicios, horarios, bloqueos y control de citas.",
        stages: [
          {
            title: "Gestión de agenda y operaciones diarias",
            description: "Vistas de calendario diario/semanal, cambio de estados y cancelaciones.",
            tasks: [
              {
                title: "Desarrollar vista de agenda diaria y semanal para administradores",
                instruction: "Crear panel administrativo donde se visualicen todas las reservas organizadas por profesional/recurso y estado.",
                subtasks: [
                  "Vista de cuadrícula semanal tipo Google Calendar",
                  "Cambio rápido de estado: Confirmada, Completada, Cancelada, No Asistió",
                  "Modal de bloqueo manual de horario (por reunión, almuerzo o feriado)"
                ],
                contextMemory: {
                  technicalRequirements: [
                    "Filtros por estado de reserva y por recurso asignado.",
                    "Acceso protegido para administradores.",
                    "Actualización reactiva sin recargar la página completa."
                  ],
                  affectedFiles: ["src/components/AdminCalendar.tsx", "src/components/AdminBookings.tsx"],
                  rulesConstraints: ["Mantener coherencia de colores por estado de reserva."],
                  dependencies: ["React", "lucide-react", "Tailwind"],
                  notes: "Herramienta principal de trabajo del personal del negocio."
                }
              },
              {
                title: "CRUD de servicios, precios y duraciones",
                instruction: "Formularios administrativos para crear, editar, pausar y fijar precios de servicios ofertados.",
                subtasks: [
                  "Tabla con lista de servicios activos e inactivos",
                  "Modal de creación/edición con duración en minutos y precio",
                  "Endpoint PUT /api/admin/services/:id"
                ],
                contextMemory: {
                  technicalRequirements: [
                    "Validar que la duración sea múltiplo positivo de 5 o 15 minutos.",
                    "No permitir eliminar servicios con citas pendientes activas (soft delete)."
                  ],
                  affectedFiles: ["src/components/ServicesManagement.tsx", "server/apiApp.ts"],
                  rulesConstraints: ["Validación estricta de tipos numéricos."],
                  dependencies: ["React", "Tailwind"],
                  notes: "Permite al cliente final configurar su oferta comercial dinámicamente."
                }
              }
            ]
          }
        ]
      },
      {
        title: "Notificaciones",
        description: "Envío automatizado de correos y alertas al cliente y administrador ante eventos de reserva.",
        stages: [
          {
            title: "Disparadores de email transaccional",
            description: "Plantillas de correo y llamadas a servicio de mensajería.",
            tasks: [
              {
                title: "Integrar envío de confirmación y recordatorio por email",
                instruction: "Configurar envío de correo con detalles de la reserva al cliente y notificación al administrador al crearse una cita.",
                subtasks: [
                  "Diseñar plantilla HTML de confirmación con fecha, hora, dirección y link de gestión",
                  "Diseñar plantilla de cancelación y reprogramación",
                  "Conectar llamada asíncrona tras inserción exitosa en base de datos"
                ],
                contextMemory: {
                  technicalRequirements: [
                    "Las notificaciones no deben bloquear la respuesta HTTP de la reserva.",
                    "Plantilla responsive compatible con clientes de correo comunes."
                  ],
                  affectedFiles: ["server/email.ts", "functions/api/[[path]].ts"],
                  rulesConstraints: ["Manejo de errores silencioso si el proveedor de correo falla."],
                  dependencies: ["Resend", "HTML Templates"],
                  notes: "Reduce drásticamente el ausentismo (no-show) de clientes."
                }
              }
            ]
          }
        ]
      },
      {
        title: "QA y accesibilidad",
        description: "Verificación de concurrencia, prevención de doble reserva y auditoría de accesibilidad.",
        stages: [
          {
            title: "Auditoría de seguridad y validación en vivo",
            description: "Pruebas de estrés y verificación de navegación accesible.",
            tasks: [
              {
                title: "Validar concurrencia contra doble reserva y pruebas WCAG",
                instruction: "Ejecutar pruebas automatizadas intentando reservar el mismo horario simultáneamente y verificar navegación 100% por teclado.",
                subtasks: [
                  "Test de concurrencia de dos solicitudes simultáneas al mismo slot",
                  "Auditoría con Lighthouse para accesibilidad (Score > 90)",
                  "Validación de contraste de colores y lectores de pantalla (ARIA labels)"
                ],
                contextMemory: {
                  technicalRequirements: [
                    "La base de datos debe rechazar la segunda reserva con error 409 Conflict.",
                    "Todos los botones del calendario deben tener aria-label descriptivo."
                  ],
                  affectedFiles: ["tests/booking-concurrency.test.ts", "src/components/calendar/*"],
                  rulesConstraints: [
                    "No dar por aprobada la tarea sin prueba de concurrencia exitosa.",
                    "No marcar tareas como verified automáticamente."
                  ],
                  dependencies: ["Jest/Vitest", "Playwright"],
                  notes: "Garantiza robustez de grado de producción antes del despliegue final."
                }
              }
            ]
          }
        ]
      }
    ];
  } else if (isEcommerce) {
    rawModules = [
      {
        title: "Catálogo de productos y variantes",
        description: "Modelado de inventario, categorías, variantes de producto y buscador en tiempo real.",
        stages: [
          {
            title: "Estructura de catálogo y filtros",
            description: "Base de datos y componentes de navegación comercial.",
            tasks: [
              {
                title: "Crear esquema de productos, categorías y stock",
                instruction: "Definir tablas para productos, imágenes, precios, variantes y control de stock disponible.",
                subtasks: ["Crear tablas products y product_variants", "Definir índices por categoría y precio", "Endpoint GET /api/products"],
                contextMemory: {
                  technicalRequirements: ["Soporte de múltiples imágenes por producto", "Control de stock a nivel de variante"],
                  affectedFiles: ["schema.sql", "server/d1.ts", "src/types.ts"],
                  rulesConstraints: ["Validar precios positivos y stock no negativo."],
                  dependencies: ["Cloudflare D1", "TypeScript"],
                  notes: "Base del catálogo de venta."
                }
              },
              {
                title: "Desarrollar escaparate con filtros dinámicos y buscador",
                instruction: "Construir interfaz reactiva para explorar productos con ordenamiento por precio y filtro por categoría.",
                subtasks: ["Barra de búsqueda con debounce", "Filtro de rango de precios", "Cards de producto con botón de compra rápida"],
                contextMemory: {
                  technicalRequirements: ["Diseño responsivo en cuadrícula", "Imágenes optimizadas con lazy loading"],
                  affectedFiles: ["src/components/ProductGrid.tsx", "src/components/ProductCard.tsx"],
                  rulesConstraints: ["Accesibilidad en botones y etiquetas de precio."],
                  dependencies: ["React", "Tailwind", "lucide-react"],
                  notes: "Pantalla principal de venta."
                }
              }
            ]
          }
        ]
      },
      {
        title: "Carrito reactivo y pasarela de pago",
        description: "Gestión de carrito de compras, cálculo de impuestos, envíos y checkout con pasarela de pago.",
        stages: [
          {
            title: "Flujo de compra y checkout seguro",
            description: "Carrito persistente y confirmación de pago.",
            tasks: [
              {
                title: "Implementar carrito persistente con cálculo de envíos",
                instruction: "Crear estado global de carrito con persistencia local y validación de stock disponible antes del checkout.",
                subtasks: ["Control de cantidades y eliminación de items", "Cálculo de total con gastos de envío", "Persistencia en localStorage"],
                contextMemory: {
                  technicalRequirements: ["Sincronización instantánea de stock", "Manejo de cupón de descuento"],
                  affectedFiles: ["src/context/CartContext.tsx", "src/components/CartDrawer.tsx"],
                  rulesConstraints: ["No permitir cantidades mayores al stock real."],
                  dependencies: ["React Context / Zustand"],
                  notes: "Experiencia clave de conversión de clientes."
                }
              },
              {
                title: "Integrar pasarela de pago y generación de órdenes",
                instruction: "Conectar pasarela con webhook de verificación y creación de registro de orden de compra.",
                subtasks: ["Formulario de checkout con dirección", "Llamada a API de pago", "Webhook de confirmación de pago exitoso"],
                contextMemory: {
                  technicalRequirements: ["Webhook idempotente para evitar cobros dobles", "Generación de número de tracking"],
                  affectedFiles: ["server/payments.ts", "src/components/Checkout.tsx"],
                  rulesConstraints: ["Nunca almacenar números de tarjeta en texto plano."],
                  dependencies: ["Stripe / MercadoPago API"],
                  notes: "Procesamiento seguro de transacciones."
                }
              }
            ]
          }
        ]
      },
      {
        title: "Panel administrativo de órdenes e inventario",
        description: "Gestión de pedidos, actualización de estados de despacho y control de inventario.",
        stages: [
          {
            title: "Supervisión de ventas y despachos",
            description: "Control de órdenes y actualización de stock.",
            tasks: [
              {
                title: "Construir panel administrativo de órdenes y despachos",
                instruction: "Crear tabla de pedidos con filtros por estado (Pagado, En preparación, Enviado, Entregado).",
                subtasks: ["Visualización de detalle de orden y cliente", "Cambio de estado con notificación al cliente", "Exportación de listado de ventas"],
                contextMemory: {
                  technicalRequirements: ["Actualización de stock automática al cancelar orden", "Protección de rutas admin"],
                  affectedFiles: ["src/components/AdminOrders.tsx", "server/apiApp.ts"],
                  rulesConstraints: ["Auditoría de quién cambia el estado de la orden."],
                  dependencies: ["React", "Tailwind"],
                  notes: "Gestión logística del negocio."
                }
              }
            ]
          }
        ]
      },
      {
        title: "Notificaciones y seguimiento de envíos",
        description: "Alertas al cliente sobre cambios de estado en su orden.",
        stages: [
          {
            title: "Mensajería transaccional de compras",
            description: "Plantillas de correo para tickets y comprobantes.",
            tasks: [
              {
                title: "Crear disparadores de notificación por email de órdenes",
                instruction: "Enviar comprobante de compra y código de seguimiento al cliente automáticamente.",
                subtasks: ["Plantilla de orden confirmada", "Plantilla de orden enviada con link de tracking"],
                contextMemory: {
                  technicalRequirements: ["Envío asíncrono", "Adjunto de factura en PDF si aplica"],
                  affectedFiles: ["server/email.ts"],
                  rulesConstraints: ["No bloquear respuesta HTTP del checkout."],
                  dependencies: ["Resend API"],
                  notes: "Notificaciones de tienda."
                }
              }
            ]
          }
        ]
      },
      {
        title: "QA y accesibilidad",
        description: "Pruebas de checkout, validación de pasarela y auditoría de accesibilidad.",
        stages: [
          {
            title: "Verificación de compra y accesibilidad",
            description: "Pruebas de extremos del carrito y pagos.",
            tasks: [
              {
                title: "Pruebas integrales de flujo de compra y accesibilidad",
                instruction: "Realizar órdenes de prueba con tarjetas de test de Stripe y auditar componentes con lectores de pantalla.",
                subtasks: ["Validación de webhook de Stripe en ambiente de prueba", "Auditoría de contraste y teclado"],
                contextMemory: {
                  technicalRequirements: ["Lighthouse score > 90", "Manejo de tarjetas rechazadas"],
                  affectedFiles: ["tests/checkout.test.ts"],
                  rulesConstraints: ["No aprobar sin prueba de pago exitosa."],
                  dependencies: ["Playwright / Vitest"],
                  notes: "Fase de control de calidad."
                }
              }
            ]
          }
        ]
      }
    ];
  } else {
    // Dominio Personalizado basado en las pantallas del Blueprint
    const screens = blueprint.screens && blueprint.screens.length > 0 ? blueprint.screens : [
      { id: "scr-1", name: "Gestión Principal", path: "/main", description: "Operaciones principales", features: ["Listados", "Formularios"] },
      { id: "scr-2", name: "Panel Administrativo", path: "/admin", description: "Administración", features: ["Configuración", "Reportes"] }
    ];

    rawModules = [
      {
        title: `Modelo de datos y servicios de ${screens[0]?.name || "Gestión"}`,
        description: `Diseño de tablas, API REST y lógica de negocio para la gestión de ${blueprint.masterPrompt?.substring(0, 40) || "la aplicación"}.`,
        stages: [
          {
            title: "Esquema relacional y endpoints nucleares",
            description: "Creación de tablas, migraciones y endpoints CRUD.",
            tasks: [
              {
                title: `Crear esquema y modelos de datos para ${screens[0]?.name || "el sistema"}`,
                instruction: `Definir estructura de tablas en base de datos con índices y restricciones para dar soporte a las pantallas del Blueprint.`,
                subtasks: [
                  "Diseñar tablas con claves foráneas e índices",
                  "Implementar endpoints CRUD en API REST",
                  "Validación de tipos en TypeScript"
                ],
                contextMemory: {
                  technicalRequirements: [
                    "Persistencia de datos consistente en D1 / PostgreSQL.",
                    "Respuestas en formato JSON estándar con códigos de estado HTTP correctos."
                  ],
                  affectedFiles: ["schema.sql", "server/d1.ts", "server/apiApp.ts"],
                  rulesConstraints: ["No hardcodear credenciales.", "Validar entradas del usuario."],
                  dependencies: ["Cloudflare D1", "TypeScript"],
                  notes: "Módulo fundamental de persistencia de datos."
                }
              }
            ]
          }
        ]
      },
      ...screens.map((screen) => ({
        title: `Módulo de ${screen.name}`,
        description: `Desarrollo de la interfaz, componentes interactivos y servicios para ${screen.name} (${screen.path || "/"}).`,
        stages: [
          {
            title: `Implementación de interfaz y lógica de ${screen.name}`,
            description: screen.description || `Vistas y componentes para ${screen.name}.`,
            tasks: (screen.features && screen.features.length > 0 ? screen.features : ["Construir vista interactiva y conectar con API"]).map((feat) => ({
              title: `${feat} en ${screen.name}`,
              instruction: `Desarrollar la funcionalidad '${feat}' dentro de la pantalla ${screen.name} (${screen.path || "/"}) conectando con los endpoints correspondientes.`,
              subtasks: [
                `Maquetar vista responsiva para ${feat}`,
                "Conectar llamadas asíncronas con manejo de loading y error",
                "Pruebas de interacción y validación de campos"
              ],
              contextMemory: {
                technicalRequirements: [
                  "Diseño responsivo compatible con dispositivos móviles y escritorio.",
                  "Manejo de estados de carga y vacíos (empty states)."
                ],
                affectedFiles: [`src/components/${screen.name.replace(/[^a-zA-Z0-9]/g, "")}.tsx`, "src/services/api.ts"],
                rulesConstraints: [
                  "No editar humanFeedback.",
                  "No marcar tareas como verified automáticamente."
                ],
                dependencies: ["React", "Tailwind", "lucide-react"],
                notes: `Pertenece a la pantalla ${screen.name}.`
              }
            }))
          }
        ]
      })),
      {
        title: "QA y accesibilidad",
        description: "Validación de flujos completos, pruebas de rendimiento y verificación de accesibilidad WCAG.",
        stages: [
          {
            title: "Control de calidad y verificación integral",
            description: "Auditoría de navegación, seguridad y despliegue.",
            tasks: [
              {
                title: "Ejecutar pruebas de integración de punta a punta y accesibilidad",
                instruction: "Comprobar los flujos principales de extremo a extremo, validar respuestas de API y auditar accesibilidad por teclado.",
                subtasks: [
                  "Validar flujo completo desde la vista inicial hasta la confirmación",
                  "Verificar que no existan errores en la consola del navegador",
                  "Auditar navegación por teclado y contraste de colores"
                ],
                contextMemory: {
                  technicalRequirements: ["Score de accesibilidad > 90 en Lighthouse.", "Cero errores 500 no controlados."],
                  affectedFiles: ["src/App.tsx", "src/main.tsx"],
                  rulesConstraints: ["Verificación humana obligatoria antes de dar por completado."],
                  dependencies: ["Vitest / Playwright"],
                  notes: "Fase final de control de calidad."
                }
              }
            ]
          }
        ]
      }
    ];
  }

  // Convertir estructura jerárquica a listas planas con IDs y relaciones coherentes
  const generatedModules: GeneratedModule[] = [];
  const generatedStages: GeneratedStage[] = [];
  const generatedTasks: GeneratedTask[] = [];

  const timestamp = Date.now();

  rawModules.forEach((m, mIdx) => {
    const modId = `mod-${timestamp}-${mIdx + 1}`;
    const moduleObj: GeneratedModule = {
      id: modId,
      title: m.title,
      description: m.description,
      order: mIdx + 1,
    };
    generatedModules.push(moduleObj);

    m.stages.forEach((s, sIdx) => {
      const stgId = `stg-${timestamp}-${mIdx + 1}-${sIdx + 1}`;
      const stageObj: GeneratedStage = {
        id: stgId,
        moduleId: modId,
        title: s.title,
        description: s.description,
        order: sIdx + 1,
      };
      generatedStages.push(stageObj);

      s.tasks.forEach((t, tIdx) => {
        const taskId = `tsk-${timestamp}-${mIdx + 1}-${sIdx + 1}-${tIdx + 1}`;
        const subtasksFormatted = (t.subtasks || []).map((stTitle, stIdx) => ({
          id: `sub-${timestamp}-${mIdx + 1}-${sIdx + 1}-${tIdx + 1}-${stIdx + 1}`,
          title: stTitle,
          completed: false,
        }));

        const enrichedMemory = enrichTaskContextWithAgentSkills(
          t.contextMemory,
          t.title,
          t.instruction
        );

        const taskObj: GeneratedTask = {
          id: taskId,
          moduleId: modId,
          stageId: stgId,
          title: t.title,
          instruction: t.instruction,
          status: "pending",
          subtasks: subtasksFormatted,
          contextMemory: enrichedMemory,
        };
        generatedTasks.push(taskObj);
      });
    });
  });

  return {
    modules: generatedModules,
    stages: generatedStages,
    tasks: generatedTasks,
  };
}

// ---------------------------------------------------------------------------
// INTEGRACIÓN CON GEMINI API (CUANDO HAY GEMINI_API_KEY)
// ---------------------------------------------------------------------------
async function callGeminiForBlueprint(idea: string, projectName: string, apiKey: string): Promise<ProjectBlueprint | null> {
  const prompt = `Eres un Arquitecto de Software Experto. Analiza la siguiente idea de proyecto y genera un Blueprint estructurado y exhaustivo en formato JSON válido.

Idea del Proyecto: "${idea}"
Nombre del Proyecto: "${projectName}"

El JSON debe cumplir ESTRICTAMENTE esta estructura:
{
  "masterPrompt": "Descripción amplia, profesional y clara del producto a construir.",
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

Devuelve ÚNICAMENTE el objeto JSON sin bloques de texto adicionales ni markdown exterior.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (!response.ok) return null;
  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) return null;

  return JSON.parse(textContent) as ProjectBlueprint;
}

async function callGeminiForPlan(blueprint: ProjectBlueprint, projectId: string, apiKey: string): Promise<GeneratedWorkPlan | null> {
  const prompt = `Actúa como Líder Técnico y Arquitecto de Software.

DIRECTIVA OBLIGATORIA PARA AGENTES IA (REGLA DE ORO):
"Nunca generes un plan genérico. Primero crea un Blueprint específico del dominio del proyecto. Luego cada módulo, etapa y tarea debe derivarse directamente de ese Blueprint. Si una tarea podría servir para cualquier proyecto, reescríbela hasta que sea específica del producto solicitado."

Blueprint del Proyecto:
${JSON.stringify(blueprint, null, 2)}

Reglas obligatorias:
1. NUNCA GENERAR MÓDULOS NI TAREAS GENÉRICAS. Prohibido usar títulos como "Funcionalidad principal", "Implementar UI", "Setup inicial" o "Backend".
2. Cada módulo, etapa y tarea debe ser estrictamente del dominio del Blueprint (ej. si es de reservas: "Modelo de reservas y disponibilidad", "Flujo cliente de reserva", "Panel administrativo de citas", "Notificaciones y recordatorios", "QA y control de concurrencia").
3. Si una tarea podría servir para cualquier proyecto genérico, reescríbela hasta que sea específica del producto solicitado.
4. Cada tarea DEBE incluir 'contextMemory' con:
   - technicalRequirements: array de strings técnicos específicos
   - affectedFiles: array de rutas de archivos sugeridas
   - rulesConstraints: array de reglas de negocio y restricciones
   - dependencies: array de librerías/tecnologías
   - notes: string explicativo del dominio

Formato JSON esperado:
{
  "modules": [
    { "id": "mod-1", "title": "Nombre de Módulo Específico de Dominio", "description": "Descripción", "order": 1 }
  ],
  "stages": [
    { "id": "stg-1", "moduleId": "mod-1", "title": "Etapa 1: ...", "description": "...", "order": 1 }
  ],
  "tasks": [
    {
      "id": "tsk-1",
      "moduleId": "mod-1",
      "stageId": "stg-1",
      "title": "Título de tarea accionable y específica del dominio",
      "instruction": "Instrucción técnica detallada para el producto",
      "status": "pending",
      "subtasks": [ { "id": "sub-1", "title": "Paso 1", "completed": false } ],
      "contextMemory": {
        "technicalRequirements": ["..."],
        "affectedFiles": ["src/..."],
        "rulesConstraints": [
          "Nunca generes un plan genérico. Cada módulo, etapa y tarea debe derivarse directamente del Blueprint.",
          "Si una tarea podría servir para cualquier proyecto, reescríbela hasta que sea específica del producto solicitado."
        ],
        "dependencies": ["..."],
        "notes": "..."
      }
    }
  ]
}

Devuelve ÚNICAMENTE el JSON sin bloques de texto adicionales.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (!response.ok) return null;
  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) return null;

  const parsedPlan = JSON.parse(textContent) as GeneratedWorkPlan;

  if (parsedPlan && Array.isArray(parsedPlan.tasks)) {
    parsedPlan.tasks = parsedPlan.tasks.map((task) => ({
      ...task,
      contextMemory: enrichTaskContextWithAgentSkills(
        task.contextMemory || {
          technicalRequirements: [],
          affectedFiles: [],
          rulesConstraints: [],
          dependencies: [],
          notes: "",
        },
        task.title,
        task.instruction
      ),
    }));
  }

  return parsedPlan;
}
