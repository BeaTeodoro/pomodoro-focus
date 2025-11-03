/* ============================================================
   🌗 Alternância de Tema (Claro / Escuro)
   Pomodoro Focus — versão robusta
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const toggleInput = document.getElementById("theme-toggle");
  const sunIcon = document.querySelector(".ph-sun");
  const moonIcon = document.querySelector(".ph-moon");

  if (!toggleInput) return;

  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const savedTheme = localStorage.getItem("theme") || (systemPrefersDark ? "dark" : "light");

  root.setAttribute("data-theme", savedTheme);
  toggleInput.checked = savedTheme === "dark";
  updateIcons(savedTheme);

  function updateIcons(theme) {
    if (!sunIcon || !moonIcon) return;
    if (theme === "dark") {
      sunIcon.style.opacity = "0.4";
      moonIcon.style.opacity = "1";
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    } else {
      sunIcon.style.opacity = "1";
      moonIcon.style.opacity = "0.4";
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    }
  }

  toggleInput.addEventListener("change", () => {
    const newTheme = toggleInput.checked ? "dark" : "light";

    // Adiciona a classe temporária para a animação
    document.documentElement.classList.add("theme-transition");

    root.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateIcons(newTheme);

    // Remove a classe após o fade (para reuso posterior)
    setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 600);
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    const systemTheme = e.matches ? "dark" : "light";
    const userTheme = localStorage.getItem("theme");
    if (!userTheme || userTheme === "auto") {
      root.setAttribute("data-theme", systemTheme);
      updateIcons(systemTheme);
    }
  });
});
