
const API_URL = "https://dancing-stars.onrender.com";

const token = localStorage.getItem("access_token");

if (!token) {
    window.location.href = "login.html";
}

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

const usernameElement = document.getElementById("username");
const accountTypeElement = document.getElementById("accountType");
const avatarElement = document.getElementById("userAvatar");
const welcomeUsernameElement = document.getElementById("welcomeUsername");
const pageTitleElement = document.getElementById("pageTitle");
const pageContentElement = document.getElementById("pageContent");
const logoutButton = document.getElementById("logoutButton");

let currentUser = null;
let dancers = [];


async function loadUser() {

    try {

        const response = await fetch(
            `${API_URL}/api/auth/me`,
            {
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

        currentUser = user;

        usernameElement.textContent = user.username;
        welcomeUsernameElement.textContent = user.username;

        accountTypeElement.textContent =
            formatAccountType(user.account_type);

        avatarElement.textContent =
            user.username.charAt(0).toUpperCase();

        setupNavigation(user);

        if (user.must_change_password) {
            showPasswordWarning();
        }

    } catch (error) {

        console.error(error);

        logout();
    }
}


function formatAccountType(accountType) {

    if (!accountType) {
        return "";
    }

    return accountType
        .toLowerCase()
        .replace("_", " ");
}


function setupNavigation(user) {

    const permissions = user.permissions || [];

    const isAdmin =
        user.account_type === "SHEPHERD" ||
        user.account_type === "ASSISTANT";

    document.querySelectorAll(".nav-item").forEach(navItem => {

        const page = navItem.dataset.page;
        const requiredPermission = pagePermissions[page];

        if (isAdmin) {
            navItem.style.display = "flex";
            return;
        }

        if (!requiredPermission) {
            navItem.style.display = "flex";
            return;
        }

        navItem.style.display =
            permissions.includes(requiredPermission)
                ? "flex"
                : "none";
    });

    setupNavigationClicks();
}


function setupNavigationClicks() {

    document.querySelectorAll(".nav-item").forEach(navItem => {

        navItem.addEventListener("click", function(event) {

            event.preventDefault();

            document.querySelectorAll(".nav-item").forEach(item => {
                item.classList.remove("active");
            });

            this.classList.add("active");

            const page = this.dataset.page;

            pageTitleElement.textContent =
                pageTitles[page] || "Dashboard";

            loadPage(page);
        });
    });
}




function loadPage(page) {

    switch (page) {

        case "overview":
            showOverview();
            break;

        case "dancers":
            loadDancers();
            break;

        case "roles":
            showComingSoon(
                "Roles",
                "Role and permission management will appear here."
            );
            break;


        case "attendance":
            loadAttendance();
            break;



        case "rehearsals":
            loadRehearsals();
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
            showSettings();
            break;

        default:
            showOverview();
    }
}


async function loadAttendance() {
    pageContentElement.innerHTML = `
        <div class="welcome-section">
            <p class="section-label">ATTENDANCE</p>
            <h2>Attendance</h2>
            <p>Select a rehearsal to manage attendance.</p>
        </div>

        <div class="dashboard-card">
            <div class="card-header">
                <div>
                    <p class="section-label">REHEARSALS</p>
                    <h3>Select Rehearsal</h3>
                </div>
            </div>
            <div id="attendanceRehearsals" class="empty-state">
                Loading rehearsals...
            </div>
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/api/attendance/rehearsals`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to load rehearsals");
        }

        const data = await response.json();
        const container = document.getElementById("attendanceRehearsals");

        if (!data.rehearsals || data.rehearsals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    No rehearsals available.
                </div>
            `;
            return;
        }

        container.className = "attendance-rehearsals";

        container.innerHTML = data.rehearsals.map(rehearsal => `
            <button
                type="button"
                class="attendance-rehearsal"
                onclick="openAttendance(${rehearsal.id})"
            >
                <strong>${escapeHtml(rehearsal.title)}</strong>
                <span>${formatAttendanceDate(rehearsal.rehearsal_date)}</span>
                <span>${rehearsal.start_time ? formatAttendanceTime(rehearsal.start_time) : ""}</span>
                <span>${rehearsal.location ? escapeHtml(rehearsal.location) : ""}</span>
            </button>
        `).join("");
    } catch (error) {
        console.error(error);

        document.getElementById("attendanceRehearsals").innerHTML = `
            <div class="form-message error">
                Unable to load rehearsals.
            </div>
        `;
    }
}

async function openAttendance(rehearsalId) {
    pageContentElement.innerHTML = `
        <div class="welcome-section">
            <p class="section-label">ATTENDANCE</p>
            <h2>Loading...</h2>
            <p>Loading attendance records.</p>
        </div>
    `;

    try {
        const response = await fetch(
            `${API_URL}/api/attendance/rehearsals/${rehearsalId}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load attendance");
        }

        const data = await response.json();
        const rehearsal = data.rehearsal;

        pageContentElement.innerHTML = `
            <div class="welcome-section">
                <p class="section-label">ATTENDANCE</p>
                <h2>${escapeHtml(rehearsal.title)}</h2>
                <p>
                    ${formatAttendanceDate(rehearsal.rehearsal_date)}
                    ${rehearsal.start_time ? " • " + formatAttendanceTime(rehearsal.start_time) : ""}
                </p>
            </div>

            <div class="dashboard-card">
                <div class="card-header">
                    <div>
                        <p class="section-label">DANCERS</p>
                        <h3>Mark Attendance</h3>
                    </div>
                </div>

                <div id="attendanceList" class="attendance-list">
                    ${data.attendance.map(dancer => `
                        <div class="attendance-row">
                            <div class="attendance-dancer">
                                <div class="dancer-avatar">
                                    ${escapeHtml(dancer.username.charAt(0).toUpperCase())}
                                </div>

                                <div>
                                    <strong>${escapeHtml(dancer.username)}</strong>
                                    <span>
                                        ${dancer.marked_by
                                            ? `Marked by ${escapeHtml(dancer.marked_by)}`
                                            : "Not marked yet"}
                                    </span>
                                </div>
                            </div>

                            <div class="attendance-actions">
                                <button
                                    type="button"
                                    class="attendance-button present ${dancer.status === "PRESENT" ? "selected" : ""}"
                                    onclick="markAttendance(${rehearsalId}, ${dancer.dancer_id}, 'PRESENT', this)"
                                >
                                    Present
                                </button>

                                <button
                                    type="button"
                                    class="attendance-button absent ${dancer.status === "ABSENT" ? "selected" : ""}"
                                    onclick="markAttendance(${rehearsalId}, ${dancer.dancer_id}, 'ABSENT', this)"
                                >
                                    Absent
                                </button>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;
    } catch (error) {
        console.error(error);

        pageContentElement.innerHTML = `
            <div class="dashboard-card">
                <div class="form-message error">
                    Unable to load attendance.
                </div>
            </div>
        `;
    }
}

