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
  tomato.style.animationPlayState = "running";

  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateDisplay();
    } else {
      clearInterval(timerInterval);
      isRunning = false;
      tomato.style.animationPlayState = "paused";

      // Alterna entre trabalho e descanso
      if (isWorkSession) {
        completedSessions++;
        sessionsDone.textContent = completedSessions;
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

      startTimer();
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
  tomato.style.animationPlayState = "paused";

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

  // Reinicia a rotação do tomate da forma correta
  tomato.style.animation = "none";
  tomato.offsetHeight;
  tomato.style.animation = "rotateTomato 60s linear infinite";
  tomato.style.animationPlayState = "paused";
  tomato.style.transform = "rotate(0deg)";

  // Volta os botões ao estado inicial
  startBtn.innerHTML = '<i class="ph ph-play"></i> Iniciar';
  startBtn.style.display = "inline-flex";
  pauseBtn.style.display = "none";
}

// Pausa o tomate e volta ele pra posição original
tomato.style.animationPlayState = "paused";
tomato.style.transform = "rotate(0deg)";

// Volta os botões ao estado inicial
startBtn.innerHTML = '<i class="ph ph-play"></i> Iniciar';
startBtn.style.display = "inline-flex";
pauseBtn.style.display = "none";

// ------------------------------
// Atualiza o tempo se o usuário mudar o valor
// ------------------------------
workInput.addEventListener("change", () => {
  if (!isRunning && !isPaused) {
    timeLeft = parseInt(workInput.value) * 60;
    updateDisplay();
  }
});

// ------------------------------
// Eventos dos botões
// ------------------------------
startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

// ------------------------------
// Inicialização
// ------------------------------
updateDisplay();
pauseBtn.style.display = "none"; // esconde o botão de pausa ao carregar
