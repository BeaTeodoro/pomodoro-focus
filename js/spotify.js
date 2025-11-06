// js/spotify.js
import {
  initSpotifyPlayer,
  nextTrack,
  onPlayerStateChange,
  onTrackChange,
  playContextOrUris,
  playPause,
  previousTrack, seek, setVolume,
  toggleLike, toggleRepeat, toggleShuffle
} from './spotifyController.js';

const clientId = '5b160d486adf43b490858c6bde7f521b';
const isLocal = ['127.0.0.1', 'localhost'].some(h => location.hostname.includes(h));
const redirectUri = isLocal ? 'http://127.0.0.1:5500/musica.html'
  : 'https://pomodoro-focus-bt.vercel.app/musica.html';
const AUTH_PROXY = 'https://pomodoro-focus-bt.vercel.app/api/token';

const scopes = [
  'user-read-private', 'user-read-email',
  'user-read-playback-state', 'user-modify-playback-state', 'streaming',
  'playlist-read-private', 'playlist-read-collaborative',
  'user-library-read', 'user-library-modify'
];

// ======================
// LOGIN + TOKEN
// ======================
function loginSpotify() {
  const url = `https://accounts.spotify.com/authorize?client_id=${clientId}`
    + `&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`
    + `&scope=${encodeURIComponent(scopes.join(' '))}&show_dialog=true`;
  location.href = url;
}

async function exchangeCodeForToken(code) {
  const r = await fetch(`${AUTH_PROXY}?code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`);
  const data = await r.json();
  if (!data.access_token) { alert('Erro ao autenticar Spotify.'); return; }

  localStorage.setItem('spotify_token', data.access_token);
  if (data.refresh_token) localStorage.setItem('spotify_refresh_token', data.refresh_token);

  await renderConnected(data.access_token);
  showPlayer();
  initSpotifyPlayer();
  loadRecommended();
  wireSearch(); // garante busca habilitada
}

async function refreshSpotifyToken() {
  const rt = localStorage.getItem('spotify_refresh_token');
  if (!rt) return null;
  const r = await fetch(`${AUTH_PROXY}?refresh_token=${rt}&redirect_uri=${encodeURIComponent(redirectUri)}`);
  const data = await r.json();
  if (data.access_token) {
    localStorage.setItem('spotify_token', data.access_token);
    return data.access_token;
  }
  logoutSpotify();
  return null;
}

async function checkAuth() {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  let token = localStorage.getItem('spotify_token');

  if (code) {
    await exchangeCodeForToken(code);
    history.replaceState({}, '', redirectUri);
    return;
  }

  if (token) {
    try {
      await renderConnected(token);
    } catch {
      token = await refreshSpotifyToken();
      if (token) await renderConnected(token);
    }
    showPlayer();
    initSpotifyPlayer();
    loadRecommended();
    wireSearch();
  } else {
    // Sem login: ainda mostramos recomendações clicáveis que pedem login
    loadRecommended(true);
  }
}

function logoutSpotify() {
  localStorage.removeItem('spotify_token');
  localStorage.removeItem('spotify_refresh_token');
  location.reload();
}

// ======================
// UI: Conectado + Player
// ======================
async function renderConnected(token) {
  const r = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error('token inválido');
  const data = await r.json();

  const el = document.querySelector('.spotify-connect');
  if (!el) return;

  el.innerHTML = `
    <div class="connected">
      <i class="ph ph-spotify-logo big-ok" aria-hidden="true"></i>
      <h2>Conectado ao Spotify</h2>
      <p>Bem-vindo(a), <strong>${data.display_name || 'usuário'}</strong></p>
      <img src="${data.images?.[0]?.url || 'img/default-avatar.svg'}" alt="Perfil" class="profile-pic">
      <button id="spotify-logout-btn" class="btn outline strong">
        <i class="ph ph-sign-out"></i> <strong>Desconectar</strong>
      </button>
    </div>
  `;
  document.getElementById('spotify-logout-btn')?.addEventListener('click', logoutSpotify);

  wireMainControls();
  const elapsed = document.getElementById('elapsed');
  const total = document.getElementById('duration');
  const playerStatus = document.getElementById('player-status');

  // liga botões do player principal
}

function showPlayer() {
  const s = document.getElementById('player-section');
  if (s) s.style.display = 'block';
}

