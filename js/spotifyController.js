// js/spotifyController.js
// Camada de controle: envia comandos ao player-core e recebe estado.

let bc = null;
let coreWin = null;
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
        stateListeners.forEach(cb => cb({
          position: lastTrack.position,
          duration: lastTrack.duration,
          paused: !lastTrack.isPlaying
        }));
      } else if (type === 'core:hello:ack') {
        // já recebeu ack do core
      } else if (type === 'core:no-token') {
        // sem token
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

// listeners
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

// controles básicos
export function playPause() {
  channel().postMessage({ type: 'ctrl:playpause' });
}
export function nextTrack() {
  channel().postMessage({ type: 'ctrl:next' });
}
export function previousTrack() {
  // Dois cliques seguidos ou se já tocou alguns segundos → volta ao início.
  const now = Date.now();
  if ((lastTrack?.position ?? 0) > 3000 || now - lastBackClick < 350) {
    // seek to 0
    seekPercent(0);
  } else {
    channel().postMessage({ type: 'ctrl:prev' });
  }
  lastBackClick = now;
}

export function setVolume(value) {
  const vol = Math.max(0, Math.min(1, Number(value) / 100));
  try { localStorage.setItem('pf_volume', value); } catch { }
  channel().postMessage({ type: 'ctrl:volume', payload: { vol } });
}


export function seek(percent) {
  // percent 0–100
  if (!lastTrack?.duration) return;
  const ms = (percent / 100) * lastTrack.duration;
  channel().postMessage({ type: 'ctrl:seek', payload: { ms } });
}
function seekPercent(p) { seek(p); }

// Ações Web API que não dependem do SDK
function getToken() {
  try { return localStorage.getItem('spotify_token'); } catch { return null; }
}

// like / repeat / shuffle via Web API
export async function toggleLike(trackId) {
  const token = getToken();
  if (!token || !trackId) return false;

  // checa se já está salva
  const chk = await fetch(`https://api.spotify.com/v1/me/tracks/contains?ids=${trackId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json()).catch(() => [false]);

  const liked = !!chk?.[0];
  const method = liked ? 'DELETE' : 'PUT';

  const res = await fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
    method,
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.ok ? !liked : liked; // retorna novo estado (true = curtida ativa)
}

export async function toggleShuffle() {
  const token = getToken();
  if (!token) return false;

  // tenta inverter o estado perguntando player
  // sem endpoint de leitura direto, alterna para true/false por clique
  // aqui, alternamos para true, depois a página alterna ícone; num 2º clique, false
  // Para simplificar: alterna sempre true/false com um "flip" em memória:
  window.__pf_shuffle = !window.__pf_shuffle;
  const res = await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${window.__pf_shuffle}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.ok ? window.__pf_shuffle : !window.__pf_shuffle;
}

export async function toggleRepeat() {
  const token = getToken();
  if (!token) return 'off';
  // alterna entre off → context → track → off (simples)
  const order = ['off', 'context', 'track'];
  const i = order.indexOf(window.__pf_repeat || 'off');
  const next = order[(i + 1) % order.length];

  const res = await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${next}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.ok) {
    window.__pf_repeat = next;
    return next;
  }
  return window.__pf_repeat || 'off';
}

// tocar algo específico a partir da página
export function playContextOrUris(body) {
  channel().postMessage({ type: 'ctrl:play', payload: { body } });
}
