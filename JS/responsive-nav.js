/**
 * Mobile navigation — hamburger menu for small screens
 */
(function () {
  function initMobileNav() {
    const navbar = document.querySelector(".navbar");
    const navLinks = document.querySelector(".nav-links");
    if (!navbar || !navLinks || document.getElementById("nav-toggle")) return;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "nav-toggle";
    toggle.id = "nav-toggle";
    toggle.setAttribute("aria-label", "Open navigation menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = "<span></span><span></span><span></span>";

    const loginEl =
      navbar.querySelector(".login-btn") ||
      navbar.querySelector(".nav-auth-wrapper");

    if (loginEl) {
      navbar.insertBefore(toggle, loginEl);
    } else {
      navbar.appendChild(toggle);
    }

    toggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      toggle.classList.toggle("active", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open navigation menu");
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        toggle.classList.remove("active");
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 992) {
        navLinks.classList.remove("open");
        toggle.classList.remove("active");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMobileNav);
  } else {
    initMobileNav();
  }
})();
