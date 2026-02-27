import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

// 延迟初始化Supabase客户端
export const getSupabase = (): SupabaseClient | null => {
  if (supabase) return supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      supabase = null;
    }
  }

  return supabase;
};

export default getSupabase;