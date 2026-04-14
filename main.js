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
      if (!isPhone()) {
        return;
      }

      if (!header.classList.contains("nav-open")) {
        return;
      }

      if (!header.contains(event.target)) {
        setOpenState(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setOpenState(false);
      }
    });

    window.addEventListener("resize", () => {
      if (!isPhone()) {
        setOpenState(false);
      }
    });
  });
});
