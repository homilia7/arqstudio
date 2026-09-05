-- Esquema SQL oficial para Cloudflare D1 (SQLite) - ARQAI Hub

CREATE TABLE IF NOT EXISTS antigravity_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  email TEXT,
  pin TEXT NOT NULL,
  access_type TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS antigravity_projects (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  main_url TEXT NOT NULL,
  description TEXT,
  api_key TEXT NOT NULL,
  blueprint TEXT, -- Guardado como JSON string
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES antigravity_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS antigravity_modules (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_num INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES antigravity_projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS antigravity_stages (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_num INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (module_id) REFERENCES antigravity_modules(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES antigravity_projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS antigravity_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  module_id TEXT,
  stage_id TEXT,
  title TEXT NOT NULL,
  instruction TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'in_progress' | 'ready_for_review' | 'verified' | 'needs_revision'
  work_url TEXT,
  ai_output TEXT,
  ai_notes TEXT,
  human_feedback TEXT,
  locked INTEGER DEFAULT 0, -- 0 (false) | 1 (true)
  assigned_agent TEXT,
  subtasks TEXT, -- Guardado como JSON string
  context_memory TEXT, -- Guardado como JSON string
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  verified_at TEXT,
  FOREIGN KEY (project_id) REFERENCES antigravity_projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS antigravity_history (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  project_id TEXT,
  task_title TEXT,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  details TEXT,
  work_url TEXT,
  author TEXT NOT NULL, -- 'human' | 'antigravity_ai' | 'api' | 'system'
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS antigravity_agent_connections (
  id TEXT PRIMARY KEY,
  agent_name TEXT NOT NULL,
  connected_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Inserción de Usuario Administrador por defecto si no existe
INSERT OR IGNORE INTO antigravity_users (id, name, email, pin, access_type, created_at)
VALUES ('usr-admin-1', 'Super Admin', 'admin@arqai.dev', '1234', 'admin', datetime('now'));
