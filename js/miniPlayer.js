// Mini player sincronizado com o Spotify
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
  const prevBtn = document.querySelector(".ph-skip-back")?.parentElement;
  const nextBtn = document.querySelector(".ph-skip-forward")?.parentElement;
  const progressFill = document.querySelector(".mini-progress-bar .progress-fill");

  if (!titleEl || !artistEl || !playBtn) return;

  initSpotifyPlayer();

  // Atualiza info da faixa
  onTrackChange((track) => {
    if (!track) return;
    titleEl.textContent = track.name || "—";
    artistEl.textContent = track.artist || "—";
    playBtn.className = track.isPlaying ? "ph ph-pause" : "ph ph-play";
  });

  // Controles
  prevBtn?.addEventListener("click", previousTrack);
  nextBtn?.addEventListener("click", nextTrack);
  playBtn?.parentElement?.addEventListener("click", playPause);

  // Progresso
  let progressInterval;

  onPlayerStateChange((state) => {
    if (!state) return;
    const { position, duration, paused } = state;
    updateProgress(position, duration);

    clearInterval(progressInterval);
    if (!paused && duration > 0) {
      progressInterval = setInterval(() => {
        const percent = ((position + (Date.now() % 1000)) / duration) * 100;
        progressFill.style.width = `${Math.min(percent, 100)}%`;
      }, 500);
    }
  });
});

function updateProgress(position, duration) {
  const fill = document.querySelector(".mini-progress-bar .progress-fill");
  if (!fill || !duration) return;
  const percent = (position / duration) * 100;
  fill.style.width = `${percent}%`;
}
