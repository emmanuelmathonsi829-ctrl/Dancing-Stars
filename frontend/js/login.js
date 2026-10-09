
const API_URL = "https://dancing-stars.onrender.com";

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    loginMessage.textContent = "";
    loginButton.disabled = true;
    loginButton.textContent = "Logging in might take up to 20s";

    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            loginMessage.textContent = data.error || "Login failed.";
            return;
        }

        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));

        window.location.href = "dashboard.html";

    } catch (error) {
        loginMessage.textContent =
            "Unable to connect to the server. Please try again.";
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Login";
    }
});

