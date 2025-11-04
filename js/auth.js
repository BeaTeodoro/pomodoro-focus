import { supabase } from "./supabase.js";

// Detecta ambiente (local ou produção)
const isLocalhost = ["127.0.0.1", "localhost"].some(host => window.location.hostname.includes(host));
const REDIRECT_URL = isLocalhost
  ? "http://127.0.0.1:5500/index.html"
  : "https://pomodoro-focus-bt.vercel.app/index.html";

// Login com Google
export async function loginWithGoogle() {
  try {
    localStorage.setItem("login_method", "google");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: REDIRECT_URL,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) throw error;
    console.log("✅ Login com Google iniciado...");
  } catch (err) {
    console.error("❌ Erro no login com Google:", err.message || err);
    alert("Erro ao tentar login com Google: " + (err.message || err));
  }
}

// Logout
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Erro ao sair:", error.message || error);
  else window.location.href = "login.html";
}

// Sessão atual
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Erro ao buscar sessão:", error.message || error);
      return null;
    }
    return data?.session || null;
  } catch (err) {
    console.error("Erro ao buscar sessão (catch):", err);
    return null;
  }
}

// Usuário atual
export async function getCurrentUser() {
  try {
    const { data: { user } = {}, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Erro ao obter usuário:", error.message || error);
      return null;
    }
    return user || null;
  } catch (err) {
    console.error("Erro ao obter usuário (catch):", err);
    return null;
  }
}

// Exige login em páginas protegidas
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    alert("⚠️ Faça login para acessar esta página.");
    window.location.href = "login.html";
  }
  return session;
}

// Listener de autenticação
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log("🔄 Evento de autenticação:", event);

  if (event === "SIGNED_IN" && session?.user) {
    const { user } = session;
    try {
      const { data: existing, error: selectError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (selectError) {
        console.error("Erro ao checar perfil:", selectError);
      }

      if (!existing) {
        // cria perfil básico
        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email,
          photo_url: user.user_metadata?.avatar_url || null,
          theme: "auto",
          created_at: new Date(),
          updated_at: new Date(),
        });

        if (insertError) console.error("Erro ao criar perfil:", insertError);
        else console.log("🆕 Perfil criado no Supabase");

        // redireciona para página de completar perfil
        window.location.href = "cadastro.html";
        return;
      }
    } catch (err) {
      console.error("Erro ao criar/perfilar usuário:", err);
    }

    // se já existir, vai para index
    window.location.href = "index.html";
  }

  if (event === "SIGNED_OUT") {
    window.location.href = "login.html";
  }
});
