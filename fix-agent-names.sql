-- Script to fix agent names that start with quotes

-- First, see which agents have names starting with quotes
SELECT id, name, account_number
FROM agents
WHERE name LIKE '"%"' OR name LIKE "'%"
ORDER BY name;

-- Update agent names to remove leading quotes
UPDATE agents
SET name = TRIM(REPLACE(REPLACE(name, '"', ''), "'", ''))
WHERE name LIKE '"%"' OR name LIKE "'%'";

-- Also clean any trailing quotes
UPDATE agents
SET name = TRIM(REPLACE(REPLACE(name, '"', ''), "'", ''))
WHERE name LIKE '%"%"' OR name LIKE "%'%";

-- Verify the fixes
SELECT id, name, account_number
FROM agents
WHERE name LIKE '"%"' OR name LIKE "'%" OR name LIKE '%"%"' OR name LIKE "%'%"
ORDER BY name;