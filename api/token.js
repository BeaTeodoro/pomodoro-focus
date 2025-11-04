// Proxy: troca o código do Spotify por um token (e permite refresh)
export default async function handler(req, res) {
  try {
    const { code, refresh_token, redirect_uri } = req.query;

    if (!redirect_uri) {
      return res.status(400).json({ error: "Missing redirect_uri" });
    }

    const body = new URLSearchParams(
      refresh_token
        ? {
          grant_type: "refresh_token",
          refresh_token,
          client_id: process.env.SPOTIFY_CLIENT_ID,
          client_secret: process.env.SPOTIFY_CLIENT_SECRET,
        }
        : {
          grant_type: "authorization_code",
          code,
          redirect_uri,
          client_id: process.env.SPOTIFY_CLIENT_ID,
          client_secret: process.env.SPOTIFY_CLIENT_SECRET,
        }
    );

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      console.error("Resposta inválida do Spotify:", text);
      return res.status(500).json({ error: "Invalid JSON from Spotify" });
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    res.status(response.status).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