async function markAttendance(rehearsalId, dancerId, status, button) {
    button.disabled = true;

    try {
        const response = await fetch(
            `${API_URL}/api/attendance/rehearsals/${rehearsalId}/dancers/${dancerId}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: status
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to update attendance");
        }

        const row = button.closest(".attendance-row");

        row.querySelectorAll(".attendance-button").forEach(item => {
            item.classList.remove("selected");
        });

        button.classList.add("selected");

        const info = row.querySelector(".attendance-dancer span");

        if (currentUser) {
            info.textContent = `Marked by ${currentUser.username}`;
        }
    } catch (error) {
        console.error(error);
        alert(error.message);
    } finally {
        button.disabled = false;
    }
}

function formatAttendanceDate(dateString) {
    if (!dateString) {
        return "";
    }

    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-ZA", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function formatAttendanceTime(timeString) {
    if (!timeString) {
        return "";
    }

    const parts = timeString.split(":");
    const hour = Number(parts[0]);
    const minute = parts[1];

    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minute} ${period}`;
}



async function loadRehearsals() {
    pageContentElement.innerHTML = `
        <div class="welcome-section">
            <p class="section-label">REHEARSALS</p>
            <h2>Rehearsals</h2>
            <p>Manage Dancing Stars rehearsals.</p>
        </div>

        <div class="dancers-toolbar">
            <input
                type="text"
                id="rehearsalSearch"
                placeholder="Search rehearsals..."
            >

            <button
                type="button"
                class="dashboard-action"
                onclick="showCreateRehearsal()"
            >
                Add Rehearsal
            </button>
        </div>

        <div class="dashboard-card">
            <div id="rehearsalsList" class="rehearsals-list">
                Loading rehearsals...
            </div>
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/api/rehearsals`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to load rehearsals");
        }

        const data = await response.json();

        renderRehearsals(data.rehearsals);

        document.getElementById("rehearsalSearch").addEventListener(
            "input",
            function() {
                const search = this.value.toLowerCase();

                const filtered = data.rehearsals.filter(rehearsal =>
                    rehearsal.title.toLowerCase().includes(search) ||
                    rehearsal.rehearsal_date.includes(search) ||
                    (rehearsal.location || "").toLowerCase().includes(search)
                );

                renderRehearsals(filtered);
            }
        );
    } catch (error) {
        console.error(error);

        document.getElementById("rehearsalsList").innerHTML = `
            <div class="form-message error">
                Unable to load rehearsals.
            </div>
        `;
    }
}

