-- =====================================================
-- Agent360 Commission System Verification SQL Queries
-- =====================================================

-- 1. Super Agent SA_01 Commission Verification
-- -------------------------------------------------
SELECT
    cc.agent_name,
    cc.period,
    cc.total_amount,
    cc.transaction_count,
    cc.eligible_amount,
    cc.commission_rate,
    cc.commission_amount,
    cc.payband,
    cc.final_commission,
    sak.activeness_score,
    sak.value_transacted_score,
    sak.unique_agents_score,
    sak.total_score as kpi_total_score
FROM commission_calculations cc
LEFT JOIN super_agent_kpis sak ON cc.agent_id = sak.super_agent_id AND cc.period = sak.period
WHERE cc.agent_name = 'Test Super Agent 01' AND cc.period = '2026-01';

-- 2. Super Agent KPI Detailed Breakdown
-- -------------------------------------------------
SELECT
    sak.super_agent_id,
    a.account_number,
    a.name as agent_name,
    sak.period,
    sak.activeness_weight,
    sak.value_transacted_weight,
    sak.unique_agents_weight,
    sak.activeness_score,
    sak.value_transacted_score,
    sak.unique_agents_score,
    sak.total_score,
    sak.created_at
FROM super_agent_kpis sak
JOIN agents a ON sak.super_agent_id = a.id
WHERE a.account_number = 'TEST_SA_01' AND sak.period = '2026-01';

-- 3. Super Agent Linked Agents Performance
-- -------------------------------------------------
SELECT
    a.account_number,
    a.name,
    a.type,
    a.total_transaction_amount,
    a.transaction_count,
    a.commission_amount,
    CASE
        WHEN a.total_transaction_amount >= 100000 THEN 'Qualifying'
        ELSE 'Non-Qualifying'
    END as qualification_status,
    ROUND(a.total_transaction_amount, 2) as transaction_amount_tzs
FROM agents a
WHERE a.parent_agent_id = (SELECT id FROM agents WHERE account_number = 'TEST_SA_01')
ORDER BY a.total_transaction_amount DESC;

-- 4. Franchise FR_01 Commission Verification
-- -------------------------------------------------
SELECT
    cc.agent_name,
    cc.period,
    cc.total_amount,
    cc.transaction_count,
    cc.eligible_amount,
    cc.commission_rate,
    cc.commission_amount,
    cc.payband,
    cc.final_commission,
    fc.agent_to_customer_value,
    fc.expected_turnover,
    fc.actual_turnover,
    fc.commission_amount as franchise_base_commission,
    fc.clawback_amount,
    fc.final_commission as franchise_final_commission,
    ROUND((fc.actual_turnover / fc.expected_turnover) * 100, 2) as performance_percentage
FROM commission_calculations cc
LEFT JOIN franchise_calculations fc ON cc.agent_id = fc.franchise_id AND cc.period = fc.period
WHERE cc.agent_name = 'Test Franchise 01' AND cc.period = '2026-01';

