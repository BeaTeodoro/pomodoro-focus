let accessToken = null;
let playerInstance = null;
let trackChangeListeners = [];

// Define token e player
export function setAccessToken(token, player) {
  accessToken = token;
  playerInstance = player;
  observePlayerState();
}

// Observa alterações no player
function observePlayerState() {
  if (!playerInstance) return;
  playerInstance.addListener("player_state_changed", state => {
    if (!state || !state.track_window) return;
    const current = state.track_window.current_track;
    const track = {
      name: current.name,
      artist: current.artists.map(a => a.name).join(", "),
      albumImage: current.album.images[0]?.url || null,
      isPlaying: !state.paused,
    };
    trackChangeListeners.forEach(cb => cb(track));
  });
}

// Controle
export async function play() {
  if (!playerInstance) return;
  await playerInstance.resume();
}

export async function pause() {
  if (!playerInstance) return;
  await playerInstance.pause();
}

export async function next() {
  if (!playerInstance) return;
  await playerInstance.nextTrack();
}

export async function previous() {
  if (!playerInstance) return;
  await playerInstance.previousTrack();
}

// Listener de faixas
export function onTrackChange(callback) {
  trackChangeListeners.push(callback);
}
