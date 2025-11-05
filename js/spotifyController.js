// Controle do Spotify Player

let spotifyPlayer = null;
let currentTrack = null;
let accessToken = localStorage.getItem("spotify_token");

const trackListeners = new Set();
const stateListeners = new Set();

// Inicializa o player Spotify
export function initSpotifyPlayer() {
  accessToken = localStorage.getItem("spotify_token");
  if (!accessToken) {
    console.warn("⚠️ Nenhum token Spotify encontrado.");
    return;
  }

  // Evita criar múltiplos players
  if (spotifyPlayer) return;

  // Aguarda o SDK carregar se ainda não estiver pronto
  if (!window.Spotify) {
    console.log("⌛ Aguardando SDK Spotify carregar...");
    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log("🎧 SDK Spotify pronto — inicializando player...");
      setupPlayer();
    };
    return;
  }

  setupPlayer();
}

// Configuração do player
function setupPlayer() {
  spotifyPlayer = new Spotify.Player({
    name: "Pomodoro Focus Player",
    getOAuthToken: cb => cb(accessToken),
    volume: 0.5,
  });

  // Quando o player estiver pronto
  spotifyPlayer.addListener("ready", ({ device_id }) => {
    console.log("✅ Player pronto:", device_id);
    const status = document.getElementById("player-status");
    if (status) status.textContent = "Player conectado ao Spotify!";
  });

  // Quando o player for desconectado
  spotifyPlayer.addListener("not_ready", ({ device_id }) => {
    console.warn("⚠️ Player desconectado:", device_id);
    const status = document.getElementById("player-status");
    if (status) status.textContent = "Player desconectado. Recarregue a página.";
  });

  // Estado de reprodução alterado
  spotifyPlayer.addListener("player_state_changed", (state) => {
    if (!state?.track_window?.current_track) return;

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

  spotifyPlayer.connect().then(success => {
    if (success) console.log("🎵 Conexão com Spotify estabelecida.");
    else console.error("❌ Falha ao conectar com Spotify Player.");
  });
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
