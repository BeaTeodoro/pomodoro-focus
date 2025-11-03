import { supabase } from "./supabase.js";

/* =========================================================
   🍅 POMODORO FOCUS — AUTENTICAÇÃO POR E-MAIL
   ========================================================= */

export async function loginWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert("❌ Erro ao entrar: " + error.message);
    console.error(error);
    return null;
  }

  alert("✅ Login realizado com sucesso!");
  window.location.href = "perfil.html";
  return data;
}

export async function signUpWithEmailAndPhoto(email, password, fullName, location, age, file) {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      alert("❌ Erro ao cadastrar: " + error.message);
      console.error(error);
      return null;
    }

    const { user } = data;
    let photoUrl = null;

    if (file && file.name) {
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (uploadError) console.error("Erro ao enviar imagem:", uploadError.message);
      else {
        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);
        photoUrl = publicUrlData.publicUrl;
      }
    }

    const { error: insertError } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      location,
      age: parseInt(age) || null,
      photo_url: photoUrl,
      theme: "auto",
      created_at: new Date(),
    });

    if (insertError) {
      alert("❌ Erro ao salvar perfil: " + insertError.message);
      console.error(insertError);
    } else {
      alert("✅ Conta criada com sucesso!");
      window.location.href = "perfil.html";
    }

    return data;
  } catch (err) {
    console.error("Erro inesperado no cadastro:", err);
    alert("❌ Ocorreu um erro inesperado. Verifique o console.");
  }
}

export async function logoutEmail() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Erro ao sair:", error.message);
  window.location.href = "index.html";
}
