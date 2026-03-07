/*
  Warnings:

  - The `assigned_at` column on the `agent_assignments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updated_at` column on the `agent_assignments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `end_date` on the `commission_configs` table. All the data in the column will be lost.
  - You are about to drop the column `payband_fee` on the `commission_configs` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `commission_configs` table. All the data in the column will be lost.
  - The `created_at` column on the `commission_configs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updated_at` column on the `commission_configs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `last_run` column on the `commission_schedules` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `next_run` column on the `commission_schedules` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `created_at` column on the `commission_schedules` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updated_at` column on the `commission_schedules` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `created_at` column on the `commission_user_assignments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updated_at` column on the `commission_user_assignments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `sent_at` column on the `notification_logs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `assigned_at` column on the `regional_manager_assignments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updated_at` column on the `regional_manager_assignments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `last_activity` column on the `user_login_sessions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `created_at` column on the `user_login_sessions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `expires_at` column on the `user_notifications` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `commission_calculations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `franchise_calculations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `super_agent_kpis` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[local_agent_id,super_agent_id,franchise_id]` on the table `agent_assignments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[agent_id,period]` on the table `commissions` will be added. If there are existing duplicate values, this will fail.
  - Made the column `transaction_count` on table `commissions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `total_amount` on table `commissions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `eligible_amount` on table `commissions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `commission_rate` on table `commissions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `commission_amount` on table `commissions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `payband` on table `commissions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "agent_assignments" DROP CONSTRAINT "agent_assignments_franchise_id_fkey";

-- DropForeignKey
ALTER TABLE "agent_assignments" DROP CONSTRAINT "agent_assignments_local_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "agent_assignments" DROP CONSTRAINT "agent_assignments_super_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "agent_suspensions" DROP CONSTRAINT "agent_suspensions_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "agent_suspensions" DROP CONSTRAINT "agent_suspensions_approved_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "agent_suspensions" DROP CONSTRAINT "agent_suspensions_suspended_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "commission_user_assignments" DROP CONSTRAINT "commission_user_assignments_commission_config_id_fkey";

-- DropForeignKey
ALTER TABLE "commission_user_assignments" DROP CONSTRAINT "commission_user_assignments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "commissions" DROP CONSTRAINT "commissions_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "faq_questions" DROP CONSTRAINT "faq_questions_category_id_fkey";

-- DropForeignKey
ALTER TABLE "help_center_articles" DROP CONSTRAINT "help_center_articles_subcategory_id_fkey";

-- DropForeignKey
ALTER TABLE "help_center_subcategories" DROP CONSTRAINT "help_center_subcategories_category_id_fkey";

-- DropForeignKey
ALTER TABLE "notification_logs" DROP CONSTRAINT "notification_logs_event_id_fkey";

-- DropForeignKey
ALTER TABLE "notification_recipients" DROP CONSTRAINT "notification_recipients_event_id_fkey";

-- DropForeignKey
ALTER TABLE "regional_manager_assignments" DROP CONSTRAINT "regional_manager_assignments_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "regional_manager_assignments" DROP CONSTRAINT "regional_manager_assignments_regional_manager_id_fkey";

-- DropForeignKey
ALTER TABLE "user_login_sessions" DROP CONSTRAINT "user_login_sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_notifications" DROP CONSTRAINT "user_notifications_event_id_fkey";

-- DropForeignKey
ALTER TABLE "user_notifications" DROP CONSTRAINT "user_notifications_user_id_fkey";

-- DropIndex
DROP INDEX "idx_agent_assignments_franchise";

-- DropIndex
DROP INDEX "idx_agent_assignments_local_agent";

-- DropIndex
DROP INDEX "idx_agent_assignments_super_agent";

-- DropIndex
DROP INDEX "idx_regional_manager_assignments_agent";

-- DropIndex
DROP INDEX "idx_regional_manager_assignments_regional_manager";

-- AlterTable
ALTER TABLE "agent_assignments" DROP COLUMN "assigned_at",
ADD COLUMN     "assigned_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "updated_at",
ADD COLUMN     "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "commission_configs" DROP COLUMN "end_date",
DROP COLUMN "payband_fee",
DROP COLUMN "start_date",
ALTER COLUMN "type" SET DEFAULT 'percentage',
ALTER COLUMN "agent_type" SET DEFAULT 'all',
ALTER COLUMN "super_agent_fixed_rate" SET DEFAULT 0.3,
ALTER COLUMN "super_agent_variable_rate" SET DEFAULT 0.7,
DROP COLUMN "created_at",
ADD COLUMN     "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "updated_at",
ADD COLUMN     "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "commission_schedules" DROP COLUMN "last_run",
ADD COLUMN     "last_run" TIMESTAMP(3),
DROP COLUMN "next_run",
ADD COLUMN     "next_run" TIMESTAMP(3),
DROP COLUMN "created_at",
ADD COLUMN     "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "updated_at",
ADD COLUMN     "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "commission_user_assignments" DROP COLUMN "created_at",
ADD COLUMN     "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "updated_at",
ADD COLUMN     "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "commissions" ADD COLUMN     "actual_turnover" DOUBLE PRECISION,
ADD COLUMN     "capital_advanced" DOUBLE PRECISION,
ADD COLUMN     "clawback_amount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "expected_turnover" DOUBLE PRECISION,
ADD COLUMN     "final_commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "kpi_activeness_score" DOUBLE PRECISION,
ADD COLUMN     "kpi_total_score" DOUBLE PRECISION,
ADD COLUMN     "kpi_unique_agents_score" DOUBLE PRECISION,
ADD COLUMN     "kpi_value_score" DOUBLE PRECISION,
ADD COLUMN     "performance_ratio" DOUBLE PRECISION,
ALTER COLUMN "transaction_count" SET NOT NULL,
ALTER COLUMN "total_amount" SET NOT NULL,
ALTER COLUMN "eligible_amount" SET NOT NULL,
ALTER COLUMN "commission_rate" SET NOT NULL,
ALTER COLUMN "commission_amount" SET NOT NULL,
ALTER COLUMN "payband" SET NOT NULL;

-- AlterTable
ALTER TABLE "notification_logs" DROP COLUMN "sent_at",
ADD COLUMN     "sent_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "regional_manager_assignments" DROP COLUMN "assigned_at",
ADD COLUMN     "assigned_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "updated_at",
ADD COLUMN     "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "user_login_sessions" DROP COLUMN "last_activity",
ADD COLUMN     "last_activity" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "created_at",
ADD COLUMN     "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "user_notifications" DROP COLUMN "expires_at",
ADD COLUMN     "expires_at" TIMESTAMP(3);

-- DropTable
DROP TABLE "commission_calculations";

-- DropTable
DROP TABLE "franchise_calculations";

-- DropTable
DROP TABLE "super_agent_kpis";

-- CreateTable
CREATE TABLE "uploaded_files" (
    "id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_assignments_local_agent_id_super_agent_id_franchise_i_key" ON "agent_assignments"("local_agent_id", "super_agent_id", "franchise_id");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_agent_id_period_key" ON "commissions"("agent_id", "period");

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_parent_agent_id_fkey" FOREIGN KEY ("parent_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_local_agent_id_fkey" FOREIGN KEY ("local_agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_super_agent_id_fkey" FOREIGN KEY ("super_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_franchise_id_fkey" FOREIGN KEY ("franchise_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_suspensions" ADD CONSTRAINT "agent_suspensions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_suspensions" ADD CONSTRAINT "agent_suspensions_suspended_by_user_id_fkey" FOREIGN KEY ("suspended_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_suspensions" ADD CONSTRAINT "agent_suspensions_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_user_assignments" ADD CONSTRAINT "commission_user_assignments_commission_config_id_fkey" FOREIGN KEY ("commission_config_id") REFERENCES "commission_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_user_assignments" ADD CONSTRAINT "commission_user_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_login_sessions" ADD CONSTRAINT "user_login_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "notification_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regional_manager_assignments" ADD CONSTRAINT "regional_manager_assignments_regional_manager_id_fkey" FOREIGN KEY ("regional_manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regional_manager_assignments" ADD CONSTRAINT "regional_manager_assignments_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_questions" ADD CONSTRAINT "faq_questions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "faq_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_center_subcategories" ADD CONSTRAINT "help_center_subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "help_center_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_center_articles" ADD CONSTRAINT "help_center_articles_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "help_center_subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "notification_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "notification_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_agent_assignments_status" RENAME TO "agent_assignments_status_idx";

-- RenameIndex
ALTER INDEX "sqlite_autoindex_agents_1" RENAME TO "agents_account_number_key";

-- RenameIndex
ALTER INDEX "sqlite_autoindex_commission_configs_1" RENAME TO "commission_configs_code_key";

-- RenameIndex
ALTER INDEX "sqlite_autoindex_faq_categories_1" RENAME TO "faq_categories_slug_key";

-- RenameIndex
ALTER INDEX "sqlite_autoindex_faq_questions_1" RENAME TO "faq_questions_slug_key";

-- RenameIndex
ALTER INDEX "sqlite_autoindex_general_settings_1" RENAME TO "general_settings_setting_key_key";

-- RenameIndex
ALTER INDEX "sqlite_autoindex_help_center_articles_1" RENAME TO "help_center_articles_slug_key";

-- RenameIndex
ALTER INDEX "sqlite_autoindex_help_center_categories_1" RENAME TO "help_center_categories_slug_key";

-- RenameIndex
ALTER INDEX "sqlite_autoindex_help_center_subcategories_1" RENAME TO "help_center_subcategories_slug_key";

-- RenameIndex
ALTER INDEX "sqlite_autoindex_keep_learning_articles_1" RENAME TO "keep_learning_articles_slug_key";

-- RenameIndex
ALTER INDEX "sqlite_autoindex_notification_settings_1" RENAME TO "notification_settings_name_key";

-- RenameIndex
ALTER INDEX "sqlite_autoindex_popular_articles_1" RENAME TO "popular_articles_slug_key";

-- RenameIndex
ALTER INDEX "idx_regional_manager_assignments_status" RENAME TO "regional_manager_assignments_status_idx";

-- RenameIndex
ALTER INDEX "sqlite_autoindex_transactions_1" RENAME TO "transactions_transaction_id_key";
