import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type GoldRate = {
  id: string;
  purity: '22k' | '20k' | '18k';
  rate_per_gram: number;
  updated_at: string;
};

export type Loan = {
  id: string;
  customer_name: string;
  phone: string;
  gross_weight: number;
  net_weight: number;
  purity: '22k' | '20k' | '18k';
  principal: number;
  ltv_percentage: number;
  locker_number: string | null;
  bag_number: string | null;
  status: 'active' | 'closed';
  created_at: string;
};

export type NewLoan = Omit<Loan, 'id' | 'created_at'>;
