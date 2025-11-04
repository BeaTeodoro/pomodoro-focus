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
