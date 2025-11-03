// Cadastro com login automático + indicador de carregamento
import { loginWithEmail, signUpWithEmailAndPhoto } from "./emailAuth.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("cadastro-form");
  const photoInput = document.getElementById("photo-upload");
  const photoPreview = document.getElementById("photo-preview");
  const submitButton = form.querySelector("button[type='submit']");
  const spinner = document.createElement("span");

  // Cria o spinner
  spinner.className = "loading-spinner";
  spinner.innerHTML = `<i class="ph ph-circle-notch"></i>`;
  spinner.style.display = "none";
  submitButton.appendChild(spinner);

  // Pré-visualizar imagem
  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) photoPreview.src = URL.createObjectURL(file);
  });

  // Enviar cadastro
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("full-name").value.trim();
    const location = document.getElementById("location").value.trim();
    const age = document.getElementById("age").value;
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const photoFile = photoInput.files[0];

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
        console.log("Cadastro concluído. Efetuando login automático...");
        await loginWithEmail(email, password);
        window.location.href = "cronometro.html";
      } else {
        alert("Falha ao criar conta. Verifique suas informações.");
      }
    } catch (err) {
      console.error("Erro no cadastro:", err);
      alert("Ocorreu um erro ao criar sua conta. Tente novamente.");
    } finally {
      submitButton.disabled = false;
      spinner.style.display = "none";
      submitButton.classList.remove("loading");
    }
  });
});
