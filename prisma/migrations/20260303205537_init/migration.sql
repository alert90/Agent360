-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" TEXT,
    "location" TEXT,
    "zone" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "phone_number" TEXT,
    "address" TEXT,
    "zip_code" TEXT,
    "avatar" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" SERIAL NOT NULL,
    "account_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "branch_code" TEXT NOT NULL,
    "branch_name" TEXT NOT NULL,
    "parent_agent_id" INTEGER,
    "is_active" INTEGER DEFAULT 1,
    "commission_eligible" INTEGER DEFAULT 1,
    "total_transaction_amount" DOUBLE PRECISION DEFAULT 0,
    "transaction_count" INTEGER DEFAULT 0,
    "commission_amount" DOUBLE PRECISION DEFAULT 0,
    "payband" DOUBLE PRECISION DEFAULT 1.0,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "username" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "contact" TEXT,
    "role" TEXT,
    "region" TEXT,
    "zone" TEXT,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "agent_id" INTEGER,
    "agent_name" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT,
    "customer_account" TEXT,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "fee" DOUBLE PRECISION DEFAULT 0,
    "net_amount" DOUBLE PRECISION,
    "commission_amount" DOUBLE PRECISION DEFAULT 0,
    "commission_eligible" INTEGER DEFAULT 1,
    "status" TEXT DEFAULT 'pending',
    "location" TEXT,
    "zone" TEXT,
    "channel" TEXT,
    "narration" TEXT,
    "reference" TEXT,
    "initiated_by" TEXT DEFAULT 'customer',
    "timestamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_calculations" (
    "id" SERIAL NOT NULL,
    "agent_id" TEXT NOT NULL,
    "agent_name" TEXT NOT NULL,
    "agent_type" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "total_amount" DOUBLE PRECISION DEFAULT 0,
    "transaction_count" INTEGER DEFAULT 0,
    "eligible_amount" DOUBLE PRECISION DEFAULT 0,
    "commission_rate" DOUBLE PRECISION DEFAULT 0,
    "commission_amount" DOUBLE PRECISION DEFAULT 0,
    "payband" DOUBLE PRECISION DEFAULT 1.0,
    "final_commission" DOUBLE PRECISION DEFAULT 0,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "super_agent_kpis" (
    "id" SERIAL NOT NULL,
    "super_agent_id" INTEGER,
    "period" TEXT NOT NULL,
    "activeness_weight" DOUBLE PRECISION NOT NULL,
    "value_transacted_weight" DOUBLE PRECISION NOT NULL,
    "unique_agents_weight" DOUBLE PRECISION NOT NULL,
    "activeness_score" DOUBLE PRECISION NOT NULL,
    "value_transacted_score" DOUBLE PRECISION NOT NULL,
    "unique_agents_score" DOUBLE PRECISION NOT NULL,
    "total_score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "super_agent_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "franchise_calculations" (
    "id" SERIAL NOT NULL,
    "franchise_id" INTEGER,
    "period" TEXT NOT NULL,
    "agent_to_customer_value" DOUBLE PRECISION NOT NULL,
    "expected_turnover" DOUBLE PRECISION NOT NULL,
    "actual_turnover" DOUBLE PRECISION NOT NULL,
    "payband" DOUBLE PRECISION NOT NULL,
    "commission_rate" DOUBLE PRECISION NOT NULL,
    "commission_amount" DOUBLE PRECISION NOT NULL,
    "clawback_amount" DOUBLE PRECISION DEFAULT 0,
    "final_commission" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "franchise_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_configs" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "agent_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "start_date" TEXT,
    "end_date" TEXT,
    "min_transaction_amount" DOUBLE PRECISION DEFAULT 100000,
    "commission_rate" DOUBLE PRECISION DEFAULT 0.05,
    "payband_fee" DOUBLE PRECISION DEFAULT 0,
    "super_agent_commission_rate" DOUBLE PRECISION DEFAULT 0.2,
    "super_agent_fixed_rate" DOUBLE PRECISION DEFAULT 0.06,
    "super_agent_variable_rate" DOUBLE PRECISION DEFAULT 0.14,
    "franchise_multiplier" DOUBLE PRECISION DEFAULT 4.5,
    "kpi_weights" TEXT,
    "is_active" INTEGER DEFAULT 1,
    "created_at" TEXT DEFAULT 'CURRENT_TIMESTAMP',
    "updated_at" TEXT DEFAULT 'CURRENT_TIMESTAMP',

    CONSTRAINT "commission_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_user_assignments" (
    "id" SERIAL NOT NULL,
    "commission_config_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TEXT DEFAULT 'CURRENT_TIMESTAMP',
    "updated_at" TEXT DEFAULT 'CURRENT_TIMESTAMP',

    CONSTRAINT "commission_user_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_assignments" (
    "id" SERIAL NOT NULL,
    "local_agent_id" INTEGER NOT NULL,
    "super_agent_id" INTEGER,
    "franchise_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "assigned_at" TEXT DEFAULT 'CURRENT_TIMESTAMP',
    "assigned_by" TEXT NOT NULL DEFAULT 'admin',
    "updated_at" TEXT DEFAULT 'CURRENT_TIMESTAMP',

    CONSTRAINT "agent_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regional_manager_assignments" (
    "id" SERIAL NOT NULL,
    "regional_manager_id" INTEGER NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "assigned_at" TEXT DEFAULT 'CURRENT_TIMESTAMP',
    "assigned_by" TEXT NOT NULL DEFAULT 'admin',
    "updated_at" TEXT DEFAULT 'CURRENT_TIMESTAMP',

    CONSTRAINT "regional_manager_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_categories" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "order_index" INTEGER DEFAULT 0,
    "is_active" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faq_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_questions" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER,
    "slug" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order_index" INTEGER DEFAULT 0,
    "is_active" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faq_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_center_categories" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "avatar_color" TEXT NOT NULL,
    "order_index" INTEGER DEFAULT 0,
    "is_active" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "help_center_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_center_subcategories" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order_index" INTEGER DEFAULT 0,
    "is_active" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "help_center_subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_center_articles" (
    "id" SERIAL NOT NULL,
    "subcategory_id" INTEGER,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order_index" INTEGER DEFAULT 0,
    "is_active" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "help_center_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "popular_articles" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "img" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "order_index" INTEGER DEFAULT 0,
    "is_active" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "popular_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keep_learning_articles" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "img" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "order_index" INTEGER DEFAULT 0,
    "is_active" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "keep_learning_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "general_settings" (
    "id" SERIAL NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" TEXT,
    "setting_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "is_required" INTEGER DEFAULT 0,
    "validation_rules" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "general_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "email_enabled" INTEGER DEFAULT 1,
    "sms_enabled" INTEGER DEFAULT 0,
    "push_enabled" INTEGER DEFAULT 0,
    "email_template" TEXT,
    "sms_template" TEXT,
    "is_active" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_events" (
    "id" SERIAL NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_recipients" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER,
    "recipient_type" TEXT NOT NULL,
    "recipient_value" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER,
    "event_type" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "recipient_id" INTEGER,
    "recipient_type" TEXT,
    "status" TEXT DEFAULT 'pending',
    "sent_at" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "event_id" INTEGER,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" INTEGER DEFAULT 0,
    "action_url" TEXT,
    "expires_at" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_suspensions" (
    "id" SERIAL NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "suspended_by_user_id" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "approved_by_user_id" INTEGER,

    CONSTRAINT "agent_suspensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" SERIAL NOT NULL,
    "agent_id" INTEGER NOT NULL,
    "agent_name" TEXT NOT NULL,
    "agent_type" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "transaction_count" INTEGER DEFAULT 0,
    "total_amount" DOUBLE PRECISION DEFAULT 0,
    "eligible_amount" DOUBLE PRECISION DEFAULT 0,
    "commission_rate" DOUBLE PRECISION DEFAULT 0,
    "commission_amount" DOUBLE PRECISION DEFAULT 0,
    "payband" DOUBLE PRECISION DEFAULT 0,
    "calculation_details" TEXT,
    "status" TEXT DEFAULT 'calculated',
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_login_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "session_id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT,
    "location" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "device_type" TEXT,
    "device_name" TEXT,
    "is_active" INTEGER DEFAULT 1,
    "last_activity" TEXT DEFAULT 'CURRENT_TIMESTAMP',
    "created_at" TEXT DEFAULT 'CURRENT_TIMESTAMP',

    CONSTRAINT "user_login_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_schedules" (
    "id" SERIAL NOT NULL,
    "frequency" TEXT NOT NULL,
    "day_of_month" INTEGER DEFAULT 1,
    "calculation_type" TEXT DEFAULT 'all',
    "is_active" INTEGER DEFAULT 1,
    "last_run" TEXT,
    "next_run" TEXT,
    "created_at" TEXT DEFAULT 'CURRENT_TIMESTAMP',
    "updated_at" TEXT DEFAULT 'CURRENT_TIMESTAMP',

    CONSTRAINT "commission_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_agents_1" ON "agents"("account_number");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_transactions_1" ON "transactions"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_commission_calculations_1" ON "commission_calculations"("agent_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_commission_configs_1" ON "commission_configs"("code");

-- CreateIndex
CREATE INDEX "idx_agent_assignments_status" ON "agent_assignments"("status");

-- CreateIndex
CREATE INDEX "idx_agent_assignments_franchise" ON "agent_assignments"("franchise_id");

-- CreateIndex
CREATE INDEX "idx_agent_assignments_super_agent" ON "agent_assignments"("super_agent_id");

-- CreateIndex
CREATE INDEX "idx_agent_assignments_local_agent" ON "agent_assignments"("local_agent_id");

-- CreateIndex
CREATE INDEX "idx_regional_manager_assignments_status" ON "regional_manager_assignments"("status");

-- CreateIndex
CREATE INDEX "idx_regional_manager_assignments_regional_manager" ON "regional_manager_assignments"("regional_manager_id");

-- CreateIndex
CREATE INDEX "idx_regional_manager_assignments_agent" ON "regional_manager_assignments"("agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_faq_categories_1" ON "faq_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_faq_questions_1" ON "faq_questions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_help_center_categories_1" ON "help_center_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_help_center_subcategories_1" ON "help_center_subcategories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_help_center_articles_1" ON "help_center_articles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_popular_articles_1" ON "popular_articles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_keep_learning_articles_1" ON "keep_learning_articles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_general_settings_1" ON "general_settings"("setting_key");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_notification_settings_1" ON "notification_settings"("name");

-- AddForeignKey
ALTER TABLE "commission_user_assignments" ADD CONSTRAINT "commission_user_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commission_user_assignments" ADD CONSTRAINT "commission_user_assignments_commission_config_id_fkey" FOREIGN KEY ("commission_config_id") REFERENCES "commission_configs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "agents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_super_agent_id_fkey" FOREIGN KEY ("super_agent_id") REFERENCES "agents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_local_agent_id_fkey" FOREIGN KEY ("local_agent_id") REFERENCES "agents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regional_manager_assignments" ADD CONSTRAINT "regional_manager_assignments_regional_manager_id_fkey" FOREIGN KEY ("regional_manager_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "regional_manager_assignments" ADD CONSTRAINT "regional_manager_assignments_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "faq_questions" ADD CONSTRAINT "faq_questions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "faq_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "help_center_subcategories" ADD CONSTRAINT "help_center_subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "help_center_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "help_center_articles" ADD CONSTRAINT "help_center_articles_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "help_center_subcategories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "notification_events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "notification_events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "notification_events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "agent_suspensions" ADD CONSTRAINT "agent_suspensions_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "agent_suspensions" ADD CONSTRAINT "agent_suspensions_suspended_by_user_id_fkey" FOREIGN KEY ("suspended_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "agent_suspensions" ADD CONSTRAINT "agent_suspensions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_login_sessions" ADD CONSTRAINT "user_login_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
