import { supabase } from "./supabase.js";

async function loadUserHeader() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, photo_url")
    .eq("id", user.id)
    .single();

  const userInfo = document.getElementById("user-info");
  const userName = document.getElementById("user-name");
  const userAvatar = document.getElementById("user-avatar");
  const loginBtn = document.getElementById("login-btn");

  if (profile) {
    userName.textContent = profile.full_name ?? user.email;
    userAvatar.src = profile.photo_url ?? "img/default-avatar.svg";

    loginBtn.classList.add("hidden");
    userInfo.classList.remove("hidden");
  }
}

loadUserHeader();