-- 5. Franchise Agent Performance Breakdown
-- -------------------------------------------------
SELECT
    a.account_number,
    a.name,
    a.total_transaction_amount,
    CASE
        WHEN a.parent_agent_id IS NOT NULL THEN (
            SELECT ca FROM (
                SELECT
                    CASE
                        WHEN a.total_transaction_amount >= (SELECT capital_advanced * 4.5 FROM franchise_agents WHERE agent_id = a.id LIMIT 1) THEN 'Excellent (≥100%)'
                        WHEN a.total_transaction_amount >= (SELECT capital_advanced * 3.6 FROM franchise_agents WHERE agent_id = a.id LIMIT 1) THEN 'Good (80-99%)'
                        WHEN a.total_transaction_amount >= (SELECT capital_advanced * 2.7 FROM franchise_agents WHERE agent_id = a.id LIMIT 1) THEN 'Average (60-79%)'
                        WHEN a.total_transaction_amount >= (SELECT capital_advanced * 1.8 FROM franchise_agents WHERE agent_id = a.id LIMIT 1) THEN 'Below Average (40-59%)'
                        ELSE 'Poor (<40%)'
                    END as ca
                FROM franchise_agents
                WHERE agent_id = a.id LIMIT 1
            )
        END
    END as performance_level,
    ROUND(a.total_transaction_amount, 2) as transaction_amount_tzs
FROM agents a
WHERE a.parent_agent_id = (SELECT id FROM agents WHERE account_number = 'TEST_FR_01')
ORDER BY a.total_transaction_amount DESC;

-- 6. Commission Configuration Used
-- -------------------------------------------------
SELECT
    title,
    code,
    min_transaction_amount,
    commission_rate,
    super_agent_commission_rate,
    super_agent_fixed_rate,
    super_agent_variable_rate,
    franchise_multiplier,
    kpi_weights
FROM commission_configs
WHERE is_active = 1
ORDER BY created_at DESC LIMIT 1;

-- 7. Transaction Summary for SA_01
-- -------------------------------------------------
SELECT
    COUNT(*) as total_transactions,
    SUM(CASE WHEN commission_eligible = 1 THEN amount ELSE 0 END) as qualifying_amount,
    SUM(CASE WHEN commission_eligible = 0 THEN amount ELSE 0 END) as non_qualifying_amount,
    SUM(amount) as total_amount,
    AVG(amount) as avg_transaction_amount,
    MAX(amount) as max_transaction_amount,
    MIN(amount) as min_transaction_amount
FROM transactions t
WHERE t.agent_name LIKE 'Test Local Agent%' AND t.agent_name LIKE '%SA%'
AND t.timestamp LIKE '2026-01%';

-- 8. Transaction Summary for FR_01
-- -------------------------------------------------
SELECT
    COUNT(*) as total_transactions,
    SUM(amount) as total_amount,
    AVG(amount) as avg_transaction_amount,
    MAX(amount) as max_transaction_amount,
    MIN(amount) as min_transaction_amount
FROM transactions t
WHERE t.agent_name LIKE 'Franchise Agent%' AND t.agent_name LIKE '%FR%'
AND t.timestamp LIKE '2026-01%';

-- 9. Manual Commission Calculation Verification for SA_01
-- -------------------------------------------------
-- This should match the stored commission calculation
WITH qualifying_agents AS (
    SELECT
        a.id,
        a.name,
        a.total_transaction_amount
    FROM agents a
    WHERE a.parent_agent_id = (SELECT id FROM agents WHERE account_number = 'TEST_SA_01')
    AND a.total_transaction_amount >= 100000
),
super_agent_commission AS (
    SELECT
        SUM(total_transaction_amount) * 0.2 as total_eligible_commission,
        SUM(total_transaction_amount) * 0.2 * 0.3 as fixed_commission,
        SUM(total_transaction_amount) * 0.2 * 0.7 as variable_commission_base
    FROM qualifying_agents
),
kpi_scores AS (
    SELECT
        80.0 as activeness_score, -- 8 out of 10 agents
        (SELECT AVG(total_transaction_amount) FROM qualifying_agents) / 1000000 * 100 as value_transacted_score,
        80.0 as unique_agents_score -- 8 out of 10 agents
),
weighted_kpi AS (
    SELECT
        activeness_score * 0.55 + value_transacted_score * 0.25 + unique_agents_score * 0.20 as total_kpi_score
    FROM kpi_scores
)
SELECT
    'Manual SA_01 Calculation' as calculation_type,
    sa.total_eligible_commission,
    sa.fixed_commission,
    sa.variable_commission_base,
    wk.total_kpi_score,
    sa.fixed_commission + (sa.variable_commission_base * wk.total_kpi_score / 100) as calculated_final_commission
FROM super_agent_commission sa, weighted_kpi wk;

-- 10. Manual Commission Calculation Verification for FR_01
-- -------------------------------------------------
-- This should match the stored franchise calculation
WITH franchise_agents_data AS (
    SELECT
        a.id,
        a.name,
        a.total_transaction_amount,
        -- Simulated capital advanced amounts for different performance levels
        CASE
            WHEN a.name LIKE '%Excellent%' THEN 1000000
            WHEN a.name LIKE '%Good%' THEN 800000
            WHEN a.name LIKE '%Average%' THEN 600000
            WHEN a.name LIKE '%Below Average%' THEN 500000
            WHEN a.name LIKE '%Poor%' THEN 400000
            ELSE 500000
        END as capital_advanced
    FROM agents a
    WHERE a.parent_agent_id = (SELECT id FROM agents WHERE account_number = 'TEST_FR_01')
),
franchise_commission_calc AS (
    SELECT
        SUM(fa.total_transaction_amount) as total_turnover,
        SUM(fa.capital_advanced) as total_capital_advanced,
        SUM(fa.total_transaction_amount) * 0.05 as base_commission,
        SUM(fa.capital_advanced * 4.5) as expected_turnover
    FROM franchise_agents_data fa
)
SELECT
    'Manual FR_01 Calculation' as calculation_type,
    fcc.total_turnover,
    fcc.total_capital_advanced,
    fcc.expected_turnover,
    fcc.base_commission,
    ROUND((fcc.total_turnover / fcc.expected_turnover) * 100, 2) as performance_percentage,
    CASE
        WHEN ROUND((fcc.total_turnover / fcc.expected_turnover) * 100, 2) >= 100 THEN fcc.base_commission * 1.0 -- Excellent: 100% payout
        WHEN ROUND((fcc.total_turnover / fcc.expected_turnover) * 100, 2) >= 80 THEN fcc.base_commission * 0.82 -- Good: 82% payout
        WHEN ROUND((fcc.total_turnover / fcc.expected_turnover) * 100, 2) >= 60 THEN fcc.base_commission * 0.64 -- Average: 64% payout
        WHEN ROUND((fcc.total_turnover / fcc.expected_turnover) * 100, 2) >= 40 THEN fcc.base_commission * 0.46 -- Below Average: 46% payout
        ELSE fcc.base_commission * 0.28 -- Poor: 28% payout
    END as calculated_final_commission,
    fcc.base_commission - CASE
        WHEN ROUND((fcc.total_turnover / fcc.expected_turnover) * 100, 2) >= 100 THEN fcc.base_commission * 1.0
        WHEN ROUND((fcc.total_turnover / fcc.expected_turnover) * 100, 2) >= 80 THEN fcc.base_commission * 0.82
        WHEN ROUND((fcc.total_turnover / fcc.expected_turnover) * 100, 2) >= 60 THEN fcc.base_commission * 0.64
        WHEN ROUND((fcc.total_turnover / fcc.expected_turnover) * 100, 2) >= 40 THEN fcc.base_commission * 0.46
        ELSE fcc.base_commission * 0.28
    END as clawback_amount
FROM franchise_commission_calc fcc;
