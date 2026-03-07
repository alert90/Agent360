-- Add paybandRates column to commission_configs
ALTER TABLE "commission_configs"
ADD COLUMN "payband_rates" TEXT;

-- Add franchise_base_rate column
ALTER TABLE "commission_configs"
ADD COLUMN "franchise_base_rate" DOUBLE PRECISION DEFAULT 0.0005;

-- Update existing records with default payband rates
UPDATE "commission_configs"
SET "payband_rates" = '{
  "excellent": {"min": 100, "rate": 1.0},
  "good": {"min": 80, "max": 99, "rate": 0.8},
  "average": {"min": 60, "max": 79, "rate": 0.6},
  "belowAverage": {"min": 40, "max": 59, "rate": 0.4},
  "poor": {"max": 39, "rate": 0.2}
}',
"franchise_base_rate" = 0.0005
WHERE "payband_rates" IS NULL;