function renderRehearsals(rehearsals) {
    const container = document.getElementById("rehearsalsList");

    if (!rehearsals.length) {
        container.innerHTML = `
            <div class="empty-state">
                No rehearsals found.
            </div>
        `;
        return;
    }

    container.innerHTML = rehearsals.map(rehearsal => `
        <div class="rehearsal-card">
            <div class="rehearsal-info">
                <span class="section-label">
                    ${formatAttendanceDate(rehearsal.rehearsal_date)}
                </span>

                <h3>${escapeHtml(rehearsal.title)}</h3>

                <p>
                    ${rehearsal.start_time
                        ? formatAttendanceTime(rehearsal.start_time)
                        : ""}
                    ${rehearsal.end_time
                        ? ` - ${formatAttendanceTime(rehearsal.end_time)}`
                        : ""}
                </p>

                ${rehearsal.location
                    ? `<p>${escapeHtml(rehearsal.location)}</p>`
                    : ""}
            </div>

            <div class="rehearsal-actions">
                <button
                    type="button"
                    class="dashboard-secondary"
                    onclick="openAttendance(${rehearsal.id})"
                >
                    Attendance
                </button>

                <button
                    type="button"
                    class="dashboard-secondary"
                    onclick="editRehearsal(${rehearsal.id})"
                >
                    Edit
                </button>

                <button
                    type="button"
                    class="dashboard-danger"
                    onclick="deleteRehearsal(${rehearsal.id})"
                >
                    Delete
                </button>
            </div>
        </div>
    `).join("");
}

