// Controle global do Spotify Player

let spotifyPlayer = null;
let currentTrack = null;
let accessToken = localStorage.getItem("spotify_token");

const trackListeners = new Set();
const stateListeners = new Set();

// Inicializa o player principal
export function initSpotifyPlayer() {
  if (!accessToken) {
    console.warn("Token Spotify ausente.");
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

// Configuração do player e eventos
function setupPlayer() {
  spotifyPlayer = new Spotify.Player({
    name: "Pomodoro Focus Player",
    getOAuthToken: cb => cb(accessToken),
    volume: 0.5,
  });

  spotifyPlayer.addListener("ready", ({ device_id }) => {
    console.log("Spotify Player ativo:", device_id);
  });

  spotifyPlayer.addListener("player_state_changed", (state) => {
    if (!state || !state.track_window?.current_track) return;

    const { name, artists } = state.track_window.current_track;
    currentTrack = {
      name,
      artist: artists.map(a => a.name).join(", "),
      isPlaying: !state.paused,
    };

    trackListeners.forEach(cb => cb(currentTrack));
    stateListeners.forEach(cb => cb(state));
  });

  spotifyPlayer.connect();
}

// Eventos públicos
export function onTrackChange(callback) {
  trackListeners.add(callback);
  if (currentTrack) callback(currentTrack);
  return () => trackListeners.delete(callback);
}

export function onPlayerStateChange(callback) {
  stateListeners.add(callback);
  return () => stateListeners.delete(callback);
}

// Controles de reprodução
export function playPause() {
  spotifyPlayer?.togglePlay();
}

export function nextTrack() {
  spotifyPlayer?.nextTrack();
}

export function previousTrack() {
  spotifyPlayer?.previousTrack();
}
