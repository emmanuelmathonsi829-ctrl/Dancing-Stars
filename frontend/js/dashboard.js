
const API_URL = "https://dancing-stars.onrender.com";

const token = localStorage.getItem("access_token");

if (!token) {
    window.location.href = "login.html";
}


/* =========================
   DASHBOARD NAVIGATION
========================= */

const pagePermissions = {
    overview: null,

    dancers: "dancers.view",

    roles: "roles.view",

    attendance: "attendance.view",

    rehearsals: "rehearsals.view",

    uniform: "uniform.view",

    dance: "dance.view",

    music: "music.view",

    reports: "reports.view",

    activity: null,

    settings: null
};


const pageTitles = {
    overview: "Dashboard",
    dancers: "Dancers",
    roles: "Roles",
    attendance: "Attendance",
    rehearsals: "Rehearsals",
    uniform: "Uniform",
    dance: "Dance Knowledge",
    music: "Music",
    reports: "Reports",
    activity: "Activity Log",
    settings: "Settings"
};


/* =========================
   ELEMENTS
========================= */

const usernameElement =
    document.getElementById("username");

const accountTypeElement =
    document.getElementById("accountType");

const avatarElement =
    document.getElementById("userAvatar");

const welcomeUsernameElement =
    document.getElementById("welcomeUsername");

const pageTitleElement =
    document.getElementById("pageTitle");

const pageContentElement =
    document.getElementById("pageContent");

const logoutButton =
    document.getElementById("logoutButton");


/* =========================
   LOAD USER
========================= */

async function loadUser() {

    try {

        const response = await fetch(
            `${API_URL}/api/auth/me`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


        if (!response.ok) {

            logout();

            return;
        }


        const user = await response.json();


        /* -------------------------
           USER INFORMATION
        ------------------------- */

        usernameElement.textContent =
            user.username;

        welcomeUsernameElement.textContent =
            user.username;

        accountTypeElement.textContent =
            formatAccountType(user.account_type);


        avatarElement.textContent =
            user.username
                .charAt(0)
                .toUpperCase();


        /* -------------------------
           PERMISSIONS
        ------------------------- */

        setupNavigation(user);


        /* -------------------------
           PASSWORD REQUIREMENT
        ------------------------- */

        if (user.must_change_password) {

            showPasswordWarning();
        }


    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        logout();
    }
}


/* =========================
   ACCOUNT TYPE
========================= */

function formatAccountType(accountType) {

    if (!accountType) {
        return "";
    }

    return accountType
        .toLowerCase()
        .replace("_", " ");
}


/* =========================
   NAVIGATION
========================= */

function setupNavigation(user) {

    const permissions =
        user.permissions || [];


    const isAdmin =
        user.account_type === "SHEPHERD" ||
        user.account_type === "ASSISTANT";


    document
        .querySelectorAll(".nav-item")
        .forEach(navItem => {

            const page =
                navItem.dataset.page;

            const requiredPermission =
                pagePermissions[page];


            /*
             * Shepherd and Assistant
             * can access everything.
             */

            if (isAdmin) {

                navItem.style.display = "flex";

                return;
            }


            /*
             * Pages with no permission
             * requirement are available
             * to every authenticated user.
             */

            if (!requiredPermission) {

                navItem.style.display = "flex";

                return;
            }


            /*
             * Show only if permission exists.
             */

            if (
                permissions.includes(
                    requiredPermission
                )
            ) {

                navItem.style.display = "flex";

            } else {

                navItem.style.display = "none";
            }

        });


    setupNavigationClicks();
}


/* =========================
   NAVIGATION CLICKS
========================= */

function setupNavigationClicks() {

    document
        .querySelectorAll(".nav-item")
        .forEach(navItem => {

            navItem.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    const page =
                        this.dataset.page;


                    /*
                     * Remove active state.
                     */

                    document
                        .querySelectorAll(".nav-item")
                        .forEach(item => {

                            item.classList.remove(
                                "active"
                            );

                        });


                    /*
                     * Activate selected tab.
                     */

                    this.classList.add("active");


                    /*
                     * Update title.
                     */

                    pageTitleElement.textContent =
                        pageTitles[page] ||
                        "Dashboard";


                    /*
                     * Load page.
                     */

                    loadPage(page);
                }
            );

        });
}


/* =========================
   PAGE LOADER
========================= */

