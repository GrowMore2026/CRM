-- =============================================================
-- create_loan_files_table.sql  —  Run in Supabase -> SQL Editor
-- =============================================================

CREATE TABLE IF NOT EXISTS public.loan_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "createdBy" text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Pending',
  
  -- Type of Loan
  "typeOfLoan" text NOT NULL DEFAULT 'Business Loan',
  
  -- Basic Details
  "fullName" text NOT NULL,
  "panCardNumber" text,
  "mobileNumber" text NOT NULL,
  "alternateMobile" text,
  "city" text,
  "age" integer,
  "employmentType" text,
  "occupation" text,
  
  -- Loan Requirement
  "loanPurpose" text,
  "propertyType" text,
  "propertyLocation" text,
  "propertyValue" numeric,
  "loanAmount" numeric,
  "downPayment" numeric,
  
  -- Employment & Income
  "employer" text,
  "workExperience" text,
  "monthlyIncome" numeric,
  "annualIncome" numeric,
  "salaryBank" text,
  "coApplicant" text DEFAULT 'No',
  "coApplicantName" text,
  
  -- Existing Liabilities
  "currentLoans" text,
  "creditCardDues" numeric,
  "totalEmi" numeric,
  "cibilScore" text,
  
  -- Property Documents
  "docAgreementToSell" boolean DEFAULT false,
  "docSaleDeed" boolean DEFAULT false,
  "docBuilderAgreement" boolean DEFAULT false,
  "docApprovedPlan" boolean DEFAULT false,
  "docOcCc" boolean DEFAULT false,
  
  -- Income Documents
  "docPanAadhaar" boolean DEFAULT false,
  "docSalarySlips" boolean DEFAULT false,
  "docBankStatement" boolean DEFAULT false,
  "docItr" boolean DEFAULT false,
  "docBusinessFinancials" boolean DEFAULT false,
  
  -- Closing Questions
  "appliedElsewhere" text DEFAULT 'No',
  "previousRejection" text DEFAULT 'No',
  "preferredBank" text,
  "loanTimeline" text,
  "bestTimeToContact" text,
  "notes" text
);

-- RLS Policies
ALTER TABLE public.loan_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "loan_files_all" ON public.loan_files;
CREATE POLICY "loan_files_all" ON public.loan_files FOR ALL USING (true) WITH CHECK (true);

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
