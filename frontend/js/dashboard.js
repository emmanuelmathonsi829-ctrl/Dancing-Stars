
const API_URL = "https://dancing-stars.onrender.com";

const token = localStorage.getItem("access_token");

if (!token) {
    window.location.href = "login.html";
}

async function loadUser() {
    try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");

            window.location.href = "login.html";
            return;
        }

        const user = await response.json();

        document.getElementById("username").textContent = user.username;
        document.getElementById("welcomeUsername").textContent = user.username;
        document.getElementById("accountType").textContent =
            user.account_type;

        document.getElementById("userAvatar").textContent =
            user.username.charAt(0).toUpperCase();

    } catch (error) {
        console.error("Authentication error:", error);

        localStorage.removeItem("access_token");
        localStorage.removeItem("user");

        window.location.href = "login.html";
    }
}

document.getElementById("logoutButton").addEventListener("click", function () {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    window.location.href = "login.html";
});

loadUser();

