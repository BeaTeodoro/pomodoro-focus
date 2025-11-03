// Estatísticas dinâmicas com Chart.js
const totalFocusEl = document.getElementById("total-focus");
const pomodorosDoneEl = document.getElementById("pomodoros-done");
const lastSessionEl = document.getElementById("last-session");

// Recupera dados reais do localStorage
let stats = JSON.parse(localStorage.getItem("pomodoro_stats")) || {
  totalFocus: 0,
  pomodoros: 0,
  lastSession: null,
  history: []
};

// Atualiza elementos da tela
function updateStatsUI() {
  totalFocusEl.textContent = `${stats.totalFocus} min`;
  pomodorosDoneEl.textContent = stats.pomodoros;
  lastSessionEl.textContent = stats.lastSession || "—";
}

// Renderiza gráfico
function renderChart() {
  const ctx = document.getElementById("focusChart").getContext("2d");

  if (window.focusChartInstance) {
    window.focusChartInstance.destroy();
  }

  const labels = stats.history.map(h => h.date);
  const values = stats.history.map(h => h.minutes);

  window.focusChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Minutos de foco por dia",
        data: values,
        backgroundColor: "var(--primary)",
        borderRadius: 6,
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
      plugins: {
        legend: { display: false }
      }
    }
  });
}

updateStatsUI();
renderChart();
