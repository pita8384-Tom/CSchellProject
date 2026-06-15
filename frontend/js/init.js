// Main initialization - binds all event listeners

// Throttle helper function
function throttle(fn, wait) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= wait) {
      last = now;
      fn.apply(this, args);
    }
  };
}

// Initialize event listeners
document.addEventListener("DOMContentLoaded", () => {
  // wheel/keyboard handlers (preserve original behavior)
  window.addEventListener("wheel", handleScroll, { passive: false });
  window.addEventListener("keydown", handleKeydown);

  // sync currentPage when user scrolls normally (throttled)
  window.addEventListener(
    "scroll",
    throttle(() => {
      if (isScrolling) return; // ignore while our programmatic smooth scroll runs
      const newPage = getMostVisiblePage();
      if (newPage !== currentPage) {
        currentPage = newPage;
        updateNavDots();
        updateNavLinks();
        handleNavbarVisibility();
      }
    }, 120)
  );

  // Dots
  document.querySelectorAll(".nav-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      const pageIndex = parseInt(dot.getAttribute("data-page"));
      scrollToPage(pageIndex);
    });
  });

  // Top nav links (data-page)
  document.querySelectorAll(".nav-link").forEach((link) => {
    const dp = link.getAttribute("data-page");
    if (dp !== null) {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const pageIndex = parseInt(link.getAttribute("data-page"));
        scrollToPage(pageIndex);
      });
    }
  });

  // Mobile menu hamburger
  const hamburger = document.getElementById("hamburger");
  if (hamburger) hamburger.addEventListener("click", toggleMobileMenu);

  // Language toggle button
  const langToggleTop = document.getElementById("language-toggle");
  // Set initial label depending on current page
  const href = window.location.href.toLowerCase();
  const onEnglish = href.includes("index-en.html");
  if (langToggleTop) {
    langToggleTop.textContent = onEnglish ? "DE" : "EN";
    langToggleTop.addEventListener("click", toggleLanguage);
  }

  // Navbar beim Cursor-Bewegung nach oben einblenden
  window.addEventListener("mousemove", handleMouseMove);

  // Initialize contact form
  initContactForm();

  // Initial nav state
  updateNavDots();
  updateNavLinks();
  handleNavbarVisibility();
});
