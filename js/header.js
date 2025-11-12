import { supabase } from "./supabase.js";

/* -------------------------------------------
   MENU MOBILE
-------------------------------------------- */
const menuToggle = document.getElementById("menu-toggle");
const headerActions = document.querySelector(".header-actions");
const mobileMenu = document.getElementById("mobile-menu");

if (menuToggle && headerActions && mobileMenu) {
  menuToggle.addEventListener("click", () => {
    headerActions.classList.toggle("active");
    mobileMenu.classList.toggle("active");

    const icon = menuToggle.querySelector("i");
    if (icon) {
      icon.classList.toggle("ph-list");
      icon.classList.toggle("ph-x");
    }
  });
}

/* -------------------------------------------
   CARREGAR USUÁRIO NO HEADER
   (alinha com o SCSS: usa .visible para mostrar)
-------------------------------------------- */
async function loadUser() {
  const userInfo = document.getElementById("user-info");
  const userMenu = document.getElementById("user-menu");
  const loginButton = document.getElementById("login-btn");
  const userName = document.getElementById("user-name");
  const userAvatar = document.getElementById("user-avatar");
  const logoutButton = document.getElementById("logout-btn");

  if (!userInfo || !loginButton) return;

  const { data: { session } } = await supabase.auth.getSession();

  // Não logado
  if (!session) {
    userInfo.classList.add("hidden");
    loginButton.classList.remove("hidden");
    return;
  }

  // Logado
  const { user } = session;

  // Carrega perfil no Supabase
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, photo_url")
    .eq("id", user.id)
    .single();

  // Aplica dados no header
  if (userName) userName.textContent = profile?.display_name || user.email;
  if (userAvatar) userAvatar.src = profile?.photo_url || "img/default-avatar.svg";

  // Mostra área do usuário, esconde o botão entrar
  userInfo.classList.remove("hidden");
  loginButton.classList.add("hidden");

  // Logout
  if (logoutButton) {
    logoutButton.onclick = async () => {
      await supabase.auth.signOut();
      window.location.reload();
    };
  }

  // Toggle menu ao clicar no avatar ou nome
  if (userInfo && userMenu) {
    userInfo.onclick = () => {
      userMenu.classList.toggle("hidden");
    };
  }
}

/* -------------------------------------------
   INICIALIZAÇÃO
-------------------------------------------- */
document.addEventListener("DOMContentLoaded", loadUser);

// Atualiza o header quando a sessão mudar
supabase.auth.onAuthStateChange(() => {
  console.log("🔄 Sessão mudou — atualizando header...");
  loadUser();
});

// Atualiza o header quando o perfil for salvo (perfil.js dispara isso)
document.addEventListener("profile-updated", loadUser);
