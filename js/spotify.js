// SPOTIFY - Autenticação e inicialização
import { initSpotifyPlayer } from "./spotifyController.js";

const clientId = "5b160d486adf43b490858c6bde7f521b";

// Detecta ambiente
const isLocal = ["127.0.0.1", "localhost"].some(h => window.location.hostname.includes(h));
const redirectUri = isLocal
  ? "http://127.0.0.1:5500/musica.html"
  : "https://pomodoro-focus-bt.vercel.app/musica.html";

// Escopos de permissão
const scopes = [
  "user-read-private",
  "user-read-email",
  "user-read-playback-state",
  "user-modify-playback-state",
  "streaming",
  "playlist-read-private",
  "playlist-read-collaborative",
];

// Proxy no deploy (Vercel)
const AUTH_PROXY = "https://pomodoro-focus-bt.vercel.app/api/token";

// Login Spotify
function loginSpotify() {
  const authUrl =
    `https://accounts.spotify.com/authorize?client_id=${clientId}` +
    `&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scopes.join(" "))}` +
    `&show_dialog=true`;
  window.location.href = authUrl;
}

// Troca código por token
async function exchangeCodeForToken(code) {
  try {
    const res = await fetch(`${AUTH_PROXY}?code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`);
    const text = await res.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      console.error("Resposta inválida do servidor:", text);
      alert("Erro na comunicação com o Spotify.");
      return;
    }

    if (!data.access_token) {
      console.error("Erro ao trocar código:", data);
      alert("Falha na autenticação com o Spotify.");
      return;
    }

    localStorage.setItem("spotify_token", data.access_token);
    if (data.refresh_token) localStorage.setItem("spotify_refresh_token", data.refresh_token);

    renderSpotifyConnected(data.access_token);
    initSpotifyPlayer();

    // Exibe o player após autenticação
    const playerSection = document.getElementById("player-section");
    if (playerSection) {
      playerSection.style.display = "block";
      console.log("🎵 Player exibido após login");
    }
  } catch (err) {
    console.error("Erro ao obter token:", err);
    alert("Erro ao conectar ao Spotify.");
  }
}

// Atualiza token expirado
async function refreshSpotifyToken() {
  const refresh = localStorage.getItem("spotify_refresh_token");
  if (!refresh) return;

  try {
    const res = await fetch(`${AUTH_PROXY}?refresh_token=${refresh}&redirect_uri=${encodeURIComponent(redirectUri)}`);
    const data = await res.json();

    if (data.access_token) {
      localStorage.setItem("spotify_token", data.access_token);
      return data.access_token;
    }
  } catch (err) {
    console.warn("Erro ao atualizar token:", err);
  }
  logoutSpotify();
}

// Verifica autenticação
async function checkSpotifyAuth() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  let token = localStorage.getItem("spotify_token");

  if (code) {
    exchangeCodeForToken(code);
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (token) {
    const valid = await validateSpotifyToken(token);
    if (!valid) token = await refreshSpotifyToken();

    if (token) {
      renderSpotifyConnected(token);
      initSpotifyPlayer();

      // Garante que o player fique visível após reload
      const playerSection = document.getElementById("player-section");
      if (playerSection) {
        playerSection.style.display = "block";
        console.log("🎵 Player exibido (usuário já autenticado)");
      }
    }
  }
}

// Valida token
async function validateSpotifyToken(token) {
  try {
    const res = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Mostra usuário conectado
async function renderSpotifyConnected(token) {
  const section = document.querySelector(".spotify-connect");
  if (!section) return;

  try {
    const res = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      console.warn("Token expirado, limpando sessão.");
      logoutSpotify();
      return;
    }

    const data = await res.json();

    section.innerHTML = `
      <div class="connected" style="text-align:center;">
        <i class="ph ph-check-circle" style="font-size:3rem; color:#1db954;"></i>
        <h2>Conectado ao Spotify</h2>
        <p>Bem-vindo(a), <strong>${data.display_name || "usuário"}</strong></p>
        <img
          src="${data.images?.[0]?.url || "img/default-avatar.svg"}"
          alt="Foto de perfil"
          style="width:100px;height:100px;border-radius:50%;border:3px solid #1db954;margin:1rem auto;">
        <button id="spotify-logout-btn" class="btn outline">
          <i class="ph ph-sign-out"></i> Desconectar
        </button>
      </div>
    `;

    document.getElementById("spotify-logout-btn").addEventListener("click", logoutSpotify);

    // Exibe o player assim que o usuário estiver conectado
    const playerSection = document.getElementById("player-section");
    if (playerSection) {
      playerSection.style.display = "block";
      console.log("🎵 Player exibido (usuário conectado)");
    }

  } catch (err) {
    console.error("Erro ao conectar ao Spotify:", err);
  }
}

// Logout
function logoutSpotify() {
  localStorage.removeItem("spotify_token");
  localStorage.removeItem("spotify_refresh_token");
  window.location.reload();
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("spotify-login-btn");

  // Garante que o botão funcione
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("🎧 Iniciando login com Spotify...");
      loginSpotify();
    });
  }

  // Verifica se o usuário já está autenticado
  checkSpotifyAuth();
});

// Expõe funções globalmente (para debug e redirect)
window.loginSpotify = loginSpotify;
window.checkSpotifyAuth = checkSpotifyAuth;
