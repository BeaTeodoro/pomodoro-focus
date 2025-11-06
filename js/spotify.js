// js/spotify.js
import {
  initSpotifyPlayer,
  nextTrack,
  onPlayerStateChange,
  onTrackChange,
  playContextOrUris,
  playPause,
  previousTrack,
  seek,
  setVolume,
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

// LOGIN / TOKEN
function loginSpotify() {
  const url = `https://accounts.spotify.com/authorize?client_id=${clientId}`
    + `&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`
    + `&scope=${encodeURIComponent(scopes.join(' '))}&show_dialog=true`;
  location.href = url;
}

async function exchangeCodeForToken(code) {
  const r = await fetch(`${AUTH_PROXY}?code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`);
  const data = await r.json();
  if (!data.access_token) return alert('Erro ao autenticar Spotify.');

  localStorage.setItem('spotify_token', data.access_token);
  if (data.refresh_token) localStorage.setItem('spotify_refresh_token', data.refresh_token);

  await renderConnected(data.access_token);
  showPlayer();
  initSpotifyPlayer();
  loadRecommended();
  wireSearch();
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
    try { await renderConnected(token); }
    catch {
      token = await refreshSpotifyToken();
      if (token) await renderConnected(token);
    }
    showPlayer();
    initSpotifyPlayer();
    loadRecommended();
    wireSearch();
    return;
  }

  loadRecommended(true);
}

function logoutSpotify() {
  localStorage.removeItem('spotify_token');
  localStorage.removeItem('spotify_refresh_token');
  location.reload();
}

// UI
async function renderConnected(token) {
  const r = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error('token inválido');
  const data = await r.json();

  const el = document.querySelector('.spotify-connect');
  if (!el) return;

  el.innerHTML = `
    <div class="connected">
      <i class="ph ph-spotify-logo big-ok"></i>
      <h2>Conectado ao Spotify</h2>
      <p>Bem-vindo(a), <strong>${data.display_name || 'usuário'}</strong></p>
      <img src="${data.images?.[0]?.url || 'img/default-avatar.svg'}" class="profile-pic">
      <button id="spotify-logout-btn" class="btn outline strong">
        <i class="ph ph-sign-out"></i> <strong>Desconectar</strong>
      </button>
    </div>
  `;
  document.getElementById('spotify-logout-btn')?.addEventListener('click', logoutSpotify);

  wireMainControls();
}

function showPlayer() {
  const s = document.getElementById('player-section');
  if (s) s.style.display = 'block';
}

// CONTROLES PRINCIPAIS
function wireMainControls() {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const playBtn = document.getElementById('play-pause-btn');
  const likeBtn = document.getElementById('like-btn');
  const repBtn = document.getElementById('repeat-btn');
  const shfBtn = document.getElementById('shuffle-btn');
  const volBtn = document.getElementById('vol-btn');
  const volSlider = document.getElementById('volume-slider');
  const volIcon = volBtn.querySelector('i');

  const img = document.getElementById('track-image');
  const tt = document.getElementById('track-title');
  const ta = document.getElementById('track-artist');
  const fill = document.getElementById('progress-fill');
  const elapsed = document.getElementById('elapsed');
  const total = document.getElementById('duration');
  const playerStatus = document.getElementById('player-status');
  const bar = document.getElementById('progress-bar');

  bar.addEventListener('click', (e) => {
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    seek(pct * 100);
  });

  let lastTrackId = null;
  onTrackChange(t => lastTrackId = t?.id || null);

  likeBtn?.addEventListener('click', async () => {
    if (!lastTrackId) return;
    const liked = await toggleLike(lastTrackId);
    likeBtn.classList.toggle('active', liked);
    likeBtn.querySelector('i').className = liked ? 'ph ph-heart-fill' : 'ph ph-heart';
  });

  shfBtn?.addEventListener('click', async () => {
    const on = await toggleShuffle();
    shfBtn.classList.toggle('active', on);
  });

  repBtn?.addEventListener('click', async () => {
    const mode = await toggleRepeat();
    repBtn.dataset.mode = mode;
    repBtn.classList.toggle('active', mode !== 'off');
  });

  prevBtn.addEventListener('click', previousTrack);
  nextBtn.addEventListener('click', nextTrack);
  playBtn.addEventListener('click', playPause);

  let muted = (Number(volSlider.value) === 0);

  const updateVolumeIcon = (value) => {
    const v = Number(value);
    if (muted || v === 0) volIcon.className = "ph ph-speaker-x";
    else if (v <= 25) volIcon.className = "ph ph-speaker-none";
    else if (v <= 60) volIcon.className = "ph ph-speaker-low";
    else volIcon.className = "ph ph-speaker-high";
  };

  updateVolumeIcon(volSlider.value);

  volSlider.addEventListener('input', e => {
    const v = e.target.value;
    setVolume(v);
    localStorage.setItem('pf_volume', v);
    muted = (v == 0);
    updateVolumeIcon(v);
  });

  volBtn.addEventListener('dblclick', () => {
    muted = !muted;
    if (muted) {
      volSlider.dataset.prev = volSlider.value;
      volSlider.value = 0;
      setVolume(0);
    } else {
      const b = volSlider.dataset.prev || 60;
      volSlider.value = b;
      setVolume(b);
    }
    updateVolumeIcon(volSlider.value);
  });

  onTrackChange((t) => {
    img.src = t.albumImage || 'img/default-avatar.svg';
    tt.textContent = t.name || '—';
    ta.textContent = t.artist || '—';
    playerStatus.textContent = t.isPlaying ? 'Tocando agora' : 'Pausado';
  });

  onPlayerStateChange((s) => {
    if (!s?.duration) return;
    fill.style.width = `${(s.position / s.duration) * 100}%`;
    elapsed.textContent = fmt(s.position);
    total.textContent = fmt(s.duration);
    playerStatus.textContent = s.paused ? 'Pausado' : 'Tocando agora';
  });
}

