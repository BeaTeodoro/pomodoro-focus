import { next, onTrackChange, pause, play, previous } from "./spotifyController.js";

const miniPrev = document.getElementById("mini-prev");
const miniPlay = document.getElementById("mini-play");
const miniNext = document.getElementById("mini-next");
const trackTitle = document.querySelector(".mini-track-info .track-title");
const trackArtist = document.querySelector(".mini-track-info .track-artist");
const progressBar = document.querySelector(".mini-progress-bar .progress-fill");

let isPlaying = false;

// Atualiza faixa
onTrackChange(track => {
  if (!track) return;
  trackTitle.textContent = track.name || "—";
  trackArtist.textContent = track.artist || "—";
  isPlaying = track.isPlaying;
  updatePlayIcon();
});

// Botões
if (miniPrev) miniPrev.addEventListener("click", previous);
if (miniNext) miniNext.addEventListener("click", next);
if (miniPlay) miniPlay.addEventListener("click", () => {
  if (isPlaying) pause();
  else play();
  isPlaying = !isPlaying;
  updatePlayIcon();
});

// Ícone
function updatePlayIcon() {
  miniPlay.innerHTML = isPlaying
    ? '<i class="ph ph-pause"></i>'
    : '<i class="ph ph-play"></i>';
}

// Simulação de progresso
setInterval(() => {
  const width = parseFloat(progressBar.style.width) || 0;
  const newWidth = width >= 100 ? 0 : width + 0.5;
  progressBar.style.width = newWidth + "%";
}, 500);
