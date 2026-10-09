
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
    birthdays: null,
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
    birthdays: "Birthdays",
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

const profilePictureModal = document.getElementById("profilePictureModal");
const profilePictureInput = document.getElementById("profilePictureInput");
const profilePictureCanvas = document.getElementById("profilePictureCanvas");
const closeProfilePictureModal = document.getElementById("closeProfilePictureModal");
const zoomOutButton = document.getElementById("zoomOutButton");
const zoomInButton = document.getElementById("zoomInButton");
const saveProfilePictureButton = document.getElementById("saveProfilePictureButton");

let currentUser = null;
let dancers = [];

let profileImage = null;
let profileOriginalFile = null;
let profileScale = 1;
let profileOffsetX = 0;
let profileOffsetY = 0;
let profileDragging = false;
let profileDragStartX = 0;
let profileDragStartY = 0;
let profileStartOffsetX = 0;
let profileStartOffsetY = 0;

const protectedImageUrls = new Set();

function revokeProtectedImageUrls() {
    protectedImageUrls.forEach(url => {
        URL.revokeObjectURL(url);
    });

    protectedImageUrls.clear();
}

async function fetchProtectedImage(url) {
    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error("Unable to load protected image");
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    protectedImageUrls.add(objectUrl);

    return objectUrl;
}

async function loadUserProfilePicture() {
    if (!currentUser || !avatarElement) {
        return;
    }

    try {
        const imageUrl = await fetchProtectedImage(
            `${API_URL}/api/profile/picture`
        );

        avatarElement.innerHTML = "";

        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = `${currentUser.username} profile picture`;

        avatarElement.appendChild(image);
    } catch (error) {
        avatarElement.textContent =
            currentUser.username.charAt(0).toUpperCase();
    }
}

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
        setupProfilePicture();

        await loadUserProfilePicture();


        if (user.must_change_password) {
            showPasswordWarning();
        }

        showOverview();

        await checkAndShowBirthdayPopup();


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

        if (
            isAdmin ||
            !requiredPermission ||
            permissions.includes(requiredPermission)
        ) {
            navItem.style.display = "flex";
        } else {
            navItem.style.display = "none";
        }
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
            loadRoles();
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

        case "birthdays":
            loadBirthdays();
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



function setupProfilePicture() {
    if (!profilePictureModal) {
        return;
    }

    avatarElement.addEventListener(
        "click",
        openProfilePictureEditor
    );

    closeProfilePictureModal.addEventListener(
        "click",
        closeProfilePictureEditor
    );

    profilePictureInput.addEventListener(
        "change",
        handleProfilePictureSelection
    );

    zoomInButton.addEventListener(
        "click",
        () => {
            profileScale = Math.min(
                profileScale + 0.1,
                5
            );

            drawProfilePicture();
        }
    );

    zoomOutButton.addEventListener(
        "click",
        () => {
            profileScale = Math.max(
                profileScale - 0.1,
                0.5
            );

            drawProfilePicture();
        }
    );

    saveProfilePictureButton.addEventListener(
        "click",
        saveProfilePicture
    );

    profilePictureCanvas.addEventListener(
        "pointerdown",
        startProfilePictureDrag
    );

    window.addEventListener(
        "pointermove",
        moveProfilePictureDrag
    );

    window.addEventListener(
        "pointerup",
        stopProfilePictureDrag
    );

    profilePictureModal.addEventListener(
        "click",
        event => {
            if (event.target === profilePictureModal) {
                closeProfilePictureEditor();
            }
        }
    );
}

function openProfilePictureEditor() {
    profilePictureModal.classList.add("open");
    profilePictureModal.setAttribute(
        "aria-hidden",
        "false"
    );

    profilePictureInput.value = "";

    if (profileImage) {
        drawProfilePicture();
    }
}

function closeProfilePictureEditor() {
    profilePictureModal.classList.remove("open");
    profilePictureModal.setAttribute(
        "aria-hidden",
        "true"
    );

    profileDragging = false;
}

function handleProfilePictureSelection(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        alert("Please choose a JPEG, PNG, or WEBP image.");
        profilePictureInput.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("The image must be smaller than 5 MB.");
        profilePictureInput.value = "";
        return;
    }

    profileOriginalFile = file;

    const reader = new FileReader();

    reader.onload = event => {
        const image = new Image();

        image.onload = () => {
            profileImage = image;

            const canvasSize = profilePictureCanvas.width;

            const scaleX =
                canvasSize / image.width;

            const scaleY =
                canvasSize / image.height;

            profileScale =
                Math.max(scaleX, scaleY);

            profileScale =
                Math.max(profileScale, 1);

            profileOffsetX =
                (canvasSize - image.width * profileScale) / 2;

            profileOffsetY =
                (canvasSize - image.height * profileScale) / 2;

            drawProfilePicture();
        };

        image.src = event.target.result;
    };

    reader.readAsDataURL(file);
}

function drawProfilePicture() {
    if (!profileImage) {
        return;
    }

    const canvas = profilePictureCanvas;
    const context = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    context.clearRect(
        0,
        0,
        width,
        height
    );

    context.fillStyle = "#111116";

    context.fillRect(
        0,
        0,
        width,
        height
    );

    context.drawImage(
        profileImage,
        profileOffsetX,
        profileOffsetY,
        profileImage.width * profileScale,
        profileImage.height * profileScale
    );
}

function startProfilePictureDrag(event) {
    if (!profileImage) {
        return;
    }

    profileDragging = true;

    profileDragStartX = event.clientX;
    profileDragStartY = event.clientY;

    profileStartOffsetX = profileOffsetX;
    profileStartOffsetY = profileOffsetY;

    profilePictureCanvas.setPointerCapture(event.pointerId);
}

function moveProfilePictureDrag(event) {
    if (!profileDragging) {
        return;
    }

    const deltaX =
        event.clientX - profileDragStartX;

    const deltaY =
        event.clientY - profileDragStartY;

    profileOffsetX =
        profileStartOffsetX + deltaX;

    profileOffsetY =
        profileStartOffsetY + deltaY;

    drawProfilePicture();
}

function stopProfilePictureDrag() {
    profileDragging = false;
}

async function saveProfilePicture() {
    if (!profileOriginalFile || !profileImage) {
        alert("Please choose a picture first.");
        return;
    }

    saveProfilePictureButton.disabled = true;
    saveProfilePictureButton.textContent = "Saving...";

    try {
        const croppedBlob =
            await createCroppedProfilePicture();

        if (!croppedBlob) {
            throw new Error(
                "Unable to create cropped picture."
            );
        }

        const formData = new FormData();

        formData.append(
            "original",
            profileOriginalFile,
            profileOriginalFile.name
        );

        formData.append(
            "cropped",
            croppedBlob,
            "profile-picture.jpg"
        );

        const response = await fetch(
            `${API_URL}/api/profile/picture`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Unable to save profile picture."
            );
        }

        closeProfilePictureEditor();

        await loadUserProfilePicture();

        alert(
            "Profile picture updated successfully."
        );
    } catch (error) {
        console.error(error);

        alert(error.message);
    } finally {
        saveProfilePictureButton.disabled = false;
        saveProfilePictureButton.textContent =
            "Save Profile Picture";
    }
}

