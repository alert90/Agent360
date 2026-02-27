-- Add missing agent notification events
INSERT OR IGNORE INTO notification_events (event_type, event_name, description, is_active, created_at, updated_at) VALUES
('agent_type_change', 'Agent Type Change', 'Triggered when an agent type is changed (local_agent, super_agent, franchise)', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('agent_assignment', 'Agent Assignment', 'Triggered when an agent is assigned to a super agent or franchise', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('agent_registration', 'Agent Registration', 'Triggered when a new agent is registered in the system', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('agent_profile_update', 'Agent Profile Update', 'Triggered when agent profile information is updated', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('agent_suspension', 'Agent Suspension', 'Triggered when an agent is suspended', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('agent_activation', 'Agent Activation', 'Triggered when an agent is activated', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('regional_manager_assignment', 'Regional Manager Assignment', 'Triggered when an agent is assigned to a regional manager', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('commission_calculation', 'Commission Calculation', 'Triggered when commission calculations are performed', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('fraud_alert', 'Fraud Alert', 'Triggered when fraudulent activity is detected', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('performance_alert', 'Performance Alert', 'Triggered when agent performance thresholds are breached', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add default recipients for admin users
INSERT OR IGNORE INTO notification_recipients (event_id, recipient_type, recipient_value, created_at)
SELECT ne.id, 'role', 'admin', CURRENT_TIMESTAMP
FROM notification_events ne
WHERE ne.event_type IN ('agent_registration', 'agent_suspension', 'fraud_alert', 'performance_alert');

-- Add recipients for analyst users
INSERT OR IGNORE INTO notification_recipients (event_id, recipient_type, recipient_value, created_at)
SELECT ne.id, 'role', 'analyst', CURRENT_TIMESTAMP
FROM notification_events ne
WHERE ne.event_type IN ('agent_assignment', 'commission_calculation', 'agent_status_change');

-- Show the added events
SELECT event_type, event_name, description FROM notification_events WHERE event_type LIKE 'agent_%' OR event_type IN ('regional_manager_assignment', 'commission_calculation', 'fraud_alert', 'performance_alert');