/**
 * Dynamic calendar + trip schedule for vehicles.html sidebar
 */
(function () {
  const BOOKINGS_KEY = "egerton_transport_bookings";
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const PLANNED_TRIPS = [
    { daysFromNow: 0, destination: "Campus shuttle loop", vehicle: "Campus Shuttle" },
    { daysFromNow: 1, destination: "Njoro – Nakuru town", vehicle: "Staff Van" },
    { daysFromNow: 3, destination: "Nakuru – Nairobi", vehicle: "Students Bus 2" },
    { daysFromNow: 5, destination: "Field study – Naivasha", vehicle: "Passengers Bus" },
    { daysFromNow: 7, destination: "Cargo delivery – Eldoret", vehicle: "Cargo Truck" },
    { daysFromNow: 10, destination: "Faculty meeting – Nairobi", vehicle: "Faculty Van" },
    { daysFromNow: 14, destination: "Sports fixture – Kisumu", vehicle: "Students Bus" },
    { daysFromNow: 18, destination: "Equipment haul – Main campus", vehicle: "Delivery Truck" },
    { daysFromNow: 21, destination: "Conference shuttle", vehicle: "Campus Shuttle" },
    { daysFromNow: 28, destination: "Industrial attachment convoy", vehicle: "Students Bus 3" }
  ];

  const now = new Date();
  let viewYear = now.getFullYear();
  let viewMonth = now.getMonth();
  let selectedDateKey = null;

  function toLocalDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function parseDateOnly(iso) {
    const d = new Date(iso + "T12:00:00");
    return isNaN(d.getTime()) ? null : d;
  }

  function sameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function formatTripDate(date) {
    return date.toLocaleDateString("en-KE", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  }

  function getBookings() {
    try {
      return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function buildTripList() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const trips = [];

    PLANNED_TRIPS.forEach((trip) => {
      const d = new Date(today);
      d.setDate(d.getDate() + trip.daysFromNow);
      trips.push({
        date: d,
        destination: trip.destination,
        vehicle: trip.vehicle,
        source: "planned"
      });
    });

    getBookings().forEach((b) => {
      const d = parseDateOnly(b.date);
      if (!d) return;
      d.setHours(0, 0, 0, 0);
      trips.push({
        date: d,
        destination: b.destination || "Official trip",
        vehicle: b.vehicleName || "Booked vehicle",
        source: "booking",
        bookingId: b.bookingId,
        status: b.status || "Pending"
      });
    });

    const seen = new Set();
    return trips
      .filter((t) => {
        const key = toLocalDateKey(t.date) + "|" + t.vehicle + "|" + t.destination;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.date - b.date);
  }

  function tripsByDate() {
    const map = new Map();
    buildTripList().forEach((t) => {
      const key = toLocalDateKey(t.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    });
    return map;
  }

  function renderCalendar() {
    const titleEl = document.getElementById("calendar-month-title");
    const bodyEl = document.getElementById("calendar-body");
    if (!titleEl || !bodyEl) return;

    const tripMap = tripsByDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    titleEl.textContent = MONTH_NAMES[viewMonth] + " " + viewYear;

    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const rows = [];
    let week = [];

    for (let i = 0; i < firstWeekday; i++) week.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) {
        rows.push(week);
        week = [];
      }
    }
    if (week.length) {
      while (week.length < 7) week.push(null);
      rows.push(week);
    }

    let html = "";
    rows.forEach((row) => {
      html += "<tr>";
      row.forEach((day) => {
        if (day === null) {
          html += '<td class="empty"></td>';
          return;
        }
        const cellDate = new Date(viewYear, viewMonth, day);
        const key = toLocalDateKey(cellDate);
        const dayTrips = tripMap.get(key) || [];
        const hasBooking = dayTrips.some((t) => t.source === "booking");
        const hasPending = dayTrips.some(
          (t) => t.source === "booking" && (t.status || "Pending") === "Pending"
        );
        const hasApproved = dayTrips.some(
          (t) => t.source === "booking" && t.status === "Approved"
        );
        const hasTrip = dayTrips.length > 0;
        const isToday = sameDay(cellDate, today);
        const isPast = cellDate < today && !isToday;
        const isSelected = selectedDateKey === key;

        const classes = ["cal-day"];
        if (isToday) classes.push("today");
        if (hasTrip) classes.push("has-trip");
        if (hasBooking) classes.push("has-booking");
        if (hasPending) classes.push("has-pending");
        if (hasApproved) classes.push("has-approved");
        if (isPast) classes.push("past");
        if (isSelected) classes.push("selected");

        const countBadge =
          dayTrips.length > 1
            ? `<span class="trip-count">${dayTrips.length}</span>`
            : "";

        html +=
          `<td class="${classes.join(" ")}" data-date="${key}" role="button" tabindex="0" ` +
          `title="${dayTrips.length ? dayTrips.map((t) => t.destination).join(", ") : "No trips"}">` +
          `<span class="day-num">${day}</span>${countBadge}</td>`;
      });
      html += "</tr>";
    });

    bodyEl.innerHTML = html;

    bodyEl.querySelectorAll(".cal-day").forEach((cell) => {
      cell.addEventListener("click", () => {
        const key = cell.getAttribute("data-date");
        selectedDateKey = selectedDateKey === key ? null : key;
        renderCalendar();
        renderScheduleList();
      });
      cell.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          cell.click();
        }
      });
    });
  }

  function renderScheduleList() {
    const listEl = document.getElementById("schedule-list");
    if (!listEl) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let trips = buildTripList();

    if (selectedDateKey) {
      trips = trips.filter((t) => toLocalDateKey(t.date) === selectedDateKey);
    } else {
      trips = trips.filter((t) => t.date >= today);
    }

    const heading = document.getElementById("schedule-updated-label");
    if (heading) {
      const time = new Date().toLocaleTimeString("en-KE", {
        hour: "2-digit",
        minute: "2-digit"
      });
      if (selectedDateKey) {
        const d = parseDateOnly(selectedDateKey);
        const label = d
          ? d.toLocaleDateString("en-KE", { weekday: "long", month: "long", day: "numeric" })
          : selectedDateKey;
        heading.textContent = "Trips on " + label + " · updated " + time;
      } else {
        heading.textContent = "Upcoming trips · updated " + time;
      }
    }

    if (trips.length === 0) {
      listEl.innerHTML = selectedDateKey
        ? '<div class="schedule-item schedule-empty">No trips on this date. Select another day or book a vehicle.</div>'
        : '<div class="schedule-item schedule-empty">No upcoming trips scheduled.</div>';
      return;
    }

    listEl.innerHTML = trips
      .map((t) => {
        const label = formatTripDate(t.date);
        const booked =
          t.source === "booking"
            ? t.status === "Approved"
              ? ' <span class="schedule-booked">Authorized</span>'
              : t.status === "Rejected"
                ? ' <span class="schedule-rejected">Declined</span>'
                : ' <span class="schedule-pending">Pending</span>'
            : ' <span class="schedule-planned">Planned</span>';
        const ref = t.bookingId
          ? `<span class="schedule-ref">${t.bookingId}</span>`
          : "";
        return (
          `<div class="schedule-item" data-date="${toLocalDateKey(t.date)}">` +
          `<strong>${label}</strong> — ${t.destination}<br>` +
          `<span class="schedule-vehicle">${t.vehicle}</span>${booked}${ref}` +
          `</div>`
        );
      })
      .join("");
  }

  function refreshSchedule() {
    renderCalendar();
    renderScheduleList();
  }

  function goToToday() {
    const t = new Date();
    viewYear = t.getFullYear();
    viewMonth = t.getMonth();
    selectedDateKey = toLocalDateKey(t);
    refreshSchedule();
  }

  function bindControls() {
    const prev = document.getElementById("calendar-prev");
    const next = document.getElementById("calendar-next");
    const todayBtn = document.getElementById("calendar-today");

    if (prev) {
      prev.addEventListener("click", () => {
        viewMonth--;
        if (viewMonth < 0) {
          viewMonth = 11;
          viewYear--;
        }
        refreshSchedule();
      });
    }
    if (next) {
      next.addEventListener("click", () => {
        viewMonth++;
        if (viewMonth > 11) {
          viewMonth = 0;
          viewYear++;
        }
        refreshSchedule();
      });
    }
    if (todayBtn) {
      todayBtn.addEventListener("click", goToToday);
    }
  }

  window.refreshVehicleSchedule = refreshSchedule;

  function init() {
    bindControls();
    refreshSchedule();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("storage", (e) => {
    if (e.key === BOOKINGS_KEY) refreshSchedule();
  });

  window.addEventListener("egerton-bookings-updated", refreshSchedule);

  setInterval(refreshSchedule, 60000);
})();
