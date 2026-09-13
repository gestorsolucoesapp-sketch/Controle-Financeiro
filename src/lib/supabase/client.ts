import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;
export function getSupabase() {
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) throw new Error('A conexão do aplicativo ainda não foi configurada.');
if (process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://dsfexbtcvkyjqaondqiv.supabase.co') throw new Error('O endereço configurado não corresponde ao projeto Finanças.');
return client ??= createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
}
