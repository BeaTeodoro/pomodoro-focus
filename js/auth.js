import { supabase } from "./supabase.js";

/* =========================================================
   🍅 POMODORO FOCUS — AUTENTICAÇÃO GOOGLE E CONTROLE DE SESSÃO
   ========================================================= */

/**
 * LOGIN COM GOOGLE (OAuth)
 */
export async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // Redireciona de volta ao site após login
      redirectTo: window.location.origin + "/perfil.html",
    },
  });

  if (error) {
    console.error("❌ Erro no login com Google:", error.message);
    alert("Erro ao tentar login com Google: " + error.message);
  } else {
    console.log("✅ Redirecionando para autenticação Google...");
  }
}

/**
 * LOGOUT (encerra a sessão)
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Erro ao sair:", error.message);
    alert("Erro ao sair: " + error.message);
  } else {
    alert("Sessão encerrada com sucesso!");
    window.location.href = "index.html";
  }
}

/**
 * OBTÉM A SESSÃO ATUAL
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Erro ao buscar sessão:", error.message);
    return null;
  }

  return data.session;
}

/**
 * OBTÉM O USUÁRIO ATUAL LOGADO
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Erro ao obter usuário:", error.message);
    return null;
  }

  return data.user;
}

/**
 * EXIGE LOGIN EM PÁGINAS PROTEGIDAS
 * Exemplo: usar no início do perfil.html
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    alert("⚠️ É necessário fazer login para acessar esta página.");
    window.location.href = "login.html";
  }

  return session;
}

/**
 * LISTENER — MONITORA ALTERAÇÕES DE SESSÃO (opcional)
 * Pode ser usado para atualizar UI em tempo real quando o usuário logar/sair.
 */
supabase.auth.onAuthStateChange((event, session) => {
  console.log("🔄 Evento de autenticação:", event);
  if (event === "SIGNED_OUT") {
    window.location.href = "login.html";
  }
});
