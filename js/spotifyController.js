// Controle do Spotify Player
let spotifyPlayer = null;
let currentTrack = null;
let accessToken = localStorage.getItem("spotify_token");

const trackListeners = new Set();
const stateListeners = new Set();

// Inicializa player
export function initSpotifyPlayer() {
  accessToken = localStorage.getItem("spotify_token");
  if (!accessToken) return;

  if (spotifyPlayer) return; // evita recriar o player

  if (!window.Spotify) {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.onload = setupPlayer;
    document.body.appendChild(script);
  } else {
    setupPlayer();
  }
}

// Configura player
function setupPlayer() {
  if (!accessToken || spotifyPlayer) return;

  spotifyPlayer = new Spotify.Player({
    name: "Pomodoro Focus Player",
    getOAuthToken: cb => cb(accessToken),
    volume: 0.5,
  });

  spotifyPlayer.addListener("ready", ({ device_id }) => {
    console.log("Player pronto:", device_id);
  });

  spotifyPlayer.addListener("not_ready", () => {
    console.warn("Player desconectado");
  });

  spotifyPlayer.addListener("player_state_changed", (state) => {
    if (!state || !state.track_window?.current_track) return;

    const track = state.track_window.current_track;
    currentTrack = {
      name: track.name,
      artist: track.artists.map(a => a.name).join(", "),
      albumImage: track.album?.images?.[0]?.url || "img/default-avatar.svg",
      isPlaying: !state.paused,
    };

    trackListeners.forEach(cb => cb(currentTrack));
    stateListeners.forEach(cb => cb(state));
  });

  spotifyPlayer.connect();
}

// Listener de faixa
export function onTrackChange(callback) {
  trackListeners.add(callback);
  if (currentTrack) callback(currentTrack);
  return () => trackListeners.delete(callback);
}

// Listener de estado
export function onPlayerStateChange(callback) {
  stateListeners.add(callback);
  return () => stateListeners.delete(callback);
}

// Controles básicos
export function playPause() {
  if (!spotifyPlayer) return;
  spotifyPlayer.togglePlay();
}

export function nextTrack() {
  if (!spotifyPlayer) return;
  spotifyPlayer.nextTrack();
}

export function previousTrack() {
  if (!spotifyPlayer) return;
  spotifyPlayer.previousTrack();
}