// ======================
// PLAYER: Controles e estado
// ======================
function wireMainControls() {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const playBtn = document.getElementById('play-pause-btn');

  const likeBtn = document.getElementById('like-btn');
  const repBtn = document.getElementById('repeat-btn');
  const shfBtn = document.getElementById('shuffle-btn');

  const volBtn = document.getElementById('vol-btn'); // se existir no HTML
  const volSlider = document.getElementById('volume-slider');
  // === RESTAURAR VOLUME SALVO ===
  const savedVol = localStorage.getItem("pf_volume");
  if (savedVol !== null && volSlider) {
    volSlider.value = savedVol;
    setVolume(savedVol);
  }

  const img = document.getElementById('track-image');
  const tt = document.getElementById('track-title');
  const ta = document.getElementById('track-artist');

  const bar = document.getElementById('progress-bar');
  const fill = document.getElementById('progress-fill');
  const elapsed = document.getElementById('elapsed');
  const total = document.getElementById('duration');

  prevBtn?.addEventListener('click', previousTrack);
  nextBtn?.addEventListener('click', nextTrack);
  playBtn?.addEventListener('click', playPause);

  // like / shuffle / repeat
  let lastTrackId = null;
  onTrackChange(t => {
    lastTrackId = t?.id || null;
  });

  likeBtn?.addEventListener("click", async () => {
    if (!lastTrackId) return;

    const liked = await toggleLike(lastTrackId);

    likeBtn.classList.toggle("active", liked);

    const icon = likeBtn.querySelector("i");
    if (icon) {
      icon.className = liked ? "ph ph-heart-fill" : "ph ph-heart";
    }
  });

  shfBtn?.addEventListener('click', async () => {
    const on = await toggleShuffle();
    shfBtn.classList.toggle('active', on);
  });

  repBtn?.addEventListener('click', async () => {
    const mode = await toggleRepeat();
    repBtn.dataset.mode = mode;
    repBtn.classList.toggle('active', mode !== 'off');
    // você pode trocar ícone conforme mode (off/context/track) se quiser
  });

  // volume + mute
  let muted = false;
  volBtn?.addEventListener('click', () => {
    muted = !muted;
    if (muted) {
      volBtn.classList.add('muted');
      volBtn.dataset.prev = volSlider?.value || '70';
      if (volSlider) volSlider.value = '0';
      setVolume(0);
    } else {
      volBtn.classList.remove('muted');
      const back = volBtn.dataset.prev || '70';
      if (volSlider) volSlider.value = back;
      setVolume(back);
    }
  });
  volSlider?.addEventListener('input', e => setVolume(e.target.value));

  // Atualização de UI por estado
  onTrackChange((t) => {
    if (img) { img.classList.add('updating'); img.src = t.albumImage || 'img/default-avatar.svg'; img.onload = () => img.classList.remove('updating'); }
    if (tt) tt.textContent = t.name || '—';
    if (ta) ta.textContent = t.artist || '—';

    const p = t.duration ? (t.position / t.duration) * 100 : 0;
    if (fill) fill.style.width = `${p}%`;
    if (elapsed) elapsed.textContent = fmt(t.position);
    if (total) total.textContent = fmt(t.duration);

    const icon = playBtn?.querySelector('i');
    if (icon) icon.className = t.isPlaying ? 'ph ph-pause' : 'ph ph-play';

    if (playerStatus) playerStatus.textContent = "Pronto para tocar";
    if (playerStatus) playerStatus.textContent = t.isPlaying ? "Tocando agora" : "Pausado";
  });

  onPlayerStateChange((s) => {
    if (!s?.duration) return;
    const pct = (s.position / s.duration) * 100;
    fill.style.width = `${pct}%`;
    elapsed.textContent = fmt(s.position);
    total.textContent = fmt(s.duration);
    const icon = playBtn?.querySelector('i');
    if (icon) icon.className = s.paused ? 'ph ph-play' : 'ph ph-pause';
    if (playerStatus) playerStatus.textContent = s.paused ? "Pausado" : "Tocando agora";
  });


  // Seek arrastável e clique
  let dragging = false;
  const pctFromEvent = (e) => {
    const rect = bar.getBoundingClientRect();
    const clientX = (e.touches && e.touches[0]?.clientX) || e.clientX;
    const x = Math.min(Math.max(0, clientX - rect.left), rect.width);
    return (x / rect.width) * 100;
  };
  bar?.addEventListener('mousedown', (e) => { dragging = true; seek(pctFromEvent(e)); });
  window.addEventListener('mousemove', (e) => { if (dragging) seek(pctFromEvent(e)); });
  window.addEventListener('mouseup', () => { dragging = false; });
  bar?.addEventListener('touchstart', (e) => { dragging = true; seek(pctFromEvent(e)); }, { passive: true });
  window.addEventListener('touchmove', (e) => { if (dragging) seek(pctFromEvent(e)); }, { passive: true });
  window.addEventListener('touchend', () => { dragging = false; });
}

function fmt(ms = 0) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

