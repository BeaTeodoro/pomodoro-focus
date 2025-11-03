// ===============================
// SPOTIFY — AUTENTICAÇÃO E INICIALIZAÇÃO
// ===============================

import { initSpotifyPlayer } from "./spotifyController.js";

const clientId = "5b160d486adf43b490858c6bde7f521b";

// ✅ Redirecionamento para o domínio Vercel
const redirectUri = "https://pomodoro-focus-bt.vercel.app/musica.html";

const scopes = [
  "user-read-private",
  "user-read-email",
  "user-read-playback-state",
  "user-modify-playback-state",
  "streaming",
  "playlist-read-private",
  "playlist-read-collaborative",
];

const AUTH_PROXY = "https://spotify-auth-proxy.vercel.app/api/token";

// -------------------------------
// LOGIN DO SPOTIFY
// -------------------------------
function loginSpotify() {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scopes.join(" "))}`;
  window.location.href = authUrl;
}

// -------------------------------
// TROCA DE CÓDIGO POR TOKEN
// -------------------------------
async function exchangeCodeForToken(code) {
  try {
    const res = await fetch(
      `${AUTH_PROXY}?code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`
    );
    const data = await res.json();

    if (!data.access_token) {
      console.error("Erro ao trocar código:", data);
      alert("Falha na autenticação com o Spotify.");
      return;
    }

    localStorage.setItem("spotify_token", data.access_token);
    localStorage.setItem("spotify_refresh_token", data.refresh_token);

    renderSpotifyConnected(data.access_token);
    initSpotifyPlayer();
  } catch (err) {
    console.error("Falha ao obter token:", err);
  }
}

// -------------------------------
// VERIFICA AUTENTICAÇÃO EXISTENTE
// -------------------------------
function checkSpotifyAuth() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const token = localStorage.getItem("spotify_token");

  if (code) {
    exchangeCodeForToken(code);
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (token) {
    renderSpotifyConnected(token);
    initSpotifyPlayer();
  } else {
    console.warn("Spotify offline: nenhum token encontrado.");
  }
}

// -------------------------------
// RENDERIZA USUÁRIO CONECTADO
// -------------------------------
async function renderSpotifyConnected(token) {
  const section = document.querySelector(".spotify-connect");
  if (!section) return;

  try {
    const res = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
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

    document
      .getElementById("spotify-logout-btn")
      .addEventListener("click", logoutSpotify);
  } catch (err) {
    console.error("Erro ao conectar ao Spotify:", err);
  }
}

// -------------------------------
// LOGOUT
// -------------------------------
function logoutSpotify() {
  localStorage.removeItem("spotify_token");
  localStorage.removeItem("spotify_refresh_token");
  window.location.reload();
}

// -------------------------------
// INICIALIZAÇÃO GERAL
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("spotify-login-btn");
  if (loginBtn) loginBtn.addEventListener("click", loginSpotify);
  checkSpotifyAuth();
});
