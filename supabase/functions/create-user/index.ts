import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, profileData } = await req.json()

    console.log("[create-user] Iniciando criação de usuário:", email);

    // 1. Cria o usuário no Auth do Supabase
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: profileData.full_name }
    })

    if (authError) {
      console.error("[create-user] Erro no Auth Admin:", authError.message);
      throw authError;
    }

    console.log("[create-user] Usuário Auth criado com ID:", authUser.user.id);

    // 2. Upsert nos dados do perfil
    // Usamos upsert pois se houver um trigger 'on_auth_user_created', 
    // a linha já pode ter sido inserida automaticamente.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authUser.user.id,
        ...profileData,
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error("[create-user] Erro ao salvar perfil:", profileError.message);
      // Opcional: remover o usuário do auth se o perfil falhar
      // await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      throw profileError;
    }

    console.log("[create-user] Perfil sincronizado com sucesso.");

    return new Response(
      JSON.stringify({ message: 'Usuário e perfil criados com sucesso', user: authUser.user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error("[create-user] Erro fatal na função:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})