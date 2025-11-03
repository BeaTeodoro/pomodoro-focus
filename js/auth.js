import { supabase } from "./supabase.js";

/* =========================================================
   🍅 POMODORO FOCUS — AUTENTICAÇÃO GERAL (GOOGLE + SESSÃO)
   ========================================================= */

/* -------------------------
   DETECTA AMBIENTE ATUAL
-------------------------- */
const isLocalhost =
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1");

const REDIRECT_URL = isLocalhost
  ? "http://127.0.0.1:5500/index.html"
  : "https://pomodoro-focus-bt.vercel.app/index.html";

/* -------------------------
   LOGIN COM GOOGLE
-------------------------- */
export async function loginWithGoogle() {
  try {
    // Marca método de login
    localStorage.setItem("login_method", "google");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: REDIRECT_URL, // ✅ agora redireciona corretamente para index.html
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

/* -------------------------
   LOGOUT
-------------------------- */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Erro ao sair:", error.message);
    alert("Erro ao sair: " + error.message);
  } else {
    window.location.href = "index.html";
  }
}

/* -------------------------
   GERENCIA SESSÃO E USUÁRIO
-------------------------- */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) console.error("Erro ao buscar sessão:", error.message);
  return data?.session || null;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) console.error("Erro ao obter usuário:", error.message);
  return data?.user || null;
}

/* -------------------------
   REQUER LOGIN (PÁGINAS PROTEGIDAS)
-------------------------- */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    alert("⚠️ Faça login para acessar esta página.");
    window.location.href = "login.html";
  }
  return session;
}

/* -------------------------
   MONITORAMENTO DE SESSÃO (EVENTOS DE LOGIN/LOGOUT)
-------------------------- */
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log("🔄 Evento de autenticação:", event);

  if (event === "SIGNED_IN" && session?.user) {
    const { user } = session;

    try {
      // Verifica se o perfil já existe
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      // Cria perfil se ainda não existir
      if (!existing) {
        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          display_name: user.user_metadata?.full_name || user.email,
          full_name: user.user_metadata?.full_name || user.email,
          photo_url: user.user_metadata?.avatar_url || null,
          theme: "auto",
          focus_minutes: 25,
          short_break: 5,
          long_break: 15,
          created_at: new Date(),
          updated_at: new Date(),
        });

        if (insertError) {
          console.error("⚠️ Erro ao criar perfil:", insertError.message);
        } else {
          console.log("🆕 Perfil criado automaticamente no Supabase");
        }
      }
    } catch (err) {
      console.error("❌ Erro ao verificar/criar perfil:", err.message);
    }

    // ✅ Redireciona automaticamente para a página inicial
    window.location.href = "index.html";
  }

  // Logout → volta pro login
  if (event === "SIGNED_OUT") {
    window.location.href = "login.html";
  }
});
