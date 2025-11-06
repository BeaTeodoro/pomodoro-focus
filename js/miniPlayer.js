import {
  nextTrack, onPlayerStateChange, onTrackChange,
  playPause, previousTrack, setVolume
} from "./spotifyController.js";

document.addEventListener("DOMContentLoaded", () => {
  const titleEl = document.querySelector(".mini-track-info .track-title");
  const artistEl = document.querySelector(".mini-track-info .track-artist");
  const playIcon = document.querySelector("#mini-play i");
  const prevBtn = document.getElementById("mini-prev");
  const nextBtn = document.getElementById("mini-next");
  const progressFill = document.querySelector(".mini-progress-bar .progress-fill");

  const volBtn = document.getElementById("mini-vol-btn");
  const volPop = document.querySelector(".mini-volume-pop");
  const volRange = document.getElementById("mini-volume-range");
  // === RESTAURAR VOLUME SALVO ===
  const savedVol = localStorage.getItem("pf_volume");
  if (savedVol !== null) {
    volRange.value = savedVol;
    setVolume(savedVol);
    if (+savedVol === 0) volBtn.classList.add("muted");
  }

  if (!titleEl || !artistEl || !playIcon || !prevBtn || !nextBtn || !progressFill) return;

  onTrackChange((t) => {
    titleEl.textContent = t?.name || "—";
    artistEl.textContent = t?.artist || "—";
    playIcon.className = t?.isPlaying ? "ph ph-pause" : "ph ph-play";
  });

  prevBtn.addEventListener("click", previousTrack);
  nextBtn.addEventListener("click", nextTrack);
  document.getElementById("mini-play").addEventListener("click", playPause);

  onPlayerStateChange((s) => {
    if (!s?.duration) return;
    const pct = (s.position / s.duration) * 100;
    progressFill.style.width = `${pct}%`;
    playIcon.className = s.paused ? "ph ph-play" : "ph ph-pause";
  });

  // volume popover + mute
  let muted = false;
  volBtn.addEventListener("click", () => {
    muted = !muted;
    if (muted) {
      volBtn.classList.add("muted");
      volRange.dataset.prev = volRange.value;
      volRange.value = 0;
      setVolume(0);
    } else {
      volBtn.classList.remove("muted");
      const back = volRange.dataset.prev || "70";
      volRange.value = back;
      setVolume(back);
    }
    volPop.classList.toggle("show");
  });

  volRange.addEventListener("input", (e) => {
    const v = e.target.value;
    setVolume(v);
    if (+v === 0) volBtn.classList.add("muted");
    else volBtn.classList.remove("muted");
  });
});
