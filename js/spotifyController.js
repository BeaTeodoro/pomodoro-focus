// ===============================
// CONTROLE GLOBAL DO SPOTIFY PLAYER
// ===============================

let spotifyPlayer = null;
let currentTrack = null;
let accessToken = localStorage.getItem("spotify_token");

const trackListeners = new Set();
const stateListeners = new Set();

export function initSpotifyPlayer() {
  accessToken = localStorage.getItem("spotify_token");
  if (!accessToken) {
    console.warn("Spotify offline: nenhum token encontrado.");
    return;
  }

  if (spotifyPlayer) return;

  if (!window.Spotify) {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.onload = setupPlayer;
    document.body.appendChild(script);
  } else {
    setupPlayer();
  }
}

function setupPlayer() {
  if (!accessToken) return;

  spotifyPlayer = new Spotify.Player({
    name: "Pomodoro Focus Player",
    getOAuthToken: cb => cb(accessToken),
    volume: 0.5,
  });

  spotifyPlayer.addListener("ready", ({ device_id }) => {
    console.log("🎵 Spotify Player pronto:", device_id);
  });

  spotifyPlayer.addListener("player_state_changed", (state) => {
    if (!state || !state.track_window?.current_track) return;

    const { name, artists, album } = state.track_window.current_track;

    currentTrack = {
      name,
      artist: artists.map(a => a.name).join(", "),
      albumImage: album?.images?.[0]?.url || "img/default-avatar.svg",
      isPlaying: !state.paused,
    };

    // Notifica todos os ouvintes (páginas que estão escutando)
    trackListeners.forEach(cb => cb(currentTrack));
    stateListeners.forEach(cb => cb(state));
  });

  spotifyPlayer.connect();
}

// Listeners
export function onTrackChange(callback) {
  trackListeners.add(callback);
  if (currentTrack) callback(currentTrack);
  return () => trackListeners.delete(callback);
}

export function onPlayerStateChange(callback) {
  stateListeners.add(callback);
  return () => stateListeners.delete(callback);
}

// Controles
export function playPause() {
  spotifyPlayer?.togglePlay();
}
export function nextTrack() {
  spotifyPlayer?.nextTrack();
}
export function previousTrack() {
  spotifyPlayer?.previousTrack();
}
