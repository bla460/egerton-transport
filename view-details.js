// Full vehicle database — mirrors every card in vehicles.html
const vehicleData = {
    "passengers-bus-1": {
        img: "Images/Cool Bus.jpg",
        name: "Passengers Bus",
        capacity: "64 Passengers",
        status: "Available",
        description: "A large capacity bus ideal for student and staff transport across campuses. Fully air-conditioned with comfortable seating."
    },
    "students-bus-1": {
        img: "Images/bus 4.jpg",
        name: "Students Bus",
        capacity: "50 Passengers",
        status: "In Service",
        description: "Designated for student trips and academic excursions. Fitted with safety belts and emergency exits."
    },
    "staff-van-1": {
        img: "Images/hiace 2.jpg",
        name: "Staff Van",
        capacity: "15 Seats",
        status: "Under Maintenance",
        description: "A versatile van used for staff commute and small group transport around the university compound."
    },
    "delivery-truck-1": {
        img: "Images/Truck.webp",
        name: "Delivery Truck",
        capacity: "8 Tons",
        status: "Available",
        description: "Heavy-duty truck for transporting equipment, supplies, and cargo between campuses and external locations."
    },
    "students-bus-2": {
        img: "Images/Scania Bus.jpg",
        name: "Students Bus 2",
        capacity: "40 Passengers",
        status: "In Service",
        description: "A robust Scania bus dedicated to student fieldwork and inter-campus travel. Equipped with luggage storage."
    },
    "faculty-van-1": {
        img: "Images/passengers vehicle.jpg",
        name: "Faculty Van",
        capacity: "12 Seats",
        status: "Available",
        description: "A comfortable van reserved for faculty members attending conferences, meetings, and official university events."
    },
    "cargo-truck-1": {
        img: "Images/Truck 3.jpg",
        name: "Cargo Truck",
        capacity: "5 Tons",
        status: "Under Maintenance",
        description: "Used for cargo and logistics operations on campus. Suitable for bulky deliveries and equipment relocation."
    },
    "students-bus-3": {
        img: "Images/egerton bus 2.jpeg",
        name: "Students Bus 3",
        capacity: "60 Passengers",
        status: "Available",
        description: "A large Egerton-branded bus for high-capacity student transport. Perfect for mass excursions and graduation events."
    },
    "maintenance-van-1": {
        img: "Images/Minibus.jpg",
        name: "Maintenance Van",
        capacity: "10 Seats",
        status: "In Service",
        description: "Dedicated to the facilities and maintenance team for rapid deployment across the university grounds."
    },
    "taxi-1": {
        img: "Images/Taxi.jpg",
        name: "Taxi",
        capacity: "4 Passengers",
        status: "Available",
        description: "Available for urgent individual or small-group travel needs within and around the university environs."
    },
    "campus-shuttle-1": {
        img: "Images/White Van 1.jpg",
        name: "Campus Shuttle",
        capacity: "20 Passengers",
        status: "In Service",
        description: "Runs on a fixed schedule between hostels, lecture halls, and key university facilities throughout the day."
    },
    "bike-1": {
        img: "Images/Bike.jpg",
        name: "Bike",
        capacity: "For Hire",
        status: "Available",
        description: "Eco-friendly bicycle available for hire within the campus. Ideal for short-distance travel between blocks."
    }
};

// --- Dynamic page population ---
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const vehicle = vehicleData[id];

let maxPassengers = 1; // Default fallback for bikes/trucks

function getPassengerCapacity(capacityStr) {
    const match = capacityStr.match(/^(\d+)\s*(Passengers|Seats|Seats)/i);
    if (match) {
        return parseInt(match[1], 10);
    }
    return 1;
}

