// Elementos
const totalFocusEl = document.getElementById("total-focus");
const pomodorosDoneEl = document.getElementById("pomodoros-done");
const lastSessionEl = document.getElementById("last-session");

// Dados locais
let stats = JSON.parse(localStorage.getItem("pomodoro_stats")) || {
  totalFocus: 0,
  pomodoros: 0,
  lastSession: null,
  history: []
};

// Atualiza valores na tela
function updateStatsUI() {
  if (!totalFocusEl || !pomodorosDoneEl || !lastSessionEl) return;
  totalFocusEl.textContent = `${stats.totalFocus} min`;
  pomodorosDoneEl.textContent = stats.pomodoros;
  lastSessionEl.textContent = stats.lastSession || "—";
}

// Renderiza gráfico
function renderChart() {
  const ctx = document.getElementById("focusChart");
  if (!ctx) return;

  const canvas = ctx.getContext("2d");
  if (window.focusChartInstance) window.focusChartInstance.destroy();

  const labels = stats.history.map(h => h.date);
  const values = stats.history.map(h => h.minutes);

  window.focusChartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Minutos de foco por dia",
        data: values,
        backgroundColor: "var(--primary)",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: "var(--text)" },
          grid: { color: "rgba(0,0,0,0.1)" }
        },
        x: {
          ticks: { color: "var(--text)" },
          grid: { display: false }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// Scroll lateral no mobile
function enableSmoothScroll() {
  const statsContainer = document.querySelector(".stats-cards");
  if (!statsContainer) return;

  statsContainer.addEventListener("wheel", e => {
    if (window.innerWidth < 768) {
      e.preventDefault();
      statsContainer.scrollLeft += e.deltaY * 0.8;
    }
  });
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  updateStatsUI();
  renderChart();
  enableSmoothScroll();
});
