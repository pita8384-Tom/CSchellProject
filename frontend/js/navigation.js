// Navigation functionality

// Update navigation dots
function updateNavDots() {
  document.querySelectorAll(".nav-dot").forEach((dot, index) => {
    if (index === currentPage) dot.classList.add("active");
    else dot.classList.remove("active");
  });
}

// Update navigation links (top nav)
function updateNavLinks() {
  document.querySelectorAll(".nav-link").forEach((link, index) => {
    const pageIndex = parseInt(link.getAttribute("data-page"));
    if (!isNaN(pageIndex)) {
      if (pageIndex === currentPage) link.classList.add("active");
      else link.classList.remove("active");
    }
  });
}

// Navigation Dots dynamisch anpassen
function updateNavigationDots() {
  const dotsContainer = document.querySelector(".nav-dots");
  if (!dotsContainer) return;

  const numDots = introDetailOpen ? 4 : 3;
  dotsContainer.innerHTML = "";

  for (let i = 0; i < numDots; i++) {
    const dot = document.createElement("div");
    dot.className = "nav-dot";
    if (i === currentPage) dot.classList.add("active");
    dot.setAttribute("data-page", i);
    dot.addEventListener("click", () => scrollToPage(i));
    dotsContainer.appendChild(dot);
  }
}

// Mobile menu functionality
function toggleMobileMenu() {
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("nav-menu");
  if (!hamburger || !navMenu) return;
  hamburger.classList.toggle("active");
  navMenu.classList.toggle("active");
}

function closeMobileMenu() {
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("nav-menu");
  if (!hamburger || !navMenu) return;
  hamburger.classList.remove("active");
  navMenu.classList.remove("active");
}

// Navbar scroll effect - háttér váltással
function handleNavbarVisibility() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  // Navbar mindig látható - nincs automatikus elrejtés
  navbar.classList.remove("navbar-hidden");
  
  // Háttér váltás az oldaltól függően
  if (currentPage === 0 && window.scrollY > 50) {
    navbar.classList.add("scrolled");
    navbar.style.background = "rgba(94, 83, 104, 0.95)"; // Sötétebb háttér
  } else {
    navbar.classList.remove("scrolled");
    navbar.style.background = "rgba(94, 83, 104, 0.92)"; // Alap háttér
  }
}

// Navbar beim Cursor nach oben wieder einblenden - kikapcsolva
function handleMouseMove(e) {
  // Funktion deaktiviert - navbar immer sichtbar
  return;
}

// Zur Kontakt-Seite navigieren
function goToKontakt(event) {
  event.preventDefault();
  // Stets immer auf Page 2 (Kontakt ist immer auf Page 2)
  scrollToPage(2);
}

// Zur Kontakt-Seite von Navbar
function goToKontaktFromNav() {
  // Alle Detail-Seiten (Sub-Galerien) schließen
  if (typeof closeAllDetailPages === 'function') {
    closeAllDetailPages();
  }
  // Zur Kontakt-Seite scrollen
  scrollToPage(2);
}

// Zur Startseite / Navbar navigieren (Page 0)
function goToNavbar() {
  // Alle Detail-Seiten (Sub-Galerien) schließen
  if (typeof closeAllDetailPages === 'function') {
    closeAllDetailPages();
  }
  scrollToPage(0);
}
