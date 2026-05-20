/**
 * Egerton Transport - Unified Authentication, Form Validation,
 * Booking Manager, and Interactive Developer Console Core Script.
 * 
 * Simulated with LocalStorage for persistent client-side demonstrations.
 */

// ==========================================================================
// 1. Initial State & Simulated Database Setup
// ==========================================================================

const EGERTON_USERS_KEY = "egerton_transport_users";
const EGERTON_BOOKINGS_KEY = "egerton_transport_bookings";
const EGERTON_SESSION_KEY = "egerton_transport_active_user";
const EGERTON_FLEET_KEY = "egerton_transport_fleet";
const EGERTON_ISSUES_KEY = "egerton_transport_issues";

const DEFAULT_FLEET = {
    "passengers-bus-1": { name: "Passengers Bus", status: "Available" },
    "students-bus-1": { name: "Students Bus", status: "In Service" },
    "staff-van-1": { name: "Staff Van", status: "Under Maintenance" },
    "delivery-truck-1": { name: "Delivery Truck", status: "Available" },
    "students-bus-2": { name: "Students Bus 2", status: "In Service" },
    "faculty-van-1": { name: "Faculty Van", status: "Available" },
    "cargo-truck-1": { name: "Cargo Truck", status: "Under Maintenance" },
    "students-bus-3": { name: "Students Bus 3", status: "Available" },
    "maintenance-van-1": { name: "Maintenance Van", status: "In Service" },
    "taxi-1": { name: "Taxi", status: "Available" },
    "campus-shuttle-1": { name: "Campus Shuttle", status: "In Service" },
    "bike-1": { name: "Bike", status: "Available" }
};

function seedDefaultUsers() {
    const users = [
        {
            username: "transport_admin",
            email: "transport.admin@egerton.ac.ke",
            password: "Admin123",
            userType: "admin",
            idNum: "ADM-TRANS-01"
        },
        {
            username: "staff_demo",
            email: "j.doe@egerton.ac.ke",
            password: "Password123",
            userType: "staff",
            idNum: "EST-9023"
        },
        {
            username: "student_demo",
            email: "alex.k@student.egerton.ac.ke",
            password: "Student123",
            userType: "student",
            idNum: "S23/04812/21"
        }
    ];
    localStorage.setItem(EGERTON_USERS_KEY, JSON.stringify(users));
}

if (!localStorage.getItem(EGERTON_USERS_KEY)) {
    seedDefaultUsers();
} else {
    const users = JSON.parse(localStorage.getItem(EGERTON_USERS_KEY)) || [];
    if (!users.some((u) => u.userType === "admin")) {
        users.unshift({
            username: "transport_admin",
            email: "transport.admin@egerton.ac.ke",
            password: "Admin123",
            userType: "admin",
            idNum: "ADM-TRANS-01"
        });
        localStorage.setItem(EGERTON_USERS_KEY, JSON.stringify(users));
    }
}

if (!localStorage.getItem(EGERTON_BOOKINGS_KEY)) {
    localStorage.setItem(EGERTON_BOOKINGS_KEY, JSON.stringify([]));
}

if (!localStorage.getItem(EGERTON_FLEET_KEY)) {
    localStorage.setItem(EGERTON_FLEET_KEY, JSON.stringify(DEFAULT_FLEET));
}

if (!localStorage.getItem(EGERTON_ISSUES_KEY)) {
    localStorage.setItem(EGERTON_ISSUES_KEY, JSON.stringify([
        {
            issueId: "ISS-1001",
            title: "Students Bus 2 — brake inspection",
            vehicleId: "students-bus-2",
            vehicleName: "Students Bus 2",
            priority: "High",
            status: "Open",
            reportedBy: "Fleet Operations",
            createdAt: new Date().toISOString(),
            notes: "Scheduled inspection before next long-distance trip."
        },
        {
            issueId: "ISS-1002",
            title: "Shuttle route delay — Hostel Block C",
            vehicleId: "campus-shuttle-1",
            vehicleName: "Campus Shuttle",
            priority: "Medium",
            status: "In Review",
            reportedBy: "Booking Desk",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            notes: "Morning shuttle ran 25 minutes behind schedule."
        }
    ]));
}

function normalizeBookings() {
    const bookings = getBookings();
    let changed = false;
    bookings.forEach((b) => {
        if (!b.status) {
            b.status = "Approved";
            changed = true;
        }
    });
    if (changed) {
        localStorage.setItem(EGERTON_BOOKINGS_KEY, JSON.stringify(bookings));
    }
}
normalizeBookings();

// Helper to get raw data
function getUsers() {
    return JSON.parse(localStorage.getItem(EGERTON_USERS_KEY)) || [];
}
function getBookings() {
    return JSON.parse(localStorage.getItem(EGERTON_BOOKINGS_KEY)) || [];
}
function getActiveUser() {
    return JSON.parse(localStorage.getItem(EGERTON_SESSION_KEY)) || null;
}

function isAdmin(user) {
    return user && user.userType === "admin";
}

function getFleet() {
    return { ...DEFAULT_FLEET, ...JSON.parse(localStorage.getItem(EGERTON_FLEET_KEY) || "{}") };
}

