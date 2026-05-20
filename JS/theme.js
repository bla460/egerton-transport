/**
 * Egerton Transport — site-wide light/dark theme (localStorage)
 */
(function () {
  const STORAGE_KEY = "theme";

  function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.style.colorScheme = "light";
    }
  }

  function setTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    syncAllToggles(theme === "dark");
  }

  function syncAllToggles(isDark) {
    document.querySelectorAll(".theme-switch input[type='checkbox']").forEach((el) => {
      el.checked = isDark;
    });
  }

  applyTheme(getTheme());

  function bindToggles() {
    document.querySelectorAll(".theme-switch input[type='checkbox']").forEach((toggle) => {
      if (toggle.dataset.themeBound) return;
      toggle.dataset.themeBound = "1";
      toggle.checked = getTheme() === "dark";
      toggle.addEventListener("change", function () {
        setTheme(this.checked ? "dark" : "light");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindToggles);
  } else {
    bindToggles();
  }

  window.EgertonTheme = { getTheme, setTheme, applyTheme };
})();
