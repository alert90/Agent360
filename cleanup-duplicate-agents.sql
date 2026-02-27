-- Script to clean up duplicate agents
-- This script identifies and removes duplicate agents based on account_number
-- Keeping the most recent entry (by created_at) and deleting older duplicates

-- First, let's see the duplicate agents
SELECT
  account_number,
  COUNT(*) as duplicate_count,
  GROUP_CONCAT(id) as ids,
  GROUP_CONCAT(created_at) as created_dates,
  GROUP_CONCAT(name) as names
FROM agents
WHERE account_number IN (
  SELECT account_number
  FROM agents
  GROUP BY account_number
  HAVING COUNT(*) > 1
)
GROUP BY account_number
ORDER BY duplicate_count DESC;

-- Create a backup table (optional but recommended)
CREATE TABLE agents_backup AS SELECT * FROM agents;

-- Delete duplicate agents, keeping only the most recent one for each account_number
DELETE FROM agents
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY account_number ORDER BY created_at DESC) as rn
    FROM agents
  ) t
  WHERE t.rn > 1
);

-- Verify the cleanup
SELECT
  account_number,
  COUNT(*) as remaining_count
FROM agents
GROUP BY account_number
HAVING COUNT(*) > 1
ORDER BY remaining_count DESC;

-- Show the remaining agents that were kept
SELECT id, name, account_number, type, created_at, is_active
FROM agents
WHERE account_number LIKE '%FIDES%' OR account_number IN (
  SELECT account_number
  FROM agents_backup
  GROUP BY account_number
  HAVING COUNT(*) > 1
)
ORDER BY account_number, created_at DESC;

-- Optional: Drop the backup table after verification
-- DROP TABLE agents_backup;