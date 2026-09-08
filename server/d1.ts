// Cloudflare D1 Database Helper Module

export interface D1ExecResult<T = any> {
  results: T[];
  success: boolean;
  meta?: any;
}

export interface CloudflareEnv {
  DB?: any; // D1Database binding
}

export async function initD1Tables(db: any): Promise<void> {
  if (!db) return;
  try {
    await db.batch([
      db.prepare(`
        CREATE TABLE IF NOT EXISTS antigravity_users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          email TEXT,
          pin TEXT NOT NULL,
          api_key TEXT,
          access_type TEXT NOT NULL DEFAULT 'user',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS antigravity_projects (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          name TEXT NOT NULL,
          main_url TEXT NOT NULL,
          description TEXT,
          api_key TEXT NOT NULL,
          blueprint TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS antigravity_modules (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          order_num INTEGER DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS antigravity_stages (
          id TEXT PRIMARY KEY,
          module_id TEXT NOT NULL,
          project_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          order_num INTEGER DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS antigravity_tasks (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          module_id TEXT,
          stage_id TEXT,
          title TEXT NOT NULL,
          instruction TEXT,
          status TEXT NOT NULL DEFAULT 'pending',
          work_url TEXT,
          ai_output TEXT,
          ai_notes TEXT,
          human_feedback TEXT,
          locked INTEGER DEFAULT 0,
          assigned_agent TEXT,
          subtasks TEXT,
          context_memory TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          completed_at TEXT,
          verified_at TEXT
        );
      `),
      db.prepare(`
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
          author TEXT NOT NULL,
          timestamp TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS antigravity_agent_connections (
          id TEXT PRIMARY KEY,
          agent_name TEXT NOT NULL,
          connected_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS antigravity_notifications (
          id TEXT PRIMARY KEY,
          agent_name TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'agent_notification',
          project_id TEXT,
          user_id TEXT,
          read INTEGER DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS antigravity_blocked_agents (
          id TEXT PRIMARY KEY,
          agent_name TEXT NOT NULL,
          user_id TEXT,
          blocked_at TEXT NOT NULL DEFAULT (datetime('now')),
          reason TEXT
        );
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS antigravity_chat_audit (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          task_id TEXT,
          user_prompt TEXT NOT NULL,
          ai_summary TEXT,
          modified_files TEXT,
          work_url TEXT,
          status TEXT DEFAULT 'pending_review',
          agent_name TEXT,
          ai_model TEXT DEFAULT 'Gemini 2.5 Pro',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `),
      db.prepare(`
        CREATE TABLE IF NOT EXISTS antigravity_rag_memory (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          component_tag TEXT,
          title TEXT NOT NULL,
          content_snippet TEXT NOT NULL,
          rules_summary TEXT,
          token_weight INTEGER DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `),
      db.prepare(`
        INSERT OR IGNORE INTO antigravity_users (id, name, email, pin, access_type, created_at)
        VALUES ('usr-admin-1', 'Super Admin', 'admin@arqai.dev', '1234', 'admin', datetime('now'));
      `),
      db.prepare(`
        DELETE FROM antigravity_notifications WHERE user_id IS NULL OR user_id = '';
      `)
    ]);

    try {
      await db.prepare("ALTER TABLE antigravity_projects ADD COLUMN locked_files TEXT").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE antigravity_tasks ADD COLUMN modified_files TEXT").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE antigravity_chat_audit ADD COLUMN ai_model TEXT").run();
    } catch (e) {}
  } catch (err) {
    console.error("[D1 Init Error]:", err);
  }
}
