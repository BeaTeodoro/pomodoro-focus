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
  const prevBtn = document.getElementById("mini-prev");
  const nextBtn = document.getElementById("mini-next");
  const progressFill = document.querySelector(".mini-progress-bar .progress-fill");

  initSpotifyPlayer();

  onTrackChange((track) => {
    if (!track) return;
    titleEl.textContent = track.name || "—";
    artistEl.textContent = track.artist || "—";
    playBtn.className = track.isPlaying ? "ph ph-pause" : "ph ph-play";
  });

  prevBtn.addEventListener("click", previousTrack);
  nextBtn.addEventListener("click", nextTrack);
  playBtn.parentElement.addEventListener("click", playPause);

  let progressInterval;

  onPlayerStateChange((state) => {
    if (!state) return;
    const { position, duration, paused } = state;
    const percent = (position / duration) * 100;
    progressFill.style.width = `${percent}%`;

    clearInterval(progressInterval);
    if (!paused && duration > 0) {
      progressInterval = setInterval(() => {
        const updated = ((state.position + 500) / duration) * 100;
        progressFill.style.width = `${Math.min(updated, 100)}%`;
      }, 500);
    }
  });
});
// Mini Player - sincroniza com o Spotify

document.addEventListener("DOMContentLoaded", () => {
  const titleEl = document.querySelector(".mini-track-info .track-title");
  const artistEl = document.querySelector(".mini-track-info .track-artist");
  const playBtn = document.querySelector("#mini-play i");
  const prevBtn = document.getElementById("mini-prev");
  const nextBtn = document.getElementById("mini-next");
  const progressFill = document.querySelector(".mini-progress-bar .progress-fill");

  if (!titleEl || !artistEl || !playBtn || !prevBtn || !nextBtn || !progressFill) return;

  initSpotifyPlayer();

  // Atualiza título / artista / ícone play-pause
  onTrackChange((track) => {
    titleEl.textContent = track?.name || "—";
    artistEl.textContent = track?.artist || "—";
    playBtn.className = track.isPlaying ? "ph ph-pause" : "ph ph-play";
  });

  // Controles
  prevBtn.addEventListener("click", previousTrack);
  nextBtn.addEventListener("click", nextTrack);
  playBtn.parentElement.addEventListener("click", playPause);

  // Atualiza barra de progresso
  onPlayerStateChange((state) => {
    if (!state) return;

    const { position, duration, paused } = state;
    if (!duration) return;

    const percent = (position / duration) * 100;
    progressFill.style.width = `${percent}%`;

    playBtn.className = paused ? "ph ph-play" : "ph ph-pause";
  });
});
