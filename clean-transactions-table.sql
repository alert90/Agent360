-- Script to clean the transactions table
-- This will remove all transactions and reset agent transaction counts

-- First, create a backup (optional but recommended)
CREATE TABLE transactions_backup AS SELECT * FROM transactions;

-- Clear the transactions table
DELETE FROM transactions;

-- Reset agent transaction counts and amounts
UPDATE agents SET
  total_transaction_amount = 0,
  transaction_count = 0,
  commission_amount = 0,
  updated_at = CURRENT_TIMESTAMP;

-- Verify the cleanup
SELECT 'Transactions remaining:' as info, COUNT(*) as count FROM transactions;
SELECT 'Agents updated:' as info, COUNT(*) as count FROM agents WHERE total_transaction_amount = 0;

-- Optional: Drop the backup table after verification
-- DROP TABLE transactions_backup;