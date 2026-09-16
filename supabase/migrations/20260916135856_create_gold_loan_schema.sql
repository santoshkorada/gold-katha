/*
# SwarnaKhata Gold Loan Schema (single-tenant, no auth)

1. New Tables
- `gold_rates`: Stores live gold rates per purity (22k, 20k, 18k) in INR per gram.
  - `id` (uuid, primary key)
  - `purity` (text, unique: '22k', '20k', '18k')
  - `rate_per_gram` (numeric, price per gram in INR)
  - `updated_at` (timestamp)

- `loans`: Stores all loan records created by the shop owner.
  - `id` (uuid, primary key)
  - `customer_name` (text, not null)
  - `phone` (text, not null)
  - `gross_weight` (numeric, grams)
  - `net_weight` (numeric, grams)
  - `purity` (text: '22k', '20k', '18k')
  - `principal` (numeric, cash lent in INR)
  - `ltv_percentage` (numeric, loan-to-value percentage)
  - `locker_number` (text, vault locker assignment)
  - `bag_number` (text, vault bag assignment)
  - `status` (text: 'active', 'closed', default 'active')
  - `created_at` (timestamp)

2. Security
- Enable RLS on both tables.
- Allow anon + authenticated full CRUD (single-shop owner, no login screen).
- `USING (true)` is intentional — all data is shared within the single shop.

3. Seed Data
- Insert default gold rates for 22k, 20k, 18k purities.
*/

CREATE TABLE IF NOT EXISTS gold_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purity text UNIQUE NOT NULL,
  rate_per_gram numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE gold_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_gold_rates" ON gold_rates;
CREATE POLICY "anon_select_gold_rates" ON gold_rates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_gold_rates" ON gold_rates;
CREATE POLICY "anon_insert_gold_rates" ON gold_rates FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_gold_rates" ON gold_rates;
CREATE POLICY "anon_update_gold_rates" ON gold_rates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_gold_rates" ON gold_rates;
CREATE POLICY "anon_delete_gold_rates" ON gold_rates FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  gross_weight numeric NOT NULL DEFAULT 0,
  net_weight numeric NOT NULL DEFAULT 0,
  purity text NOT NULL DEFAULT '22k',
  principal numeric NOT NULL DEFAULT 0,
  ltv_percentage numeric NOT NULL DEFAULT 0,
  locker_number text,
  bag_number text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_loans" ON loans;
CREATE POLICY "anon_select_loans" ON loans FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_loans" ON loans;
CREATE POLICY "anon_insert_loans" ON loans FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_loans" ON loans;
CREATE POLICY "anon_update_loans" ON loans FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_loans" ON loans;
CREATE POLICY "anon_delete_loans" ON loans FOR DELETE
  TO anon, authenticated USING (true);

-- Seed default gold rates
INSERT INTO gold_rates (purity, rate_per_gram) VALUES
  ('22k', 7200),
  ('20k', 6550),
  ('18k', 5900)
ON CONFLICT (purity) DO NOTHING;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_created_at ON loans(created_at DESC);