if (vehicle) {
    // Image
    const img = document.getElementById("vehicle-img");
    if (img) { img.src = vehicle.img; img.alt = vehicle.name; }

    // Text fields
    document.getElementById("details-name").textContent = vehicle.name;
    document.getElementById("details-capacity").textContent = "Capacity: " + vehicle.capacity;
    document.getElementById("details-description").textContent = vehicle.description;
    document.title = vehicle.name + " — Egerton Transport";

    // Status badge — use admin fleet overrides when available
    const statusEl = document.getElementById("details-status");
    const submitBtn = document.getElementById("submit-btn");

    function refreshStatusBadge() {
        if (!statusEl) return;
        const liveStatus =
            window.EgertonAuth && id
                ? window.EgertonAuth.getVehicleStatus(id)
                : vehicle.status;
        vehicle.status = liveStatus;
        statusEl.textContent = liveStatus;
        statusEl.className = "status-badge";
        if (liveStatus === "Available") statusEl.classList.add("status-available");
        else if (liveStatus === "In Service") statusEl.classList.add("status-inservice");
        else statusEl.classList.add("status-maintenance");

        if (submitBtn) {
            if (liveStatus === "Available") {
                submitBtn.disabled = false;
                submitBtn.textContent = "Submit Booking Request";
                submitBtn.style.opacity = "";
                submitBtn.style.cursor = "";
            } else {
                submitBtn.disabled = true;
                submitBtn.textContent = liveStatus === "In Service" ? "Currently In Service" : "Under Maintenance";
                submitBtn.style.opacity = "0.6";
                submitBtn.style.cursor = "not-allowed";
            }
        }
    }

    refreshStatusBadge();

    // Listen for admin changes to fleet state
    window.addEventListener("egerton-fleet-updated", refreshStatusBadge);
    window.addEventListener("storage", (event) => {
        if (event.key === "egerton_transport_fleet") {
            refreshStatusBadge();
        }
    });

    // Set Max passengers on the input field dynamically
    maxPassengers = getPassengerCapacity(vehicle.capacity);
    const passInput = document.getElementById("passenger-count");
    if (passInput) {
        passInput.max = maxPassengers;
        passInput.placeholder = `1 to ${maxPassengers} passengers`;
    }

    // Disable booking if not available
    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn && vehicle.status !== "Available") {
        submitBtn.disabled = true;
        submitBtn.textContent = vehicle.status === "In Service" ? "Currently In Service" : "Under Maintenance";
        submitBtn.style.opacity = "0.6";
        submitBtn.style.cursor = "not-allowed";
    }
} else {
    document.getElementById("details-name").textContent = "Vehicle Not Found";
    document.getElementById("details-capacity").textContent = "";
    document.getElementById("details-description").textContent = "No details available for this vehicle.";
}

