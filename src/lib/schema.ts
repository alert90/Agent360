import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// Users table for authentication
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  fullName: text('full_name').notNull(),
  username: text('username').notNull().unique(),
  role: text('role').notNull(),
  permissions: text('permissions'), // JSON string for permissions array
  location: text('location'),
  zone: text('zone'),
  phoneNumber: text('phone_number'),
  address: text('address'),
  zipCode: text('zip_code'),
  avatar: text('avatar'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
})

// Agents table
export const agents = sqliteTable('agents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountNumber: text('account_number').notNull().unique(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'local_agent', 'super_agent', 'franchise'
  branchCode: text('branch_code').notNull(),
  branchName: text('branch_name').notNull(),
  parentAgentId: integer('parent_agent_id'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  totalTransactionAmount: real('total_transaction_amount').default(0),
  transactionCount: integer('transaction_count').default(0),
  commissionAmount: real('commission_amount').default(0),
  payband: real('payband').default(1.0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
})

// Transactions table
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  transactionId: text('transaction_id').notNull(),
  agentId: integer('agent_id').references(() => agents.id),
  agentName: text('agent_name').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  customerAccount: text('customer_account'),
  type: text('type').notNull(), // 'deposit', 'withdrawal', 'transfer', 'payment'
  amount: real('amount').notNull(),
  fee: real('fee').default(0),
  netAmount: real('net_amount'),
  commissionAmount: real('commission_amount').default(0),
  commissionEligible: integer('commission_eligible', { mode: 'boolean' }).default(true),
  status: text('status').notNull().default('pending'),
  location: text('location'),
  zone: text('zone'),
  channel: text('channel'),
  narration: text('narration'),
  reference: text('reference'),
  initiatedBy: text('initiated_by').default('customer'),
  timestamp: text('timestamp').default('CURRENT_TIMESTAMP'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP')
})

// Commission Calculations table
export const commissionCalculations = sqliteTable('commission_calculations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agentId: integer('agent_id').references(() => agents.id),
  agentName: text('agent_name').notNull(),
  agentType: text('agent_type').notNull(),
  period: text('period').notNull(), // '2025-01', etc.
  totalAmount: real('total_amount').notNull(),
  transactionCount: integer('transaction_count').notNull(),
  eligibleAmount: real('eligible_amount').notNull(),
  commissionRate: real('commission_rate').notNull(),
  commissionAmount: real('commission_amount').notNull(),
  payband: real('payband').notNull(),
  finalCommission: real('final_commission').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
})

// Super Agent KPIs table
export const superAgentKPIs = sqliteTable('super_agent_kpis', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  superAgentId: integer('super_agent_id').references(() => agents.id),
  period: text('period').notNull(),
  activenessWeight: real('activeness_weight').notNull(),
  valueTransactedWeight: real('value_transacted_weight').notNull(),
  uniqueAgentsWeight: real('unique_agents_weight').notNull(),
  activenessScore: real('activeness_score').notNull(),
  valueTransactedScore: real('value_transacted_score').notNull(),
  uniqueAgentsScore: real('unique_agents_score').notNull(),
  totalScore: real('total_score').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP')
})

// Franchise Calculations table
export const franchiseCalculations = sqliteTable('franchise_calculations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  franchiseId: integer('franchise_id').references(() => agents.id),
  period: text('period').notNull(),
  agentToCustomerValue: real('agent_to_customer_value').notNull(),
  expectedTurnover: real('expected_turnover').notNull(),
  actualTurnover: real('actual_turnover').notNull(),
  payband: real('payband').notNull(),
  commissionRate: real('commission_rate').notNull(),
  commissionAmount: real('commission_amount').notNull(),
  clawbackAmount: real('clawback_amount').default(0),
  finalCommission: real('final_commission').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP')
})

// Commission Configurations table (simplified - no date fields)
export const commissionConfigs = sqliteTable('commission_configs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  code: text('code').notNull().unique(),
  description: text('description'),
  type: text('type').notNull(), // 'percentage' only now
  value: real('value').notNull(),
  agentType: text('agent_type').notNull(),
  status: text('status').notNull().default('active'), // 'active' or 'inactive'
  startDate: text('start_date'), // Optional - no longer used
  endDate: text('end_date'), // Optional - no longer used
  minTransactionAmount: real('min_transaction_amount').default(100000),
  commissionRate: real('commission_rate').default(0.05),
  paybandFee: real('payband_fee').default(0),
  superAgentCommissionRate: real('super_agent_commission_rate').default(0.2),
  superAgentFixedRate: real('super_agent_fixed_rate').default(0.06),
  superAgentVariableRate: real('super_agent_variable_rate').default(0.14),
  franchiseMultiplier: real('franchise_multiplier').default(4.5),
  kpiWeights: text('kpi_weights'), // JSON string for KPI weights
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
})

