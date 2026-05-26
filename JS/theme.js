/**
 * Egerton Transport — site-wide light/dark theme (localStorage)
 */
(function () {
  const STORAGE_KEY = "theme";
  // Force dark theme across the entire site.
  function applyTheme() {
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.style.colorScheme = "dark";
  }

  // No-op setters to prevent other scripts from changing the theme.
  function getTheme() {
    return 'dark';
  }
  function setTheme(/*theme*/) {
    // persist dark-only preference for compatibility
    try { localStorage.setItem(STORAGE_KEY, 'dark'); } catch (e) {}
    applyTheme();
  }

  // Disable any visible theme toggles (if present) and ensure they reflect dark state
  function disableToggles() {
    document.querySelectorAll('.theme-switch input[type="checkbox"]').forEach((el) => {
      try { el.checked = true; el.disabled = true; } catch (e) {}
    });
    document.querySelectorAll('[data-theme-toggle]').forEach((el) => el.remove());
  }

  applyTheme();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', disableToggles);
  else disableToggles();

  window.EgertonTheme = { getTheme, setTheme, applyTheme };
})();