function showCreateRehearsal() {
    pageContentElement.innerHTML = `
        <div class="welcome-section">
            <p class="section-label">REHEARSALS</p>
            <h2>Add Rehearsal</h2>
            <p>Create a rehearsal for Dancing Stars.</p>
        </div>

        <div class="dashboard-card">
            <form id="rehearsalForm">
                <div class="form-group">
                    <label for="rehearsalTitle">Title</label>
                    <input
                        type="text"
                        id="rehearsalTitle"
                        value="Dancing Stars Rehearsal"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="rehearsalDate">Date</label>
                    <input
                        type="date"
                        id="rehearsalDate"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="rehearsalStart">Start Time</label>
                    <input
                        type="time"
                        id="rehearsalStart"
                        value="17:00"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="rehearsalEnd">End Time</label>
                    <input
                        type="time"
                        id="rehearsalEnd"
                    >
                </div>

                <div class="form-group">
                    <label for="rehearsalLocation">Location</label>
                    <input
                        type="text"
                        id="rehearsalLocation"
                        placeholder="Rehearsal location"
                    >
                </div>

                <div class="form-group">
                    <label for="rehearsalDescription">Description</label>
                    <input
                        type="text"
                        id="rehearsalDescription"
                        placeholder="Optional description"
                    >
                </div>

                <div id="rehearsalFormMessage"></div>

                <div class="dancer-form-actions">
                    <button
                        type="submit"
                        class="dashboard-action"
                    >
                        Create Rehearsal
                    </button>

                    <button
                        type="button"
                        class="dashboard-secondary"
                        onclick="loadRehearsals()"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;

    document.getElementById("rehearsalForm").addEventListener(
        "submit",
        createRehearsal
    );
}

async function createRehearsal(event) {
    event.preventDefault();

    const message = document.getElementById("rehearsalFormMessage");

    const data = {
        title: document.getElementById("rehearsalTitle").value.trim(),
        rehearsal_date: document.getElementById("rehearsalDate").value,
        start_time: document.getElementById("rehearsalStart").value,
        end_time: document.getElementById("rehearsalEnd").value || null,
        location: document.getElementById("rehearsalLocation").value.trim() || null,
        description: document.getElementById("rehearsalDescription").value.trim() || null
    };

    try {
        const response = await fetch(`${API_URL}/api/rehearsals`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to create rehearsal");
        }

        loadRehearsals();
    } catch (error) {
        message.innerHTML = `
            <div class="form-message error">
                ${escapeHtml(error.message)}
            </div>
        `;
    }
}

async function editRehearsal(rehearsalId) {
    try {
        const response = await fetch(
            `${API_URL}/api/rehearsals/${rehearsalId}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load rehearsal");
        }

        const rehearsal = await response.json();

        pageContentElement.innerHTML = `
            <div class="welcome-section">
                <p class="section-label">REHEARSALS</p>
                <h2>Edit Rehearsal</h2>
                <p>Update rehearsal information.</p>
            </div>

            <div class="dashboard-card">
                <form id="editRehearsalForm">
                    <div class="form-group">
                        <label for="editRehearsalTitle">Title</label>
                        <input
                            type="text"
                            id="editRehearsalTitle"
                            value="${escapeHtml(rehearsal.title)}"
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label for="editRehearsalDate">Date</label>
                        <input
                            type="date"
                            id="editRehearsalDate"
                            value="${rehearsal.rehearsal_date}"
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label for="editRehearsalStart">Start Time</label>
                        <input
                            type="time"
                            id="editRehearsalStart"
                            value="${rehearsal.start_time || ""}"
                        >
                    </div>

                    <div class="form-group">
                        <label for="editRehearsalEnd">End Time</label>
                        <input
                            type="time"
                            id="editRehearsalEnd"
                            value="${rehearsal.end_time || ""}"
                        >
                    </div>

                    <div class="form-group">
                        <label for="editRehearsalLocation">Location</label>
                        <input
                            type="text"
                            id="editRehearsalLocation"
                            value="${escapeHtml(rehearsal.location || "")}"
                        >
                    </div>

                    <div class="form-group">
                        <label for="editRehearsalDescription">Description</label>
                        <input
                            type="text"
                            id="editRehearsalDescription"
                            value="${escapeHtml(rehearsal.description || "")}"
                        >
                    </div>

                    <div id="editRehearsalMessage"></div>

                    <div class="dancer-form-actions">
                        <button
                            type="submit"
                            class="dashboard-action"
                        >
                            Save Changes
                        </button>

                        <button
                            type="button"
                            class="dashboard-secondary"
                            onclick="loadRehearsals()"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById("editRehearsalForm").addEventListener(
            "submit",
            event => updateRehearsal(event, rehearsalId)
        );
    } catch (error) {
        alert(error.message);
    }
}

async function updateRehearsal(event, rehearsalId) {
    event.preventDefault();

    const message = document.getElementById("editRehearsalMessage");

    const data = {
        title: document.getElementById("editRehearsalTitle").value.trim(),
        rehearsal_date: document.getElementById("editRehearsalDate").value,
        start_time: document.getElementById("editRehearsalStart").value || null,
        end_time: document.getElementById("editRehearsalEnd").value || null,
        location: document.getElementById("editRehearsalLocation").value.trim() || null,
        description: document.getElementById("editRehearsalDescription").value.trim() || null
    };

    try {
        const response = await fetch(
            `${API_URL}/api/rehearsals/${rehearsalId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(data)
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to update rehearsal");
        }

        loadRehearsals();
    } catch (error) {
        message.innerHTML = `
            <div class="form-message error">
                ${escapeHtml(error.message)}
            </div>
        `;
    }
}

async function deleteRehearsal(rehearsalId) {
    if (!confirm("Delete this rehearsal? Attendance records may also be affected.")) {
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/api/rehearsals/${rehearsalId}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to delete rehearsal");
        }

        loadRehearsals();
    } catch (error) {
        alert(error.message);
    }
}