// Commission User Assignments table - for user-specific commissions
export const commissionUserAssignments = sqliteTable('commission_user_assignments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  commissionConfigId: integer('commission_config_id').references(() => commissionConfigs.id),
  userId: integer('user_id').references(() => users.id),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
})

// FAQ Categories table
export const faqCategories = sqliteTable('faq_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  icon: text('icon').notNull(),
  subtitle: text('subtitle').notNull(),
  orderIndex: integer('order_index').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
})

// FAQ Questions table
export const faqQuestions = sqliteTable('faq_questions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').references(() => faqCategories.id),
  slug: text('slug').notNull().unique(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  orderIndex: integer('order_index').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
})

// Help Center Categories table
export const helpCenterCategories = sqliteTable('help_center_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  icon: text('icon').notNull(),
  avatarColor: text('avatar_color').notNull(),
  orderIndex: integer('order_index').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
})

// Help Center Subcategories table
export const helpCenterSubcategories = sqliteTable('help_center_subcategories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').references(() => helpCenterCategories.id),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  icon: text('icon').notNull(),
  orderIndex: integer('order_index').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
})

// Help Center Articles table
export const helpCenterArticles = sqliteTable('help_center_articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subcategoryId: integer('subcategory_id').references(() => helpCenterSubcategories.id),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  orderIndex: integer('order_index').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
})

// Popular Articles table
export const popularArticles = sqliteTable('popular_articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  img: text('img').notNull(),
  subtitle: text('subtitle').notNull(),
  orderIndex: integer('order_index').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
})

// Keep Learning Articles table
export const keepLearningArticles = sqliteTable('keep_learning_articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  img: text('img').notNull(),
  subtitle: text('subtitle').notNull(),
  orderIndex: integer('order_index').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
})

// General Settings table
export const generalSettings = sqliteTable('general_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  settingKey: text('setting_key').notNull().unique(),
  settingValue: text('setting_value'),
  settingType: text('setting_type').notNull(), // 'string', 'number', 'boolean', 'json'
  category: text('category').notNull(), // 'branding', 'contact', 'notifications', 'system'
  label: text('label').notNull(),
  description: text('description'),
  isRequired: integer('is_required', { mode: 'boolean' }).default(false),
  validationRules: text('validation_rules'), // JSON string for validation rules
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
})

// Notification Settings table
export const notificationSettings = sqliteTable('notification_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  label: text('label').notNull(),
  description: text('description'),
  emailEnabled: integer('email_enabled', { mode: 'boolean' }).default(true),
  smsEnabled: integer('sms_enabled', { mode: 'boolean' }).default(false),
  pushEnabled: integer('push_enabled', { mode: 'boolean' }).default(false),
  emailTemplate: text('email_template'),
  smsTemplate: text('sms_template'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
})

// Notification Events table
export const notificationEvents = sqliteTable('notification_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  eventType: text('event_type').notNull(), // 'user_login', 'password_change', 'admin_update', etc.
  eventName: text('event_name').notNull(),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
})

// Notification Recipients table
export const notificationRecipients = sqliteTable('notification_recipients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  eventId: integer('event_id').references(() => notificationEvents.id),
  recipientType: text('recipient_type').notNull(), // 'all', 'role', 'user', 'zone', 'region'
  recipientValue: text('recipient_value'), // role name, user id, zone name, region name, or null for 'all'
  createdAt: text('created_at').default('CURRENT_TIMESTAMP')
})

// Notification Logs table
export const notificationLogs = sqliteTable('notification_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  eventId: integer('event_id').references(() => notificationEvents.id),
  eventType: text('event_type').notNull(),
  eventName: text('event_name').notNull()
})

// Agent Assignments table
export const agentAssignments = sqliteTable('agent_assignments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  localAgentId: integer('local_agent_id').references(() => agents.id),
  superAgentId: integer('super_agent_id').references(() => agents.id),
  franchiseId: integer('franchise_id').references(() => agents.id),
  status: text('status').notNull().default('active'), // 'active', 'inactive'
  assignedAt: text('assigned_at').default('CURRENT_TIMESTAMP'),
  assignedBy: text('assigned_by').notNull().default('admin'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP')
})
