import { createClient } from '@supabase/supabase-js';

// Valores fixos para o Supabase (Publishable/Anon Key é segura para o frontend)
const SUPABASE_URL = "https://qesbydjnbqlvkktyikhp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlc2J5ZGpuYnFsdmtrdHlpa2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjQyMzgsImV4cCI6MjA4ODc0MDIzOH0.jSjrPOqlvEM2GxBcs9XemwuDsYbVqk6f-IKs-lXWCOo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sb-auth-token',
    lockType: 'null'
  } as any
});