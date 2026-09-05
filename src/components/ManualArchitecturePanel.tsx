import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Layout,
  Sliders,
  Database,
  Plus,
  Trash2,
  Save,
  Copy,
  Check,
  Bot,
  Layers,
  ArrowRight,
  ExternalLink,
  Code2,
  Terminal,
  Cpu,
  RefreshCw,
  FileCode,
  Globe,
  Lock,
  ListPlus,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronsUpDown,
} from "lucide-react";
import { Project, ProjectBlueprint, ProjectScreen, ProjectConnection } from "../types";
import * as api from "../services/api";

interface ManualArchitecturePanelProps {
  activeProject: Project | null;
  onProjectUpdated: (project: Project) => void;
  onPlanGeneratedSuccess: () => void;
  onSwitchToTasksView: () => void;
  onOpenNeonModal?: () => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

export const ManualArchitecturePanel: React.FC<ManualArchitecturePanelProps> = ({
  activeProject,
  onProjectUpdated,
  onPlanGeneratedSuccess,
  onSwitchToTasksView,
  onOpenNeonModal,
  showToast,
}) => {
  const [blueprint, setBlueprint] = useState<ProjectBlueprint>({
    masterPrompt: "",
    generalFeatures: [],
    screens: [],
    connections: [],
    architecturalNotes: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [showJsonPasteModal, setShowJsonPasteModal] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  // Estado del Acordeón para las 5 secciones
  const [openSections, setOpenSections] = useState<{
    prompt: boolean;
    screens: boolean;
    generalFeatures: boolean;
    connections: boolean;
    antigravity: boolean;
  }>({
    prompt: true,
    screens: true,
    generalFeatures: true,
    connections: true,
    antigravity: true,
  });

  const toggleSection = (sectionKey: "prompt" | "screens" | "generalFeatures" | "connections" | "antigravity") => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const expandAllSections = () => {
    setOpenSections({
      prompt: true,
      screens: true,
      generalFeatures: true,
      connections: true,
      antigravity: true,
    });
  };

  const collapseAllSections = () => {
    setOpenSections({
      prompt: false,
      screens: false,
      generalFeatures: false,
      connections: false,
      antigravity: false,
    });
  };

  // Estados temporales para agregar pantalla
  const [newScreenName, setNewScreenName] = useState("");
  const [newScreenPath, setNewScreenPath] = useState("");
  const [newScreenDesc, setNewScreenDesc] = useState("");

  // Estados temporales para agregar funcionalidad a pantalla
  const [screenFeatureInput, setScreenFeatureInput] = useState<{ [screenId: string]: string }>({});

  // Estados temporales para funcionalidad general
  const [newGeneralFeature, setNewGeneralFeature] = useState("");

  // Estados temporales para agregar conexión
  const [newConnName, setNewConnName] = useState("");
  const [newConnType, setNewConnType] = useState<ProjectConnection["type"]>("database");
  const [newConnDetails, setNewConnDetails] = useState("");

  // Cargar Blueprint al montar o cambiar proyecto
  useEffect(() => {
    if (!activeProject) return;

    if (activeProject.blueprint) {
      setBlueprint(activeProject.blueprint);
    } else {
      // Cargar desde API
      loadBlueprintFromApi(activeProject.id);
    }
  }, [activeProject?.id]);

  const loadBlueprintFromApi = async (projectId: string) => {
    try {
      setIsLoading(true);
      const res = await api.fetchBlueprint(projectId);
      if (res && res.blueprint) {
        setBlueprint(res.blueprint);
      }
    } catch (err) {
      console.error("Error al cargar blueprint:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBlueprint = async () => {
    if (!activeProject) return;
    try {
      setIsSaving(true);
      const res = await api.saveBlueprint(activeProject.id, blueprint);
      if (res.project) {
        onProjectUpdated(res.project);
      }
      showToast("Blueprint manual guardado exitosamente.", "success");
    } catch (err) {
      console.error("Error al guardar blueprint:", err);
      showToast("Error al guardar el blueprint", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-generar Blueprint Inteligente desde la idea
  const handleAutoGenerateBlueprint = async () => {
    if (!activeProject) return;
    try {
      setIsGenerating(true);
      const idea = blueprint.masterPrompt || activeProject.description || activeProject.name;
      const res = await api.generateBlueprint(activeProject.id, { idea, name: activeProject.name });
      if (res && res.blueprint) {
        setBlueprint(res.blueprint);
        showToast("✨ Blueprint inteligente generado y guardado exitosamente.", "success");
      }
    } catch (err: any) {
      showToast(err.message || "Error al auto-generar blueprint", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Cargar plantilla de ejemplo (SaaS Contable / Administrativo)
  const handleLoadTemplate = () => {
    const templateBlueprint: ProjectBlueprint = {
      masterPrompt:
        "Desarrollar una plataforma SaaS modular para contadores y administradores con autenticación basada en roles (RBAC: Admin, Contador, Cliente). El sistema debe permitir registrar clientes, gestionar libros contables, calcular impuestos, generar declaraciones y exportar reportes analíticos a Excel. La arquitectura debe mantener un estricto desacoplamiento entre vistas, componentes de interfaz y servicios de datos.",
      generalFeatures: [
        "Autenticación segura con Supabase Auth (Roles: Admin, Contador, Cliente)",
        "Soporte Modo Claro y Modo Oscuro con Tailwind CSS",
        "Diseño 100% responsivo adaptable a pantallas de móvil, tablet y desktop",
        "Exportación de reportes y listados a formato Microsoft Excel (.xlsx)",
        "Notificaciones y alertas contextuales (Toast notifications)",
        "Auditoría y registro histórico de cambios con autor y timestamp",
      ],
      screens: [
        {
          id: "scr-login",
          name: "Acceso & Login Seguro",
          path: "/login",
          description: "Portal de autenticación y redirección automática según el rol asignado.",
          features: [
            "Formulario de inicio de sesión con correo y contraseña",
            "Manejo de estados de carga y mensajes de error claros",
            "Redirección condicional: Admin a panel admin, Contador a panel contador",
            "Opción de recuperación de contraseña vía correo electrónico",
          ],
        },
        {
          id: "scr-admin",
          name: "Panel de Administrador",
          path: "/admin",
          description: "Panel de control maestro para gestionar usuarios contadores y métricas globales.",
          features: [
            "CRUD completo de contadores: Crear, listar, editar y deshabilitar",
            "Asignación de cuotas o límites de clientes por contador",
            "Métricas clave: Total de contadores activos, clientes totales y actividad",
            "Buscador en tiempo real y filtros por estado de cuenta",
          ],
        },
        {
          id: "scr-contador",
          name: "Panel del Contador (Gestión de Clientes)",
          path: "/contador",
          description: "Área de trabajo del contador para gestionar sus clientes asignados y contabilidad.",
          features: [
            "CRUD de clientes asignados: Razón social, RFC/NIF, contacto y régimen fiscal",
            "Subida y consulta de declaraciones fiscales y comprobantes",
            "Botón de exportación del catálogo de clientes a Excel",
            "Buscador instantáneo por nombre de cliente o número de identificación",
          ],
        },
      ],
      connections: [
        {
          id: "conn-supabase",
          name: "Supabase (Auth & PostgreSQL)",
          type: "database",
          configDetails: "URL y Anon Key. Tablas: 'usuarios', 'contadores', 'clientes', 'documentos'. Row Level Security (RLS) habilitado.",
        },
        {
          id: "conn-excel",
          name: "Librería XLSX / Excel Generator",
          type: "other",
          configDetails: "Librería cliente para generación de hojas de cálculo con estilos y nombres de columna formateados.",
        },
      ],
      architecturalNotes:
        "Estructura modular en /src: Vistas separadas por rol, clientes de conexión desacoplados y control de estados mediante React Hooks y TypeScript estricto.",
    };

    setBlueprint(templateBlueprint);
    showToast("Plantilla de ejemplo cargada en el blueprint. ¡Puedes ajustarla y guardarla!", "info");
  };

  // Agregar Pantalla
  const handleAddScreen = () => {
    if (!newScreenName.trim()) {
      showToast("Ingresa el nombre de la pantalla", "error");
      return;
    }

    const newScreen: ProjectScreen = {
      id: "scr-" + Date.now(),
      name: newScreenName.trim(),
      path: newScreenPath.trim() || "/" + newScreenName.trim().toLowerCase().replace(/\s+/g, "-"),
      description: newScreenDesc.trim() || "Pantalla de " + newScreenName.trim(),
      features: [],
    };

    setBlueprint({
      ...blueprint,
      screens: [...blueprint.screens, newScreen],
    });

    setNewScreenName("");
    setNewScreenPath("");
    setNewScreenDesc("");
    showToast(`Pantalla "${newScreen.name}" agregada.`, "success");
  };

  // Eliminar Pantalla
  const handleDeleteScreen = (screenId: string) => {
    setBlueprint({
      ...blueprint,
      screens: blueprint.screens.filter((s) => s.id !== screenId),
    });
  };

  // Agregar Funcionalidad a una Pantalla específica
  const handleAddFeatureToScreen = (screenId: string) => {
    const text = (screenFeatureInput[screenId] || "").trim();
    if (!text) return;

    setBlueprint({
      ...blueprint,
      screens: blueprint.screens.map((screen) => {
        if (screen.id === screenId) {
          return {
            ...screen,
            features: [...screen.features, text],
          };
        }
        return screen;
      }),
    });

    setScreenFeatureInput({
      ...screenFeatureInput,
      [screenId]: "",
    });
  };

  // Eliminar Funcionalidad de una Pantalla
  const handleDeleteFeatureFromScreen = (screenId: string, featureIndex: number) => {
    setBlueprint({
      ...blueprint,
      screens: blueprint.screens.map((screen) => {
        if (screen.id === screenId) {
          return {
            ...screen,
            features: screen.features.filter((_, idx) => idx !== featureIndex),
          };
        }
        return screen;
      }),
    });
  };

  // Agregar Funcionalidad General
  const handleAddGeneralFeature = () => {
    if (!newGeneralFeature.trim()) return;
    setBlueprint({
      ...blueprint,
      generalFeatures: [...blueprint.generalFeatures, newGeneralFeature.trim()],
    });
    setNewGeneralFeature("");
  };

  // Eliminar Funcionalidad General
  const handleDeleteGeneralFeature = (index: number) => {
    setBlueprint({
      ...blueprint,
      generalFeatures: blueprint.generalFeatures.filter((_, idx) => idx !== index),
    });
  };

  // Agregar Conexión
  const handleAddConnection = () => {
    if (!newConnName.trim()) {
      showToast("Ingresa el nombre del servicio o conexión", "error");
      return;
    }

    const newConn: ProjectConnection = {
      id: "conn-" + Date.now(),
      name: newConnName.trim(),
      type: newConnType,
      configDetails: newConnDetails.trim() || "Configuración por variables de entorno",
    };

    setBlueprint({
      ...blueprint,
      connections: [...blueprint.connections, newConn],
    });

    setNewConnName("");
    setNewConnDetails("");
    showToast(`Conexión "${newConn.name}" agregada.`, "success");
  };

  // Eliminar Conexión
  const handleDeleteConnection = (connId: string) => {
    setBlueprint({
      ...blueprint,
      connections: blueprint.connections.filter((c) => c.id !== connId),
    });
  };

  // Generar Plan con IA en Backend a partir del Blueprint
  const handleGeneratePlanNow = async () => {
    if (!activeProject) return;

    if (blueprint.screens.length === 0 && (!blueprint.masterPrompt || blueprint.masterPrompt.length < 10)) {
      showToast("Por favor define al menos el prompt maestro o agrega al menos una pantalla antes de generar el plan.", "error");
      return;
    }

    try {
      setIsGenerating(true);
      // Guardar primero para tener lo último
      await api.saveBlueprint(activeProject.id, blueprint);

      const res = await api.generatePlanFromBlueprint(activeProject.id);
      showToast(res.message || "Plan de acción estructurado generado con éxito.", "success");
      onPlanGeneratedSuccess();
      onSwitchToTasksView();
    } catch (err: any) {
      console.error("Error al generar plan:", err);
      showToast(err.message || "Error al generar el plan", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Aplicar JSON del plan pegado manualmente
  const handleApplyJsonPlan = async () => {
    if (!activeProject) return;
    try {
      const parsed = JSON.parse(jsonInput);
      const modulesArray = Array.isArray(parsed) ? parsed : parsed.modules;

      if (!Array.isArray(modulesArray) || modulesArray.length === 0) {
        showToast("El JSON debe contener un array 'modules' con los módulos y etapas.", "error");
        return;
      }

      setIsGenerating(true);
      const res = await api.populatePlan(activeProject.id, {
        modules: modulesArray,
        clearExisting: true,
      });

      showToast(res.message || "Plan poblado exitosamente en la plataforma.", "success");
      setShowJsonPasteModal(false);
      setJsonInput("");
      onPlanGeneratedSuccess();
      onSwitchToTasksView();
    } catch (err: any) {
      showToast("Error de sintaxis JSON: " + err.message, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Prompt generado listo para Antigravity
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const blueprintApiUrl = `${origin}/api/projects/${activeProject?.id || "PROJ_ID"}/blueprint`;
  const populateApiUrl = `${origin}/api/projects/${activeProject?.id || "PROJ_ID"}/populate-plan`;

  const antigravityInstructionPrompt = `Actúa como Antigravity AI, el Agente Líder de Desarrollo de Software.

1. Consulta los requerimientos del proyecto haciendo una petición GET a:
${blueprintApiUrl}

2. Lee cuidadosamente el documento de arquitectura manual (Blueprint):
- Prompt Maestro y Visión de negocio.
- Lista de Pantallas y sus Funcionalidades específicas una a una.
- Funcionalidades Generales de todo el sistema.
- Conexiones y servicios externos requeridos (Bases de datos, Auth, APIs).

3. Según estos requerimientos, crea un PLAN DE ACCIÓN JERÁRQUICO organizado exactamente por:
- Módulos (Módulo 1: Setup, Módulo 2: Pantallas clave, Módulo 3: Funcionalidades Globales, etc.)
- Etapas por módulo (Etapa 1.1, Etapa 1.2, etc.)
- Tareas concretas de desarrollo
- Minitareas (subtasks: [{ id, title, completed: false }])
- Memoria de contexto técnico por tarea (technicalRequirements, affectedFiles, rulesConstraints, dependencies)

4. Publica el plan directamente en la web realizando una petición HTTP POST a:
${populateApiUrl}
Con el payload JSON: { "clearExisting": true, "modules": [ ...tu plan desglosado... ] }

5. Una vez poblado el plan en la web, comienza a implementar las tareas paso a paso, actualizando el estado y dejando lista cada pantalla para la revisión del usuario en la URL del proyecto.`;

  const curlCommand = `curl -s "${blueprintApiUrl}"`;

  const copyToClipboard = (text: string, type: "prompt" | "curl") => {
    navigator.clipboard.writeText(text);
    if (type === "prompt") {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } else {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    }
    showToast("Copiado al portapapeles", "info");
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        <p className="text-sm font-semibold">Cargando arquitectura del proyecto...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del Panel de Arquitectura Manual */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Panel Exclusivo: Creación & Arquitectura Manual del Proyecto
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
                  Blueprint & Planificación
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Define aquí a mano todo lo que compone el proyecto: el <strong>prompt de lo que trata</strong>, las <strong>pantallas</strong>, las <strong>funcionalidades de cada pantalla</strong>, los <strong>requerimientos generales</strong> y las <strong>conexiones</strong>. Luego indica a Antigravity que lea las instrucciones y organice el plan en módulos, etapas, tareas y pasos.
              </p>
            </div>
          </div>

          {/* Botones de Acción de Cabecera */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleAutoGenerateBlueprint}
              disabled={isGenerating}
              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              title="Generar automáticamente un Blueprint estructurado con IA a partir de la idea"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Auto-Generar Blueprint</span>
            </button>



            <button
              onClick={handleSaveBlueprint}
              disabled={isSaving}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors flex items-center space-x-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Guardando..." : "Guardar Blueprint"}</span>
            </button>

            <button
              onClick={handleGeneratePlanNow}
              disabled={isGenerating}
              className="px-4 py-1.5 text-xs font-bold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center space-x-1.5 shadow-sm hover:shadow disabled:opacity-50 cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{isGenerating ? "Generando Plan..." : "Generar Plan con IA Ahora"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Control Global de Acordeón */}
      <div className="flex items-center justify-between px-1 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
          <ChevronsUpDown className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">Arquitectura por Secciones (Acordeón)</span>
          <span className="hidden sm:inline text-[11px] text-slate-400">· Haz clic en cualquier encabezado para desplegar o contraer su contenido</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={expandAllSections}
            className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            Expandir Todo
          </button>
          <button
            onClick={collapseAllSections}
            className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            Colapsar Todo
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: PROMPT MAESTRO / DE QUÉ TRATA EL PROYECTO */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-all overflow-hidden">
        <div
          onClick={() => toggleSection("prompt")}
          className="flex items-center justify-between p-4 sm:p-5 cursor-pointer select-none hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  1. Prompt de lo que trata el Proyecto (Visión & Objetivo Maestro)
                </h3>
                {blueprint.masterPrompt.trim() && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Definido" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Describe la idea del proyecto, el problema que resuelve, usuarios a los que va dirigido y alcance general.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2.5 shrink-0">
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              {blueprint.masterPrompt.length} caracteres
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              {openSections.prompt ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>

        {openSections.prompt && (
          <div className="p-5 pt-0 space-y-3 border-t border-slate-100 dark:border-slate-800 mt-1">
            <textarea
              value={blueprint.masterPrompt}
              onChange={(e) => setBlueprint({ ...blueprint, masterPrompt: e.target.value })}
              placeholder="Ej: Construir una plataforma web SaaS para gestionar clientes y facturas de despachos contables. Debe tener autenticación con roles, panel de administración para supervisar usuarios, panel del contador para registrar comprobantes, y exportación directa de libros contables a Excel..."
              rows={4}
              className="w-full text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg p-3 font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
            />
          </div>
        )}
      </div>

      {/* SECCIÓN 2: PANTALLAS Y FUNCIONALIDADES DE CADA PANTALLA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-all overflow-hidden">
        <div
          onClick={() => toggleSection("screens")}
          className="flex items-center justify-between p-4 sm:p-5 cursor-pointer select-none hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Layout className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  2. Pantallas del Proyecto & Funcionalidades por Pantalla ({blueprint.screens.length})
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Agrega cada pantalla que tendrá la aplicación y detalla individualmente las funcionalidades que incluye cada una.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2.5 shrink-0">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
              {blueprint.screens.length} pantallas
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              {openSections.screens ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>

        {openSections.screens && (
          <div className="p-5 pt-0 space-y-4 border-t border-slate-100 dark:border-slate-800 mt-1">
            {/* Lista de Pantallas Creadas */}
            {blueprint.screens.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-950/50">
                <Layout className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No hay pantallas agregadas todavía
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Utiliza el formulario de abajo para agregar la primera pantalla (ej. Login, Dashboard, Clientes).
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {blueprint.screens.map((screen, sIdx) => (
                  <div
                    key={screen.id}
                    className="border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/50 rounded-lg p-4 space-y-3 transition-colors"
                  >
                    {/* Cabecera de la Pantalla */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center font-mono">
                          {sIdx + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {screen.name}
                          </h4>
                          <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/60">
                            {screen.path || "/"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteScreen(screen.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                        title="Eliminar pantalla"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {screen.description && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                        {screen.description}
                      </p>
                    )}

                    {/* Lista de Funcionalidades de esta Pantalla */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center space-x-1">
                          <ListPlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Funcionalidades de "{screen.name}" ({screen.features.length})</span>
                        </span>
                      </div>

                      {screen.features.length === 0 ? (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic pl-1">
                          Aún no has agregado funcionalidades específicas para esta pantalla.
                        </p>
                      ) : (
                        <div className="space-y-1.5 pl-1">
                          {screen.features.map((feat, fIdx) => (
                            <div
                              key={fIdx}
                              className="flex items-center justify-between gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-xs text-slate-700 dark:text-slate-300 shadow-2xs"
                            >
                              <div className="flex items-start space-x-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                <span className="text-[11px]">{feat}</span>
                              </div>
                              <button
                                onClick={() => handleDeleteFeatureFromScreen(screen.id, fIdx)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                title="Eliminar funcionalidad"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Input para agregar funcionalidad a esta pantalla */}
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="text"
                          value={screenFeatureInput[screen.id] || ""}
                          onChange={(e) =>
                            setScreenFeatureInput({
                              ...screenFeatureInput,
                              [screen.id]: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddFeatureToScreen(screen.id);
                            }
                          }}
                          placeholder={`Agregar funcionalidad a ${screen.name} y presionar Enter...`}
                          className="flex-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => handleAddFeatureToScreen(screen.id)}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs rounded border border-slate-200 dark:border-slate-700 transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Agregar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario para Agregar Nueva Pantalla */}
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-3">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                <span>+ Agregar Nueva Pantalla al Proyecto</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Nombre de la Pantalla *
                  </label>
                  <input
                    type="text"
                    value={newScreenName}
                    onChange={(e) => setNewScreenName(e.target.value)}
                    placeholder="Ej. Gestión de Clientes"
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Ruta / URL Sugerida
                  </label>
                  <input
                    type="text"
                    value={newScreenPath}
                    onChange={(e) => setNewScreenPath(e.target.value)}
                    placeholder="Ej. /clientes"
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Descripción Breve
                  </label>
                  <input
                    type="text"
                    value={newScreenDesc}
                    onChange={(e) => setNewScreenDesc(e.target.value)}
                    placeholder="Ej. Tabla y formulario CRUD para clientes"
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleAddScreen}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Guardar Pantalla</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN 3: FUNCIONALIDADES GENERALES DEL PROYECTO */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-all overflow-hidden">
        <div
          onClick={() => toggleSection("generalFeatures")}
          className="flex items-center justify-between p-4 sm:p-5 cursor-pointer select-none hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  3. Funcionalidades Generales del Proyecto ({blueprint.generalFeatures.length})
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Requerimientos globales que aplican de forma transversal a toda la aplicación (Autenticación, roles, exportaciones, diseño responsivo, seguridad).
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2.5 shrink-0">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
              {blueprint.generalFeatures.length} generales
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              {openSections.generalFeatures ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>

        {openSections.generalFeatures && (
          <div className="p-5 pt-0 space-y-4 border-t border-slate-100 dark:border-slate-800 mt-1">
            {/* Badges de Funcionalidades Generales */}
            <div className="space-y-2">
              {blueprint.generalFeatures.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No hay requerimientos generales registrados.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {blueprint.generalFeatures.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-[11px] font-medium">{feat}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteGeneralFeature(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input para nueva funcionalidad general */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newGeneralFeature}
                onChange={(e) => setNewGeneralFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddGeneralFeature();
                  }
                }}
                placeholder="Agregar funcionalidad general (ej. 'Modo oscuro/claro', 'Exportación a Excel', 'Manejo de errores global')..."
                className="flex-1 text-xs bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddGeneralFeature}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN 4: CONEXIONES DEL PROYECTO */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm transition-all overflow-hidden">
        <div
          onClick={() => toggleSection("connections")}
          className="flex items-center justify-between p-4 sm:p-5 cursor-pointer select-none hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  4. Conexiones & Servicios del Proyecto ({blueprint.connections.length})
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Bases de datos (Neon PostgreSQL, Supabase), autenticación, APIs externas, servicios de correo o almacenamiento.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            {onOpenNeonModal && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenNeonModal();
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span>Estado Neon DB</span>
              </button>
            )}
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
              {blueprint.connections.length} servicios
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              {openSections.connections ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>

        {openSections.connections && (
          <div className="p-5 pt-0 space-y-4 border-t border-slate-100 dark:border-slate-800 mt-1">
            {blueprint.connections.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No hay conexiones configuradas.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {blueprint.connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="p-3 bg-slate-50/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1.5 relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
                          {conn.type}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {conn.name}
                        </h5>
                      </div>
                      <button
                        onClick={() => handleDeleteConnection(conn.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Eliminar conexión"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {conn.configDetails && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                        {conn.configDetails}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Formulario Agregar Conexión */}
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-3">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                <Plus className="w-3.5 h-3.5 text-purple-600" />
                <span>+ Agregar Conexión o Servicio Externo</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Nombre de la Conexión *
                  </label>
                  <input
                    type="text"
                    value={newConnName}
                    onChange={(e) => setNewConnName(e.target.value)}
                    placeholder="Ej. Supabase Auth & Database"
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Tipo de Conexión
                  </label>
                  <select
                    value={newConnType}
                    onChange={(e) => setNewConnType(e.target.value as any)}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="database">Base de Datos (PostgreSQL, Supabase)</option>
                    <option value="auth">Autenticación (Supabase Auth, OAuth)</option>
                    <option value="api">API Externa / Webhook</option>
                    <option value="storage">Almacenamiento (S3, Supabase Storage)</option>
                    <option value="other">Otro / Utilidad</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Detalles / Tablas / Variables
                  </label>
                  <input
                    type="text"
                    value={newConnDetails}
                    onChange={(e) => setNewConnDetails(e.target.value)}
                    placeholder="Ej. Tablas: users, clientes. Variables: SUPABASE_URL"
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleAddConnection}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Guardar Conexión</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN 5: ENLACE & PROMPT PARA ANTIGRAVITY (LA CLAVE DEL FLUJO) */}
      <div className="bg-linear-to-br from-slate-900 to-indigo-950 text-white rounded-xl shadow-xl border border-indigo-900/50 transition-all overflow-hidden">
        <div
          onClick={() => toggleSection("antigravity")}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 sm:p-6 cursor-pointer select-none hover:bg-indigo-950/40 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Instruir a Antigravity: Leer Blueprint y Poblar el Plan en la Web
              </h3>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Una vez completados los requerimientos a mano, copia este prompt a Antigravity o genera el plan directamente.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(antigravityInstructionPrompt, "prompt");
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-md shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPrompt ? "¡Copiado!" : "Copiar Prompt"}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowJsonPasteModal(true);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-md border border-slate-700 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pegar JSON</span>
            </button>

            <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-indigo-800/60 flex items-center justify-center text-indigo-300 hover:text-white">
              {openSections.antigravity ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>

        {openSections.antigravity && (
          <div className="p-6 pt-0 space-y-4 border-t border-indigo-900/40 mt-1">
            {/* Caja de Código con el Prompt para Antigravity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-indigo-300">
                <span className="font-mono flex items-center space-x-1">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Prompt Generado para Antigravity</span>
                </span>
                <span className="text-[10px] text-indigo-400">
                  Endpoint: {blueprintApiUrl}
                </span>
              </div>

              <pre className="bg-slate-950/90 border border-indigo-900/60 rounded-lg p-3.5 text-[11px] font-mono text-indigo-100 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto">
                {antigravityInstructionPrompt}
              </pre>
            </div>

            {/* cURL Rápido y botón de acción */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-indigo-900/60 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-indigo-300 text-[11px]">Comando cURL de lectura:</span>
                <code className="bg-slate-950 px-2 py-0.5 rounded text-[11px] text-indigo-200 font-mono border border-slate-800">
                  {curlCommand}
                </code>
                <button
                  onClick={() => copyToClipboard(curlCommand, "curl")}
                  className="text-indigo-400 hover:text-white transition-colors cursor-pointer"
                  title="Copiar comando cURL"
                >
                  {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleGeneratePlanNow}
                  disabled={isGenerating}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded transition-all flex items-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{isGenerating ? "Generando y poblando..." : "Auto-Generar y Poblar Plan en la Web"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PARA PEGAR PLAN EN FORMATO JSON MANUALMENTE */}
      {showJsonPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pegar Plan de Acción Estructurado (JSON)
                </h3>
              </div>
              <button
                onClick={() => setShowJsonPasteModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Si Antigravity te devolvió el plan organizado en formato JSON en el chat, pégalo aquí para que se creen automáticamente los módulos, etapas, tareas, minitareas y pasos en la plataforma.
            </p>

            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{ "modules": [ { "title": "Módulo 1: Arquitectura Base", "stages": [ { "title": "Etapa 1.1", "tasks": [ { "title": "Crear vista", "subtasks": [...] } ] } ] } ] }'
              rows={8}
              className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowJsonPasteModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyJsonPlan}
                disabled={!jsonInput.trim() || isGenerating}
                className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isGenerating ? "Poblando plan..." : "Poblar Plan en la Web"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
