import { supabase } from "./supabase.js";

// Inputs
const fullNameInput = document.getElementById("full_name");
const locationInput = document.getElementById("location");
const ageInput = document.getElementById("age");
const avatarInput = document.getElementById("avatar-input");

// Preview correto
const avatarPreview = document.getElementById("user-avatar-preview");

// Preview ao escolher imagem
avatarInput.addEventListener("change", () => {
  const file = avatarInput.files[0];
  if (file) {
    avatarPreview.src = URL.createObjectURL(file);
  }
});

// Carregar dados do perfil
async function loadProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return window.location.href = "login.html";

  const { user } = session;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) return console.error(error);

  fullNameInput.value = data.full_name || "";
  locationInput.value = data.location || "";
  ageInput.value = data.age || "";

  avatarPreview.src = data.photo_url || "img/default-avatar.svg";
}

// Salvar perfil
async function saveProfile(e) {
  e.preventDefault();

  const { data: { session } } = await supabase.auth.getSession();
  const { user } = session;

  let photoURL = null;

  // Upload da imagem (se houver)
  if (avatarInput.files.length > 0) {
    const file = avatarInput.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `profiles/${user.id}-${Date.now()}.${fileExt}`; // ← adiciona pasta + timestamp

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error(uploadError);
      return alert("Erro ao enviar imagem");
    }

    // Obtém URL pública
    const { data: publicURL } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    photoURL = publicURL.publicUrl;
  }

  // Atualiza perfil
  const updates = {
    id: user.id,
    full_name: fullNameInput.value,
    location: locationInput.value,
    age: ageInput.value,
    updated_at: new Date(),
  };

  if (photoURL) updates.photo_url = photoURL;

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) return alert("Erro ao salvar perfil");

  // Dispara atualização no header
  document.dispatchEvent(new CustomEvent("profile-updated"));

  alert("Perfil atualizado com sucesso!");

  // Atualiza o header automaticamente
  document.dispatchEvent(new CustomEvent("profile-updated"));

  alert("✅ Perfil atualizado!");
}

document.getElementById("profile-form").addEventListener("submit", saveProfile);

loadProfile();
