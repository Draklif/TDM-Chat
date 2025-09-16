import { login } from "./services/api.js";

document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorEl = document.getElementById("loginError");

    errorEl.textContent = "";

    try {
        if (!username || !password) {
            errorEl.textContent = "Debes ingresar usuario y contraseña";
            return;
        }

        // Llamar backend
        const data = await login(username, password);

        console.log(data)

        // Guardar datos del usuario en localStorage
        localStorage.setItem("username", data.user.name);

        // Redirigir al chat
        window.location.href = "/chat.html";
    } catch (err) {
        console.error("Error de login:", err);
        errorEl.textContent = err.message || "Credenciales inválidas";
    }
});
