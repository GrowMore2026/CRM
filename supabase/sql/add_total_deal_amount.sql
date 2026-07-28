-- Add totalDealAmount column to clients table for tracking the full deal value
-- (separate from paymentAmount which tracks how much has been collected so far)

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS "totalDealAmount" numeric DEFAULT 0;

-- Back-fill existing rows: set totalDealAmount = paymentAmount where paymentAmount > 0
UPDATE clients
SET "totalDealAmount" = "paymentAmount"
WHERE "paymentAmount" > 0 AND ("totalDealAmount" IS NULL OR "totalDealAmount" = 0);