function getVehicleStatus(vehicleId) {
    const fleet = getFleet();
    return fleet[vehicleId] ? fleet[vehicleId].status : "Available";
}

function setVehicleStatus(vehicleId, status, adminNote) {
    const user = getActiveUser();
    if (!isAdmin(user)) {
        return { success: false, message: "Admin access required." };
    }
    const fleet = getFleet();
    if (!fleet[vehicleId]) {
        return { success: false, message: "Unknown vehicle." };
    }
    fleet[vehicleId] = {
        ...fleet[vehicleId],
        status,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.username,
        adminNote: adminNote || ""
    };
    localStorage.setItem(EGERTON_FLEET_KEY, JSON.stringify(fleet));
    window.dispatchEvent(new Event("egerton-fleet-updated"));
    return { success: true };
}

function getTransportIssues() {
    return JSON.parse(localStorage.getItem(EGERTON_ISSUES_KEY)) || [];
}

function addTransportIssue(title, vehicleId, priority, notes) {
    const user = getActiveUser();
    if (!isAdmin(user)) {
        return { success: false, message: "Admin access required." };
    }
    const fleet = getFleet();
    const issues = getTransportIssues();
    const issueId = "ISS-" + Math.floor(1000 + Math.random() * 9000);
    issues.unshift({
        issueId,
        title: title.trim(),
        vehicleId: vehicleId || "",
        vehicleName: fleet[vehicleId] ? fleet[vehicleId].name : "General",
        priority: priority || "Medium",
        status: "Open",
        reportedBy: user.username,
        createdAt: new Date().toISOString(),
        notes: notes || ""
    });
    localStorage.setItem(EGERTON_ISSUES_KEY, JSON.stringify(issues));
    return { success: true, issueId };
}

function updateIssueStatus(issueId, status, resolutionNote) {
    const user = getActiveUser();
    if (!isAdmin(user)) {
        return { success: false, message: "Admin access required." };
    }
    const issues = getTransportIssues();
    const issue = issues.find((i) => i.issueId === issueId);
    if (!issue) {
        return { success: false, message: "Issue not found." };
    }
    issue.status = status;
    issue.resolutionNote = resolutionNote || "";
    issue.resolvedAt = status === "Resolved" ? new Date().toISOString() : null;
    issue.resolvedBy = status === "Resolved" ? user.username : null;
    localStorage.setItem(EGERTON_ISSUES_KEY, JSON.stringify(issues));
    return { success: true };
}

function approveBooking(bookingId) {
    const user = getActiveUser();
    if (!isAdmin(user)) {
        return { success: false, message: "Admin access required." };
    }
    const bookings = getBookings();
    const booking = bookings.find((b) => b.bookingId === bookingId);
    if (!booking) {
        return { success: false, message: "Booking not found." };
    }
    booking.status = "Approved";
    booking.approvedBy = user.username;
    booking.approvedAt = new Date().toISOString();
    booking.rejectionReason = null;
    localStorage.setItem(EGERTON_BOOKINGS_KEY, JSON.stringify(bookings));
    notifyBookingChange();
    return { success: true, booking };
}

function rejectBooking(bookingId, reason) {
    const user = getActiveUser();
    if (!isAdmin(user)) {
        return { success: false, message: "Admin access required." };
    }
    const bookings = getBookings();
    const booking = bookings.find((b) => b.bookingId === bookingId);
    if (!booking) {
        return { success: false, message: "Booking not found." };
    }
    booking.status = "Rejected";
    booking.rejectedBy = user.username;
    booking.rejectedAt = new Date().toISOString();
    booking.rejectionReason = reason || "Request declined by transport office.";
    localStorage.setItem(EGERTON_BOOKINGS_KEY, JSON.stringify(bookings));
    notifyBookingChange();
    return { success: true, booking };
}

function notifyBookingChange() {
    window.dispatchEvent(new Event("egerton-bookings-updated"));
    if (typeof window.refreshVehicleSchedule === "function") {
        window.refreshVehicleSchedule();
    }
}

// ==========================================================================
// 2. Validation Engine
// ==========================================================================

const ValidationRules = {
    // Requires a letter, number, and min 5 characters
    username: /^[a-zA-Z0-9_]{5,20}$/,
    
    // Authenticate with Egerton university email domain patterns
    email: /^[a-zA-Z0-9._%+-]+@(student\.)?egerton\.ac\.ke$/,
    
    // Minimum 6 characters, at least one uppercase letter and one number
    password: /^(?=.*[0-9])(?=.*[a-zA-Z]).{6,20}$/,
    
    // Basic alphanumeric check for names or staff IDs
    staffOrStudentId: /^[a-zA-Z0-9\/ -]{4,20}$/
};

/**
 * Validates a form field and toggles visual validation classes
 */
