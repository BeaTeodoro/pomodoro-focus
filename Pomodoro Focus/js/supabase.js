import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://tnwhdkspowoamnrhhgok.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRud2hka3Nwb3dvYW1ucmhoZ29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMDc0OTIsImV4cCI6MjA3NzU4MzQ5Mn0.avJV39Jsqvrq9vpFqLfgz12o80fwrLskBu0jCAZ4Mz8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
