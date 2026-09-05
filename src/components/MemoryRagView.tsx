import React, { useState } from 'react';
import { 
  BookOpen, 
  Database, 
  Search, 
  Plus, 
  Lock, 
  FileText, 
  ShieldCheck, 
  Cpu, 
  HardDrive 
} from 'lucide-react';
import { Project, RagDocument } from '../types';

interface MemoryRagViewProps {
  activeProject: Project | null;
}

export const MemoryRagView: React.FC<MemoryRagViewProps> = ({ activeProject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [docs, setDocs] = useState<RagDocument[]>([
    {
      id: 'rag-1',
      projectId: activeProject?.id || 'default',
      title: 'Reglas de Arquitectura & TDD',
      content: 'Principio obligatorio: Nunca eliminar código preexistente sin justificación explícita. Beyonce Rule: Si una funcionalidad es crítica, debe tener test unitario.',
      tokenCount: 420,
      tags: ['arquitectura', 'tdd', 'reglas'],
      createdAt: '2026-09-05'
    },
    {
      id: 'rag-2',
      projectId: activeProject?.id || 'default',
      title: 'Esquema de Base de Datos Cloudflare D1',
      content: 'Tablas de proyectos, usuarios, módulos, tareas y commits con relaciones foráneas en cascada e índices en project_id.',
      tokenCount: 650,
      tags: ['d1', 'sql', 'esquema'],
      createdAt: '2026-09-05'
    }
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    const doc: RagDocument = {
      id: 'rag-' + Date.now(),
      projectId: activeProject?.id || 'default',
      title: newTitle,
      content: newContent,
      tokenCount: Math.round(newContent.length / 4),
      tags: ['custom', 'agent-memory'],
      createdAt: new Date().toISOString().split('T')[0]
    };
    setDocs([doc, ...docs]);
    setNewTitle('');
    setNewContent('');
    setShowAddModal(false);
  };

  const filteredDocs = docs.filter(
    (d) => d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto text-zinc-900 dark:text-zinc-100">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-300 dark:border-zinc-800 pb-3">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <BookOpen className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Memoria Dual: Vector RAG & Lockfile Inmutable</span>
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            Capa de memoria a corto plazo (STM de tokens) y memoria a largo plazo (LTM vectorial con Cloudflare Vectorize).
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Indexar Documento
        </button>
      </div>

      {/* Métricas de Memoria */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-zinc-200/80 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg p-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <Cpu className="w-4 h-4" /> Memoria a Corto Plazo (STM)
          </div>
          <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-2">1,070 <span className="text-xs text-zinc-500 font-normal">tk activos</span></p>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">Contexto de la conversación actual del agente.</p>
        </div>

        <div className="bg-zinc-200/80 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg p-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-xs font-semibold">
            <HardDrive className="w-4 h-4" /> Base Vectorial RAG (LTM)
          </div>
          <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-2">{docs.length} <span className="text-xs text-zinc-500 font-normal">documentos</span></p>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">Almacenados en Cloudflare Vectorize.</p>
        </div>

        <div className="bg-zinc-200/80 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg p-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Lock className="w-4 h-4" /> Lockfile Inmutable
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">LOCKED <span className="text-xs text-zinc-500 font-normal">historial.md</span></p>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">Protección contra borrado de código validado.</p>
        </div>
      </div>

      {/* Buscador de Documentos RAG */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar en la memoria vectorial RAG..."
          className="w-full pl-9 pr-4 py-2 bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-md text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Lista de Documentos */}
      <div className="space-y-2">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="bg-zinc-200/70 dark:bg-zinc-900/90 border border-zinc-300 dark:border-zinc-800 rounded-lg p-3.5 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                {doc.title}
              </h4>
              <span className="text-[10px] font-mono text-zinc-500">{doc.tokenCount} tk • {doc.createdAt}</span>
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-2 leading-relaxed bg-zinc-100 dark:bg-zinc-950 p-2.5 rounded border border-zinc-300 dark:border-zinc-800/80 font-mono">
              {doc.content}
            </p>
            <div className="flex items-center gap-1.5 mt-2.5">
              {doc.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-zinc-300 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border border-zinc-400 dark:border-zinc-700/60 font-mono">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Agregar Documento */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-lg w-full p-4 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-zinc-100">Indexar Nuevo Documento en RAG</h3>
            <form onSubmit={handleAddDoc} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Título del Documento:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Reglas de Negocio o Arquitectura"
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Contenido Técnico:</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  placeholder="Escribe el conocimiento técnico que el agente debe recordar..."
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Indexar en RAG
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
