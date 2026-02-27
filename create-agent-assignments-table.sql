-- Create agent_assignments table
CREATE TABLE IF NOT EXISTS agent_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_agent_id INTEGER NOT NULL,
  super_agent_id INTEGER,
  franchise_id INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
  assigned_by TEXT NOT NULL DEFAULT 'admin',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (local_agent_id) REFERENCES agents(id),
  FOREIGN KEY (super_agent_id) REFERENCES agents(id),
  FOREIGN KEY (franchise_id) REFERENCES agents(id),
  CHECK (super_agent_id IS NOT NULL OR franchise_id IS NOT NULL)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_assignments_local_agent ON agent_assignments(local_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_super_agent ON agent_assignments(super_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_franchise ON agent_assignments(franchise_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_status ON agent_assignments(status);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_agent_assignments_timestamp
AFTER UPDATE ON agent_assignments
BEGIN
  UPDATE agent_assignments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
