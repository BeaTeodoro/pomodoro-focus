// Mini Player do Spotify — sincronizado com o player global

import {
  initSpotifyPlayer,
  nextTrack,
  onPlayerStateChange,
  onTrackChange,
  playPause,
  previousTrack,
} from "./spotifyController.js";

document.addEventListener("DOMContentLoaded", () => {
  const titleEl = document.querySelector(".track-title");
  const artistEl = document.querySelector(".track-artist");
  const playBtn = document.querySelector(".play-btn i");
  const prevBtn = document.querySelector(".ph-skip-back").parentElement;
  const nextBtn = document.querySelector(".ph-skip-forward").parentElement;
  const progressFill = document.querySelector(".mini-progress-bar .progress-fill");

  initSpotifyPlayer();

  // Atualiza informações da faixa
  onTrackChange((track) => {
    if (!track) return;

    titleEl.textContent = track.name || "—";
    artistEl.textContent = track.artist || "—";
    playBtn.className = track.isPlaying ? "ph ph-pause" : "ph ph-play";

    const wrapper = titleEl.closest(".mini-track-info");
    wrapper.classList.remove("scrolling");

    setTimeout(() => {
      if (titleEl.scrollWidth > wrapper.clientWidth) {
        wrapper.classList.add("scrolling");
      }
    }, 150);
  });

  // Controles do player
  prevBtn.addEventListener("click", previousTrack);
  nextBtn.addEventListener("click", nextTrack);
  playBtn.parentElement.addEventListener("click", playPause);

  // Atualiza a barra de progresso
  let progressInterval;

  onPlayerStateChange((state) => {
    if (!state) return;

    const { position, duration, paused } = state;
    updateProgress(position, duration);

    progressFill?.classList.toggle("playing", !paused);
    clearInterval(progressInterval);

    if (!paused && duration) {
      progressInterval = setInterval(() => {
        const currentWidth = parseFloat(progressFill.style.width) || 0;
        const nextWidth = currentWidth + (100 / (duration / 1000)) * 0.5;
        progressFill.style.width = `${Math.min(nextWidth, 100)}%`;
      }, 500);
    }
  });
});

// Atualiza a porcentagem da barra
function updateProgress(position, duration) {
  const fill = document.querySelector(".mini-progress-bar .progress-fill");
  if (!fill || !duration) return;
  const percent = (position / duration) * 100;
  fill.style.width = `${percent}%`;
}