function createCroppedProfilePicture() {
    return new Promise(resolve => {
        const outputCanvas =
            document.createElement("canvas");

        outputCanvas.width = 600;
        outputCanvas.height = 600;

        const context =
            outputCanvas.getContext("2d");

        context.drawImage(
            profilePictureCanvas,
            0,
            0,
            600,
            600
        );

        outputCanvas.toBlob(
            blob => {
                resolve(blob);
            },
            "image/jpeg",
            0.9
        );
    });
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
        const response = await fetch(
            `${API_URL}/api/attendance/rehearsals`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                "Failed to load rehearsals"
            );
        }

        const data = await response.json();

        const container =
            document.getElementById(
                "attendanceRehearsals"
            );

        if (
            !data.rehearsals ||
            data.rehearsals.length === 0
        ) {
            container.innerHTML = `
                <div class="empty-state">
                    No rehearsals available.
                </div>
            `;

            return;
        }

        container.className =
            "attendance-rehearsals";

        container.innerHTML =
            data.rehearsals.map(rehearsal => `
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

        document.getElementById(
            "attendanceRehearsals"
        ).innerHTML = `
            <div class="form-message error">
                Unable to load rehearsals.
            </div>
        `;
    }
}

async function loadRoles() {
    pageContentElement.innerHTML = `
        <div class="page-header">
            <div>
                <p class="section-label">ACCESS CONTROL</p>
                <h2>Roles</h2>
                <p>Create roles and control what users are allowed to do.</p>
            </div>

            <button
                class="primary-button"
                type="button"
                onclick="showCreateRole()"
            >
                + Create Role
            </button>
        </div>

        <div id="rolesMessage"></div>

        <div id="rolesList" class="roles-list">
            <div class="empty-state">
                Loading roles...
            </div>
        </div>
    `;

    try {
        const response = await fetch(
            `${API_URL}/api/roles`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                "Failed to load roles"
            );
        }

        const data = await response.json();

        renderRoles(data.roles);
    } catch (error) {
        console.error(error);

        document.getElementById(
            "rolesList"
        ).innerHTML = `
            <div class="form-message error">
                Unable to load roles.
            </div>
        `;
    }
}

function renderRoles(roles) {
    const rolesList =
        document.getElementById("rolesList");

    if (!roles.length) {
        rolesList.innerHTML = `
            <div class="empty-state">
                No roles have been created yet.
            </div>
        `;

        return;
    }

    rolesList.innerHTML =
        roles.map(role => `
            <div class="role-card">

                <div class="role-card-header">

                    <div>
                        <p class="section-label">
                            ROLE
                        </p>

                        <h3>
                            ${escapeHtml(role.name)}
                        </h3>

                        <p class="role-description">
                            ${escapeHtml(
                                role.description ||
                                "No description"
                            )}
                        </p>
                    </div>

                    <div class="role-actions">

                        <button
                            class="secondary-button"
                            type="button"
                            onclick="editRole(
                                ${role.id},
                                '${escapeHtml(role.name)}',
                                '${escapeHtml(
                                    role.description || ""
                                )}'
                            )"
                        >
                            Edit
                        </button>

                        <button
                            class="danger-button"
                            type="button"
                            onclick="deleteRole(
                                ${role.id},
                                '${escapeHtml(role.name)}'
                            )"
                        >
                            Delete
                        </button>

                    </div>

                </div>

                <div class="role-permissions">

                    <span class="permission-label">
                        Permissions
                    </span>

                    <div class="permission-list">

                        ${
                            role.permissions.length
                            ? role.permissions.map(
                                permission => `
                                    <span class="permission-tag">
                                        ${escapeHtml(
                                            permission.name
                                        )}
                                    </span>
                                `
                            ).join("")
                            : `
                                <span class="no-permissions">
                                    No permissions assigned
                                </span>
                            `
                        }

                    </div>

                </div>

                <div class="role-card-buttons">

                    <button
                        class="permission-button"
                        type="button"
                        onclick="manageRolePermissions(
                            ${role.id},
                            '${escapeHtml(role.name)}'
                        )"
                    >
                        Manage Permissions
                    </button>

                    <button
                        class="permission-button"
                        type="button"
                        onclick="manageRoleUsers(
                            ${role.id},
                            '${escapeHtml(role.name)}'
                        )"
                    >
                        Assign Users
                    </button>

                </div>

            </div>
        `).join("");
}

function showCreateRole() {
    pageContentElement.innerHTML = `
        <div class="page-header">

            <div>
                <p class="section-label">
                    ROLES
                </p>

                <h2>
                    Create Role
                </h2>

                <p>
                    Create a permission bundle for users.
                </p>
            </div>

            <button
                class="secondary-button"
                type="button"
                onclick="loadRoles()"
            >
                ← Back
            </button>

        </div>

        <div class="form-card">

            <form id="createRoleForm">

                <div class="form-group">

                    <label for="roleName">
                        Role Name
                    </label>

                    <input
                        id="roleName"
                        type="text"
                        placeholder="e.g. Dance Captain"
                        required
                    >

                </div>

                <div class="form-group">

                    <label for="roleDescription">
                        Description
                    </label>

                    <textarea
                        id="roleDescription"
                        placeholder="Describe what this role is for"
                        rows="4"
                    ></textarea>

                </div>

                <div id="createRoleMessage"></div>

                <button
                    class="primary-button"
                    type="submit"
                >
                    Create Role
                </button>

            </form>

        </div>
    `;

    document
        .getElementById("createRoleForm")
        .addEventListener(
            "submit",
            createRole
        );
}

async function createRole(event) {
    event.preventDefault();

    const name =
        document.getElementById(
            "roleName"
        ).value.trim();

    const description =
        document.getElementById(
            "roleDescription"
        ).value.trim();

    const messageElement =
        document.getElementById(
            "createRoleMessage"
        );

    if (!name) {
        messageElement.innerHTML = `
            <div class="form-message error">
                Role name is required.
            </div>
        `;

        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/api/roles`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    description
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Failed to create role"
            );
        }

        loadRoles();
    } catch (error) {
        messageElement.innerHTML = `
            <div class="form-message error">
                ${escapeHtml(error.message)}
            </div>
        `;
    }
}

