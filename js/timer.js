// Seleciona elementos principais
const tomato = document.querySelector(".tomato-rotator");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const resetBtn = document.getElementById("reset-btn");
const timerDisplay = document.getElementById("timer-display");
const workInput = document.getElementById("work-time");
const breakInput = document.getElementById("break-time");
const sessionLabel = document.getElementById("session-label");
const sessionsDone = document.getElementById("sessions-done");

// Estados do timer
let isRunning = false;
let isPaused = false;
let isWorkSession = true;
let timerInterval;
let timeLeft = parseInt(workInput.value) * 60;
let completedSessions = 0;

// ------------------------------
//  Atualiza o display do tempo
// ------------------------------
function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}

// ------------------------------
// salva estatísticas locais após cada sessão de trabalho concluída
// ------------------------------
function updateStats(minutes) {
  try {
    const stats = JSON.parse(localStorage.getItem("pomodoro_stats")) || {
      totalFocus: 0,
      pomodoros: 0,
      lastSession: null,
      history: []
    };

    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR");

    stats.totalFocus = (stats.totalFocus || 0) + minutes;
    stats.pomodoros = (stats.pomodoros || 0) + 1;
    stats.lastSession = dateStr;
    stats.history = stats.history || [];
    stats.history.push({ date: dateStr, minutes });

    localStorage.setItem("pomodoro_stats", JSON.stringify(stats));
  } catch (err) {
    console.error("Erro ao atualizar estatísticas:", err);
  }
}

// ------------------------------
//  Inicia ou retoma o timer
// ------------------------------
function startTimer() {
  if (isRunning) return;
  isRunning = true;
  isPaused = false;

  // Atualiza os botões
  startBtn.style.display = "none";
  pauseBtn.style.display = "inline-flex";

  // Inicia o giro do tomate 🍅
  if (tomato) tomato.style.animationPlayState = "running";

  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateDisplay();
    } else {
      clearInterval(timerInterval);
      isRunning = false;
      if (tomato) tomato.style.animationPlayState = "paused";

      // Alterna entre trabalho e descanso
      if (isWorkSession) {
        completedSessions++;
        sessionsDone.textContent = completedSessions;

        // Atualiza estatísticas com os minutos configurados de trabalho
        const minutesWorked = parseInt(workInput.value) || 0;
        updateStats(minutesWorked);

        isWorkSession = false;
        timeLeft = parseInt(breakInput.value) * 60;
        sessionLabel.innerHTML =
          '<i class="ph ph-coffee"></i> Sessão de Descanso';
      } else {
        isWorkSession = true;
        timeLeft = parseInt(workInput.value) * 60;
        sessionLabel.innerHTML =
          '<i class="ph ph-timer"></i> Sessão de Trabalho';
      }

      // reinicia automaticamente o próximo período
      // pequena quebra para evitar reentrada instantânea
      setTimeout(startTimer, 500);
    }
  }, 1000);
}

// ------------------------------
// ⏸Pausa o timer (exibe botão Retomar)
// ------------------------------
function pauseTimer() {
  if (!isRunning) return;
  clearInterval(timerInterval);
  isRunning = false;
  isPaused = true;

  // Pausa o tomate 🍅
  if (tomato) tomato.style.animationPlayState = "paused";

  // Alterna visibilidade dos botões
  startBtn.innerHTML = '<i class="ph ph-play"></i> Retomar';
  startBtn.style.display = "inline-flex";
  pauseBtn.style.display = "none";
}

// ------------------------------
// Reseta o timer completamente
// ------------------------------
function resetTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  isPaused = false;
  isWorkSession = true;
  timeLeft = parseInt(workInput.value) * 60;
  updateDisplay();
  sessionLabel.innerHTML = '<i class="ph ph-timer"></i> Sessão de Trabalho';

  // Reinicia a rotação do tomate de forma suave
  if (tomato) {
    tomato.style.animation = "none";
    // força repaint
    void tomato.offsetWidth;
    tomato.style.animation = "rotateTomato 60s linear infinite";
    tomato.style.animationPlayState = "paused";
    tomato.style.transform = "rotate(0deg)";
  }

  // Volta os botões ao estado inicial
  startBtn.innerHTML = '<i class="ph ph-play"></i> Iniciar';
  startBtn.style.display = "inline-flex";
  pauseBtn.style.display = "none";
}

// Inicial setup seguro (verifica existência dos elementos)
if (tomato) tomato.style.animationPlayState = "paused";
if (startBtn) startBtn.innerHTML = '<i class="ph ph-play"></i> Iniciar';
if (startBtn) startBtn.style.display = "inline-flex";
if (pauseBtn) pauseBtn.style.display = "none";
updateDisplay();

// ------------------------------
// Atualiza o tempo se o usuário mudar o valor
// ------------------------------
if (workInput) {
  workInput.addEventListener("change", () => {
    if (!isRunning && !isPaused) {
      timeLeft = parseInt(workInput.value) * 60;
      updateDisplay();
    }
  });
}

// ------------------------------
// Eventos dos botões (verifica existência)
if (startBtn) startBtn.addEventListener("click", startTimer);
if (pauseBtn) pauseBtn.addEventListener("click", pauseTimer);
if (resetBtn) resetBtn.addEventListener("click", resetTimer);