function showSettings() {

    pageContentElement.innerHTML = `

        <div class="welcome-section">

            <p class="section-label">
                ACCOUNT
            </p>

            <h2>
                Settings
            </h2>

            <p>
                Manage your account and security.
            </p>

        </div>

        <div class="dashboard-card settings-card">

            <div class="card-header">

                <div>
                    <p class="section-label">
                        SECURITY
                    </p>

                    <h3>
                        Change Password
                    </h3>
                </div>

            </div>

            <form id="changePasswordForm">

                <div class="form-group">

                    <label for="currentPassword">
                        Current Password
                    </label>

                    <input
                        type="password"
                        id="currentPassword"
                        required
                        autocomplete="current-password"
                    >

                </div>

                <div class="form-group">

                    <label for="newPassword">
                        New Password
                    </label>

                    <input
                        type="password"
                        id="newPassword"
                        required
                        minlength="8"
                        autocomplete="new-password"
                    >

                </div>

                <div class="form-group">

                    <label for="confirmPassword">
                        Confirm New Password
                    </label>

                    <input
                        type="password"
                        id="confirmPassword"
                        required
                        minlength="8"
                        autocomplete="new-password"
                    >

                </div>

                <button
                    type="submit"
                    class="dashboard-action"
                >
                    Change Password
                </button>

                <p
                    id="passwordMessage"
                    class="form-message"
                ></p>

            </form>

        </div>

        <div class="dashboard-card settings-danger-card">

            <div class="card-header">

                <div>
                    <p class="section-label">
                        DANGER ZONE
                    </p>

                    <h3>
                        Delete Account
                    </h3>
                </div>

            </div>

            <p>
                Your account will be disabled and you will be logged out.
                Your historical records will be preserved.
            </p>

            <button
                type="button"
                id="deleteAccountButton"
                class="dashboard-danger"
            >
                Delete My Account
            </button>

            <p
                id="deleteMessage"
                class="form-message"
            ></p>

        </div>
    `;

    document
        .getElementById("changePasswordForm")
        .addEventListener(
            "submit",
            changePassword
        );

    document
        .getElementById("deleteAccountButton")
        .addEventListener(
            "click",
            deleteAccount
        );
}