function validateField(inputElement, regexPattern, errorMsg) {
    if (!inputElement) return true;
    
    const value = inputElement.value.trim();
    const inputGroup = inputElement.closest(".input-group") || inputElement.parentElement;
    
    let isValid = regexPattern.test(value);
    
    // Custom check for empty input
    if (value === "") {
        isValid = false;
        errorMsg = "This field is required.";
    }

    // Dynamic UI states
    if (isValid) {
        inputGroup.classList.remove("error");
        inputGroup.classList.add("success");
        const feedback = inputGroup.querySelector(".input-feedback-msg");
        if (feedback) feedback.style.display = "none";
    } else {
        inputGroup.classList.remove("success");
        inputGroup.classList.add("error");
        
        let feedback = inputGroup.querySelector(".input-feedback-msg");
        if (!feedback) {
            feedback = document.createElement("span");
            feedback.className = "input-feedback-msg";
            inputGroup.appendChild(feedback);
        }
        feedback.textContent = errorMsg;
        feedback.style.display = "block";
    }
    
    // Update live developer console state
    updateDevConsoleDB();
    
    return isValid;
}

// ==========================================================================
// 3. User Authentication Flow
// ==========================================================================

/**
 * Handle Signup/Registration
 */
function handleSignup(usernameVal, emailVal, passwordVal, userTypeVal, idVal) {
    const users = getUsers();
    
    // Check if username or email already exists
    if (users.some(u => u.username === usernameVal)) {
        return { success: false, message: "Username is already taken." };
    }
    if (users.some(u => u.email === emailVal)) {
        return { success: false, message: "Email is already registered." };
    }
    
    if (userTypeVal === "admin") {
        return { success: false, message: "Admin accounts cannot be created via public signup." };
    }

    const newUser = {
        username: usernameVal,
        email: emailVal,
        password: passwordVal,
        userType: userTypeVal,
        idNum: idVal
    };
    
    users.push(newUser);
    localStorage.setItem(EGERTON_USERS_KEY, JSON.stringify(users));
    
    // Auto-login after successful signup
    localStorage.setItem(EGERTON_SESSION_KEY, JSON.stringify(newUser));
    
    return { success: true, message: "Account created successfully!" };
}

/**
 * Handle Login
 */
function handleLogin(emailOrUserVal, passwordVal) {
    const users = getUsers();
    
    // Search user database
    const user = users.find(u => 
        (u.email === emailOrUserVal || u.username === emailOrUserVal) && 
        u.password === passwordVal
    );
    
    if (!user) {
        return { success: false, message: "Invalid username/email or password." };
    }
    
    localStorage.setItem(EGERTON_SESSION_KEY, JSON.stringify(user));
    return { success: true, message: "Login successful!" };
}

/**
 * Handle Logout
 */
function handleLogout() {
    localStorage.removeItem(EGERTON_SESSION_KEY);
    window.location.reload();
}

// ==========================================================================
// 4. Booking Management Flow
// ==========================================================================

/**
 * Validates and submits a new booking request
 */
function requestBooking(vehicleId, vehicleName, dateVal, destinationVal, passengerCountVal, tripPurposeVal) {
    const user = getActiveUser();
    if (!user) {
        return { success: false, message: "You must be logged in to book." };
    }
    
    // Date validation - must be in the future
    const selectedDate = new Date(dateVal);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // remove time for pure day check
    
    if (selectedDate < today) {
        return { success: false, message: "Trip date cannot be in the past." };
    }
    
    const bookings = getBookings();
    
    // Check if this vehicle is already booked by the active user on this date (avoid duplicate)
    const duplicate = bookings.some(b => 
        b.vehicleId === vehicleId && 
        b.date === dateVal && 
        b.userEmail === user.email
    );
    
    if (duplicate) {
        return { success: false, message: "You have already requested this vehicle for this date." };
    }
    
    // Generate secure randomized ticket reference
    const randNum = Math.floor(10000 + Math.random() * 90000); // 5 digits
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const randChar = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    const ticketRef = `EGT-${randNum}-${randChar}`;
    
    const newBooking = {
        bookingId: ticketRef,
        vehicleId: vehicleId,
        vehicleName: vehicleName,
        date: dateVal,
        destination: destinationVal,
        passengerCount: passengerCountVal || 1,
        tripPurpose: tripPurposeVal || "Official Trip",
        userName: user.username,
        userEmail: user.email,
        userIdNum: user.idNum,
        userType: user.userType,
        status: "Pending",
        timestamp: new Date().toISOString()
    };
    
    bookings.push(newBooking);
    localStorage.setItem(EGERTON_BOOKINGS_KEY, JSON.stringify(bookings));
    notifyBookingChange();
    
    return { success: true, booking: newBooking, pendingApproval: true };
}

/**
 * Cancels an active booking
 */
function cancelBooking(bookingId) {
    let bookings = getBookings();
    const activeUser = getActiveUser();
    
    if (!activeUser) return false;
    
    // Filter out the selected booking
    const originalLength = bookings.length;
    bookings = bookings.filter(b => !(b.bookingId === bookingId && b.userEmail === activeUser.email));
    
    localStorage.setItem(EGERTON_BOOKINGS_KEY, JSON.stringify(bookings));
    notifyBookingChange();
    
    updateDevConsoleDB();
    return bookings.length < originalLength;
}

