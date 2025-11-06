import { supabase } from "./supabase.js";

// Redireciono automaticamente p/ o domínio atual
const REDIRECT_URL = `${window.location.origin}/index.html`;

// Login com Google (OAuth)
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
    console.log("✅ Login com Google iniciado…");
  } catch (err) {
    console.error("❌ Erro no login com Google:", err?.message || err);
    alert("Erro ao tentar login com Google: " + (err?.message || err));
  }
}

// Logout
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Erro ao sair:", error?.message || error);
  else window.location.href = "login.html";
}

// Sessão atual
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data?.session || null;
  } catch {
    return null;
  }
}

// Usuário atual
export async function getCurrentUser() {
  try {
    const { data: { user } = {}, error } = await supabase.auth.getUser();
    if (error) return null;
    return user || null;
  } catch {
    return null;
  }
}

// Listener de autenticação (cria perfil no 1º login Google e vai para index)
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log("🔄 Auth event:", event);

  if (event === "SIGNED_IN" && session?.user) {
    const { user } = session;

    try {
      // já existe perfil?
      const { data: existing, error: selectError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (selectError) console.error("Erro ao checar perfil:", selectError);

      if (!existing) {
        // cria perfil básico no primeiro login
        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email,
          location: null,
          age: null,
          photo_url: user.user_metadata?.avatar_url || null,
          theme: "auto",
          created_at: new Date(),
          updated_at: new Date(),
        });

        if (insertError) console.error("Erro ao criar perfil:", insertError);
        else console.log("🆕 Perfil criado no Supabase");
      }
    } catch (err) {
      console.error("Erro ao criar/checar perfil:", err);
    }

    // Vai para index sempre que logar
    if (!location.pathname.endsWith("/index.html")) {
      window.location.href = "index.html";
    }
  }

  if (event === "SIGNED_OUT") {
    if (!location.pathname.endsWith("/login.html")) {
      window.location.href = "login.html";
    }
  }
});
