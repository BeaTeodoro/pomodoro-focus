import { setAccessToken } from "./spotifyController.js";

const isLocal = ["localhost", "127.0.0.1"].some(h => window.location.hostname.includes(h));
const redirectUri = isLocal
  ? "http://127.0.0.1:5500/musica.html"
  : "https://pomodoro-focus-bt.vercel.app/musica.html";

const CLIENT_ID = "5b160d486adf43b490858c6bde7f521b"; // insira sua Client ID real
const AUTH_PROXY = "https://spotify-auth-proxy.vercel.app/api/token";

const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-modify-playback-state",
  "user-read-playback-state",
  "user-read-currently-playing",
  "playlist-read-private",
].join(" ");

// Login
function loginSpotify() {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(SCOPES)}`;
  window.location.href = authUrl;
}

// Troca código por token
async function exchangeCodeForToken(code) {
  try {
    const res = await fetch(`${AUTH_PROXY}?code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`);
    const data = await res.json();

    if (!data.access_token) {
      alert("Falha na autenticação com o Spotify.");
      return;
    }

    localStorage.setItem("spotify_token", data.access_token);
    setAccessToken(data.access_token);

    document.querySelector(".spotify-connect").style.display = "none";
    document.getElementById("player-section").style.display = "block";
  } catch (err) {
    console.error("Erro ao obter token:", err);
  }
}

// Verifica login
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("spotify-login-btn");
  if (loginBtn) loginBtn.addEventListener("click", loginSpotify);

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const token = localStorage.getItem("spotify_token");

  if (code) {
    exchangeCodeForToken(code);
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (token) {
    setAccessToken(token);
    document.querySelector(".spotify-connect").style.display = "none";
    document.getElementById("player-section").style.display = "block";
  }
});