function loadPage(page) {

    switch (page) {

        case "overview":

            showOverview();

            break;


        case "dancers":

            showComingSoon(
                "Dancers",
                "Dancer management will appear here."
            );

            break;


        case "roles":

            showComingSoon(
                "Roles",
                "Role and permission management will appear here."
            );

            break;


        case "attendance":

            showComingSoon(
                "Attendance",
                "Attendance management will appear here."
            );

            break;


        case "rehearsals":

            showComingSoon(
                "Rehearsals",
                "Rehearsal management will appear here."
            );

            break;


        case "uniform":

            showComingSoon(
                "Uniform",
                "Uniform management will appear here."
            );

            break;


        case "dance":

            showComingSoon(
                "Dance Knowledge",
                "Dance knowledge management will appear here."
            );

            break;


        case "music":

            showComingSoon(
                "Music",
                "Music management will appear here."
            );

            break;


        case "reports":

            showComingSoon(
                "Reports",
                "Reports will appear here."
            );

            break;


        case "activity":

            showComingSoon(
                "Activity Log",
                "Activity history will appear here."
            );

            break;


        case "settings":

            showComingSoon(
                "Settings",
                "Account settings will appear here."
            );

            break;


        default:

            showOverview();
    }
}


/* =========================
   OVERVIEW
========================= */

function showOverview() {

    pageContentElement.innerHTML = `

        <div class="welcome-section">

            <p class="section-label">
                OVERVIEW
            </p>

            <h2>
                Welcome back,
                <span>
                    ${escapeHtml(
                        usernameElement.textContent
                    )}
                </span>
            </h2>

            <p>
                Manage Dancing Stars from one place.
            </p>

        </div>


        <div class="stats-grid">

            <div class="stat-card">

                <span class="stat-label">
                    DANCERS
                </span>

                <strong class="stat-value">
                    —
                </strong>

                <span class="stat-description">
                    Active members
                </span>

            </div>


            <div class="stat-card">

                <span class="stat-label">
                    REHEARSALS
                </span>

                <strong class="stat-value">
                    —
                </strong>

                <span class="stat-description">
                    Upcoming rehearsals
                </span>

            </div>


            <div class="stat-card">

                <span class="stat-label">
                    ATTENDANCE
                </span>

                <strong class="stat-value">
                    —
                </strong>

                <span class="stat-description">
                    Recent attendance
                </span>

            </div>


            <div class="stat-card">

                <span class="stat-label">
                    DANCES
                </span>

                <strong class="stat-value">
                    —
                </strong>

                <span class="stat-description">
                    In the library
                </span>

            </div>

        </div>


        <div class="dashboard-grid">

            <div class="dashboard-card">

                <div class="card-header">

                    <div>

                        <p class="section-label">
                            NEXT
                        </p>

                        <h3>
                            Upcoming Rehearsal
                        </h3>

                    </div>

                </div>


                <div class="empty-state">

                    No upcoming rehearsal.

                </div>

            </div>


            <div class="dashboard-card">

                <div class="card-header">

                    <div>

                        <p class="section-label">
                            RECENT
                        </p>

                        <h3>
                            Recent Activity
                        </h3>

                    </div>

                </div>


                <div class="empty-state">

                    No recent activity.

                </div>

            </div>

        </div>

    `;
}


/* =========================
   COMING SOON
========================= */

function showComingSoon(title, message) {

    pageContentElement.innerHTML = `

        <div class="welcome-section">

            <p class="section-label">
                DANCING STARS
            </p>

            <h2>
                ${escapeHtml(title)}
            </h2>

            <p>
                ${escapeHtml(message)}
            </p>

        </div>


        <div class="dashboard-card">

            <div class="empty-state">

                This section is being built.

            </div>

        </div>

    `;
}


/* =========================
   PASSWORD WARNING
========================= */

function showPasswordWarning() {

    const warning =
        document.createElement("div");


    warning.textContent =
        "Please change your initial password in Settings.";


    warning.style.padding =
        "12px 16px";

    warning.style.margin =
        "15px 40px 0";

    warning.style.border =
        "1px solid rgba(255,255,255,0.12)";

    warning.style.borderRadius =
        "10px";

    warning.style.background =
        "rgba(255,255,255,0.04)";

    warning.style.fontSize =
        "13px";

    warning.style.opacity =
        "0.7";


    document
        .querySelector(".main-content")
        .prepend(warning);
}


/* =========================
   LOGOUT
========================= */

function logout() {

    localStorage.removeItem(
        "access_token"
    );

    localStorage.removeItem(
        "user"
    );

    window.location.href =
        "login.html";
}


logoutButton.addEventListener(
    "click",
    logout
);


/* =========================
   HTML SAFETY
========================= */

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================
   START
========================= */

loadUser();

