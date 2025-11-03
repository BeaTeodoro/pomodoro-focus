import { supabase } from "./supabase.js";

//AUTENTICAÇÃO GERAL (Google + Sessão)//

// LOGIN COM GOOGLE
export async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/perfil.html",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("❌ Erro no login com Google:", error.message);
    alert("Erro ao tentar login com Google: " + error.message);
  } else {
    console.log("✅ Redirecionando para autenticação Google...");
  }
}

// LOGOUT
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Erro ao sair:", error.message);
  else window.location.href = "index.html";
}

// OBTÉM SESSÃO ATUAL
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) console.error("Erro ao buscar sessão:", error.message);
  return data?.session || null;
}

// OBTÉM USUÁRIO ATUAL
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) console.error("Erro ao obter usuário:", error.message);
  return data?.user || null;
}

// GARANTE LOGIN EM PÁGINAS PROTEGIDAS
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    alert("⚠️ Faça login para acessar esta página.");
    window.location.href = "login.html";
  }
  return session;
}

// 🔄 Listener de sessão
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log("🔄 Auth Event:", event);

  if (event === "SIGNED_IN" && session?.user) {
    // Verifica se o perfil existe, senão cria
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", session.user.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("profiles").insert({
        id: session.user.id,
        display_name: session.user.user_metadata?.full_name || session.user.email,
        photo_url: session.user.user_metadata?.avatar_url || null,
        theme: "auto",
        created_at: new Date(),
      });
      console.log("🆕 Perfil criado automaticamente no Supabase");
    }
  }

  if (event === "SIGNED_OUT") {
    window.location.href = "login.html";
  }
});
