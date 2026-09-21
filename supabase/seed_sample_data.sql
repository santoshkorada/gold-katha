-- =============================================================
-- GoldKatha — Sample Data
-- =============================================================
-- Run this in Supabase SQL Editor AFTER the schema is applied.
-- Prerequisites: Sign up in the app first (creates your tenant).
-- =============================================================

DO $$
DECLARE
  tid uuid;
BEGIN
  SELECT id INTO tid FROM public.tenants ORDER BY created_at DESC LIMIT 1;

  IF tid IS NULL THEN
    RAISE EXCEPTION 'No tenant found. Sign up in the app first.';
  END IF;

  -- Clear existing loans for a clean slate
  DELETE FROM public.loans WHERE tenant_id = tid;

  -- Update gold rates
  UPDATE public.gold_rates SET rate_per_gram = 7450, updated_at = now()
   WHERE tenant_id = tid AND purity = '24k';
  UPDATE public.gold_rates SET rate_per_gram = 7100, updated_at = now()
   WHERE tenant_id = tid AND purity = '22k';
  UPDATE public.gold_rates SET rate_per_gram = 7000, updated_at = now()
   WHERE tenant_id = tid AND purity = 'custom';

  -- Seed loans
  INSERT INTO public.loans
    (tenant_id, customer_name, phone, gross_weight, net_weight, purity,
     principal, ltv_percentage,
     interest_type, interest_per_hundred, duration,
     locker_number, bag_number, status, created_at)
  VALUES
    -- Active loans
    (tid, 'Rajesh Kumar',    '9876543210', 25.5, 23.0, '24k', 120000, 70.0, 'monthly', 2.0,  6,  'L-101', 'B-001', 'active', now() - interval '45 days'),
    (tid, 'Lakshmi Devi',    '9988776655', 15.0, 13.5, '24k',  75000, 74.5, 'monthly', 2.5,  3,  'L-102', 'B-002', 'active', now() - interval '30 days'),
    (tid, 'Mohammed Irfan',  '9112233445', 30.0, 27.8, '22k', 150000, 76.0, 'daily',   0.07, 90, NULL,    NULL,    'active', now() - interval '20 days'),
    (tid, 'Priya Sharma',    '9223344556', 10.0,  9.2, '22k',  45000, 68.8, 'monthly', 2.0,  4,  'L-103', 'B-003', 'active', now() - interval '15 days'),
    (tid, 'Venkatesh Reddy', '9334455667', 50.0, 46.5, '24k', 250000, 72.2, 'monthly', 1.5,  12, NULL,    NULL,    'active', now() - interval '10 days'),
    (tid, 'Sita Ramaiah',    '9445566778',  8.0,  7.2, '22k',  35000, 68.4, 'daily',   0.06, 60, 'L-104', 'B-004', 'active', now() - interval '5 days'),
    -- Closed loans
    (tid, 'Anand Prasad',    '9556677889', 20.0, 18.5, '24k', 100000, 72.6, 'monthly', 2.0,  3,  'L-105', 'B-005', 'closed', now() - interval '90 days'),
    (tid, 'Deepa Kumari',    '9667788990', 12.0, 11.0, '22k',  55000, 70.4, 'monthly', 2.5,  6,  'L-106', 'B-006', 'closed', now() - interval '120 days');

  RAISE NOTICE 'Seeded 8 loans (6 active, 2 closed) for tenant %', tid;
END $$;