async function changePassword(event) {

    event.preventDefault();

    const currentPassword =
        document.getElementById("currentPassword").value;

    const newPassword =
        document.getElementById("newPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    const message =
        document.getElementById("passwordMessage");

    if (newPassword.length < 8) {
        message.textContent =
            "New password must be at least 8 characters.";
        return;
    }

    if (newPassword !== confirmPassword) {
        message.textContent =
            "New passwords do not match.";
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/auth/change-password`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            message.textContent =
                data.error ||
                "Unable to change password.";
            return;
        }

        message.textContent =
            "Password changed successfully.";

        document
            .getElementById("changePasswordForm")
            .reset();

    } catch (error) {

        message.textContent =
            "Unable to connect to the server.";
    }
}


async function deleteAccount() {

    const confirmed =
        window.confirm(
            "Are you sure you want to delete your account? Your account will be disabled and you will be logged out."
        );

    if (!confirmed) {
        return;
    }

    const password =
        window.prompt(
            "Enter your current password to confirm account deletion:"
        );

    if (!password) {
        return;
    }

    const message =
        document.getElementById("deleteMessage");

}



async function showOverview() {
    pageContentElement.innerHTML = `
        <div class="welcome-section">
            <p class="section-label">OVERVIEW</p>
            <h2>Welcome back, <span>${escapeHtml(usernameElement.textContent)}</span></h2>
            <p>Manage Dancing Stars from one place.</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <span class="stat-label">DANCERS</span>
                <strong class="stat-value" id="overviewDancerCount">—</strong>
                <span class="stat-description">Active members</span>
            </div>

            <div class="stat-card">
                <span class="stat-label">REHEARSALS</span>
                <strong class="stat-value" id="overviewRehearsalCount">—</strong>
                <span class="stat-description">Upcoming rehearsals</span>
            </div>

            <div class="stat-card">
                <span class="stat-label">ATTENDANCE</span>
                <strong class="stat-value" id="overviewAttendanceRate">—</strong>
                <span class="stat-description">Latest rehearsal</span>
            </div>

            <div class="stat-card">
                <span class="stat-label">DANCES</span>
                <strong class="stat-value" id="overviewDanceCount">—</strong>
                <span class="stat-description">In the library</span>
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="dashboard-card">
                <div class="card-header">
                    <div>
                        <p class="section-label">NEXT</p>
                        <h3>Upcoming Rehearsal</h3>
                    </div>
                </div>

                <div id="overviewNextRehearsal" class="empty-state">
                    Loading...
                </div>
            </div>

            <div class="dashboard-card">
                <div class="card-header">
                    <div>
                        <p class="section-label">RECENT</p>
                        <h3>Recent Activity</h3>
                    </div>
                </div>

                <div class="empty-state">
                    Activity history will appear here.
                </div>
            </div>
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/api/dashboard/overview`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to load dashboard overview");
        }

        const data = await response.json();

        document.getElementById("overviewDancerCount").textContent =
            data.dancers;

        document.getElementById("overviewRehearsalCount").textContent =
            data.upcoming_rehearsals;

        document.getElementById("overviewAttendanceRate").textContent =
            data.attendance_rate === null
                ? "—"
                : `${data.attendance_rate}%`;

        document.getElementById("overviewDanceCount").textContent =
            data.dances;

        const nextRehearsalElement =
            document.getElementById("overviewNextRehearsal");

        if (!data.next_rehearsal) {
            nextRehearsalElement.innerHTML = `
                <div class="empty-state">
                    No upcoming rehearsal.
                </div>
            `;
            return;
        }

        const rehearsal = data.next_rehearsal;

        nextRehearsalElement.innerHTML = `
            <div class="overview-rehearsal">
                <strong>${escapeHtml(rehearsal.title)}</strong>

                <span>
                    ${formatAttendanceDate(rehearsal.date)}
                </span>

                <span>
                    ${rehearsal.start_time
                        ? formatAttendanceTime(rehearsal.start_time)
                        : ""}
                    ${rehearsal.location
                        ? ` • ${escapeHtml(rehearsal.location)}`
                        : ""}
                </span>
            </div>
        `;
    } catch (error) {
        console.error(error);

        document.getElementById("overviewDancerCount").textContent = "—";
        document.getElementById("overviewRehearsalCount").textContent = "—";
        document.getElementById("overviewAttendanceRate").textContent = "—";
        document.getElementById("overviewDanceCount").textContent = "—";

        document.getElementById("overviewNextRehearsal").innerHTML = `
            <div class="form-message error">
                Unable to load dashboard information.
            </div>
        `;
    }
}




async function loadDancers() {

    pageContentElement.innerHTML = `
        <div class="welcome-section">
            <p class="section-label">MEMBERS</p>
            <h2>Dancers</h2>
            <p>Manage the Dancing Stars members.</p>
        </div>

        <div class="dancers-toolbar">

            <input
                type="search"
                id="dancerSearch"
                placeholder="Search dancers..."
            >

            <button
                type="button"
                id="addDancerButton"
                class="dashboard-action"
            >
                + Add Dancer
            </button>

        </div>

        <div id="dancersList" class="dancers-list">
            <div class="empty-state">
                Loading dancers...
            </div>
        </div>
    `;

    const searchInput =
        document.getElementById("dancerSearch");

    searchInput.addEventListener(
        "input",
        renderDancers
    );

    const addButton =
        document.getElementById("addDancerButton");

    addButton.addEventListener(
        "click",
        showAddDancerForm
    );

    try {

        const response = await fetch(
            `${API_URL}/api/dancers`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {

            const data = await response.json();

            throw new Error(
                data.error || "Unable to load dancers."
            );
        }

        const data = await response.json();

        dancers = data.dancers || [];

        renderDancers();

    } catch (error) {

        document.getElementById(
            "dancersList"
        ).innerHTML = `
            <div class="empty-state">
                ${escapeHtml(error.message)}
            </div>
        `;
    }
}


function renderDancers() {

    const list =
        document.getElementById("dancersList");

    if (!list) {
        return;
    }

    const searchInput =
        document.getElementById("dancerSearch");

    const search =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

    const filtered =
        dancers.filter(dancer =>
            dancer.username
                .toLowerCase()
                .includes(search)
        );

    if (filtered.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                No dancers found.
            </div>
        `;

        return;
    }

    list.innerHTML = filtered.map(dancer => {

        const initial =
            dancer.username
                .charAt(0)
                .toUpperCase();

        const status =
            dancer.status === "ACTIVE"
                ? "Active"
                : "Disabled";

        return `
            <div class="dancer-card">

                <div class="dancer-avatar">
                    ${initial}
                </div>

                <div class="dancer-info">

                    <strong>
                        ${escapeHtml(dancer.username)}
                    </strong>

                    <span class="dancer-status ${dancer.status.toLowerCase()}">
                        ${status}
                    </span>

                </div>

                <button
                    type="button"
                    class="dancer-view-button"
                    data-id="${dancer.id}"
                >
                    View
                </button>

            </div>
        `;

    }).join("");

    document
        .querySelectorAll(".dancer-view-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(button.dataset.id);

                    showDancer(id);
                }
            );
        });
}