// ==========================================================================
// 5. Dynamic Navbar & View Controller
// ==========================================================================

/**
 * Synchronizes user authentication views in the header navbar
 */
function initNavbarState() {
    const user = getActiveUser();
    const navLinks = document.querySelector(".nav-links");
    
    // Find the login button
    let loginBtn = document.querySelector(".login-btn");
    
    if (user) {
        if (isAdmin(user) && navLinks && !navLinks.querySelector(".admin-nav-top")) {
            const adminTop = document.createElement("a");
            adminTop.href = "admin.html";
            adminTop.className = "admin-nav-top";
            adminTop.style.cssText = "color:#6ee7a0;font-weight:600;";
            adminTop.textContent = "Admin";
            navLinks.appendChild(adminTop);
        }

        // If logged in, replace login button with Profile dropdown
        if (loginBtn) {
            const authWrapper = document.createElement("div");
            authWrapper.className = "nav-auth-wrapper";
            authWrapper.innerHTML = `
                <button class="user-profile-btn" id="profile-dropdown-trigger">
                    <span class="user-avatar">${user.username.charAt(0)}</span>
                    ${user.username} ▾
                </button>
                <div class="dropdown-menu" id="profile-dropdown-menu">
                    <div class="dropdown-header">
                        <h5>${user.username}</h5>
                        <span>${user.email}</span>
                    </div>
                    <a href="home.html#my-bookings-section" class="dropdown-item">
                        📅 My Bookings
                    </a>
                    ${isAdmin(user) ? `<a href="admin.html" class="dropdown-item admin-nav-link">🛡️ Admin Panel</a>` : ""}
                    <button class="dropdown-item logout-btn" id="logout-button">
                        🚪 Log Out
                    </button>
                </div>
            `;
            
            loginBtn.replaceWith(authWrapper);
            
            // Add dropdown togglers
            const trigger = document.getElementById("profile-dropdown-trigger");
            const menu = document.getElementById("profile-dropdown-menu");
            
            trigger.addEventListener("click", (e) => {
                e.stopPropagation();
                menu.classList.toggle("show");
            });
            
            document.addEventListener("click", () => {
                menu.classList.remove("show");
            });
            
            // Logout click
            document.getElementById("logout-button").addEventListener("click", handleLogout);
        }
    }
}

/**
 * Builds the Bookings Dashboard inside home.html (only visible to active session)
 */
