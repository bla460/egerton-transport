/**
 * Transport Department — Admin control panel
 */
document.addEventListener("DOMContentLoaded", () => {
  const auth = window.EgertonAuth;
  if (!auth) return;

  const user = auth.getActiveUser();
  const deniedEl = document.getElementById("admin-access-denied");
  const dashboardEl = document.getElementById("admin-dashboard");

  if (!auth.isAdmin(user)) {
    if (deniedEl) deniedEl.hidden = false;
    if (dashboardEl) dashboardEl.hidden = true;
    return;
  }

  if (deniedEl) deniedEl.hidden = true;
  if (dashboardEl) dashboardEl.hidden = false;

  const roleEl = document.getElementById("admin-user-role");
  if (roleEl) {
    roleEl.textContent = user.username + " · " + user.idNum;
  }

  const tabs = document.querySelectorAll(".admin-tab");
  const panels = document.querySelectorAll(".admin-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-panel");
      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("panel-" + target)?.classList.add("active");
    });
  });

  function renderStats() {
    const bookings = auth.getBookings();
    const pending = bookings.filter((b) => (b.status || "Pending") === "Pending").length;
    const approved = bookings.filter((b) => b.status === "Approved").length;
    const issues = auth.getTransportIssues().filter((i) => i.status !== "Resolved").length;
    const fleet = auth.getFleet();
    const maintenance = Object.values(fleet).filter(
      (v) => v.status === "Under Maintenance"
    ).length;

    setText("stat-pending", pending);
    setText("stat-approved", approved);
    setText("stat-issues", issues);
    setText("stat-maintenance", maintenance);

    const badge = document.getElementById("tab-pending-badge");
    if (badge) {
      badge.textContent = pending;
      badge.hidden = pending === 0;
    }
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function renderPendingBookings() {
    const container = document.getElementById("pending-bookings-list");
    if (!container) return;

    const pending = auth
      .getBookings()
      .filter((b) => (b.status || "Pending") === "Pending")
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (pending.length === 0) {
      container.innerHTML =
        '<div class="admin-empty">No booking requests awaiting authorization.</div>';
      return;
    }

    container.innerHTML = pending.map((b) => bookingCard(b, true)).join("");
    bindBookingActions(container);
  }

  function renderAllBookings() {
    const container = document.getElementById("all-bookings-list");
    if (!container) return;

    const all = auth
      .getBookings()
      .sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date));

    if (all.length === 0) {
      container.innerHTML = '<div class="admin-empty">No bookings in the system yet.</div>';
      return;
    }

    container.innerHTML = all.map((b) => bookingCard(b, false)).join("");
    bindBookingActions(container);
  }

  function bookingCard(b, showActions) {
    const status = b.status || "Pending";
    const dateStr = new Date(b.date).toLocaleDateString("en-KE", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    const actions =
      showActions && status === "Pending"
        ? `<div class="admin-actions">
            <button type="button" class="admin-btn admin-btn-approve" data-approve="${b.bookingId}">✓ Authorize Trip</button>
            <button type="button" class="admin-btn admin-btn-reject" data-reject="${b.bookingId}">✕ Decline</button>
          </div>`
        : status === "Pending"
          ? `<div class="admin-actions">
              <button type="button" class="admin-btn admin-btn-approve" data-approve="${b.bookingId}">✓ Authorize</button>
              <button type="button" class="admin-btn admin-btn-reject" data-reject="${b.bookingId}">✕ Decline</button>
            </div>`
          : "";

    return `
      <article class="admin-card" id="admin-booking-${b.bookingId}">
        <div class="admin-card-header">
          <div>
            <h3>${b.bookingId} — ${b.vehicleName}</h3>
            <p class="admin-meta">
              ${dateStr} · ${b.destination}<br>
              Requester: ${b.userName} (${b.userIdNum}) · ${b.userType}<br>
              ${b.passengerCount} passengers · ${b.tripPurpose}
            </p>
          </div>
          <span class="status-pill-admin ${status.toLowerCase()}">${status}</span>
        </div>
        ${b.rejectionReason ? `<p class="admin-meta" style="color:#f87171;">${b.rejectionReason}</p>` : ""}
        ${actions}
      </article>
    `;
  }

  function bindBookingActions(container) {
    container.querySelectorAll("[data-approve]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-approve");
        const result = auth.approveBooking(id);
        if (result.success) {
          refreshAll();
          alert("Trip " + id + " has been authorized.");
        } else {
          alert(result.message);
        }
      });
    });

    container.querySelectorAll("[data-reject]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-reject");
        const reason = prompt("Reason for declining this request (optional):");
        if (reason === null) return;
        const result = auth.rejectBooking(id, reason);
        if (result.success) {
          refreshAll();
          alert("Trip " + id + " has been declined.");
        } else {
          alert(result.message);
        }
      });
    });
  }

  function renderFleet() {
    const container = document.getElementById("fleet-admin-grid");
    if (!container) return;

    const fleet = auth.getFleet();
    const statuses = ["Available", "In Service", "Under Maintenance"];

    container.innerHTML = Object.entries(fleet)
      .map(([id, v]) => {
        const options = statuses
          .map(
            (s) =>
              `<option value="${s}" ${v.status === s ? "selected" : ""}>${s}</option>`
          )
          .join("");
        return `
          <div class="admin-card fleet-admin-card">
            <h3>${v.name}</h3>
            <p class="admin-meta">ID: ${id}</p>
            <span class="status-pill-admin ${(v.status || "").toLowerCase().replace(/\s/g, "-")}">${v.status}</span>
            <label class="admin-meta" style="display:block;margin-top:10px;">Change status</label>
            <select data-fleet-id="${id}">${options}</select>
            <button type="button" class="admin-btn admin-btn-neutral" style="margin-top:8px;width:100%;" data-save-fleet="${id}">Update Bus</button>
          </div>
        `;
      })
      .join("");

    container.querySelectorAll("[data-save-fleet]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-save-fleet");
        const select = container.querySelector(`select[data-fleet-id="${id}"]`);
        if (!select) return;
        const result = auth.setVehicleStatus(id, select.value);
        if (result.success) {
          const fleet = auth.getFleet();
          renderFleet();
          renderStats();
          alert((fleet[id]?.name || id) + " status updated to " + select.value + ".");
        } else {
          alert(result.message);
        }
      });
    });
  }

  function renderIssues() {
    const container = document.getElementById("issues-list");
    if (!container) return;

    const issues = auth.getTransportIssues();

    if (issues.length === 0) {
      container.innerHTML = '<div class="admin-empty">No transport issues logged.</div>';
      return;
    }

    container.innerHTML = issues
      .map((issue) => {
        const created = new Date(issue.createdAt).toLocaleString("en-KE");
        const statusClass = (issue.status || "open").toLowerCase().replace(/\s/g, "-");
        const actions =
          issue.status !== "Resolved"
            ? `<div class="admin-actions">
                <button type="button" class="admin-btn admin-btn-neutral" data-issue-review="${issue.issueId}">Mark In Review</button>
                <button type="button" class="admin-btn admin-btn-approve" data-issue-resolve="${issue.issueId}">Resolve</button>
              </div>`
            : `<p class="admin-meta">Resolved by ${issue.resolvedBy || "—"}</p>`;

        return `
          <article class="admin-card">
            <div class="admin-card-header">
              <div>
                <h3>${issue.issueId}: ${issue.title}</h3>
                <p class="admin-meta">
                  ${issue.vehicleName} · Priority: ${issue.priority}<br>
                  Reported by ${issue.reportedBy} · ${created}<br>
                  ${issue.notes || ""}
                </p>
              </div>
              <span class="status-pill-admin ${statusClass}">${issue.status}</span>
            </div>
            ${issue.resolutionNote ? `<p class="admin-meta">${issue.resolutionNote}</p>` : ""}
            ${actions}
          </article>
        `;
      })
      .join("");

    container.querySelectorAll("[data-issue-review]").forEach((btn) => {
      btn.addEventListener("click", () => {
        auth.updateIssueStatus(btn.getAttribute("data-issue-review"), "In Review");
        refreshAll();
      });
    });

    container.querySelectorAll("[data-issue-resolve]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const note = prompt("Resolution notes:");
        if (note === null) return;
        auth.updateIssueStatus(btn.getAttribute("data-issue-resolve"), "Resolved", note);
        refreshAll();
      });
    });
  }

  function populateIssueVehicleSelect() {
    const select = document.getElementById("issue-vehicle");
    if (!select) return;
    const fleet = auth.getFleet();
    select.innerHTML =
      '<option value="">General / Department</option>' +
      Object.entries(fleet)
        .map(([id, v]) => `<option value="${id}">${v.name}</option>`)
        .join("");
  }

  const issueForm = document.getElementById("issue-form");
  if (issueForm) {
    issueForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("issue-title").value;
      const vehicleId = document.getElementById("issue-vehicle").value;
      const priority = document.getElementById("issue-priority").value;
      const notes = document.getElementById("issue-notes").value;
      const result = auth.addTransportIssue(title, vehicleId, priority, notes);
      if (result.success) {
        issueForm.reset();
        refreshAll();
        alert("Transport issue " + result.issueId + " logged.");
      } else {
        alert(result.message);
      }
    });
  }

  function refreshAll() {
    renderStats();
    renderPendingBookings();
    renderAllBookings();
    renderFleet();
    renderIssues();
  }

  populateIssueVehicleSelect();
  refreshAll();

  window.addEventListener("egerton-bookings-updated", refreshAll);
  window.addEventListener("egerton-fleet-updated", () => {
    renderFleet();
    renderStats();
  });
});
