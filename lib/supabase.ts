import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;
let initAttempted = false;

// 检查是否为有效的 Supabase 配置（排除占位符）
const isValidSupabaseConfig = (url: string | undefined, key: string | undefined): boolean => {
  if (!url || !key || typeof url !== 'string' || typeof key !== 'string') return false;
  if (url.includes('your-') || url === 'placeholder' || key.includes('your-') || key === 'placeholder') return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
};

// 延迟初始化Supabase客户端
export const getSupabase = (): SupabaseClient | null => {
  if (supabase) return supabase;
  if (initAttempted) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  initAttempted = true;

  if (isValidSupabaseConfig(supabaseUrl, supabaseAnonKey)) {
    try {
      supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    } catch (error) {
      console.error('Error creating Supabase client:', error);
    }
  }

  return supabase;
};

export default getSupabase;