function renderBookingsDashboard() {
    const user = getActiveUser();
    let anchor = document.querySelector(".main-container");
    if (!anchor) {
        anchor = document.querySelector(".home-cta-strip") || document.querySelector(".home-section");
    }
    
    if (!user || !anchor) return;
    
    // Check if bookings container already exists, if not create it
    let dashboard = document.getElementById("my-bookings-section");
    if (!dashboard) {
        dashboard = document.createElement("div");
        dashboard.id = "my-bookings-section";
        dashboard.className = "bookings-dashboard-container active";
        
        anchor.after(dashboard);
    }
    
    const bookings = getBookings().filter(b => b.userEmail === user.email);
    
    let bookingsHTML = "";
    if (bookings.length === 0) {
        bookingsHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 30px; color: var(--text-light); border: 1px dashed var(--border-color); border-radius: 8px;">
                <p style="margin-bottom: 12px; font-size: 14px;">You have no active bookings currently.</p>
                <a href="vehicles.html" class="login-btn" style="text-decoration:none; display:inline-block;">View Fleet & Book Now</a>
            </div>
        `;
    } else {
        bookingsHTML = bookings.map(b => {
            const status = b.status || "Pending";
            const statusClass = status.toLowerCase();
            const canCancel = status === "Pending" || status === "Approved";
            return `
            <div class="booking-record-card" id="card-${b.bookingId}">
                <div class="header">
                    <span class="ref-code">${b.bookingId}</span>
                    <span class="booking-status-pill ${statusClass}">${status}</span>
                </div>
                <div class="date" style="font-size:11px;color:var(--text-light);margin-bottom:6px;">${new Date(b.date).toLocaleDateString("en-US", {month: 'short', day: 'numeric', year: 'numeric'})}</div>
                <div class="dest">📍 To: ${b.destination}</div>
                <div class="vehicle-name">🚌 ${b.vehicleName}</div>
                <div style="font-size:11px; color:var(--text-light);">Purpose: ${b.tripPurpose} | Pax: ${b.passengerCount}</div>
                ${b.rejectionReason ? `<div style="font-size:11px;color:#f87171;margin-top:6px;">${b.rejectionReason}</div>` : ""}
                ${canCancel ? `<button class="cancel-btn" onclick="triggerBookingCancellation('${b.bookingId}')">Cancel Trip</button>` : ""}
            </div>
        `}).join("");
    }
    
    dashboard.innerHTML = `
        <div class="bookings-dashboard-header">
            <h3>📅 Your Requested Trips & Bookings</h3>
            <span style="font-size: 12px; color: var(--brand-green); font-weight:600; background: var(--brand-green-light); padding: 4px 10px; border-radius:20px;">
                ${bookings.length} Booked
            </span>
        </div>
        <div class="bookings-grid">
            ${bookingsHTML}
        </div>
    `;
}

/**
 * Renders a booking confirmation panel on service, staff, and contact pages.
 */
function buildBookingTicketCard(booking, isLive) {
    const dateStr = new Date(booking.date).toLocaleDateString("en-KE", {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric"
    });
    const status = booking.status || "Approved";
    const isPending = status === "Pending";
    const isRejected = status === "Rejected";
    const title = isPending ? "Request Submitted" : isRejected ? "Request Declined" : "Booking Confirmed";
    const icon = isPending ? "⏳" : isRejected ? "✕" : "✓";
    const stamp = isPending ? "PENDING" : isRejected ? "REJECTED" : "APPROVED";
    const liveBadge = isLive
        ? `<span class="booking-live-badge">${status}</span>`
        : `<span class="booking-demo-badge">Sample</span>`;

    return `
        <div class="booking-ticket-card ${isLive ? "is-live" : "is-demo"} status-${status.toLowerCase()}">
            <div class="booking-ticket-header">
                <div class="booking-ticket-icon">${icon}</div>
                <div>
                    <h3>${title}</h3>
                    <p>Egerton University Transport Department</p>
                </div>
                ${liveBadge}
            </div>
            <div class="booking-ticket-body">
                <div class="booking-ticket-row"><span>Ticket Ref</span><strong>${booking.bookingId}</strong></div>
                <div class="booking-ticket-row"><span>Status</span><strong>${status}</strong></div>
                <div class="booking-ticket-row"><span>Vehicle</span><strong>${booking.vehicleName}</strong></div>
                <div class="booking-ticket-row"><span>Travel Date</span><strong>${dateStr}</strong></div>
                <div class="booking-ticket-row"><span>Destination</span><strong>${booking.destination}</strong></div>
                <div class="booking-ticket-row"><span>Passengers</span><strong>${booking.passengerCount}</strong></div>
                <div class="booking-ticket-row"><span>Purpose</span><strong>${booking.tripPurpose}</strong></div>
                <div class="booking-ticket-row"><span>Requester</span><strong>${booking.userName || "—"}</strong></div>
                ${booking.rejectionReason ? `<div class="booking-ticket-row"><span>Note</span><strong>${booking.rejectionReason}</strong></div>` : ""}
                <div class="booking-ticket-stamp">${stamp}</div>
            </div>
            <div class="booking-ticket-footer">
                ${isLive ? `<a href="home.html#my-bookings-section" class="login-btn booking-ticket-cta">View All Bookings</a>` : `<a href="vehicles.html" class="login-btn booking-ticket-cta">Book a Vehicle</a>`}
                <a href="Tracking.html" class="booking-ticket-link">Track Trip →</a>
            </div>
        </div>
    `;
}

const DEMO_BOOKING = {
    bookingId: "EGT-48291-K",
    vehicleName: "Students Bus 2",
    date: "2026-06-15",
    destination: "Nairobi — Academic Conference",
    passengerCount: 42,
    tripPurpose: "Official University Trip",
    userName: "student_demo",
    status: "Approved"
};

function renderBookingSuccessSection() {
    const section = document.getElementById("booking-success-section");
    if (!section) return;

    const user = getActiveUser();
    const allBookings = getBookings();
    let booking = null;
    let isLive = false;

    const params = new URLSearchParams(window.location.search);
    const refFromUrl = params.get("ref");
    if (refFromUrl) {
        const fromUrl = allBookings.find(b => b.bookingId === refFromUrl);
        if (fromUrl) {
            booking = fromUrl;
            isLive = true;
        }
    }

    if (!booking && user) {
        const userBookings = allBookings.filter(b => b.userEmail === user.email);
        if (userBookings.length) {
            booking = userBookings[userBookings.length - 1];
            isLive = true;
        }
    }

    if (booking) {
        section.innerHTML = `
            <div class="booking-success-wrap">
                <div class="booking-success-intro">
                    <h2>Your Trip Confirmation</h2>
                    <p>Present this reference at pickup. Keep a printed or digital copy for boarding.</p>
                </div>
                ${buildBookingTicketCard(booking, isLive)}
            </div>
        `;
        return;
    }

    if (user) {
        section.innerHTML = `
            <div class="booking-success-wrap booking-success-empty">
                <div class="booking-success-intro">
                    <h2>No Active Bookings Yet</h2>
                    <p>Once you complete a vehicle request, your confirmation will appear here automatically.</p>
                </div>
                <a href="vehicles.html" class="login-btn">Browse Fleet &amp; Book</a>
            </div>
        `;
        return;
    }

    section.innerHTML = `
        <div class="booking-success-wrap">
            <div class="booking-success-intro">
                <h2>Booking Confirmation Preview</h2>
                <p>Sign in after booking to see your live ticket. Below is an example of a successful request.</p>
            </div>
            ${buildBookingTicketCard(DEMO_BOOKING, false)}
            <p class="booking-signin-hint"><button type="button" class="login-btn" id="booking-preview-login">Sign In to View Your Bookings</button></p>
        </div>
    `;

    const previewLogin = document.getElementById("booking-preview-login");
    if (previewLogin) {
        previewLogin.addEventListener("click", () => {
            const loginModal = document.getElementById("login");
            if (loginModal) loginModal.classList.add("active");
        });
    }
}

// Global hook for booking cancellation
window.triggerBookingCancellation = function(bookingId) {
    if (confirm("Are you sure you want to cancel this booking?")) {
        const success = cancelBooking(bookingId);
        if (success) {
            // Anim out card
            const card = document.getElementById(`card-${bookingId}`);
            if (card) {
                card.style.opacity = "0";
                card.style.transform = "scale(0.8)";
                setTimeout(() => {
                    renderBookingsDashboard();
                }, 300);
            }
        }
    }
};

// ==========================================================================
// 6. Interactive Developer Console
// ==========================================================================

let activeDevTab = "validation";

function buildDevConsole() {
    // Avoid double creations
    if (document.getElementById("floating-dev-console")) return;
    
    // Create toggle trigger
    const toggle = document.createElement("div");
    toggle.id = "floating-dev-toggle";
    toggle.className = "dev-console-toggle";
    toggle.innerHTML = "👨‍💻";
    toggle.title = "View Form & Auth Source Code Tutorial";
    document.body.appendChild(toggle);
    
    // Create Console Panel
    const consolePanel = document.createElement("div");
    consolePanel.id = "floating-dev-console";
    consolePanel.className = "dev-console";
    
    consolePanel.innerHTML = `
        <div class="dev-header">
            <h4>Egerton Dev Guide Console</h4>
            <span class="dev-close" id="dev-console-close">&times;</span>
        </div>
        <div class="dev-tabs">
            <button class="dev-tab active" data-tab="validation">Rules & Regex</button>
            <button class="dev-tab" data-tab="html">Form HTML</button>
            <button class="dev-tab" data-tab="js">State JS</button>
            <button class="dev-tab" data-tab="db">Live Database</button>
        </div>
        <div class="dev-content" id="dev-console-body">
            <!-- Dynamic Content -->
        </div>
    `;
    document.body.appendChild(consolePanel);
    
    // Add Toggle events
    toggle.addEventListener("click", () => {
        consolePanel.classList.toggle("active");
        renderDevContent();
    });
    
    document.getElementById("dev-console-close").addEventListener("click", () => {
        consolePanel.classList.remove("active");
    });
    
    // Add Tab event listeners
    const tabs = consolePanel.querySelectorAll(".dev-tab");
    tabs.forEach(tab => {
        tab.addEventListener("click", function() {
            tabs.forEach(t => t.classList.remove("active"));
            this.classList.add("active");
            activeDevTab = this.getAttribute("data-tab");
            renderDevContent();
        });
    });
    
    renderDevContent();
}

function renderDevContent() {
    const body = document.getElementById("dev-console-body");
    if (!body) return;
    
    if (activeDevTab === "validation") {
        body.innerHTML = `
            <div class="dev-explanation">
                <strong>Show Me How: Form Validation</strong><br>
                Success in forms comes from verifying inputs before sending to the backend. We use Regex patterns to inspect value structures and provide styling feedback on keypress or submit.
            </div>
            <pre class="dev-code-block"><code>// RegEx Validation Patterns used here:

// 1. Emails: Must be university domains (@egerton.ac.ke)
emailPattern = /^[a-zA-Z0-9._%+-]+@(student\\.)?egerton\\.ac\\.ke$/;

// 2. Passwords: Min 6 characters, 1 uppercase, 1 digit
passwordPattern = /^(?=.*[0-9])(?=.*[a-zA-Z]).{6,20}$/;

// 3. Usernames: Alphanumeric, between 5 and 20 chars
usernamePattern = /^[a-zA-Z0-9_]{5,20}$/;

// How we toggle classes:
if (pattern.test(value)) {
    inputGroup.classList.remove("error");
    inputGroup.classList.add("success");
    errorMsg.style.display = "none";
} else {
    inputGroup.classList.add("error");
    errorMsg.style.display = "block";
}</code></pre>
        `;
    } else if (activeDevTab === "html") {
        body.innerHTML = `
            <div class="dev-explanation">
                <strong>Semantic HTML Form Markup</strong><br>
                Modern, responsive forms require clear labels, precise input types (like <code>type="date"</code> or <code>type="email"</code>), and descriptive error buckets for accessibility (ARIA).
            </div>
            <pre class="dev-code-block"><code>&lt;!-- Successful Booking Form Structure --&gt;
&lt;form id="booking-form"&gt;
  &lt;div class="input-group"&gt;
    &lt;label for="user-name"&gt;Full Name / ID&lt;/label&gt;
    &lt;input type="text" id="user-name" required&gt;
    &lt;span class="input-feedback-msg"&gt;&lt;/span&gt;
  &lt;/div&gt;

  &lt;div class="input-group"&gt;
    &lt;label for="trip-date"&gt;Date of Travel&lt;/label&gt;
    &lt;input type="date" id="trip-date" required&gt;
    &lt;span class="input-feedback-msg"&gt;&lt;/span&gt;
  &lt;/div&gt;
  
  &lt;button type="submit"&gt;Submit Booking&lt;/button&gt;
&lt;/form&gt;</code></pre>
        `;
    } else if (activeDevTab === "js") {
        body.innerHTML = `
            <div class="dev-explanation">
                <strong>Simulated Session & Data Persistence</strong><br>
                To hold user states without a database server, we use browser's <code>localStorage</code> which serializes and writes JS objects as JSON strings.
            </div>
            <pre class="dev-code-block"><code>// Sign Up Flow
function register(user) {
  let users = JSON.parse(localStorage.getItem('users')) || [];
  users.push(user);
  localStorage.setItem('users', JSON.stringify(users));
}

// Session Lock Flow
const activeSession = localStorage.getItem('activeUser');
if (!activeSession) {
  bookingForm.classList.add('logged-out'); // Shows Lock Card
} else {
  bookingForm.classList.remove('logged-out'); // Unlocks Form
}</code></pre>
        `;
    } else if (activeDevTab === "db") {
        const users = getUsers();
        const bookings = getBookings();
        const active = getActiveUser();
        
        body.innerHTML = `
            <div class="dev-explanation">
                <strong>Live Client-Side Database Inspector</strong><br>
                Here is the real-time content of your browser's local storage database for this website!
            </div>
            <div>
                <span class="dev-db-badge session">Active Session</span>
                <pre class="dev-code-block" style="color: #fda4af; margin-bottom: 12px;"><code>${active ? JSON.stringify(active, null, 2) : "NO ACTIVE SESSION (Logged Out)"}</code></pre>
                
                <span class="dev-db-badge users">Registered Accounts (${users.length})</span>
                <pre class="dev-code-block" style="color: #93c5fd; margin-bottom: 12px; max-height: 120px; overflow-y: auto;"><code>${JSON.stringify(users, null, 2)}</code></pre>
                
                <span class="dev-db-badge bookings">Active Bookings (${bookings.length})</span>
                <pre class="dev-code-block" style="color: #6ee7b7; max-height: 120px; overflow-y: auto;"><code>${JSON.stringify(bookings, null, 2)}</code></pre>
            </div>
        `;
    }
}

function updateDevConsoleDB() {
    if (activeDevTab === "db" && document.getElementById("floating-dev-console")?.classList.contains("active")) {
        renderDevContent();
    }
}

// ==========================================================================
// 7. Initialize Everything on Load
// ==========================================================================

// ==========================================================================
// 7. Initialize Everything and Hook UI Elements on Load
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    initNavbarState();
    renderBookingsDashboard();
    renderBookingSuccessSection();
    buildDevConsole();
    
    // ---------------------------------------------------------
    // A. Modal Popup Event Handlers (Anti-Hash-Scroll UX)
    // ---------------------------------------------------------
    
    const loginModal = document.getElementById("login");
    const signupModal = document.getElementById("signup");
    const forgotModal = document.getElementById("forgot");
    
    // Function to close all auth modals
    function closeAllModals() {
        if (loginModal) loginModal.classList.remove("active");
        if (signupModal) signupModal.classList.remove("active");
        if (forgotModal) forgotModal.classList.remove("active");
    }
    
    // Hook Login buttons (navbar/cta buttons)
    document.querySelectorAll(".login-btn, #login-nav-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            // Check if this is the actual profile menu or logout button
            if (e.target.id === "profile-dropdown-trigger" || e.target.id === "logout-button") return;
            
            // Only trigger if user is logged out (has login text or button)
            const activeUser = getActiveUser();
            if (!activeUser) {
                e.preventDefault();
                closeAllModals();
                if (loginModal) loginModal.classList.add("active");
                updateDevConsoleDB();
            }
        });
    });
    
    // Hook Close buttons in modals
    document.querySelectorAll(".popup .close, #close-login, #close-signup, #close-forgot").forEach(closeBtn => {
        closeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            closeAllModals();
        });
    });
    
    // Close modal on background click
    document.querySelectorAll(".popup").forEach(popup => {
        popup.addEventListener("click", (e) => {
            if (e.target === popup) {
                closeAllModals();
            }
        });
    });
    
    // Modal Switchers
    const toSignupBtn = document.getElementById("to-signup");
    if (toSignupBtn) {
        toSignupBtn.addEventListener("click", (e) => {
            e.preventDefault();
            closeAllModals();
            if (signupModal) signupModal.classList.add("active");
        });
    }
    
    const toLoginBtn = document.getElementById("to-login");
    if (toLoginBtn) {
        toLoginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            closeAllModals();
            if (loginModal) loginModal.classList.add("active");
        });
    }
    
    const toForgotBtn = document.getElementById("to-forgot");
    if (toForgotBtn) {
        toForgotBtn.addEventListener("click", (e) => {
            e.preventDefault();
            closeAllModals();
            if (forgotModal) forgotModal.classList.add("active");
        });
    }
    
    const forgotToLoginBtn = document.getElementById("forgot-to-login");
    if (forgotToLoginBtn) {
        forgotToLoginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            closeAllModals();
            if (loginModal) loginModal.classList.add("active");
        });
    }
    
    // ---------------------------------------------------------
    // B. Signup Form Interactive Validation
    // ---------------------------------------------------------
    
    const signupForm = document.getElementById("signup-form-inner");
    if (signupForm) {
        const usernameInput = document.getElementById("signup-username");
        const emailInput = document.getElementById("signup-email");
        const idInput = document.getElementById("signup-idnum");
        const passwordInput = document.getElementById("signup-password");
        
        if (usernameInput) {
            usernameInput.addEventListener("input", () => {
                validateField(usernameInput, ValidationRules.username, "Username must be 5-20 characters, alphanumeric.");
            });
        }
        if (emailInput) {
            emailInput.addEventListener("input", () => {
                validateField(emailInput, ValidationRules.email, "Must be a valid Egerton university email (@egerton.ac.ke or @student.egerton.ac.ke).");
            });
        }
        if (idInput) {
            idInput.addEventListener("input", () => {
                validateField(idInput, ValidationRules.staffOrStudentId, "Enter a valid ID number (minimum 4 characters).");
            });
        }
        if (passwordInput) {
            passwordInput.addEventListener("input", () => {
                validateField(passwordInput, ValidationRules.password, "Must be 6-20 characters with at least one letter and one number.");
            });
        }
        
        signupForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const isUserValid = validateField(usernameInput, ValidationRules.username, "Username must be 5-20 characters, alphanumeric.");
            const isEmailValid = validateField(emailInput, ValidationRules.email, "Must be a valid Egerton university email (@egerton.ac.ke or @student.egerton.ac.ke).");
            const isIdValid = validateField(idInput, ValidationRules.staffOrStudentId, "Enter a valid ID number (minimum 4 characters).");
            const isPassValid = validateField(passwordInput, ValidationRules.password, "Must be 6-20 characters with at least one letter and one number.");
            
            if (isUserValid && isEmailValid && isIdValid && isPassValid) {
                const userTypeVal = document.getElementById("signup-usertype").value;
                const result = handleSignup(
                    usernameInput.value.trim(),
                    emailInput.value.trim(),
                    passwordInput.value,
                    userTypeVal,
                    idInput.value.trim()
                );
                
                if (result.success) {
                    alert("🎉 Registration Successful! Welcome to Egerton Transport Department.");
                    window.location.reload();
                } else {
                    // Show error on username or email
                    const focusField = result.message.includes("Username") ? usernameInput : emailInput;
                    validateField(focusField, /^$/, result.message); // Force error
                }
            }
        });
    }
    
    // ---------------------------------------------------------
    // C. Login Form Interactive Validation
    // ---------------------------------------------------------
    
    const loginForm = document.getElementById("login-form-inner");
    if (loginForm) {
        const emailOrUserVal = document.getElementById("login-username");
        const passwordVal = document.getElementById("login-password");
        
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const isUserValid = emailOrUserVal.value.trim() !== "";
            const isPassValid = passwordVal.value !== "";
            
            if (!isUserValid) {
                validateField(emailOrUserVal, /^.+$/, "Please enter your username or email.");
            }
            if (!isPassValid) {
                validateField(passwordVal, /^.+$/, "Please enter your password.");
            }
            
            if (isUserValid && isPassValid) {
                const result = handleLogin(emailOrUserVal.value.trim(), passwordVal.value);
                
                if (result.success) {
                    alert("🚪 Welcome back! You are now logged in.");
                    window.location.reload();
                } else {
                    alert("❌ " + result.message);
                    validateField(emailOrUserVal, /^$/, "Invalid credentials.");
                    validateField(passwordVal, /^$/, "Invalid credentials.");
                }
            }
        });
    }
    
    // ---------------------------------------------------------
    // D. Forgot Password Form Submit
    // ---------------------------------------------------------
    
    const forgotForm = document.getElementById("forgot-form-inner");
    if (forgotForm) {
        const emailInput = document.getElementById("forgot-email");
        if (emailInput) {
            emailInput.addEventListener("input", () => {
                validateField(emailInput, ValidationRules.email, "Must be a valid Egerton university email.");
            });
        }
        
        forgotForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const isValid = validateField(emailInput, ValidationRules.email, "Must be a valid Egerton university email.");
            if (isValid) {
                alert(`📧 Simulated Password Reset Link Sent!\nWe have dispatched a recovery email to: ${emailInput.value.trim()}`);
                closeAllModals();
                if (loginModal) loginModal.classList.add("active");
            }
        });
    }
});

// Expose functions globally to the window object for static site imports
window.EgertonAuth = {
    ValidationRules, 
    validateField, 
    handleSignup, 
    handleLogin, 
    handleLogout, 
    requestBooking, 
    cancelBooking,
    approveBooking,
    rejectBooking,
    isAdmin,
    getFleet,
    getVehicleStatus,
    setVehicleStatus,
    getTransportIssues,
    addTransportIssue,
    updateIssueStatus,
    getActiveUser,
    getUsers,
    getBookings,
    updateDevConsoleDB,
    renderBookingsDashboard,
    renderBookingSuccessSection,
    initNavbarState
};
