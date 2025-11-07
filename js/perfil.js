import { supabase } from "./supabase.js";

async function loadProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return (window.location.href = "login.html");

  const { user } = session;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  document.getElementById("perfil-name").value = profile.display_name || "";
  document.getElementById("perfil-location").value = profile.location || "";
  document.getElementById("perfil-age").value = profile.age || "";
  document.getElementById("perfil-avatar").src = profile.photo_url || "img/default-avatar.svg";

  document.getElementById("save-profile").onclick = async () => {
    await supabase.from("profiles")
      .update({
        display_name: document.getElementById("perfil-name").value,
        location: document.getElementById("perfil-location").value,
        age: parseInt(document.getElementById("perfil-age").value) || null,
      })
      .eq("id", user.id);

    alert("✅ Perfil atualizado!");
  };

  document.getElementById("delete-account").onclick = async () => {
    if (!confirm("⚠️ Tem certeza que deseja excluir sua conta?")) return;
    await supabase.rpc("delete_user");
    alert("✅ Conta excluída!");
    window.location.href = "index.html";
  };
}

document.addEventListener("DOMContentLoaded", loadProfile);
