let spotifyPlayer = null;
let currentTrack = null;
let accessToken = localStorage.getItem("spotify_token");

const trackListeners = new Set();
const stateListeners = new Set();

export function initSpotifyPlayer() {
  accessToken = localStorage.getItem("spotify_token");
  if (!accessToken) return;
  if (spotifyPlayer) return;

  if (!window.Spotify) {
    console.error("SDK Spotify ainda não carregado!");
    return;
  }

  spotifyPlayer = new Spotify.Player({
    name: "Pomodoro Focus Player",
    getOAuthToken: cb => cb(accessToken),
    volume: 0.5,
  });

  spotifyPlayer.addListener("ready", ({ device_id }) => {
    console.log("✅ Player pronto:", device_id);
    document.getElementById("player-status").textContent = "Player conectado ao Spotify!";
  });

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

  spotifyPlayer.connect();
}

export function onTrackChange(callback) {
  trackListeners.add(callback);
  if (currentTrack) callback(currentTrack);
  return () => trackListeners.delete(callback);
}

export function onPlayerStateChange(callback) {
  stateListeners.add(callback);
  return () => stateListeners.delete(callback);
}

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
