import { supabase } from "./supabase.js";

// -----------------------------
// LOGIN COM EMAIL E SENHA
// -----------------------------
export async function loginWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      const msg = (error.message || "").toLowerCase();

      if (msg.includes("email not confirmed") || msg.includes("confirm")) {
        alert("⚠️ Confirme seu e-mail antes de entrar.");
      } else if (msg.includes("invalid login credentials")) {
        alert("❌ E-mail ou senha inválidos.");
      } else {
        alert("❌ Erro ao entrar: " + error.message);
      }
      return null;
    }

    // ✅ Aguarda Supabase salvar a sessão antes de trocar a página
    setTimeout(() => {
      window.location.href = "index.html";
    }, 200);

    return data;

  } catch (err) {
    console.error("Erro ao entrar:", err);
    alert("❌ Erro ao entrar: " + (err?.message || err));
    return null;
  }
}


// -----------------------------
// CADASTRO COM FOTO (OPCIONAL)
// -----------------------------
export async function signUpWithEmailAndPhoto(email, password, fullName, location, age, file) {
  try {
    // 1) Criar conta + enviar metadados usados pelo trigger
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/index.html`,
        data: {
          full_name: fullName,
          name: fullName // usado pelo trigger → display_name
        }
      }
    });

    if (error) throw error;

    // ✅ destructuring como você pediu
    const { user } = data;

    let photoUrl = null;

    // 2) Upload da foto, se houver
    if (file?.name && user?.id) {
      const ext = file.name.split(".").pop();
      const fileName = `avatar-${user.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
        photoUrl = urlData?.publicUrl ?? null;
      }
    }

    // 3) Atualiza perfil criado automaticamente pelo trigger
    await supabase
      .from("profiles")
      .update({
        display_name: fullName,
        full_name: fullName,
        location,
        age: age ? parseInt(age) : null,
        photo_url: photoUrl
      })
      .eq("id", user.id);

    alert("✅ Conta criada! Confirme seu e-mail para ativar o acesso.");
    window.location.href = "login.html";

  } catch (err) {
    console.error("Erro ao cadastrar:", err);
    alert(`❌ Erro ao criar conta: ${err?.message || err}`);
  }
}

// -----------------------------
// LOGOUT
// -----------------------------
export async function logoutEmail() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    window.location.href = "login.html";

  } catch (err) {
    console.error("Erro ao sair:", err);
  }
}
