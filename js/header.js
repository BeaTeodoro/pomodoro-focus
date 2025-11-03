// HEADER MOBILE + MENU TOGGLE
const menuToggle = document.getElementById("menu-toggle");
const headerActions = document.querySelector(".header-actions");
const mobileMenu = document.getElementById("mobile-menu");

// Verifica se os elementos existem antes de adicionar o evento
if (menuToggle && headerActions && mobileMenu) {
  menuToggle.addEventListener("click", () => {
    headerActions.classList.toggle("active");
    mobileMenu.classList.toggle("active");

    // alterna o ícone (menu / X)
    const icon = menuToggle.querySelector("i");
    if (icon) {
      icon.classList.toggle("ph-list");
      icon.classList.toggle("ph-x");
    }
  });
}
