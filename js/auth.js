import { supabase } from "./supabase.js";

/* =========================================================
   🍅 POMODORO FOCUS — AUTENTICAÇÃO GERAL (GOOGLE + SESSÃO)
   ========================================================= */

// Detecta ambiente atual
const isLocalhost =
  window.location.hostname.includes("localhost") ||
  window.location.hostname.includes("127.0.0.1");

const REDIRECT_URL = isLocalhost
  ? "http://127.0.0.1:5500/cadastro.html"
  : "https://pomodoro-focus-bt.vercel.app/cadastro.html";

/* -------------------------
   LOGIN COM GOOGLE
-------------------------- */
export async function loginWithGoogle() {
  try {
    // Marca que o usuário iniciou login pelo Google
    localStorage.setItem("login_method", "google");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: REDIRECT_URL,
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
  if (error) console.error("Erro ao sair:", error.message);
  else window.location.href = "index.html";
}

/* -------------------------
   SESSÕES E USUÁRIOS
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
   VERIFICAÇÃO DE LOGIN
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
   MONITORAMENTO DE SESSÃO
-------------------------- */
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log("🔄 Evento de autenticação:", event);

  if (event === "SIGNED_IN" && session?.user) {
    const user = session.user;

    try {
      // Verifica se o perfil já existe
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      // Cria perfil se ainda não existir
      if (!existing) {
        await supabase.from("profiles").insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email,
          photo_url: user.user_metadata?.avatar_url || null,
          theme: "auto",
          created_at: new Date(),
          updated_at: new Date(),
        });
        console.log("🆕 Perfil criado automaticamente no Supabase");
      }
    } catch (err) {
      console.error("❌ Erro ao criar perfil:", err.message);
    }
  }

  if (event === "SIGNED_OUT") {
    window.location.href = "login.html";
  }
});
