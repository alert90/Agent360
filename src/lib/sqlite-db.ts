import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

// Create SQLite database
const sqlite = new Database('agent360.db')
sqlite.pragma('journal_mode = WAL')

// Create tables using raw SQL for compatibility
const createTables = async () => {
  try {
    // Create users table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        permissions TEXT,
        location TEXT,
        zone TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create agents table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_number TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        branch_code TEXT NOT NULL,
        branch_name TEXT NOT NULL,
        parent_agent_id INTEGER,
        is_active INTEGER DEFAULT 1,
        total_transaction_amount REAL DEFAULT 0,
        transaction_count INTEGER DEFAULT 0,
        commission_amount REAL DEFAULT 0,
        payband REAL DEFAULT 1.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create transactions table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id TEXT UNIQUE NOT NULL,
        agent_id INTEGER,
        agent_name TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        customer_account TEXT,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        fee REAL DEFAULT 0,
        net_amount REAL,
        commission_amount REAL DEFAULT 0,
        commission_eligible INTEGER DEFAULT 1,
        status TEXT DEFAULT 'pending',
        location TEXT,
        zone TEXT,
        channel TEXT,
        narration TEXT,
        reference TEXT,
        initiated_by TEXT DEFAULT 'customer',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create commission_calculations table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS commission_calculations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        agent_type TEXT NOT NULL,
        period TEXT NOT NULL,
        total_amount REAL DEFAULT 0,
        transaction_count INTEGER DEFAULT 0,
        eligible_amount REAL DEFAULT 0,
        commission_rate REAL DEFAULT 0,
        commission_amount REAL DEFAULT 0,
        payband REAL DEFAULT 1.0,
        final_commission REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(agent_id, period)
      )
    `)

    // Create commission_configs table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS commission_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        value REAL NOT NULL,
        agent_type TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        start_date TEXT,
        end_date TEXT,
        min_transaction_amount REAL DEFAULT 100000,
        commission_rate REAL DEFAULT 0.05,
        payband_fee REAL DEFAULT 0,
        super_agent_commission_rate REAL DEFAULT 0.2,
        super_agent_fixed_rate REAL DEFAULT 0.06,
        super_agent_variable_rate REAL DEFAULT 0.14,
        franchise_multiplier REAL DEFAULT 4.5,
        kpi_weights TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create super_agent_kpis table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS super_agent_kpis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        super_agent_id INTEGER,
        period TEXT NOT NULL,
        activeness_weight REAL NOT NULL,
        value_transacted_weight REAL NOT NULL,
        unique_agents_weight REAL NOT NULL,
        activeness_score REAL NOT NULL,
        value_transacted_score REAL NOT NULL,
        unique_agents_score REAL NOT NULL,
        total_score REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create franchise_calculations table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS franchise_calculations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        franchise_id INTEGER,
        period TEXT NOT NULL,
        agent_to_customer_value REAL NOT NULL,
        expected_turnover REAL NOT NULL,
        actual_turnover REAL NOT NULL,
        payband REAL NOT NULL,
        commission_rate REAL NOT NULL,
        commission_amount REAL NOT NULL,
        clawback_amount REAL DEFAULT 0,
        final_commission REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create FAQ categories table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS faq_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        icon TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create FAQ questions table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS faq_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        slug TEXT UNIQUE NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES faq_categories (id)
      )
    `)

    // Create help center categories table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS help_center_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        icon TEXT NOT NULL,
        avatar_color TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create help center subcategories table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS help_center_subcategories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        icon TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES help_center_categories (id)
      )
    `)

    // Create help center articles table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS help_center_articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subcategory_id INTEGER,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subcategory_id) REFERENCES help_center_subcategories (id)
      )
    `)

    // Create popular articles table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS popular_articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        img TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create keep learning articles table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS keep_learning_articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        img TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create general settings table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS general_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT,
        setting_type TEXT NOT NULL,
        category TEXT NOT NULL,
        label TEXT NOT NULL,
        description TEXT,
        is_required INTEGER DEFAULT 0,
        validation_rules TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create notification settings table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        label TEXT NOT NULL,
        description TEXT,
        email_enabled INTEGER DEFAULT 1,
        sms_enabled INTEGER DEFAULT 0,
        push_enabled INTEGER DEFAULT 0,
        email_template TEXT,
        sms_template TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create notification events table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS notification_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        event_name TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create notification recipients table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS notification_recipients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER,
        recipient_type TEXT NOT NULL,
        recipient_value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES notification_events (id)
      )
    `)

    // Create notification logs table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER,
        event_type TEXT NOT NULL,
        event_name TEXT NOT NULL,
        message TEXT NOT NULL,
        recipient_id INTEGER,
        recipient_type TEXT,
        status TEXT DEFAULT 'pending',
        sent_at TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES notification_events (id)
      )
    `)

    // Create user notifications table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        event_id INTEGER,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        action_url TEXT,
        expires_at TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (event_id) REFERENCES notification_events (id)
      )
    `)

    console.log('Database tables created successfully')
  } catch (error) {
    console.error('Error creating tables:', error)
    throw error
  }
}

// Create default users
const createDefaultUsers = async () => {
  try {
    // Check if users already exist
    const existingUsers = sqlite.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }

    if (existingUsers.count > 0) {
      console.log('Users already exist, skipping default user creation')

      return
    }

    // Insert default users
    const insertUser = sqlite.prepare(`
      INSERT INTO users (email, password, full_name, username, role, permissions, location, zone, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const defaultUsers = [
      ['admin@cyberwiz.world', 'admin', 'Nicky Miles', 'ennexica', 'admin', '["all"]', 'Dar es Salaam', 'Central', 1],
      [
        'analyst@cyberwiz.world',
        'analyst',
        'Data Analyst',
        'analyst',
        'analyst',
        '["read", "analyze", "export"]',
        'Dar es Salaam',
        'Central',
        1
      ],
      [
        'sagent@cyberwiz.world',
        'sagent',
        'Super Agent John',
        'sagent_john',
        'super_agent',
        '["manage_agents", "view_reports", "view_commissions"]',
        'Dar es Salaam',
        'Central',
        1
      ],
      [
        'franchise@cyberwiz.world',
        'franchise',
        'Franchise Mary',
        'franchise_mary',
        'franchise',
        '["manage_agents", "view_commissions", "view_customers"]',
        'Arusha',
        'Northern',
        1
      ]
    ]

    const transaction = sqlite.transaction(() => {
      for (const user of defaultUsers) {
        insertUser.run(...user)
      }
    })

    transaction()
    console.log('Default users created successfully')
  } catch (error) {
    console.error('Error creating default users:', error)
    throw error
  }
}

// Initialize database on module load
async function initializeDatabase() {
  try {
    console.log('Initializing SQLite database...')

    // Create tables if they don't exist
    await createTables()

    // Create default users
    await createDefaultUsers()

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
  }
}

// Create drizzle instance
export const db = drizzle(sqlite, { schema })

// Export tables
export const {
  users,
  agents,
  transactions,
  commissionCalculations,
  superAgentKPIs,
  franchiseCalculations,
  commissionConfigs,
  faqCategories,
  faqQuestions,
  helpCenterCategories,
  helpCenterSubcategories,
  helpCenterArticles,
  popularArticles,
  keepLearningArticles,
  generalSettings,
  notificationSettings
} = schema

// Database connection helper
export const connectDB = async () => {
  try {
    console.log('Connected to SQLite database')

    // Tables should already be created by initializeDatabase()
    // But we can add any additional connection logic here if needed
  } catch (error) {
    console.error('Database connection error:', error)
    throw error
  }
}

// Close database connection
export const closeDB = async () => {
  try {
    sqlite.close()
    console.log('Database connection closed')
  } catch (error) {
    console.error('Error closing database:', error)
  }
}

// Initialize database immediately
initializeDatabase()

export default db
