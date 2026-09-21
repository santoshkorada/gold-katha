import { AppState } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
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
  interest_type: 'monthly' | 'daily';
  interest_per_hundred: number;
  duration: number;
  locker_number: string | null;
  bag_number: string | null;
  status: 'active' | 'closed';
  created_at: string;
  closed_at?: string;
  item_image_url?: string;
  kyc_type?: string;
  kyc_number?: string;
  kyc_image_url?: string;
};

export type NewLoan = Omit<Loan, 'id' | 'created_at' | 'closed_at' | 'item_image_url' | 'kyc_type' | 'kyc_number' | 'kyc_image_url'> & {
  item_image_url?: string;
  kyc_type?: string;
  kyc_number?: string;
  kyc_image_url?: string;
};

export type Transaction = {
  id: string;
  tenant_id: string;
  loan_id: string;
  type: 'interest_payment' | 'principal_payment';
  amount: number;
  created_at: string;
};
