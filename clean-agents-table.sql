-- Script to clean the agents table
-- This will remove all agents and related data for a fresh start

-- First, create backups (highly recommended)
CREATE TABLE agents_backup_full AS SELECT * FROM agents;
CREATE TABLE agent_assignments_backup AS SELECT * FROM agent_assignments;

-- Try to backup regional manager assignments if table exists
CREATE TABLE IF NOT EXISTS regional_manager_assignments_backup AS SELECT * FROM regional_manager_assignments;

-- Clear related tables first (due to foreign key constraints)
DELETE FROM agent_suspensions;
DELETE FROM commissions;
DELETE FROM agent_assignments;

-- Try to clear regional manager assignments if table exists
DELETE FROM regional_manager_assignments WHERE 1=1;

-- Clear the agents table
DELETE FROM agents;

-- Reset any sequences if needed (SQLite doesn't have sequences, but this is for completeness)
-- The IDs will auto-increment from the highest existing ID

-- Verify the cleanup
SELECT 'Agents remaining:' as info, COUNT(*) as count FROM agents;
SELECT 'Agent assignments remaining:' as info, COUNT(*) as count FROM agent_assignments;
SELECT 'Commissions remaining:' as info, COUNT(*) as count FROM commissions;

-- Optional: Drop the backup tables after verification
-- DROP TABLE agents_backup_full;
-- DROP TABLE agent_assignments_backup;
-- DROP TABLE regional_manager_assignments_backup;