// --- Session State & Form Validation Logic ---
document.addEventListener("DOMContentLoaded", () => {
    const auth = window.EgertonAuth;
    if (!auth) {
        console.error("EgertonAuth library not found.");
        return;
    }

    const bookingPanel = document.querySelector(".booking-form-panel");
    const activeUser = auth.getActiveUser();

    // 1. Session Lock Controller
    if (!activeUser) {
        bookingPanel.classList.add("logged-out");
        
        // Connect the booking CTA buttons to the page auth popups
        const loginLockBtn = bookingPanel.querySelector("#booking-login-btn");
        const signupLockBtn = bookingPanel.querySelector("#booking-signup-btn");
        const loginModal = document.getElementById("login");
        const signupModal = document.getElementById("signup");

        if (loginLockBtn) {
            loginLockBtn.addEventListener("click", () => {
                if (loginModal) {
                    loginModal.classList.add("active");
                }
            });
        }

        if (signupLockBtn) {
            signupLockBtn.addEventListener("click", () => {
                if (signupModal) {
                    signupModal.classList.add("active");
                }
            });
        }
    } else {
        bookingPanel.classList.remove("logged-out");
        
        // Auto-populate User Name & ID fields securely
        const userField = document.getElementById("booking-user-name");
        if (userField) {
            userField.value = `${activeUser.username} (${activeUser.idNum})`;
            
            // Highlight as successful validation state immediately
            const parent = userField.closest(".input-group") || userField.parentElement;
            parent.classList.add("success");
        }
    }

    // 2. Real-Time Field Validation Bindings
    const dateField = document.getElementById("trip-date");
    const destField = document.getElementById("destination");
    const passField = document.getElementById("passenger-count");
    const purposeField = document.getElementById("trip-purpose");

    if (dateField) {
        dateField.addEventListener("input", () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selected = new Date(dateField.value);
            
            if (dateField.value === "") {
                auth.validateField(dateField, /^$/, "Travel date is required.");
            } else if (selected < today) {
                auth.validateField(dateField, /^$/, "Trip date must be today or in the future.");
            } else {
                // Clear error
                auth.validateField(dateField, /^.*$/, "");
            }
        });
    }

    if (destField) {
        destField.addEventListener("input", () => {
            const value = destField.value.trim();
            if (value.length < 3) {
                auth.validateField(destField, /^$/, "Destination must be at least 3 characters.");
            } else {
                auth.validateField(destField, /^.+$/, "");
            }
        });
    }

    if (passField) {
        passField.addEventListener("input", () => {
            const count = parseInt(passField.value, 10);
            if (isNaN(count) || count < 1) {
                auth.validateField(passField, /^$/, "Must be at least 1 passenger.");
            } else if (count > maxPassengers) {
                auth.validateField(passField, /^$/, `Passenger count exceeds vehicle capacity of ${maxPassengers}.`);
            } else {
                auth.validateField(passField, /^.+$/, "");
            }
        });
    }

    if (purposeField) {
        purposeField.addEventListener("change", () => {
            if (purposeField.value === "") {
                auth.validateField(purposeField, /^$/, "Please select a trip purpose.");
            } else {
                auth.validateField(purposeField, /^.+$/, "");
            }
        });
    }

    // 3. Form Submission Coordinator
    const bookingForm = document.getElementById("booking-form");
    if (bookingForm) {
        bookingForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Run final check validations
            let isFormValid = true;

            // Date validation
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selected = new Date(dateField.value);
            if (dateField.value === "") {
                auth.validateField(dateField, /^$/, "Travel date is required.");
                isFormValid = false;
            } else if (selected < today) {
                auth.validateField(dateField, /^$/, "Trip date must be today or in the future.");
                isFormValid = false;
            } else {
                auth.validateField(dateField, /^.*$/, "");
            }

            // Destination validation
            if (destField.value.trim().length < 3) {
                auth.validateField(destField, /^$/, "Destination must be at least 3 characters.");
                isFormValid = false;
            } else {
                auth.validateField(destField, /^.+$/, "");
            }

            // Passenger validation
            const count = parseInt(passField.value, 10);
            if (isNaN(count) || count < 1) {
                auth.validateField(passField, /^$/, "Must be at least 1 passenger.");
                isFormValid = false;
            } else if (count > maxPassengers) {
                auth.validateField(passField, /^$/, `Passenger count exceeds vehicle capacity of ${maxPassengers}.`);
                isFormValid = false;
            } else {
                auth.validateField(passField, /^.+$/, "");
            }

            // Purpose validation
            if (purposeField.value === "") {
                auth.validateField(purposeField, /^$/, "Please select a trip purpose.");
                isFormValid = false;
            } else {
                auth.validateField(purposeField, /^.+$/, "");
            }

            if (isFormValid) {
                const vehicleName = vehicle ? vehicle.name : "Unknown Vehicle";
                const result = await auth.requestBooking(
                    id,
                    vehicleName,
                    dateField.value,
                    destField.value.trim(),
                    count,
                    purposeField.value
                );

                if (result.success) {
                    const booking = result.booking;
                    const isPending = booking.status === "Pending";

                    const receiptTitle = document.querySelector("#booking-receipt-modal .receipt-header h3");
                    const receiptBadge = document.querySelector("#booking-receipt-modal .success-badge");
                    const receiptStamp = document.querySelector("#booking-receipt-modal .receipt-stamp");
                    if (receiptTitle) {
                        receiptTitle.textContent = isPending
                            ? "Request Submitted — Pending Approval"
                            : "Booking Confirmed!";
                    }
                    if (receiptBadge) receiptBadge.textContent = isPending ? "⏳" : "✓";
                    if (receiptStamp) {
                        receiptStamp.textContent = isPending ? "PENDING" : "APPROVED";
                    }

                    document.getElementById("receipt-vehicle").textContent = booking.vehicleName;
                    document.getElementById("receipt-user").textContent = activeUser.username;
                    document.getElementById("receipt-id").textContent = booking.userIdNum;
                    document.getElementById("receipt-email").textContent = activeUser.email || "Not available";
                    document.getElementById("receipt-date").textContent = new Date(booking.date).toLocaleDateString("en-US", {
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                    });
                    document.getElementById("receipt-destination").textContent = booking.destination;
                    document.getElementById("receipt-passengers").textContent = `${booking.passengerCount} / ${maxPassengers}`;
                    document.getElementById("receipt-purpose").textContent = booking.tripPurpose;
                    document.getElementById("receipt-ticket-code").textContent = booking.bookingId;

                    const receiptModal = document.getElementById("booking-receipt-modal");
                    if (receiptModal) {
                        receiptModal.classList.add("active");
                    }

                    const confirmationMsg = document.getElementById("confirmation-msg");
                    const emailNotificationEl = document.getElementById("email-notification");
                    const emailAddress = activeUser.email || "your email address";
                    if (confirmationMsg) {
                        const formattedDate = new Date(booking.date).toLocaleDateString("en-US", {
                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                        });
                        confirmationMsg.style.display = "block";
                        confirmationMsg.innerHTML = isPending
                            ? `<strong>Booking request submitted!</strong> Your request for <strong>${booking.vehicleName}</strong> on <strong>${formattedDate}</strong> to <strong>${booking.destination}</strong> is now pending approval. Reference: <strong>${booking.bookingId}</strong>. A confirmation email has been sent to <strong>${emailAddress}</strong>.`
                            : `<strong>Booking confirmed!</strong> Your trip for <strong>${booking.vehicleName}</strong> on <strong>${formattedDate}</strong> to <strong>${booking.destination}</strong> has been confirmed. Ticket: <strong>${booking.bookingId}</strong>. A confirmation email has been sent to <strong>${emailAddress}</strong>.`;
                    }
                    if (emailNotificationEl) {
                        const emailData = result.emailNotification;
                        if (emailData) {
                            emailNotificationEl.style.display = "block";
                            emailNotificationEl.innerHTML = `
                                <div style="padding:14px 16px; border:1px solid rgba(40,167,69,0.25); border-radius:10px; background:rgba(234,247,236,0.85); color:#114f22;">
                                    <div style="font-size:0.95rem; margin-bottom:8px;"><strong>Email notification sent to:</strong> ${emailData.to}</div>
                                    <div style="font-size:0.88rem; margin-bottom:8px;"><strong>Subject:</strong> ${emailData.subject}</div>
                                    <pre style="white-space:pre-wrap; margin:0; padding:12px; border-radius:8px; background:#f5fcf7; color:#184f2b; font-size:0.88rem; overflow:auto;">${emailData.body}</pre>
                                </div>
                            `;
                        } else {
                            emailNotificationEl.style.display = "none";
                            emailNotificationEl.innerHTML = "";
                        }
                    }

                    if (isPending) {
                        alert(
                            "Your trip request has been submitted.\n\n" +
                            "Reference: " + booking.bookingId + "\n\n" +
                            "A transport administrator will review and authorize your booking. " +
                            "You will see the status update under My Bookings once approved."
                        );
                    }

                    // Reset form fields
                    bookingForm.reset();
                    
                    // Restore read-only name field with session info
                    const userField = document.getElementById("booking-user-name");
                    if (userField) {
                        userField.value = `${activeUser.username} (${activeUser.idNum})`;
                    }
                    
                    // Clean success / error classes
                    [dateField, destField, passField, purposeField].forEach(el => {
                        const parent = el.closest(".input-group") || el.parentElement;
                        parent.classList.remove("success", "error");
                    });

                    // Update developer live storage inspector
                    auth.updateDevConsoleDB();
                } else {
                    const confirmationMsg = document.getElementById("confirmation-msg");
                    const emailNotificationEl = document.getElementById("email-notification");
                    if (confirmationMsg) {
                        confirmationMsg.style.display = "none";
                        confirmationMsg.innerHTML = "";
                    }
                    if (emailNotificationEl) {
                        emailNotificationEl.style.display = "none";
                        emailNotificationEl.innerHTML = "";
                    }
                    alert("❌ " + result.message);
                }
            }
        });
    }

    // 4. Booking Receipt Actions
    const printBtn = document.getElementById("receipt-print-btn");
    if (printBtn) {
        printBtn.addEventListener("click", () => {
            // Simulated premium thermal/stamp printing action
            const printBtnText = printBtn.innerHTML;
            printBtn.innerHTML = "⌛ Preparing Document...";
            printBtn.disabled = true;
            
            setTimeout(() => {
                printBtn.innerHTML = "🖨️ Spooling to Printer...";
                setTimeout(() => {
                    alert("📄 Egerton University Transport Ticket Spooled Successfully!\n\nReference: " + document.getElementById("receipt-ticket-code").textContent + "\nStatus: APPROVED & SIGNED\n\nA physical print-out of this ticket is sent to your local machine.");
                    printBtn.innerHTML = printBtnText;
                    printBtn.disabled = false;
                }, 1000);
            }, 800);
        });
    }

    const closeReceiptBtn = document.getElementById("receipt-close-btn");
    if (closeReceiptBtn) {
        closeReceiptBtn.addEventListener("click", () => {
            const receiptModal = document.getElementById("booking-receipt-modal");
            if (receiptModal) {
                receiptModal.classList.remove("active");
            }
            
            const ref = document.getElementById("receipt-ticket-code")?.textContent;
            window.location.href = ref
                ? "contact.html?ref=" + encodeURIComponent(ref)
                : "home.html#my-bookings-section";
        });
    }
});