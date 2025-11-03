import { supabase } from "./supabase.js";

/* POMODORO FOCUS — AUTENTICAÇÃO GERAL (Google + Sessão) */

// LOGIN COM GOOGLE
export async function loginWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://pomodoro-focus-bt.vercel.app/perfil.html", // URL exata do seu domínio Vercel
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) throw error;

    console.log("✅ Redirecionando para autenticação Google...");
  } catch (err) {
    console.error("❌ Erro no login com Google:", err.message);
    alert("Erro ao tentar login com Google: " + err.message);
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

// 🔄 Listener de sessão (executa quando o estado muda)
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log("🔄 Evento de autenticação:", event);

  // Quando o usuário entra
  if (event === "SIGNED_IN" && session?.user) {
    const user = session.user;

    // Verifica se o perfil já existe
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    // Cria o perfil se não existir
    if (!existing) {
      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        display_name: user.user_metadata?.full_name || user.email,
        photo_url: user.user_metadata?.avatar_url || null,
        theme: "auto",
        focus_minutes: 25,
        short_break: 5,
        long_break: 15,
        created_at: new Date(),
        updated_at: new Date(),
      });

      if (error) {
        console.error("⚠️ Erro ao criar perfil no Supabase:", error.message);
      } else {
        console.log("🆕 Perfil criado automaticamente no Supabase");
      }
    }
  }

  // Quando o usuário sai
  if (event === "SIGNED_OUT") {
    window.location.href = "login.html";
  }
});
