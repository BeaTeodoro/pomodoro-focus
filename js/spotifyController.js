// js/spotifyController.js
let bc = null;
let lastTrack = null;
let lastState = null;
let lastBackClick = 0;

const trackListeners = new Set();
const stateListeners = new Set();

function channel() {
  if (!bc) {
    bc = new BroadcastChannel('pf-player');
    bc.onmessage = (ev) => {
      const { type, payload } = ev.data || {};

      if (type === 'core:state') {
        lastTrack = payload.current;

        trackListeners.forEach(cb => cb(lastTrack));

        lastState = {
          position: lastTrack.position,
          duration: lastTrack.duration,
          paused: !lastTrack.isPlaying
        };
        stateListeners.forEach(cb => cb(lastState));
      }
    };
  }
  return bc;
}

export function initSpotifyPlayer() {
  const c = channel();
  c.postMessage({ type: "core:hello" });
  c.postMessage({ type: "ctrl:transfer", payload: { play: false } });
}

export function onTrackChange(cb) {
  trackListeners.add(cb);
  if (lastTrack) cb(lastTrack);
  return () => trackListeners.delete(cb);
}

export function onPlayerStateChange(cb) {
  stateListeners.add(cb);
  if (lastState) cb(lastState);
  return () => stateListeners.delete(cb);
}

export function playPause() { channel().postMessage({ type: 'ctrl:playpause' }); }
export function nextTrack() { channel().postMessage({ type: 'ctrl:next' }); }

export function previousTrack() {
  const now = Date.now();
  const isDouble = (now - lastBackClick) < 300; // janela de duplo clique ~300ms
  lastBackClick = now;

  if (isDouble) {
    // 2 cliques: faixa anterior
    channel().postMessage({ type: 'ctrl:prev' });
  } else {
    // 1 clique: reinicia faixa
    seek(0);
  }
}

export function setVolume(value) {
  const vol = Math.max(0, Math.min(1, Number(value) / 100));
  try { localStorage.setItem('pf_volume', value); } catch { }
  channel().postMessage({ type: 'ctrl:volume', payload: { vol } });
}

export function seek(percent) {
  if (!lastTrack?.duration) return;
  const ms = (percent / 100) * lastTrack.duration;
  channel().postMessage({ type: 'ctrl:seek', payload: { ms } });
}
function seekPercent(p) { seek(p); }

// Web API extras
function getToken() { return localStorage.getItem('spotify_token'); }

export async function toggleLike(trackId) {
  if (!trackId) return false;
  const token = getToken();
  const chk = await fetch(`https://api.spotify.com/v1/me/tracks/contains?ids=${trackId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json());
  const liked = !!chk[0];
  await fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
    method: liked ? 'DELETE' : 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  return !liked;
}

export async function toggleShuffle() {
  const token = getToken();
  window.__pf_shuffle = !window.__pf_shuffle;
  await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${window.__pf_shuffle}`, {
    method: 'PUT', headers: { Authorization: `Bearer ${token}` }
  });
  return window.__pf_shuffle;
}

export async function toggleRepeat() {
  const token = getToken();
  const order = ['off', 'context', 'track'];
  const i = order.indexOf(window.__pf_repeat || 'off');
  const next = order[(i + 1) % order.length];
  await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${next}`, {
    method: 'PUT', headers: { Authorization: `Bearer ${token}` }
  });
  window.__pf_repeat = next;
  return next;
}

export function playContextOrUris(body) {
  channel().postMessage({ type: 'ctrl:play', payload: { body } });
}
