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
  const loginButton = document.getElementById("login-btn");
  const userName = document.getElementById("user-name");
  const userAvatar = document.getElementById("user-avatar");
  const logoutButton = document.getElementById("logout-btn");

  // segurança se o header desta página não tiver esses elementos
  if (!userInfo || !loginButton) return;

  const { data: { session } } = await supabase.auth.getSession();

  // Não logado → mostra "Entrar", esconde área do usuário
  if (!session) {
    userInfo.classList.remove("visible");
    userInfo.classList.add("hidden");
    loginButton.classList.remove("hidden");
    return;
  }

  // Logado → carrega perfil
  const { user } = session;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, photo_url")
    .eq("id", user.id)
    .single();

  if (!error && profile) {
    if (userName) userName.textContent = profile.display_name || "Usuário";
    if (userAvatar) userAvatar.src = profile.photo_url || "img/default-avatar.svg";
  }

  // Mostra área do usuário e esconde o botão "Entrar"
  loginButton.classList.add("hidden");
  userInfo.classList.remove("hidden");
  userInfo.classList.add("visible");

  // (Opcional) abrir/fechar menu de usuário ao clicar na área
  const userMenu = document.getElementById("user-menu");
  if (userMenu) {
    userInfo.addEventListener("click", () => {
      userMenu.classList.toggle("hidden");
    });
    // clicar fora fecha
    document.addEventListener("click", (e) => {
      if (!userInfo.contains(e.target) && !userMenu.contains(e.target)) {
        userMenu.classList.add("hidden");
      }
    });
  }

  // Logout
  if (logoutButton) {
    logoutButton.onclick = async () => {
      await supabase.auth.signOut();
      window.location.reload();
    };
  }
}

/* -------------------------------------------
   INICIALIZAÇÃO
-------------------------------------------- */
document.addEventListener("DOMContentLoaded", loadUser);
supabase.auth.onAuthStateChange(() => {
  console.log("🔄 Sessão mudou — atualizando header...");
  loadUser();
});
