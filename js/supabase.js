import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Lê variáveis de ambiente (Vercel ou fallback local)
const SUPABASE_URL =
  import.meta.env?.SUPABASE_URL ||
  process.env?.SUPABASE_URL ||
  "https://tnwhdkspowoamnrhhgok.supabase.co";

const SUPABASE_KEY =
  import.meta.env?.SUPABASE_KEY ||
  process.env?.SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRud2hka3Nwb3dvYW1ucmhoZ29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDc0OTIsImV4cCI6MjA3NzU4MzQ5Mn0.avJV39Jsqvrq9vpFqLfgz12o80fwrLskBu0jCAZ4Mz8";

// Cria o cliente global
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Log para verificar conexão (somente no ambiente local)
if (window.location.hostname.includes("127.0.0.1") || window.location.hostname.includes("localhost")) {
  console.log("✅ Supabase conectado com:", SUPABASE_URL);
}