// ======================
// RECOMENDAÇÕES (mantidas)
const recItems = [
  { kind: 'playlist', id: '59d0fMsUB0IUcWShIJPblE', name: 'Focus Flow' },
  { kind: 'album', id: '0Mhs1rtpOqQ5IR2xKOr4W4', name: 'Brain Food' },
  { kind: 'playlist', id: '5z9CdKSqJjAt30rhTlRDZX', name: 'Deep Work' },
  { kind: 'album', id: '71HsJBoL9ZaegMEArmYF66', name: 'Lo-Fi Jazz Study' },
];

async function loadRecommended(readOnly = false) {
  const ul = document.getElementById('recommended-container');
  if (!ul) return;

  const token = localStorage.getItem('spotify_token');
  ul.innerHTML = '';
  for (const r of recItems) {
    const url = r.kind === 'playlist'
      ? `https://api.spotify.com/v1/playlists/${r.id}`
      : `https://api.spotify.com/v1/albums/${r.id}`;
    try {
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      const img = data.images?.[0]?.url || data.images?.[1]?.url || data.images?.[2]?.url || 'img/default-avatar.svg';
      const { uri } = data;

      const li = document.createElement('li');
      li.className = 'rec-item';
      li.innerHTML = `
        <img src="${img}" alt="">
        <div class="rec-meta">
          <span class="rec-title">${r.name}</span>
          <button class="btn outline play-item"><i class="ph ph-play"></i></button>
        </div>
      `;
      li.querySelector('.play-item')?.addEventListener('click', async () => {
        if (!token) { loginSpotify(); return; }
        playContextOrUris({ context_uri: uri });
      });
      ul.appendChild(li);
    } catch { }
  }
}

// ======================
// BUSCA (B2) fixa e simples
function wireSearch() {
  const card = document.getElementById('search-card');
  const input = document.getElementById('search-input');
  const btn = document.getElementById('search-btn');
  const results = document.getElementById('search-results');
  if (!card || !input || !btn || !results) return;

  card.style.display = 'block';

  let delay;
  const perform = async () => {
    const q = input.value.trim();

    if (!q) {
      results.innerHTML = '';
      return;
    }

    const token = localStorage.getItem('spotify_token');
    if (!token) return;

    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track,playlist,album&limit=12`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();

    const blocks = [];

    (data.tracks?.items || []).forEach(t => {
      const img = t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || 'img/default-avatar.svg';
      blocks.push(`
        <li class="rec-item" data-uri="${t.uri}">
          <img src="${img}" alt="">
          <div class="rec-meta">
            <span class="rec-title">${t.name} — ${t.artists.map(a => a.name).join(', ')}</span>
            <button class="btn outline play-item"><i class="ph ph-play"></i></button>
          </div>
        </li>`);
    });

    (data.playlists?.items || []).forEach(p => {
      const img = p.images?.[0]?.url || 'img/default-avatar.svg';
      blocks.push(`
        <li class="rec-item" data-context="${p.uri}">
          <img src="${img}" alt="">
          <div class="rec-meta">
            <span class="rec-title">${p.name}</span>
            <button class="btn outline play-item"><i class="ph ph-play"></i></button>
          </div>
        </li>`);
    });

    (data.albums?.items || []).forEach(a => {
      const img = a.images?.[0]?.url || 'img/default-avatar.svg';
      blocks.push(`
        <li class="rec-item" data-context="${a.uri}">
          <img src="${img}" alt="">
          <div class="rec-meta">
            <span class="rec-title">${a.name} — ${a.artists.map(x => x.name).join(', ')}</span>
            <button class="btn outline play-item"><i class="ph ph-play"></i></button>
          </div>
        </li>`);
    });

    results.innerHTML = blocks.join('');
  }

  btn.onclick = perform;
  input.addEventListener('input', () => { clearTimeout(delay); delay = setTimeout(perform, 350); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') perform(); if (e.key === 'Escape') { results.innerHTML = ''; input.value = ''; } });

  results.addEventListener('click', async (e) => {
    const li = e.target.closest('li.rec-item'); if (!li) return;
    const { uri, context } = li.dataset;
    const body = uri ? { uris: [uri] } : { context_uri: context };
    playContextOrUris(body);
    // limpar após selecionar
    results.innerHTML = '';
    input.value = '';
  });
}

// ======================
// Boot
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('spotify-login-btn')?.addEventListener('click', loginSpotify);
  checkAuth();

  // Se clicarem nas recomendações sem login, pede login
  document.getElementById('recommended-container')?.addEventListener('click', (e) => {
    const li = e.target.closest('li.rec-item'); if (!li) return;
    const token = localStorage.getItem('spotify_token');
    if (!token) loginSpotify();
  });
});
