import { signUpWithEmailAndPhoto } from "./emailAuth.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("cadastro-form");
  const photoInput = document.getElementById("photoUpload");
  const photoPreview = document.getElementById("photoPreview");
  const submitButton = form.querySelector("button[type='submit']");
  const spinner = document.createElement("span");

  // Spinner de carregamento
  spinner.className = "loading-spinner";
  spinner.innerHTML = `<i class="ph ph-circle-notch"></i>`;
  spinner.style.display = "none";
  submitButton.appendChild(spinner);

  // Pré-visualização da imagem
  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      // revoga URLs antigos para liberar memória
      if (photoPreview.src && photoPreview.src.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview.src);
      }
      photoPreview.src = URL.createObjectURL(file);
    }
  });

  // Envio do cadastro
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const location = document.getElementById("location").value.trim();
    const age = document.getElementById("age").value;
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const photoFile = photoInput.files[0];

    // Validação simples
    if (!fullName || !email || !password) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // Desativa botão e mostra loading
    submitButton.disabled = true;
    spinner.style.display = "inline-flex";
    submitButton.classList.add("loading");

    try {
      const result = await signUpWithEmailAndPhoto(
        email,
        password,
        fullName,
        location,
        age,
        photoFile
      );

      if (result?.user) {
        alert("✅ Conta criada com sucesso! Faça login para continuar.");
        window.location.href = "login.html";
      } else {
        alert("❌ Falha ao criar conta. Verifique suas informações.");
      }
    } catch (err) {
      console.error("Erro no cadastro:", err);
      alert("Erro ao criar conta. Tente novamente.");
    } finally {
      submitButton.disabled = false;
      spinner.style.display = "none";
      submitButton.classList.remove("loading");
    }
  });
});
