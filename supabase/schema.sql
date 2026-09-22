-- =============================================================
-- GoldKatha — Complete Database Schema
-- =============================================================
-- Multi-tenant SaaS gold loan management system.
-- Each shop owner signs up → gets a tenant + profile + default
-- gold rates automatically via the handle_new_user trigger.
-- =============================================================


-- =============================================================
-- 1. CORE TABLES
-- =============================================================

-- Tenants (shops / workspaces)
CREATE TABLE IF NOT EXISTS tenants (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  location     text,
  gst_number   text,
  phone_number text,
  address      text,
  logo_url     text,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;


-- User profiles (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mobile_number text UNIQUE NOT NULL,
  name          text,
  age           integer,
  gender        text,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;


-- Tenant ↔ User mapping
CREATE TABLE IF NOT EXISTS tenant_users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'owner',
  created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;


-- Gold rates per purity per tenant
CREATE TABLE IF NOT EXISTS gold_rates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid REFERENCES tenants(id) ON DELETE CASCADE,
  purity        text NOT NULL,
  rate_per_gram numeric NOT NULL DEFAULT 0,
  updated_at    timestamptz DEFAULT now(),
  CONSTRAINT gold_rates_tenant_purity_key UNIQUE (tenant_id, purity)
);
ALTER TABLE gold_rates ENABLE ROW LEVEL SECURITY;


-- Loans
CREATE TABLE IF NOT EXISTS loans (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid REFERENCES tenants(id) ON DELETE CASCADE,
  customer_name       text NOT NULL,
  phone               text NOT NULL,
  gross_weight        numeric NOT NULL DEFAULT 0,
  net_weight          numeric NOT NULL DEFAULT 0,
  purity              text NOT NULL DEFAULT '22k',
  principal           numeric NOT NULL DEFAULT 0,
  ltv_percentage      numeric NOT NULL DEFAULT 0,
  interest_type       text NOT NULL DEFAULT 'monthly',
  interest_per_hundred numeric NOT NULL DEFAULT 0,
  duration            integer NOT NULL DEFAULT 1,
  locker_number       text,
  bag_number          text,
  status              text NOT NULL DEFAULT 'active',
  created_at          timestamptz DEFAULT now(),
  closed_at           timestamptz,
  item_image_url      text,
  kyc_type            text,
  kyc_number          text,
  kyc_image_url       text,
  CONSTRAINT loans_interest_type_check CHECK (interest_type IN ('monthly', 'daily')),
  CONSTRAINT loans_duration_check      CHECK (duration >= 1)
);
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;


-- Indexes
CREATE INDEX IF NOT EXISTS idx_loans_status     ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_created_at ON loans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loans_tenant_id  ON loans(tenant_id);

-- Transactions (Ledger)
CREATE TABLE IF NOT EXISTS transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid REFERENCES tenants(id) ON DELETE CASCADE,
  loan_id     uuid REFERENCES loans(id) ON DELETE CASCADE,
  type        text NOT NULL,
  amount      numeric NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  CONSTRAINT transactions_type_check CHECK (type IN ('interest_payment', 'principal_payment'))
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_transactions_loan_id ON transactions(loan_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at ASC);


-- =============================================================
-- 2. HELPER FUNCTIONS
-- =============================================================

-- Returns the current authenticated user's tenant ID
CREATE OR REPLACE FUNCTION get_current_user_tenant_id()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid() LIMIT 1;
$$;


-- Auto-sets tenant_id on INSERT if not provided
CREATE OR REPLACE FUNCTION set_tenant_id_on_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := get_current_user_tenant_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Auto-provisions profile + tenant + gold rates on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_tenant_id   uuid;
  p_name          text;
  p_age           integer;
  p_gender        text;
  p_mobile_number text;
BEGIN
  p_name          := NEW.raw_user_meta_data->>'name';
  p_age           := (NEW.raw_user_meta_data->>'age')::integer;
  p_gender        := NEW.raw_user_meta_data->>'gender';
  p_mobile_number := NEW.raw_user_meta_data->>'mobile_number';

  p_shop_name     := NEW.raw_user_meta_data->>'shop_name';
  p_shop_location := NEW.raw_user_meta_data->>'shop_location';

  -- Create profile
  INSERT INTO public.profiles (id, mobile_number, name, age, gender)
  VALUES (NEW.id, p_mobile_number, p_name, p_age, p_gender);

  -- Create tenant (shop)
  INSERT INTO public.tenants (name, location)
  VALUES (
    COALESCE(p_shop_name, COALESCE(p_name || '''s Shop', 'My Gold Shop')),
    p_shop_location
  )
  RETURNING id INTO new_tenant_id;

  -- Link user → tenant
  INSERT INTO public.tenant_users (tenant_id, user_id, role)
  VALUES (new_tenant_id, NEW.id, 'owner');

  -- Seed default gold rates
  INSERT INTO public.gold_rates (tenant_id, purity, rate_per_gram) VALUES
    (new_tenant_id, '24k', 7600),
    (new_tenant_id, '22k', 7200),
    (new_tenant_id, 'custom', 7000);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- =============================================================
-- 3. TRIGGERS
-- =============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS set_loans_tenant_id ON loans;
CREATE TRIGGER set_loans_tenant_id
  BEFORE INSERT ON loans
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_insert();

DROP TRIGGER IF EXISTS set_gold_rates_tenant_id ON gold_rates;
CREATE TRIGGER set_gold_rates_tenant_id
  BEFORE INSERT ON gold_rates
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_insert();

DROP TRIGGER IF EXISTS set_transactions_tenant_id ON transactions;
CREATE TRIGGER set_transactions_tenant_id
  BEFORE INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_insert();


-- =============================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- =============================================================

-- Tenants: users can only see their own tenant
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
CREATE POLICY "Users can view their own tenant" ON tenants
  FOR SELECT TO authenticated
  USING (id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

-- Profiles: users can view/update their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- Tenant users: users can see their own mappings
DROP POLICY IF EXISTS "Users can view their own tenant mappings" ON tenant_users;
CREATE POLICY "Users can view their own tenant mappings" ON tenant_users
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Gold rates: tenant-scoped CRUD
DROP POLICY IF EXISTS "tenant_select_gold_rates" ON gold_rates;
CREATE POLICY "tenant_select_gold_rates" ON gold_rates
  FOR SELECT TO authenticated
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "tenant_insert_gold_rates" ON gold_rates;
CREATE POLICY "tenant_insert_gold_rates" ON gold_rates
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "tenant_update_gold_rates" ON gold_rates;
CREATE POLICY "tenant_update_gold_rates" ON gold_rates
  FOR UPDATE TO authenticated
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "tenant_delete_gold_rates" ON gold_rates;
CREATE POLICY "tenant_delete_gold_rates" ON gold_rates
  FOR DELETE TO authenticated
  USING (tenant_id = get_current_user_tenant_id());

-- Loans: tenant-scoped CRUD
DROP POLICY IF EXISTS "tenant_select_loans" ON loans;
CREATE POLICY "tenant_select_loans" ON loans
  FOR SELECT TO authenticated
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "tenant_insert_loans" ON loans;
CREATE POLICY "tenant_insert_loans" ON loans
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "tenant_update_loans" ON loans;
CREATE POLICY "tenant_update_loans" ON loans
  FOR UPDATE TO authenticated
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "tenant_delete_loans" ON loans;
CREATE POLICY "tenant_delete_loans" ON loans
  FOR DELETE TO authenticated
  USING (tenant_id = get_current_user_tenant_id());

-- Transactions: tenant-scoped CRUD
DROP POLICY IF EXISTS "tenant_select_transactions" ON transactions;
CREATE POLICY "tenant_select_transactions" ON transactions
  FOR SELECT TO authenticated
  USING (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "tenant_insert_transactions" ON transactions;
CREATE POLICY "tenant_insert_transactions" ON transactions
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "tenant_update_transactions" ON transactions;
CREATE POLICY "tenant_update_transactions" ON transactions
  FOR UPDATE TO authenticated
  USING (tenant_id = get_current_user_tenant_id())
  WITH CHECK (tenant_id = get_current_user_tenant_id());

DROP POLICY IF EXISTS "tenant_delete_transactions" ON transactions;
CREATE POLICY "tenant_delete_transactions" ON transactions
  FOR DELETE TO authenticated
  USING (tenant_id = get_current_user_tenant_id());

