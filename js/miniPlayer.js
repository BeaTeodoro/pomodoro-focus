// js/miniPlayer.js
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
  const volIcon = volBtn.querySelector("i");
  const volPop = document.querySelector(".mini-volume-pop");
  const volRange = document.getElementById("mini-volume-range");

  // === RESTAURAR VOLUME ===
  const savedVol = localStorage.getItem("pf_volume");
  volRange.value = savedVol ?? 60;
  setVolume(volRange.value);

  let muted = (+volRange.value === 0);
  volBtn.classList.toggle("muted", muted);

  // === Ícone do Volume ===
  const updateVolumeIcon = (value) => {
    const v = Number(value);

    if (muted || v === 0) {
      volIcon.className = "ph ph-speaker-x";
    } else if (v <= 25) {
      volIcon.className = "ph ph-speaker-none";
    } else if (v <= 60) {
      volIcon.className = "ph ph-speaker-low";
    } else {
      volIcon.className = "ph ph-speaker-high";
    }
  }

  updateVolumeIcon(volRange.value);

  // === Atualização de faixa ===
  onTrackChange((t) => {
    titleEl.textContent = t?.name || "—";
    artistEl.textContent = t?.artist || "—";
    playIcon.className = t?.isPlaying ? "ph ph-pause" : "ph ph-play";
  });

  // === Atualização do progresso ===
  onPlayerStateChange((s) => {
    if (!s?.duration) return;
    progressFill.style.width = `${(s.position / s.duration) * 100}%`;
    playIcon.className = s.paused ? "ph ph-play" : "ph ph-pause";
  });

  prevBtn.addEventListener("click", previousTrack);
  nextBtn.addEventListener("click", nextTrack);
  document.getElementById("mini-play").addEventListener("click", playPause);

  // ====== VOLUME ======

  let clickTimer = null;

  // Clique simples = toggle popover
  volBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (clickTimer) return;

    clickTimer = setTimeout(() => {
      volPop.classList.toggle("show");
      clickTimer = null;
    }, 220);
  });

  // Duplo clique = mute/unmute
  volBtn.addEventListener("dblclick", (e) => {
    e.preventDefault();
    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }

    muted = !muted;

    if (muted) {
      volBtn.classList.add("muted");
      volRange.dataset.prev = volRange.value || "60";
      volRange.value = 0;
      setVolume(0);
      localStorage.setItem("pf_volume", "0");
    } else {
      volBtn.classList.remove("muted");
      const back = volRange.dataset.prev || localStorage.getItem("pf_volume") || "60";
      volRange.value = back;
      setVolume(back);
      localStorage.setItem("pf_volume", back);
    }

    updateVolumeIcon(volRange.value);
    volPop.classList.remove("show");
  });

  // Fecha popover ao clicar fora
  document.addEventListener("click", () => volPop.classList.remove("show"));
  volPop.addEventListener("click", (e) => e.stopPropagation());
  volRange.addEventListener("click", (e) => e.stopPropagation());

  // Slider controla volume
  volRange.addEventListener("input", (e) => {
    const v = e.target.value;
    setVolume(v);
    localStorage.setItem("pf_volume", v);

    muted = (+v === 0);
    volBtn.classList.toggle("muted", muted);
    if (!muted) volRange.dataset.prev = v;

    updateVolumeIcon(v);
  });

});