function editRole(id, name, description) {
    pageContentElement.innerHTML = `
        <div class="page-header">

            <div>
                <p class="section-label">
                    ROLES
                </p>

                <h2>
                    Edit Role
                </h2>

                <p>
                    Update the role information.
                </p>
            </div>

            <button
                class="secondary-button"
                type="button"
                onclick="loadRoles()"
            >
                ← Back
            </button>

        </div>

        <div class="form-card">

            <form id="editRoleForm">

                <div class="form-group">

                    <label for="editRoleName">
                        Role Name
                    </label>

                    <input
                        id="editRoleName"
                        type="text"
                        value="${escapeHtml(name)}"
                        required
                    >

                </div>

                <div class="form-group">

                    <label for="editRoleDescription">
                        Description
                    </label>

                    <textarea
                        id="editRoleDescription"
                        rows="4"
                    >${escapeHtml(description)}</textarea>

                </div>

                <div id="editRoleMessage"></div>

                <button
                    class="primary-button"
                    type="submit"
                >
                    Save Changes
                </button>

            </form>

        </div>
    `;

    document
        .getElementById("editRoleForm")
        .addEventListener(
            "submit",
            async event => {
                event.preventDefault();

                const newName =
                    document
                        .getElementById(
                            "editRoleName"
                        )
                        .value
                        .trim();

                const newDescription =
                    document
                        .getElementById(
                            "editRoleDescription"
                        )
                        .value
                        .trim();

                const messageElement =
                    document.getElementById(
                        "editRoleMessage"
                    );

                try {
                    const response =
                        await fetch(
                            `${API_URL}/api/roles/${id}`,
                            {
                                method: "PUT",
                                headers: {
                                    "Content-Type":
                                        "application/json",
                                    "Authorization":
                                        `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    name: newName,
                                    description:
                                        newDescription
                                })
                            }
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.error ||
                            "Failed to update role"
                        );
                    }

                    loadRoles();
                } catch (error) {
                    messageElement.innerHTML = `
                        <div class="form-message error">
                            ${escapeHtml(
                                error.message
                            )}
                        </div>
                    `;
                }
            }
        );
}

async function deleteRole(id, name) {
    const confirmed =
        confirm(
            `Delete the role "${name}"? This will also remove its permissions and assignments.`
        );

    if (!confirmed) {
        return;
    }

    try {
        const response =
            await fetch(
                `${API_URL}/api/roles/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Failed to delete role"
            );
        }

        loadRoles();
    } catch (error) {
        alert(error.message);
    }
}

async function manageRolePermissions(
    roleId,
    roleName
) {
    pageContentElement.innerHTML = `
        <div class="page-header">

            <div>
                <p class="section-label">
                    ROLES
                </p>

                <h2>
                    ${escapeHtml(roleName)}
                </h2>

                <p>
                    Choose the permissions for this role.
                </p>
            </div>

            <button
                class="secondary-button"
                type="button"
                onclick="loadRoles()"
            >
                ← Back
            </button>

        </div>

        <div id="permissionsContainer">
            <div class="empty-state">
                Loading permissions...
            </div>
        </div>
    `;

    try {
        const [
            rolesResponse,
            permissionsResponse
        ] = await Promise.all([
            fetch(
                `${API_URL}/api/roles`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            ),
            fetch(
                `${API_URL}/api/roles/permissions`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            )
        ]);

        if (
            !rolesResponse.ok ||
            !permissionsResponse.ok
        ) {
            throw new Error(
                "Failed to load permissions"
            );
        }

        const rolesData =
            await rolesResponse.json();

        const permissionsData =
            await permissionsResponse.json();

        const role =
            rolesData.roles.find(
                item => item.id === roleId
            );

        if (!role) {
            throw new Error(
                "Role not found"
            );
        }

        renderRolePermissions(
            role,
            permissionsData.permissions
        );
    } catch (error) {
        document.getElementById(
            "permissionsContainer"
        ).innerHTML = `
            <div class="form-message error">
                ${escapeHtml(error.message)}
            </div>
        `;
    }
}

function renderRolePermissions(
    role,
    permissions
) {
    const assignedPermissions =
        new Set(
            role.permissions.map(
                permission => permission.id
            )
        );

    document.getElementById(
        "permissionsContainer"
    ).innerHTML = `
        <div class="form-card">

            <form id="permissionsForm">

                <div class="permissions-grid">

                    ${permissions.map(permission => `
                        <label class="permission-option">

                            <input
                                type="checkbox"
                                name="permission"
                                value="${permission.id}"
                                ${
                                    assignedPermissions.has(
                                        permission.id
                                    )
                                        ? "checked"
                                        : ""
                                }
                            >

                            <span>
                                <strong>
                                    ${escapeHtml(
                                        permission.name
                                    )}
                                </strong>

                                <small>
                                    ${escapeHtml(
                                        permission.description ||
                                        ""
                                    )}
                                </small>
                            </span>

                        </label>
                    `).join("")}

                </div>

                <div id="permissionsMessage"></div>

                <button
                    class="primary-button"
                    type="submit"
                >
                    Save Permissions
                </button>

            </form>

        </div>
    `;

    document
        .getElementById("permissionsForm")
        .addEventListener(
            "submit",
            async event => {
                event.preventDefault();

                const selectedPermissions =
                    Array.from(
                        document.querySelectorAll(
                            '#permissionsForm input[name="permission"]:checked'
                        )
                    ).map(
                        input => Number(input.value)
                    );

                const messageElement =
                    document.getElementById(
                        "permissionsMessage"
                    );

                try {
                    const response =
                        await fetch(
                            `${API_URL}/api/roles/${role.id}/permissions`,
                            {
                                method: "PUT",
                                headers: {
                                    "Content-Type":
                                        "application/json",
                                    "Authorization":
                                        `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    permission_ids:
                                        selectedPermissions
                                })
                            }
                        );

                    const data =
                        await response.json();

                    if (!response.ok) {
                        throw new Error(
                            data.error ||
                            "Failed to update permissions"
                        );
                    }

                    loadRoles();
                } catch (error) {
                    messageElement.innerHTML = `
                        <div class="form-message error">
                            ${escapeHtml(
                                error.message
                            )}
                        </div>
                    `;
                }
            }
        );
}

async function manageRoleUsers(
    roleId,
    roleName
) {
    pageContentElement.innerHTML = `
        <div class="page-header">

            <div>
                <p class="section-label">
                    ROLES
                </p>

                <h2>
                    Assign Users
                </h2>

                <p>
                    Assign users to
                    ${escapeHtml(roleName)}.
                </p>
            </div>

            <button
                class="secondary-button"
                type="button"
                onclick="loadRoles()"
            >
                ← Back
            </button>

        </div>

        <div id="roleUsersContainer">
            <div class="empty-state">
                Loading users...
            </div>
        </div>
    `;

    try {
        const [
            usersResponse,
            roleUsersResponse
        ] = await Promise.all([
            fetch(
                `${API_URL}/api/dancers`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            ),
            fetch(
                `${API_URL}/api/roles/${roleId}/users`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            )
        ]);

        if (
            !usersResponse.ok ||
            !roleUsersResponse.ok
        ) {
            throw new Error(
                "Failed to load users"
            );
        }

        const usersData =
            await usersResponse.json();

        const roleUsersData =
            await roleUsersResponse.json();

        const assignedUserIds =
            new Set(
                roleUsersData.users.map(
                    user => user.id
                )
            );

        renderRoleUsers(
            roleId,
            roleName,
            usersData.dancers,
            assignedUserIds
        );
    } catch (error) {
        document.getElementById(
            "roleUsersContainer"
        ).innerHTML = `
            <div class="form-message error">
                ${escapeHtml(error.message)}
            </div>
        `;
    }
}

function renderRoleUsers(
    roleId,
    roleName,
    users,
    assignedUserIds
) {
    document.getElementById(
        "roleUsersContainer"
    ).innerHTML = `
        <div class="assign-users-layout">

            <aside class="assign-users-sidebar">

                <div class="assign-role-info">

                    <span class="assign-role-label">
                        ROLE
                    </span>

                    <h3>
                        ${escapeHtml(roleName)}
                    </h3>

                    <p>
                        Manage which users have this role.
                    </p>

                </div>

                <nav class="assign-users-tabs">

                    <button
                        type="button"
                        class="assign-tab active"
                        data-tab="all"
                    >
                        <span>
                            All Users
                        </span>

                        <small>
                            ${users.length}
                        </small>
                    </button>

                    <button
                        type="button"
                        class="assign-tab"
                        data-tab="assigned"
                    >
                        <span>
                            Assigned
                        </span>

                        <small>
                            ${assignedUserIds.size}
                        </small>
                    </button>

                </nav>

            </aside>

            <div class="assign-users-main">

                <div class="assign-users-header">

                    <div>

                        <span class="section-label">
                            USER ASSIGNMENTS
                        </span>

                        <h3>
                            Select Users
                        </h3>

                        <p>
                            Choose the users who should have this role.
                        </p>

                    </div>

                    <div class="assign-users-count">

                        <strong id="selectedUsersCount">
                            ${assignedUserIds.size}
                        </strong>

                        <span>
                            selected
                        </span>

                    </div>

                </div>

                <div class="assign-users-toolbar">

                    <div class="assign-search">

                        <span>
                            ⌕
                        </span>

                        <input
                            type="text"
                            id="roleUsersSearch"
                            placeholder="Search users..."
                            autocomplete="off"
                        >

                    </div>

                </div>

                <form id="roleUsersForm">

                    <div
                        class="role-users-list"
                        id="roleUsersList"
                    >

                        ${
                            users.length
                            ? users.map(user => `
                                <label
                                    class="role-user-option"
                                    data-user-id="${user.id}"
                                    data-username="${escapeHtml(
                                        user.username.toLowerCase()
                                    )}"
                                    data-status="${escapeHtml(
                                        user.status.toLowerCase()
                                    )}"
                                    data-assigned="${
                                        assignedUserIds.has(
                                            user.id
                                        )
                                    }"
                                >

                                    <div class="role-user-check">

                                        <input
                                            type="checkbox"
                                            value="${user.id}"
                                            ${
                                                assignedUserIds.has(
                                                    user.id
                                                )
                                                    ? "checked"
                                                    : ""
                                            }
                                        >

                                        <span class="custom-check"></span>

                                    </div>

                                    <div class="role-user-avatar">
                                        ${escapeHtml(
                                            user.username
                                                .charAt(0)
                                                .toUpperCase()
                                        )}
                                    </div>

                                    <span class="role-user-details">

                                        <strong>
                                            ${escapeHtml(
                                                user.username
                                            )}
                                        </strong>

                                        <small>
                                            ${escapeHtml(
                                                user.status
                                            )}
                                        </small>

                                    </span>

                                    <span
                                        class="role-user-status ${
                                            user.status === "ACTIVE"
                                                ? "active"
                                                : "inactive"
                                        }"
                                    >
                                        ${escapeHtml(
                                            user.status
                                        )}
                                    </span>

                                </label>
                            `).join("")
                            : `
                                <div class="empty-state">
                                    No dancers found.
                                </div>
                            `
                        }

                    </div>

                    <div
                        id="roleUsersEmptySearch"
                        class="assign-empty-search"
                        style="display: none;"
                    >
                        No users match your search.
                    </div>

                    <div id="roleUsersMessage"></div>

                    <div class="assign-users-footer">

                        <span>
                            Changes will apply to
                            <strong id="footerSelectedCount">
                                ${assignedUserIds.size}
                            </strong>
                            users.
                        </span>

                        <button
                            class="primary-button"
                            type="submit"
                        >
                            Save Assignments
                        </button>

                    </div>

                </form>

            </div>

        </div>
    `;

    const form =
        document.getElementById(
            "roleUsersForm"
        );

    const searchInput =
        document.getElementById(
            "roleUsersSearch"
        );

    const userOptions =
        Array.from(
            document.querySelectorAll(
                ".role-user-option"
            )
        );

    const tabs =
        Array.from(
            document.querySelectorAll(
                ".assign-tab"
            )
        );

    const selectedCountElement =
        document.getElementById(
            "selectedUsersCount"
        );

    const footerSelectedCount =
        document.getElementById(
            "footerSelectedCount"
        );

    const emptySearchElement =
        document.getElementById(
            "roleUsersEmptySearch"
        );

    function updateSelectedCount() {
        const selectedCount =
            document.querySelectorAll(
                '#roleUsersForm input[type="checkbox"]:checked'
            ).length;

        selectedCountElement.textContent =
            selectedCount;

        footerSelectedCount.textContent =
            selectedCount;
    }

    function applyFilters() {
        const searchTerm =
            searchInput.value
                .trim()
                .toLowerCase();

        const activeTab =
            document
                .querySelector(
                    ".assign-tab.active"
                )
                ?.dataset.tab ||
            "all";

        let visibleCount = 0;

        userOptions.forEach(option => {
            const username =
                option.dataset.username ||
                "";

            const status =
                option.dataset.status ||
                "";

            const assigned =
                option.dataset.assigned ===
                "true";

            const matchesSearch =
                username.includes(searchTerm) ||
                status.includes(searchTerm);

            const matchesTab =
                activeTab === "all" ||
                (
                    activeTab === "assigned" &&
                    assigned
                );

            const visible =
                matchesSearch &&
                matchesTab;

            option.style.display =
                visible
                    ? "flex"
                    : "none";

            if (visible) {
                visibleCount++;
            }
        });

        emptySearchElement.style.display =
            visibleCount === 0 &&
            userOptions.length
                ? "block"
                : "none";
    }

    tabs.forEach(tab => {
        tab.addEventListener(
            "click",
            () => {
                tabs.forEach(item => {
                    item.classList.remove(
                        "active"
                    );
                });

                tab.classList.add(
                    "active"
                );

                applyFilters();
            }
        );
    });

    searchInput.addEventListener(
        "input",
        applyFilters
    );

    document
        .querySelectorAll(
            '#roleUsersForm input[type="checkbox"]'
        )
        .forEach(input => {
            input.addEventListener(
                "change",
                () => {
                    const option =
                        input.closest(
                            ".role-user-option"
                        );

                    option.dataset.assigned =
                        input.checked
                            ? "true"
                            : "false";

                    updateSelectedCount();

                    const assignedTab =
                        document.querySelector(
                            '.assign-tab[data-tab="assigned"] small'
                        );

                    const assignedCount =
                        document.querySelectorAll(
                            '#roleUsersForm input[type="checkbox"]:checked'
                        ).length;

                    assignedTab.textContent =
                        assignedCount;
                }
            );
        });

    updateSelectedCount();

    form.addEventListener(
        "submit",
        async event => {
            event.preventDefault();

            const selectedIds =
                new Set(
                    Array.from(
                        document.querySelectorAll(
                            '#roleUsersForm input[type="checkbox"]:checked'
                        )
                    ).map(
                        input => Number(
                            input.value
                        )
                    )
                );

            const messageElement =
                document.getElementById(
                    "roleUsersMessage"
                );

            try {
                const currentResponse =
                    await fetch(
                        `${API_URL}/api/roles/${roleId}/users`,
                        {
                            headers: {
                                "Authorization":
                                    `Bearer ${token}`
                            }
                        }
                    );

                if (!currentResponse.ok) {
                    throw new Error(
                        "Failed to load current assignments"
                    );
                }

                const currentData =
                    await currentResponse.json();

                const currentIds =
                    new Set(
                        currentData.users.map(
                            user => user.id
                        )
                    );

                for (const userId of selectedIds) {
                    if (!currentIds.has(userId)) {
                        const response =
                            await fetch(
                                `${API_URL}/api/roles/${roleId}/users/${userId}`,
                                {
                                    method: "POST",
                                    headers: {
                                        "Authorization":
                                            `Bearer ${token}`
                                    }
                                }
                            );

                        if (
                            !response.ok &&
                            response.status !== 409
                        ) {
                            const data =
                                await response.json();

                            throw new Error(
                                data.error ||
                                "Failed to assign role"
                            );
                        }
                    }
                }

                for (const userId of currentIds) {
                    if (!selectedIds.has(userId)) {
                        const response =
                            await fetch(
                                `${API_URL}/api/roles/${roleId}/users/${userId}`,
                                {
                                    method: "DELETE",
                                    headers: {
                                        "Authorization":
                                            `Bearer ${token}`
                                    }
                                }
                            );

                        if (!response.ok) {
                            const data =
                                await response.json();

                            throw new Error(
                                data.error ||
                                "Failed to remove role"
                            );
                        }
                    }
                }

                messageElement.innerHTML = `
                    <div class="form-message success">
                        Users assigned successfully.
                    </div>
                `;
            } catch (error) {
                messageElement.innerHTML = `
                    <div class="form-message error">
                        ${escapeHtml(
                            error.message
                        )}
                    </div>
                `;
            }
        }
    );
}

async function openAttendance(rehearsalId) {
    pageContentElement.innerHTML = `
        <div class="welcome-section">
            <p class="section-label">
                ATTENDANCE
            </p>

            <h2>
                Loading...
            </h2>

            <p>
                Loading attendance records.
            </p>
        </div>
    `;

    try {
        const response =
            await fetch(
                `${API_URL}/api/attendance/rehearsals/${rehearsalId}`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        if (!response.ok) {
            throw new Error(
                "Failed to load attendance"
            );
        }

        const data =
            await response.json();

        const rehearsal =
            data.rehearsal;

        pageContentElement.innerHTML = `
            <div class="welcome-section">

                <p class="section-label">
                    ATTENDANCE
                </p>

                <h2>
                    ${escapeHtml(
                        rehearsal.title
                    )}
                </h2>

                <p>
                    ${formatAttendanceDate(
                        rehearsal.rehearsal_date
                    )}
                    ${
                        rehearsal.start_time
                            ? " • " +
                              formatAttendanceTime(
                                  rehearsal.start_time
                              )
                            : ""
                    }
                </p>

            </div>

            <div class="dashboard-card">

                <div class="card-header">

                    <div>
                        <p class="section-label">
                            DANCERS
                        </p>

                        <h3>
                            Mark Attendance
                        </h3>
                    </div>

                </div>

                <div
                    id="attendanceList"
                    class="attendance-list"
                >

                    ${data.attendance.map(
                        dancer => `
                            <div class="attendance-row">

                                <div class="attendance-dancer">

                                    <div class="dancer-avatar">
                                        ${escapeHtml(
                                            dancer.username
                                                .charAt(0)
                                                .toUpperCase()
                                        )}
                                    </div>

                                    <div>

                                        <strong>
                                            ${escapeHtml(
                                                dancer.username
                                            )}
                                        </strong>

                                        <span>
                                            ${
                                                dancer.marked_by
                                                    ? `Marked by ${escapeHtml(
                                                        dancer.marked_by
                                                    )}`
                                                    : ""
                                            }
                                        </span>

                                    </div>

                                </div>

                                <div class="attendance-actions">

                                    <button
                                        type="button"
                                        class="attendance-button present ${
                                            dancer.status ===
                                            "PRESENT"
                                                ? "selected"
                                                : ""
                                        }"
                                        onclick="markAttendance(
                                            ${rehearsalId},
                                            ${dancer.dancer_id},
                                            'PRESENT',
                                            this
                                        )"
                                    >
                                        Present
                                    </button>

                                    <button
                                        type="button"
                                        class="attendance-button absent ${
                                            dancer.status ===
                                            "ABSENT"
                                                ? "selected"
                                                : ""
                                        }"
                                        onclick="markAttendance(
                                            ${rehearsalId},
                                            ${dancer.dancer_id},
                                            'ABSENT',
                                            this
                                        )"
                                    >
                                        Absent
                                    </button>

                                </div>

                            </div>
                        `
                    ).join("")}

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

async function markAttendance(
    rehearsalId,
    dancerId,
    status,
    button
) {
    button.disabled = true;

    try {
        const response =
            await fetch(
                `${API_URL}/api/attendance/rehearsals/${rehearsalId}/dancers/${dancerId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json",
                        "Authorization":
                            `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        status
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Failed to update attendance"
            );
        }

        const row =
            button.closest(
                ".attendance-row"
            );

        row
            .querySelectorAll(
                ".attendance-button"
            )
            .forEach(item => {
                item.classList.remove(
                    "selected"
                );
            });

        button.classList.add(
            "selected"
        );

        const info =
            row.querySelector(
                ".attendance-dancer span"
            );

        if (currentUser) {
            info.textContent =
                `Marked by ${currentUser.username}`;
        }
    } catch (error) {
        console.error(error);
        alert(error.message);
    } finally {
        button.disabled = false;
    }
}

function formatAttendanceDate(
    dateString
) {
    if (!dateString) {
        return "";
    }

    const date =
        new Date(
            `${dateString}T00:00:00`
        );

    return date.toLocaleDateString(
        "en-ZA",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}

function formatAttendanceTime(
    timeString
) {
    if (!timeString) {
        return "";
    }

    const parts =
        timeString.split(":");

    const hour =
        Number(parts[0]);

    const minute =
        parts[1];

    const period =
        hour >= 12
            ? "PM"
            : "AM";

    const displayHour =
        hour % 12 || 12;

    return `${displayHour}:${minute} ${period}`;
}

async function loadRehearsals() {
    pageContentElement.innerHTML = `
        <div class="welcome-section">

            <p class="section-label">
                REHEARSALS
            </p>

            <h2>
                Rehearsals
            </h2>

            <p>
                Manage Dancing Stars rehearsals.
            </p>

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

            <div
                id="rehearsalsList"
                class="rehearsals-list"
            >
                Loading rehearsals...
            </div>

        </div>
    `;

    try {
        const response =
            await fetch(
                `${API_URL}/api/rehearsals`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        if (!response.ok) {
            throw new Error(
                "Failed to load rehearsals"
            );
        }

        const data =
            await response.json();

        renderRehearsals(
            data.rehearsals
        );

        document
            .getElementById(
                "rehearsalSearch"
            )
            .addEventListener(
                "input",
                function() {
                    const search =
                        this.value
                            .toLowerCase();

                    const filtered =
                        data.rehearsals.filter(
                            rehearsal =>
                                rehearsal.title
                                    .toLowerCase()
                                    .includes(search) ||
                                rehearsal.rehearsal_date
                                    .includes(search) ||
                                (
                                    rehearsal.location ||
                                    ""
                                )
                                    .toLowerCase()
                                    .includes(search)
                        );

                    renderRehearsals(
                        filtered
                    );
                }
            );
    } catch (error) {
        console.error(error);

        document.getElementById(
            "rehearsalsList"
        ).innerHTML = `
            <div class="form-message error">
                Unable to load rehearsals.
            </div>
        `;
    }
}

function renderRehearsals(
    rehearsals
) {
    const container =
        document.getElementById(
            "rehearsalsList"
        );

    if (!rehearsals.length) {
        container.innerHTML = `
            <div class="empty-state">
                No rehearsals found.
            </div>
        `;

        return;
    }

    container.innerHTML =
        rehearsals.map(
            rehearsal => `
                <div class="rehearsal-card">

                    <div class="rehearsal-info">

                        <span class="section-label">
                            ${formatAttendanceDate(
                                rehearsal.rehearsal_date
                            )}
                        </span>

                        <h3>
                            ${escapeHtml(
                                rehearsal.title
                            )}
                        </h3>

                        <p>
                            ${
                                rehearsal.start_time
                                    ? formatAttendanceTime(
                                        rehearsal.start_time
                                    )
                                    : ""
                            }

                            ${
                                rehearsal.end_time
                                    ? ` - ${formatAttendanceTime(
                                        rehearsal.end_time
                                    )}`
                                    : ""
                            }
                        </p>

                        ${
                            rehearsal.location
                                ? `<p>${escapeHtml(
                                    rehearsal.location
                                )}</p>`
                                : ""
                        }

                    </div>

                    <div class="rehearsal-actions">

                        <button
                            type="button"
                            class="dashboard-secondary"
                            onclick="openAttendance(
                                ${rehearsal.id}
                            )"
                        >
                            Attendance
                        </button>

                        <button
                            type="button"
                            class="dashboard-secondary"
                            onclick="editRehearsal(
                                ${rehearsal.id}
                            )"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="dashboard-danger"
                            onclick="deleteRehearsal(
                                ${rehearsal.id}
                            )"
                        >
                            Delete
                        </button>

                    </div>

                </div>
            `
        ).join("");
}

function showCreateRehearsal() {
    pageContentElement.innerHTML = `
        <div class="welcome-section">

            <p class="section-label">
                REHEARSALS
            </p>

            <h2>
                Add Rehearsal
            </h2>

            <p>
                Create a rehearsal for Dancing Stars.
            </p>

        </div>

        <div class="dashboard-card">

            <form id="rehearsalForm">

                <div class="form-group">

                    <label for="rehearsalTitle">
                        Title
                    </label>

                    <input
                        type="text"
                        id="rehearsalTitle"
                        value="Dancing Stars Rehearsal"
                        required
                    >

                </div>

                <div class="form-group">

                    <label for="rehearsalDate">
                        Date
                    </label>

                    <input
                        type="date"
                        id="rehearsalDate"
                        required
                    >

                </div>

                <div class="form-group">

                    <label for="rehearsalStart">
                        Start Time
                    </label>

                    <input
                        type="time"
                        id="rehearsalStart"
                        value="17:00"
                        required
                    >

                </div>

                <div class="form-group">

                    <label for="rehearsalEnd">
                        End Time
                    </label>

                    <input
                        type="time"
                        id="rehearsalEnd"
                    >

                </div>

                <div class="form-group">

                    <label for="rehearsalLocation">
                        Location
                    </label>

                    <input
                        type="text"
                        id="rehearsalLocation"
                        placeholder="Rehearsal location"
                    >

                </div>

                <div class="form-group">

                    <label for="rehearsalDescription">
                        Description
                    </label>

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

    document
        .getElementById(
            "rehearsalForm"
        )
        .addEventListener(
            "submit",
            createRehearsal
        );
}

async function createRehearsal(
    event
) {
    event.preventDefault();

    const message =
        document.getElementById(
            "rehearsalFormMessage"
        );

    const data = {
        title:
            document
                .getElementById(
                    "rehearsalTitle"
                )
                .value
                .trim(),

        rehearsal_date:
            document.getElementById(
                "rehearsalDate"
            ).value,

        start_time:
            document.getElementById(
                "rehearsalStart"
            ).value,

        end_time:
            document.getElementById(
                "rehearsalEnd"
            ).value ||
            null,

        location:
            document
                .getElementById(
                    "rehearsalLocation"
                )
                .value
                .trim() ||
            null,

        description:
            document
                .getElementById(
                    "rehearsalDescription"
                )
                .value
                .trim() ||
            null
    };

    try {
        const response =
            await fetch(
                `${API_URL}/api/rehearsals`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        "Authorization":
                            `Bearer ${token}`
                    },
                    body:
                        JSON.stringify(
                            data
                        )
                }
            );

        const result =
            await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                "Failed to create rehearsal"
            );
        }

        loadRehearsals();
    } catch (error) {
        message.innerHTML = `
            <div class="form-message error">
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;
    }
}

async function editRehearsal(
    rehearsalId
) {
    try {
        const response =
            await fetch(
                `${API_URL}/api/rehearsals/${rehearsalId}`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        if (!response.ok) {
            throw new Error(
                "Failed to load rehearsal"
            );
        }

        const rehearsal =
            await response.json();

        pageContentElement.innerHTML = `
            <div class="welcome-section">

                <p class="section-label">
                    REHEARSALS
                </p>

                <h2>
                    Edit Rehearsal
                </h2>

                <p>
                    Update rehearsal information.
                </p>

            </div>

            <div class="dashboard-card">

                <form id="editRehearsalForm">

                    <div class="form-group">

                        <label for="editRehearsalTitle">
                            Title
                        </label>

                        <input
                            type="text"
                            id="editRehearsalTitle"
                            value="${escapeHtml(
                                rehearsal.title
                            )}"
                            required
                        >

                    </div>

                    <div class="form-group">

                        <label for="editRehearsalDate">
                            Date
                        </label>

                        <input
                            type="date"
                            id="editRehearsalDate"
                            value="${rehearsal.rehearsal_date}"
                            required
                        >

                    </div>

                    <div class="form-group">

                        <label for="editRehearsalStart">
                            Start Time
                        </label>

                        <input
                            type="time"
                            id="editRehearsalStart"
                            value="${rehearsal.start_time || ""}"
                        >

                    </div>

                    <div class="form-group">

                        <label for="editRehearsalEnd">
                            End Time
                        </label>

                        <input
                            type="time"
                            id="editRehearsalEnd"
                            value="${rehearsal.end_time || ""}"
                        >

                    </div>

                    <div class="form-group">

                        <label for="editRehearsalLocation">
                            Location
                        </label>

                        <input
                            type="text"
                            id="editRehearsalLocation"
                            value="${escapeHtml(
                                rehearsal.location ||
                                ""
                            )}"
                        >

                    </div>

                    <div class="form-group">

                        <label for="editRehearsalDescription">
                            Description
                        </label>

                        <input
                            type="text"
                            id="editRehearsalDescription"
                            value="${escapeHtml(
                                rehearsal.description ||
                                ""
                            )}"
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

        document
            .getElementById(
                "editRehearsalForm"
            )
            .addEventListener(
                "submit",
                event =>
                    updateRehearsal(
                        event,
                        rehearsalId
                    )
            );
    } catch (error) {
        alert(error.message);
    }
}

async function updateRehearsal(
    event,
    rehearsalId
) {
    event.preventDefault();

    const message =
        document.getElementById(
            "editRehearsalMessage"
        );

    const data = {
        title:
            document.getElementById(
                "editRehearsalTitle"
            ).value.trim(),

        rehearsal_date:
            document.getElementById(
                "editRehearsalDate"
            ).value,

        start_time:
            document.getElementById(
                "editRehearsalStart"
            ).value ||
            null,

        end_time:
            document.getElementById(
                "editRehearsalEnd"
            ).value ||
            null,

        location:
            document
                .getElementById(
                    "editRehearsalLocation"
                )
                .value
                .trim() ||
            null,

        description:
            document
                .getElementById(
                    "editRehearsalDescription"
                )
                .value
                .trim() ||
            null
    };

    try {
        const response =
            await fetch(
                `${API_URL}/api/rehearsals/${rehearsalId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json",
                        "Authorization":
                            `Bearer ${token}`
                    },
                    body:
                        JSON.stringify(
                            data
                        )
                }
            );

        const result =
            await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                "Failed to update rehearsal"
            );
        }

        loadRehearsals();
    } catch (error) {
        message.innerHTML = `
            <div class="form-message error">
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;
    }
}

async function deleteRehearsal(
    rehearsalId
) {
    if (
        !confirm(
            "Delete this rehearsal? Attendance records may also be affected."
        )
    ) {
        return;
    }

    try {
        const response =
            await fetch(
                `${API_URL}/api/rehearsals/${rehearsalId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const result =
            await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                "Failed to delete rehearsal"
            );
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
        .getElementById(
            "changePasswordForm"
        )
        .addEventListener(
            "submit",
            changePassword
        );

    document
        .getElementById(
            "deleteAccountButton"
        )
        .addEventListener(
            "click",
            deleteAccount
        );
}

async function changePassword(
    event
) {
    event.preventDefault();

    const currentPassword =
        document.getElementById(
            "currentPassword"
        ).value;

    const newPassword =
        document.getElementById(
            "newPassword"
        ).value;

    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        ).value;

    const message =
        document.getElementById(
            "passwordMessage"
        );

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
        const response =
            await fetch(
                `${API_URL}/api/auth/change-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        "Authorization":
                            `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        current_password:
                            currentPassword,
                        new_password:
                            newPassword
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
            .getElementById(
                "changePasswordForm"
            )
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
        document.getElementById(
            "deleteMessage"
        );

    try {
        const response =
            await fetch(
                `${API_URL}/api/auth/delete-account`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type":
                            "application/json",
                        "Authorization":
                            `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        password
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Unable to delete account."
            );
        }

        logout();
    } catch (error) {
        message.textContent =
            error.message;
    }
}

async function showOverview() {
    const isDancer =
        currentUser.account_type ===
        "DANCER";

    if (isDancer) {
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
                    Your Dancing Stars overview.
                </p>

            </div>

            <div class="stats-grid">

                <div class="stat-card">

                    <span class="stat-label">
                        ATTENDANCE
                    </span>

                    <strong
                        class="stat-value"
                        id="overviewAttendanceRate"
                    >
                        —
                    </strong>

                    <span class="stat-description">
                        Your attendance
                    </span>

                </div>

                <div class="stat-card">

                    <span class="stat-label">
                        STREAK
                    </span>

                    <strong
                        class="stat-value"
                        id="overviewStreak"
                    >
                        —
                    </strong>

                    <span class="stat-description">
                        Current attendance streak
                    </span>

                </div>

                <div class="stat-card">

                    <span class="stat-label">
                        ATTENDED
                    </span>

                    <strong
                        class="stat-value"
                        id="overviewAttended"
                    >
                        —
                    </strong>

                    <span class="stat-description">
                        Rehearsals attended
                    </span>

                </div>

                <div class="stat-card">

                    <span class="stat-label">
                        UPCOMING
                    </span>

                    <strong
                        class="stat-value"
                        id="overviewRehearsalCount"
                    >
                        —
                    </strong>

                    <span class="stat-description">
                        Upcoming rehearsals
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
                                Upcoming Rehearsals
                            </h3>

                        </div>

                    </div>

                    <div
                        id="overviewNextRehearsal"
                        class="empty-state"
                    >
                        Loading...
                    </div>

                </div>

                <div class="dashboard-card">

                    <div class="card-header">

                        <div>

                            <p class="section-label">
                                ATTENDANCE
                            </p>

                            <h3>
                                Your Progress
                            </h3>

                        </div>

                    </div>

                    <div
                        id="overviewAttendanceInfo"
                        class="empty-state"
                    >
                        Loading...
                    </div>

                </div>

            </div>
        `;
    } else {
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
                        TOTAL MEMBERS
                    </span>

                    <strong
                        class="stat-value"
                        id="overviewMemberCount"
                    >
                        —
                    </strong>

                    <span class="stat-description">
                        Active dancers
                    </span>

                </div>

                <div class="stat-card">

                    <span class="stat-label">
                        LATEST ATTENDANCE
                    </span>

                    <strong
                        class="stat-value"
                        id="overviewAttendanceRate"
                    >
                        —
                    </strong>

                    <span class="stat-description">
                        Latest completed rehearsal
                    </span>

                </div>

                <div class="stat-card">

                    <span class="stat-label">
                        UPCOMING REHEARSALS
                    </span>

                    <strong
                        class="stat-value"
                        id="overviewRehearsalCount"
                    >
                        —
                    </strong>

                    <span class="stat-description">
                        Scheduled rehearsals
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

                    <div
                        id="overviewNextRehearsal"
                        class="empty-state"
                    >
                        Loading...
                    </div>

                </div>

                <div class="dashboard-card">

                    <div class="card-header">

                        <div>

                            <p class="section-label">
                                LATEST
                            </p>

                            <h3>
                                Attendance
                            </h3>

                        </div>

                    </div>

                    <div
                        id="overviewAttendanceInfo"
                        class="empty-state"
                    >
                        Loading...
                    </div>

                </div>

            </div>
        `;
    }

    try {
        const response =
            await fetch(
                `${API_URL}/api/dashboard/overview`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        if (!response.ok) {
            throw new Error(
                "Failed to load dashboard overview"
            );
        }

        const data =
            await response.json();

        if (
            data.account_type ===
            "DANCER"
        ) {
            document.getElementById(
                "overviewAttendanceRate"
            ).textContent =
                data.attendance.rate === null
                    ? "—"
                    : `${data.attendance.rate}%`;

            document.getElementById(
                "overviewStreak"
            ).textContent =
                data.attendance.current_streak;

            document.getElementById(
                "overviewAttended"
            ).textContent =
                data.attendance.total_attended;

            document.getElementById(
                "overviewRehearsalCount"
            ).textContent =
                data.upcoming_rehearsals.length;

            const nextRehearsalElement =
                document.getElementById(
                    "overviewNextRehearsal"
                );

            if (
                !data.upcoming_rehearsals.length
            ) {
                nextRehearsalElement.innerHTML = `
                    <div class="empty-state">
                        No upcoming rehearsals.
                    </div>
                `;
            } else {
                nextRehearsalElement.innerHTML =
                    data.upcoming_rehearsals
                        .map(
                            rehearsal => `
                                <div class="overview-rehearsal">

                                    <strong>
                                        ${escapeHtml(
                                            rehearsal.title
                                        )}
                                    </strong>

                                    <span>
                                        ${formatAttendanceDate(
                                            rehearsal.date
                                        )}
                                    </span>

                                    <span>
                                        ${
                                            rehearsal.start_time
                                                ? formatAttendanceTime(
                                                    rehearsal.start_time
                                                )
                                                : ""
                                        }

                                        ${
                                            rehearsal.location
                                                ? ` • ${escapeHtml(
                                                    rehearsal.location
                                                )}`
                                                : ""
                                        }
                                    </span>

                                </div>
                            `
                        )
                        .join("");
            }

            document.getElementById(
                "overviewAttendanceInfo"
            ).innerHTML = `
                <div class="overview-rehearsal">

                    <strong>
                        ${data.attendance.total_attended}
                    </strong>

                    <span>
                        rehearsals attended
                    </span>

                    <span>
                        ${data.attendance.total_recorded}
                        recorded rehearsals
                    </span>

                </div>
            `;
        } else {
            document.getElementById(
                "overviewMemberCount"
            ).textContent =
                data.members;

            document.getElementById(
                "overviewAttendanceRate"
            ).textContent =
                data.attendance_rate === null
                    ? "—"
                    : `${data.attendance_rate}%`;

            document.getElementById(
                "overviewRehearsalCount"
            ).textContent =
                data.upcoming_rehearsals;

            const nextRehearsalElement =
                document.getElementById(
                    "overviewNextRehearsal"
                );

            if (!data.next_rehearsal) {
                nextRehearsalElement.innerHTML = `
                    <div class="empty-state">
                        No upcoming rehearsal.
                    </div>
                `;
            } else {
                const rehearsal =
                    data.next_rehearsal;

                nextRehearsalElement.innerHTML = `
                    <div class="overview-rehearsal">

                        <strong>
                            ${escapeHtml(
                                rehearsal.title
                            )}
                        </strong>

                        <span>
                            ${formatAttendanceDate(
                                rehearsal.date
                            )}
                        </span>

                        <span>
                            ${
                                rehearsal.start_time
                                    ? formatAttendanceTime(
                                        rehearsal.start_time
                                    )
                                    : ""
                            }

                            ${
                                rehearsal.location
                                    ? ` • ${escapeHtml(
                                        rehearsal.location
                                    )}`
                                    : ""
                            }
                        </span>

                    </div>
                `;
            }

            if (!data.latest_rehearsal) {
                document.getElementById(
                    "overviewAttendanceInfo"
                ).innerHTML = `
                    <div class="empty-state">
                        No completed rehearsal yet.
                    </div>
                `;
            } else {
                document.getElementById(
                    "overviewAttendanceInfo"
                ).innerHTML = `
                    <div class="overview-rehearsal">

                        <strong>
                            ${escapeHtml(
                                data.latest_rehearsal.title
                            )}
                        </strong>

                        <span>
                            ${formatAttendanceDate(
                                data.latest_rehearsal.date
                            )}
                        </span>

                        <span>
                            Latest attendance:
                            ${
                                data.attendance_rate === null
                                    ? "—"
                                    : `${data.attendance_rate}%`
                            }
                        </span>

                    </div>
                `;
            }
        }
    } catch (error) {
        console.error(error);

        const statIds = [
            "overviewMemberCount",
            "overviewAttendanceRate",
            "overviewRehearsalCount",
            "overviewStreak",
            "overviewAttended"
        ];

        statIds.forEach(id => {
            const element =
                document.getElementById(id);

            if (element) {
                element.textContent = "—";
            }
        });

        const nextRehearsalElement =
            document.getElementById(
                "overviewNextRehearsal"
            );

        if (nextRehearsalElement) {
            nextRehearsalElement.innerHTML = `
                <div class="form-message error">
                    Unable to load dashboard information.
                </div>
            `;
        }

        const attendanceInfoElement =
            document.getElementById(
                "overviewAttendanceInfo"
            );

        if (attendanceInfoElement) {
            attendanceInfoElement.innerHTML = `
                <div class="form-message error">
                    Unable to load attendance information.
                </div>
            `;
        }
    }
}

async function loadDancers() {
    pageContentElement.innerHTML = `
        <div class="welcome-section">

            <p class="section-label">
                MEMBERS
            </p>

            <h2>
                Dancers
            </h2>

            <p>
                Manage the Dancing Stars members.
            </p>

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

        <div
            id="dancersList"
            class="dancers-list"
        >

            <div class="empty-state">
                Loading dancers...
            </div>

        </div>
    `;

    const searchInput =
        document.getElementById(
            "dancerSearch"
        );

    searchInput.addEventListener(
        "input",
        renderDancers
    );

    const addButton =
        document.getElementById(
            "addDancerButton"
        );

    addButton.addEventListener(
        "click",
        showAddDancerForm
    );

    try {
        const response =
            await fetch(
                `${API_URL}/api/dancers`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        if (!response.ok) {
            const data =
                await response.json();

            throw new Error(
                data.error ||
                "Unable to load dancers."
            );
        }

        const data =
            await response.json();

        dancers =
            data.dancers || [];

        renderDancers();

        loadDancerProfilePictures();
    } catch (error) {
        document.getElementById(
            "dancersList"
        ).innerHTML = `
            <div class="empty-state">
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;
    }
}

async function loadBirthdays() {
    pageContentElement.innerHTML = `
        <div class="welcome-section">
            <p class="section-label">CELEBRATIONS</p>
            <h2>◼️ Birthdays</h2>
            <p>Celebrate our Dancing Stars family!</p>
        </div>

        <div id="birthdaysList">
            <div class="empty-state">
                Loading birthdays...
            </div>
        </div>
    `;

    const birthdaysList =
        document.getElementById("birthdaysList");

    try {
        const response = await fetch(
            `${API_URL}/api/profile/birthdays`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Unable to load birthdays."
            );
        }

        const birthdays = data.birthdays || [];

        if (birthdays.length === 0) {
            birthdaysList.innerHTML = `
                <div class="empty-state">
                    🎂 No birthdays have been added yet.
                </div>
            `;
            return;
        }

        birthdays.sort(
            (a, b) => a.days_until - b.days_until
        );

        birthdaysList.innerHTML = `
            <div class="birthdays-list">
                ${birthdays.map(birthday => {
                    const birthdayDate = new Date(
                        2000,
                        birthday.birthday_month - 1,
                        birthday.birthday_day
                    );

                    const formattedDate =
                        birthdayDate.toLocaleDateString(
                            "en-ZA",
                            {
                                day: "numeric",
                                month: "long"
                            }
                        );

                    let countdown;

                    if (birthday.days_until === 0) {
                        countdown = "🎉 Today is their birthday!";
                    } else if (birthday.days_until === 1) {
                        countdown = "🎈 Birthday tomorrow!";
                    } else if (birthday.days_until < 0) {
                        countdown = "Birthday passed";
                    } else {
                        countdown =
                            `In ${birthday.days_until} days`;
                    }

                    return `
                        <div class="birthday-card">
                            <div
                                class="birthday-avatar"
                                id="birthday-avatar-${birthday.id}"
                            >
                                ${escapeHtml(
                                    birthday.username
                                        .charAt(0)
                                        .toUpperCase()
                                )}
                            </div>

                            <div class="birthday-details">
                                <h3>
                                    ${escapeHtml(
                                        birthday.username
                                    )}
                                </h3>

                                <p>${formattedDate}</p>

                                <span>
                                    ${escapeHtml(countdown)}
                                </span>
                            </div>

                            <div class="birthday-icon">
                                🎂
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
        `;

        for (const birthday of birthdays) {
            if (!birthday.has_profile_picture) {
                continue;
            }

            try {
                const imageUrl = await fetchProtectedImage(
                    `${API_URL}/api/profile/picture/${birthday.id}`
                );

                const avatar = document.getElementById(
                    `birthday-avatar-${birthday.id}`
                );

                if (avatar) {
                    const image = document.createElement("img");

                    image.src = imageUrl;
                    image.alt =
                        `${birthday.username}'s profile picture`;

                    avatar.innerHTML = "";
                    avatar.appendChild(image);
                }
            } catch (error) {
                // Keep the initials if the picture cannot be loaded.
            }
        }
    } catch (error) {
        birthdaysList.innerHTML = `
            <div class="empty-state">
                ${escapeHtml(error.message)}
            </div>
        `;
    }
}

function renderDancers() {
    const list =
        document.getElementById(
            "dancersList"
        );

    if (!list) {
        return;
    }

    const searchInput =
        document.getElementById(
            "dancerSearch"
        );

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    const filtered =
        dancers.filter(
            dancer =>
                dancer.username
                    .toLowerCase()
                    .includes(search)
        );

    if (!filtered.length) {
        list.innerHTML = `
            <div class="empty-state">
                No dancers found.
            </div>
        `;

        return;
    }

    list.innerHTML =
        filtered.map(
            dancer => {

                const initial =
                    dancer.username
                        .charAt(0)
                        .toUpperCase();

                const status =
                    dancer.status ===
                    "ACTIVE"
                        ? "Active"
                        : "Disabled";

                return `
                    <div class="dancer-card">

                        <button
                            type="button"
                            class="dancer-avatar"
                            data-picture-id="${dancer.id}"
                            aria-label="View ${escapeHtml(
                                dancer.username
                            )} profile picture"
                        >
                            ${initial}
                        </button>

                        <div class="dancer-info">

                            <strong>
                                ${escapeHtml(
                                    dancer.username
                                )}
                            </strong>

                            <span
                                class="dancer-status ${dancer.status.toLowerCase()}"
                            >
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
            }
        ).join("");

    document
        .querySelectorAll(
            ".dancer-view-button"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const id =
                        Number(
                            button.dataset.id
                        );

                    showDancer(id);
                }
            );
        });

    document
        .querySelectorAll(
            ".dancer-avatar[data-picture-id]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const id =
                        Number(
                            button.dataset.pictureId
                        );

                    showProtectedDancerPicture(
                        id
                    );
                }
            );
        });
}

async function loadDancerProfilePictures() {
    const pictureDancers =
        dancers.filter(
            dancer =>
                dancer.profile_picture
        );

    await Promise.all(
        pictureDancers.map(
            async dancer => {
                try {
                    const imageUrl =
                        await fetchProtectedImage(
                            `${API_URL}/api/profile/picture/${dancer.id}`
                        );

                    const avatar =
                        document.querySelector(
                            `.dancer-avatar[data-picture-id="${dancer.id}"]`
                        );

                    if (!avatar) {
                        return;
                    }

                    avatar.innerHTML = "";

                    const image =
                        document.createElement(
                            "img"
                        );

                    image.src =
                        imageUrl;

                    image.alt =
                        `${dancer.username} profile picture`;

                    avatar.appendChild(
                        image
                    );
                } catch (error) {
                    console.error(
                        error
                    );
                }
            }
        )
    );
}

async function showProtectedDancerPicture(
    dancerId
) {
    const dancer =
        dancers.find(
            item =>
                item.id === dancerId
        );

    if (!dancer || !dancer.profile_picture) {
        return;
    }

    try {
        const imageUrl =
            await fetchProtectedImage(
                `${API_URL}/api/profile/picture/${dancerId}`
            );

        openLargePictureModal(
            imageUrl,
            dancer.username
        );
    } catch (error) {
        alert(
            "Unable to load this profile picture."
        );
    }
}

function openLargePictureModal(
    imageUrl,
    username
) {
    let modal =
        document.getElementById(
            "largePictureModal"
        );

    if (!modal) {
        modal =
            document.createElement(
                "div"
            );

        modal.id =
            "largePictureModal";

        modal.className =
            "profile-picture-modal";

        modal.innerHTML = `
            <div
                class="profile-picture-box"
                role="dialog"
                aria-modal="true"
            >

                <button
                    type="button"
                    class="profile-picture-close"
                    id="largePictureClose"
                    aria-label="Close picture"
                >
                    ×
                </button>

                <h2 id="largePictureTitle">
                    Profile Picture
                </h2>

                <div class="profile-picture-preview">
                    <img
                        id="largePictureImage"
                        alt=""
                    >
                </div>

            </div>
        `;

        document.body.appendChild(
            modal
        );

        document
            .getElementById(
                "largePictureClose"
            )
            .addEventListener(
                "click",
                () => {
                    modal.classList.remove(
                        "open"
                    );
                }
            );

        modal.addEventListener(
            "click",
            event => {
                if (
                    event.target ===
                    modal
                ) {
                    modal.classList.remove(
                        "open"
                    );
                }
            }
        );
    }

    const image =
        document.getElementById(
            "largePictureImage"
        );

    const title =
        document.getElementById(
            "largePictureTitle"
        );

    title.textContent =
        username;

    image.src =
        imageUrl;

    image.alt =
        `${username} profile picture`;

    modal.classList.add(
        "open"
    );
}

function showDancer(id) {
    const dancer =
        dancers.find(
            item =>
                item.id === id
        );

    if (!dancer) {
        return;
    }

    const initial =
        dancer.username
            .charAt(0)
            .toUpperCase();

    pageContentElement.innerHTML = `
        <div class="welcome-section">

            <p class="section-label">
                DANCER
            </p>

            <h2>
                ${escapeHtml(
                    dancer.username
                )}
            </h2>

            <p>
                Dancer profile
            </p>

        </div>

        <div class="dashboard-card dancer-profile">

            <button
                type="button"
                class="dancer-profile-avatar"
                id="dancerProfilePictureButton"
                aria-label="View profile picture"
            >
                ${initial}
            </button>

            <h3>
                ${escapeHtml(
                    dancer.username
                )}
            </h3>

            <p>
                Status:
                <strong>
                    ${escapeHtml(
                        dancer.status
                    )}
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

    const profileButton =
        document.getElementById(
            "dancerProfilePictureButton"
        );

    if (dancer.profile_picture) {
        profileButton.addEventListener(
            "click",
            () => {
                showProtectedDancerPicture(
                    dancer.id
                );
            }
        );

        fetchProtectedImage(
            `${API_URL}/api/profile/picture/${dancer.id}`
        )
            .then(imageUrl => {
                profileButton.innerHTML = `
                    <img
                        src="${imageUrl}"
                        alt="${escapeHtml(
                            dancer.username
                        )} profile picture"
                    >
                `;
            })
            .catch(() => {});
    }

    document
        .getElementById(
            "backToDancers"
        )
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
        .getElementById(
            "cancelDancer"
        )
        .addEventListener(
            "click",
            loadDancers
        );

    document
        .getElementById(
            "addDancerForm"
        )
        .addEventListener(
            "submit",
            createDancer
        );
}

async function createDancer(
    event
) {
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
        const response =
            await fetch(
                `${API_URL}/api/dancers`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        "Authorization":
                            `Bearer ${token}`
                    },
                    body:
                        JSON.stringify({
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

function showComingSoon(
    title,
    message
) {
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
    if (
        document.getElementById(
            "passwordWarning"
        )
    ) {
        return;
    }

    const warning =
        document.createElement(
            "div"
        );

    warning.id =
        "passwordWarning";

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
        .querySelector(
            ".main-content"
        )
        .prepend(
            warning
        );
}

function logout() {
    revokeProtectedImageUrls();

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
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

async function checkAndShowBirthdayPopup() {
    if (!currentUser) {
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/api/profile/birthdays`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            return;
        }

        const data = await response.json();
        const birthdays = data.birthdays || [];

        const hasBirthday = birthdays.some(
            birthday => String(birthday.id) === String(currentUser.id)
        );

        if (hasBirthday) {
            return;
        }

        if (document.getElementById("birthdayPopup")) {
            return;
        }

        const overlay = document.createElement("div");

        overlay.id = "birthdayPopup";
        overlay.className = "birthday-popup-overlay";

        overlay.innerHTML = `
            <div
                class="birthday-popup"
                role="dialog"
                aria-modal="true"
                aria-labelledby="birthdayPopupTitle"
            >
                <div class="birthday-popup-icon">🎂</div>

                <h2 id="birthdayPopupTitle">
                    Add your birthday
                </h2>

                <p>
                    Let Dancing Stars celebrate your special day with you.
                    We only need the day and month.
                </p>

                <form id="birthdayForm">
                    <div class="birthday-inputs">
                        <label>
                            Day
                            <input
                                type="number"
                                id="birthdayDay"
                                min="1"
                                max="31"
                                placeholder="Day"
                                required
                            >
                        </label>

                        <label>
                            Month
                            <select id="birthdayMonth" required>
                                <option value="">Select month</option>
                                <option value="1">January</option>
                                <option value="2">February</option>
                                <option value="3">March</option>
                                <option value="4">April</option>
                                <option value="5">May</option>
                                <option value="6">June</option>
                                <option value="7">July</option>
                                <option value="8">August</option>
                                <option value="9">September</option>
                                <option value="10">October</option>
                                <option value="11">November</option>
                                <option value="12">December</option>
                            </select>
                        </label>
                    </div>

                    <p
                        id="birthdayError"
                        class="birthday-error"
                        role="alert"
                    ></p>

                    <div class="birthday-popup-actions">
                        <button
                            type="button"
                            id="skipBirthdayButton"
                            class="birthday-skip-button"
                        >
                            Skip
                        </button>

                        <button
                            type="submit"
                            id="saveBirthdayButton"
                            class="birthday-save-button"
                        >
                            Save Birthday
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(overlay);

        const form = document.getElementById("birthdayForm");
        const errorElement = document.getElementById("birthdayError");
        const saveButton = document.getElementById("saveBirthdayButton");
        const skipButton = document.getElementById("skipBirthdayButton");

        skipButton.addEventListener("click", () => {
            overlay.remove();
        });

        form.addEventListener("submit", async event => {
            event.preventDefault();

            errorElement.textContent = "";

            const day = Number(
                document.getElementById("birthdayDay").value
            );

            const month = Number(
                document.getElementById("birthdayMonth").value
            );

            if (!day || !month) {
                errorElement.textContent =
                    "Please select your birthday day and month.";
                return;
            }

            saveButton.disabled = true;
            saveButton.textContent = "Saving...";

            try {
                const saveResponse = await fetch(
                    `${API_URL}/api/profile/birthday`,
                    {
                        method: "PUT",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            day: day,
                            month: month
                        })
                    }
                );

                const result = await saveResponse.json();

                if (!saveResponse.ok) {
                    throw new Error(
                        result.error || "Unable to save your birthday."
                    );
                }

                overlay.remove();
            } catch (error) {
                errorElement.textContent = error.message;
                saveButton.disabled = false;
                saveButton.textContent = "Save Birthday";
            }
        });

        document.getElementById("birthdayDay").focus();

    } catch (error) {
        console.error("Unable to check birthday:", error);
    }
}

logoutButton.addEventListener(
    "click",
    logout
);

window.addEventListener(
    "beforeunload",
    revokeProtectedImageUrls
);

loadUser();

