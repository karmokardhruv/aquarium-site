// ============================================
// SITE-WIDE THEME (dark/light) via localStorage
// This runs IMMEDIATELY (not deferred) so toggleTheme
// is available for onclick handlers from the start.
// ============================================
(function () {
  const THEME_KEY = "site-theme";

  function getSavedTheme() {
    return localStorage.getItem(THEME_KEY) || "night";
  }

  function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);

    const icon = document.getElementById("theme-icon");
    if (icon) {
      if (theme === "day") {
        icon.classList.remove("fa-moon");
        icon.classList.add("fa-sun");
      } else {
        icon.classList.remove("fa-sun");
        icon.classList.add("fa-moon");
      }
    }
  }

  // Apply immediately (body exists since script is at bottom)
  applyTheme(getSavedTheme());

  // Global toggle function for onclick handlers and aquarium.js
  window.toggleTheme = function () {
    const current = document.body.getAttribute("data-theme") || "night";
    const next = current === "day" ? "night" : "day";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);

    // Notify aquarium.js if it's loaded (fish texture swap)
    if (typeof window._onThemeChange === "function") {
      window._onThemeChange(next);
    }
  };
})();

// ============================================
// HAMBURGER NAV TOGGLE (mobile)
// This needs DOM ready
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".site-header").forEach((header) => {
    const toggle = header.querySelector(".nav-toggle");
    const nav = header.querySelector(".main-nav");

    if (!toggle || !nav) {
      return;
    }

    const isPhone = () => window.matchMedia("(max-width: 767px)").matches;

    const setOpenState = (isOpen) => {
      header.classList.toggle("nav-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation menu" : "Open navigation menu"
      );
    };

    setOpenState(false);

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      setOpenState(!expanded);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (isPhone()) {
          setOpenState(false);
        }
      });
    });

    document.addEventListener("click", (event) => {
      if (!isPhone()) return;
      if (!header.classList.contains("nav-open")) return;
      if (!header.contains(event.target)) setOpenState(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpenState(false);
    });

    window.addEventListener("resize", () => {
      if (!isPhone()) setOpenState(false);
    });
  });
});
