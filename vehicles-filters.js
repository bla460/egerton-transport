document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;
  // Always enforce dark theme for the portal
  html.dataset.theme = 'dark';

  const filterBtn = document.querySelector('.filter-btn');
  const sidebar = document.querySelector('.sidebar');
  const content = document.querySelector('.content');
  const mainContainer = document.querySelector('.main-container');

  filterBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    // Smooth push/slide animation when user applies filters
    content && (content.style.transition = 'transform 300ms ease, box-shadow 300ms ease');
    sidebar && (sidebar.style.transition = 'transform 300ms ease');

    if (window.innerWidth <= 900) {
      // Mobile: treat sidebar as off-canvas panel
      if (!sidebar.classList.contains('off-open')) {
        sidebar.classList.add('off-open');
        sidebar.style.position = 'fixed';
        sidebar.style.left = '0';
        sidebar.style.top = '0';
        sidebar.style.height = '100%';
        sidebar.style.zIndex = '1000';
        sidebar.style.transform = 'translateX(0)';
        content && (content.style.transform = 'translateX(260px)');
      } else {
        sidebar.classList.remove('off-open');
        sidebar.style.transform = '';
        content && (content.style.transform = '');
      }
    } else {
      // Desktop: push content to the right temporarily to emphasize applied filters
      if (!mainContainer.classList.contains('filters-applied')) {
        mainContainer.classList.add('filters-applied');
        content && (content.style.transform = 'translateX(260px)');
        setTimeout(() => {
          content && (content.style.boxShadow = '-8px 0 24px rgba(0,0,0,0.18)');
        }, 300);
      } else {
        mainContainer.classList.remove('filters-applied');
        content && (content.style.transform = '');
        content && (content.style.boxShadow = '');
      }
    }
  });

  // Close off-canvas when clicking outside (mobile)
  document.addEventListener('click', (ev) => {
    if (window.innerWidth <= 900 && sidebar.classList.contains('off-open')) {
      if (!sidebar.contains(ev.target) && !filterBtn.contains(ev.target)) {
        sidebar.classList.remove('off-open');
        sidebar.style.transform = '';
        content && (content.style.transform = '');
      }
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      sidebar.classList.remove('off-open');
      sidebar.style.transform = '';
      content && (content.style.transform = '');
    }
  });

  // --- Fleet status rendering ---
  function getFleetFromAuthOrStorage() {
    if (window.EgertonAuth && typeof window.EgertonAuth.getFleet === 'function') {
      return window.EgertonAuth.getFleet();
    }
    try {
      const raw = localStorage.getItem('egerton_transport_fleet');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function applyStatusToCard(card, status) {
    const s = (status || 'Available').trim();
    const cls = s === 'Available' ? 'status-available' : s === 'In Service' ? 'status-inservice' : 'status-maintenance';

    let statusEl = card.querySelector('.status-pill, .status-available, .status-inservice, .status-maintenance');
    if (!statusEl) {
      const statusParagraph = Array.from(card.querySelectorAll('p')).find((p) => /status/i.test(p.textContent)) || document.createElement('p');
      if (!card.contains(statusParagraph)) card.appendChild(statusParagraph);
      statusParagraph.textContent = 'Status: ';
      statusEl = document.createElement('span');
      statusParagraph.appendChild(statusEl);
    }

    statusEl.textContent = s;
    statusEl.className = 'status-pill ' + cls;
  }

  function renderFleetStatuses() {
    const fleet = getFleetFromAuthOrStorage();
    document.querySelectorAll('.vehicle-card').forEach((card) => {
      const link = card.querySelector('a[href*="view-details.html"]');
      let vehicleId = null;
      if (link && link.href) {
        try {
          const url = new URL(link.href, window.location.origin);
          vehicleId = url.searchParams.get('id');
        } catch (e) {
          // ignore
        }
      }

      // fallback: try to match by heading text to fleet name
      if (!vehicleId) {
        const nameEl = card.querySelector('h4');
        const name = nameEl ? nameEl.textContent.trim() : '';
        vehicleId = Object.keys(fleet).find((k) => (fleet[k].name || '').toLowerCase() === name.toLowerCase());
      }

      const status = vehicleId && fleet[vehicleId] ? fleet[vehicleId].status : null;
      applyStatusToCard(card, status || 'Available');

      // --- Capacity injection ---
      const vehicleCapacities = {
        "passengers-bus-1": "64 Passengers",
        "students-bus-1": "50 Passengers",
        "staff-van-1": "15 Seats",
        "delivery-truck-1": "8 Tons",
        "students-bus-2": "40 Passengers",
        "faculty-van-1": "12 Seats",
        "cargo-truck-1": "5 Tons",
        "students-bus-3": "60 Passengers",
        "maintenance-van-1": "10 Seats",
        "taxi-1": "4 Passengers",
        "campus-shuttle-1": "20 Passengers",
        "bike-1": "For Hire"
      };

      const capText = vehicleId && vehicleCapacities[vehicleId] ? vehicleCapacities[vehicleId] : null;
      if (capText) {
        // update existing capacity paragraph if present
        let capEl = card.querySelector('.vehicle-capacity');
        if (!capEl) {
          capEl = document.createElement('p');
          capEl.className = 'vehicle-capacity';
          // insert after title if possible
          const title = card.querySelector('h4');
          if (title && title.parentNode) title.parentNode.insertBefore(capEl, title.nextSibling);
          else card.appendChild(capEl);
        }
        capEl.textContent = 'Capacity: ' + capText;
        capEl.style.color = 'var(--text-light)';
        capEl.style.fontSize = '14px';
        capEl.style.margin = '6px 0';
      }
    });
  }

  // Initial render
  renderFleetStatuses();

  // Re-render when admin updates fleet within the same window
  window.addEventListener('egerton-fleet-updated', renderFleetStatuses);

  // Re-render when fleet data changes in another tab/window
  window.addEventListener('storage', (event) => {
    if (event.key === 'egerton_transport_fleet') {
      renderFleetStatuses();
    }
  });

});
