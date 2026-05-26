document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("transport-contact-form");
  const formPanel = document.getElementById("contact-form-panel");
  const successPanel = document.getElementById("contact-success-panel");
  const resetBtn = document.getElementById("contact-reset-btn");
  const bookingNote = document.getElementById("contact-success-booking-note");

  if (!form) return;

  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }

  function clearErrors() {
    ["name-error", "email-error", "message-error"].forEach((id) => showError(id, ""));
    form.querySelectorAll(".input-group").forEach((g) => g.classList.remove("error"));
  }

  function validateContactForm() {
    clearErrors();
    let valid = true;

    const name = document.getElementById("user-name");
    const email = document.getElementById("user-email");
    const message = document.getElementById("message");

    if (!name.value.trim()) {
      name.closest(".input-group").classList.add("error");
      showError("name-error", "Please enter your full name.");
      valid = false;
    }

    const emailVal = email.value.trim();
    const emailPattern = /^[a-zA-Z0-9._%+-]+@(student\.)?egerton\.ac\.ke$/;
    if (!emailVal || !emailPattern.test(emailVal)) {
      email.closest(".input-group").classList.add("error");
      showError("email-error", "Use a valid Egerton email (@egerton.ac.ke).");
      valid = false;
    }

    if (!message.value.trim()) {
      message.closest(".input-group").classList.add("error");
      showError("message-error", "Please enter your message.");
      valid = false;
    }

    return valid;
  }

  function showContactSuccess() {
    formPanel.hidden = true;
    successPanel.hidden = false;

    const refInput = document.getElementById("booking-ref");
    const ref = refInput && refInput.value.trim();

    if (bookingNote) {
      if (ref) {
        bookingNote.hidden = false;
        bookingNote.textContent =
          "Your message references booking " +
          ref +
          ". Our booking desk will prioritise trip-related enquiries.";
      } else if (window.EgertonAuth) {
        const user = window.EgertonAuth.getActiveUser();
        const bookings = window.EgertonAuth.getBookings();
        if (user && bookings.length) {
          const latest = bookings.filter((b) => b.userEmail === user.email).pop();
          if (latest) {
            bookingNote.hidden = false;
            bookingNote.textContent =
              "Linked to your confirmed trip " +
              latest.bookingId +
              " (" +
              latest.vehicleName +
              " on " +
              new Date(latest.date).toLocaleDateString("en-KE") +
              ").";
          } else {
            bookingNote.hidden = true;
          }
        } else {
          bookingNote.hidden = true;
        }
      }
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateContactForm()) return;

    const contactRequest = {
      requestId: `CONTACT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
      name: document.getElementById("user-name").value.trim(),
      email: document.getElementById("user-email").value.trim(),
      message: document.getElementById("message").value.trim(),
      bookingRef: document.getElementById("booking-ref")?.value.trim() || null,
      submittedAt: new Date().toISOString()
    };

    if (window.EgertonAuth && typeof window.EgertonAuth.addContactRequest === "function") {
      window.EgertonAuth.addContactRequest(contactRequest);
    } else {
      const stored = JSON.parse(localStorage.getItem("egerton_transport_contact_requests") || "[]");
      stored.unshift(contactRequest);
      localStorage.setItem("egerton_transport_contact_requests", JSON.stringify(stored.slice(0, 50)));
      window.dispatchEvent(new Event('egerton-contact-requests-updated'));
    }

    showContactSuccess();
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      form.reset();
      clearErrors();
      formPanel.hidden = false;
      successPanel.hidden = true;
      if (bookingNote) bookingNote.hidden = true;
    });
  }

  const params = new URLSearchParams(window.location.search);
  const refParam = params.get("ref");
  const refInput = document.getElementById("booking-ref");
  if (refParam && refInput) {
    refInput.value = refParam;
  }
  if (params.get("sent") === "1") {
    showContactSuccess();
  }
});