function showDancer(id) {

    const dancer =
        dancers.find(
            item => item.id === id
        );

    if (!dancer) {
        return;
    }

    pageContentElement.innerHTML = `

        <div class="welcome-section">

            <p class="section-label">
                DANCER
            </p>

            <h2>
                ${escapeHtml(dancer.username)}
            </h2>

            <p>
                Dancer profile
            </p>

        </div>

        <div class="dashboard-card dancer-profile">

            <div class="dancer-profile-avatar">
                ${escapeHtml(
                    dancer.username
                        .charAt(0)
                        .toUpperCase()
                )}
            </div>

            <h3>
                ${escapeHtml(dancer.username)}
            </h3>

            <p>
                Status:
                <strong>
                    ${escapeHtml(dancer.status)}
                </strong>
            </p>

            <button
                type="button"
                id="backToDancers"
                class="dashboard-action"
            >
                ← Back to Dancers
            </button>

        </div>
    `;

    document
        .getElementById("backToDancers")
        .addEventListener(
            "click",
            loadDancers
        );
}


function showAddDancerForm() {

    pageContentElement.innerHTML = `

        <div class="welcome-section">

            <p class="section-label">
                MEMBERS
            </p>

            <h2>
                Add Dancer
            </h2>

            <p>
                Create a new Dancing Stars account.
            </p>

        </div>

        <div class="dashboard-card">

            <form id="addDancerForm">

                <div class="form-group">

                    <label for="newDancerUsername">
                        Username
                    </label>

                    <input
                        type="text"
                        id="newDancerUsername"
                        required
                        autocomplete="off"
                        placeholder="Enter username"
                    >

                </div>

                <div class="dancer-form-actions">

                    <button
                        type="submit"
                        class="dashboard-action"
                    >
                        Create Dancer
                    </button>

                    <button
                        type="button"
                        id="cancelDancer"
                        class="dashboard-secondary"
                    >
                        Cancel
                    </button>

                </div>

                <p
                    id="dancerFormMessage"
                    class="form-message"
                ></p>

            </form>

        </div>
    `;

    document
        .getElementById("cancelDancer")
        .addEventListener(
            "click",
            loadDancers
        );

    document
        .getElementById("addDancerForm")
        .addEventListener(
            "submit",
            createDancer
        );
}


async function createDancer(event) {

    event.preventDefault();

    const username =
        document
            .getElementById(
                "newDancerUsername"
            )
            .value
            .trim();

    const message =
        document.getElementById(
            "dancerFormMessage"
        );

    if (!username) {
        message.textContent =
            "Username is required.";
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/dancers`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify({
                    username
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok) {

            message.textContent =
                data.error ||
                "Unable to create dancer.";

            return;
        }

        loadDancers();

    } catch (error) {

        message.textContent =
            "Unable to connect to the server.";
    }
}


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


function showPasswordWarning() {

    if (document.getElementById("passwordWarning")) {
        return;
    }

    const warning =
        document.createElement("div");

    warning.id = "passwordWarning";

    warning.textContent =
        "Please change your initial password in Settings.";

    warning.style.padding = "12px 16px";
    warning.style.margin = "15px 40px 0";
    warning.style.border =
        "1px solid rgba(255,255,255,0.12)";
    warning.style.borderRadius = "10px";
    warning.style.background =
        "rgba(255,255,255,0.04)";
    warning.style.fontSize = "13px";
    warning.style.opacity = "0.7";

    document
        .querySelector(".main-content")
        .prepend(warning);
}


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


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


logoutButton.addEventListener(
    "click",
    logout
);


loadUser();

