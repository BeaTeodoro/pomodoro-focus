import { supabase } from "./supabase.js";

// Login com e-mail e senha
export async function loginWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    alert("✅ Login realizado com sucesso!");
    window.location.href = "index.html";
    return data;
  } catch (err) {
    console.error("Erro ao entrar:", err.message || err);
    alert("❌ Erro ao entrar: " + (err.message || err));
    return null;
  }
}

// Cadastro com foto (opcional)
export async function signUpWithEmailAndPhoto(email, password, fullName, location, age, file) {
  try {
    // Cria conta no Supabase Auth
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    const { user } = data;

    let photoUrl = null;

    // Upload da foto se houver
    if (file?.name) {
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        console.error("Erro no upload:", uploadError.message || uploadError);
      } else {
        // pega a URL pública corretamente
        const { data: publicUrlData, error: publicError } = supabase.storage.from("avatars").getPublicUrl(fileName);
        if (publicError) {
          console.error("Erro ao gerar publicUrl:", publicError);
        } else {
          photoUrl = publicUrlData?.publicUrl || null;
        }
      }
    }

    // Cria/atualiza perfil do usuário
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      location,
      age: parseInt(age) || null,
      photo_url: photoUrl,
      theme: "auto",
      created_at: new Date(),
    });

    if (profileError) throw profileError;

    alert("✅ Conta criada com sucesso! Faça login para continuar.");
    window.location.href = "login.html";
    return data;
  } catch (err) {
    console.error("Erro ao cadastrar:", err.message || err);
    alert("❌ Ocorreu um erro ao criar sua conta. Tente novamente.");
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
    console.error("Erro ao sair:", err.message || err);
  }
}