function fmt(ms = 0) {
  const s = Math.floor((ms || 0) / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

// RECOMENDADOS
const recItems = [
  { kind: 'playlist', id: '59d0fMsUB0IUcWShIJPblE', name: 'Calming Study' },
  { kind: 'album', id: '0Mhs1rtpOqQ5IR2xKOr4W4', name: 'For Coding' },
  { kind: 'playlist', id: '5z9CdKSqJjAt30rhTlRDZX', name: 'Concentration & Study' },
  { kind: 'album', id: '71HsJBoL9ZaegMEArmYF66', name: 'Deep Work' },
];

async function loadRecommended() {
  const ul = document.getElementById('recommended-container');
  if (!ul) return;

  const token = localStorage.getItem('spotify_token');
  ul.innerHTML = '';

  for (const r of recItems) {
    const endpoint = r.kind === 'playlist'
      ? `https://api.spotify.com/v1/playlists/${r.id}`
      : `https://api.spotify.com/v1/albums/${r.id}`;

    const res = await fetch(endpoint, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const data = await res.json();

    const img = data.images?.[0]?.url || 'img/default-avatar.svg';
    const { uri } = data;

    const li = document.createElement('li');
    li.className = 'rec-item';
    li.innerHTML = `
      <img src="${img}">
      <div class="rec-meta">
        <span class="rec-title">${r.name}</span>
        <button class="btn outline play-item"><i class="ph ph-play"></i></button>
      </div>
    `;
    li.querySelector('.play-item').addEventListener('click', () => {
      if (!token) loginSpotify();
      else playContextOrUris({ context_uri: uri });
    });

    ul.appendChild(li);
  }
}

// === BUSCA ===
function wireSearch() {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (!input || !results) return;

  // Botão X de limpar
  let btnClear = document.getElementById("clear-search");
  if (!btnClear) {
    btnClear = document.createElement("button");
    btnClear.id = "clear-search";
    btnClear.textContent = "×";
    btnClear.style.cssText = `
    margin-left:6px;
    cursor:pointer;
    font-size:1.3rem;
    background:none;
    border:none;
    color:var(--text);
  `;
    input.parentElement.appendChild(btnClear);
  }

  btnClear.addEventListener("click", () => {
    input.value = "";
    results.innerHTML = "";
    results.classList.remove("show"); // 👈 FECHA A CAIXA DE RESULTADOS
    input.focus();
  });

  // === Função robusta para pegar imagem sem erro ===
  function getImg(obj) {
    // Imagem de faixas (tracks)
    if (obj?.album?.images?.length) {
      return obj.album.images[0].url;
    }

    // Imagem de playlists ou álbuns
    if (obj?.images?.length) {
      return obj.images[0].url;
    }

    // Fallback caso o item realmente não tenha capa
    return 'img/default-avatar.svg';
  }

  let delay;
  async function perform() {
    const q = input.value.trim();
    if (!q) return (results.innerHTML = '');

    const token = localStorage.getItem('spotify_token');
    if (!token) return;

    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track,playlist,album&limit=14`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();
    const blocks = [];

    // TRACKS
    (data.tracks?.items || []).forEach(t => {
      if (!t?.uri) return; // ⬅️ Pula item sem URI
      blocks.push(`
        <li class="rec-item" data-uri="${t.uri}">
          <img src="${getImg(t)}">
          <div class="rec-meta">
            <span class="rec-title">${t.name} — ${t.artists.map(a => a.name).join(', ')}</span>
            <button class="btn outline play-item"><i class="ph ph-play"></i></button>
          </div>
        </li>
      `);
    });

    // PLAYLISTS
    (data.playlists?.items || []).forEach(p => {
      if (!p?.uri) return; // ⬅️ Pula sem URI
      blocks.push(`
        <li class="rec-item" data-context="${p.uri}">
          <img src="${getImg(p)}">
          <div class="rec-meta"><span class="rec-title">${p.name}</span>
            <button class="btn outline play-item"><i class="ph ph-play"></i></button>
          </div>
        </li>
      `);
    });

    // ÁLBUNS
    (data.albums?.items || []).forEach(a => {
      if (!a?.uri) return; // ⬅️ Pula sem URI
      blocks.push(`
        <li class="rec-item" data-context="${a.uri}">
          <img src="${getImg(a)}">
          <div class="rec-meta">
            <span class="rec-title">${a.name} — ${a.artists.map(x => x.name).join(', ')}</span>
            <button class="btn outline play-item"><i class="ph ph-play"></i></button>
          </div>
        </li>
      `);
    });

    results.innerHTML = blocks.join('');
    results.classList.toggle('show', blocks.length > 0);

  }

  input.addEventListener('input', () => {
    clearTimeout(delay);
    delay = setTimeout(perform, 350);
  });

  // tocar ao clicar
  results.addEventListener('click', (e) => {
    const li = e.target.closest('.rec-item');
    if (!li) return;

    const { uri, context } = li.dataset;
    playContextOrUris(uri ? { uris: [uri] } : { context_uri: context });

    results.innerHTML = '';
    input.value = '';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('spotify-login-btn')?.addEventListener('click', loginSpotify);
  checkAuth();
});
