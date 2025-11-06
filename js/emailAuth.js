import { supabase } from "./supabase.js";

// Login com e-mail e senha
export async function loginWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Erros comuns
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("email not confirmed") || msg.includes("confirm")) {
        alert("⚠️ Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.");
      } else if (msg.includes("invalid login credentials")) {
        alert("❌ E-mail ou senha inválidos.");
      } else {
        alert("❌ Erro ao entrar: " + error.message);
      }
      return null;
    }

    alert("✅ Login realizado com sucesso!");
    window.location.href = "index.html";
    return data;
  } catch (err) {
    console.error("Erro ao entrar:", err?.message || err);
    alert("❌ Erro ao entrar: " + (err?.message || err));
    return null;
  }
}

// Cadastro com foto (opcional)
export async function signUpWithEmailAndPhoto(email, password, fullName, location, age, file) {
  try {
    // Cria conta
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    const { user } = data;

    let photoUrl = null;

    // Upload da foto se houver
    if (file?.name && user?.id) {
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (!uploadError) {
        const { data: publicUrlData, error: publicError } =
          supabase.storage.from("avatars").getPublicUrl(fileName);
        if (!publicError) photoUrl = publicUrlData?.publicUrl || null;
      } else {
        console.warn("Upload falhou (seguindo sem avatar):", uploadError?.message || uploadError);
      }
    }

    // Cria/atualiza perfil
    if (user?.id) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName,
        location,
        age: parseInt(age) || null,
        photo_url: photoUrl,
        theme: "auto",
        created_at: new Date(),
        updated_at: new Date(),
      });
      if (profileError) throw profileError;
    }

    // Se seu projeto exige confirmação de e-mail:
    alert("✅ Conta criada! Se for necessário, confirme seu e-mail para entrar.");
    window.location.href = "login.html";
    return data;
  } catch (err) {
    console.error("Erro ao cadastrar:", err?.message || err);
    alert("❌ Ocorreu um erro ao criar sua conta. " + (err?.message || ""));
    return null;
  }
}

// Logout
export async function logoutEmail() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.location.href = "login.html";
  } catch (err) {
    console.error("Erro ao sair:", err?.message || err);
  }
}
