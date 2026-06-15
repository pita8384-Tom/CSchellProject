// Intro Detail Page functionality

// Function to close all detail pages
function closeAllDetailPages() {
  const pages = ["page-intro", "page-bodypainting", "page-zeichnungen", "page-events", "page-malerei", "page-bildhauerei", "page-sandmalerei", "page-presse"];

  pages.forEach((pageId) => {
    const page = document.getElementById(pageId);
    if (page) {
      page.classList.add("hidden");
    }
  });

  introDetailOpen = false;
  bodypaintingDetailOpen = false;
  zeichnungenDetailOpen = false;
  eventsDetailOpen = false;
  malereiDetailOpen = false;
  bildhauereiDetailOpen = false;
  sandmalereiDetailOpen = false;
  presseDetailOpen = false;
}

// Intro Detail Seite öffnen
function openIntroDetail(event) {
  event.preventDefault();

  // Close all other detail pages first
  closeAllDetailPages();

  const introPage = document.getElementById("page-intro");
  if (introPage) {
    introPage.classList.remove("hidden");
    introDetailOpen = true;

    // Navigation Dots aktualisieren (4 statt 3)
    updateNavigationDots();

    // Direkt zur Intro-Detail Seite scrollen
    setTimeout(() => {
      introPage.scrollIntoView({ behavior: "smooth", block: "start" });
      currentPage = 2;
      updateNavDots();
      updateNavLinks();
      handleNavbarVisibility();
    }, 50);
  }
}

// Intro Detail Seite schließen
function closeIntroDetail() {
  const introPage = document.getElementById("page-intro");
  if (introPage) {
    introDetailOpen = false;

    // Zuerst zur Übersicht scrollen
    scrollToPage(1);

    // Dann die Intro-Seite nach dem Scroll verstecken
    setTimeout(() => {
      introPage.classList.add("hidden");
      // Navigation Dots aktualisieren (3 statt 4)
      updateNavigationDots();
    }, 100);
  }
}

// Bodypainting Detail Page functionality
var bodypaintingDetailOpen = false;

// Bodypainting Detail Seite öffnen
function openBodypaintingDetail(event) {
  event.preventDefault();

  // Close all other detail pages first
  closeAllDetailPages();

  const bodypaintingPage = document.getElementById("page-bodypainting");
  if (bodypaintingPage) {
    bodypaintingPage.classList.remove("hidden");
    bodypaintingDetailOpen = true;

    // Direkt zur Bodypainting-Detail Seite scrollen
    setTimeout(() => {
      bodypaintingPage.scrollIntoView({ behavior: "smooth", block: "start" });
      handleNavbarVisibility();
    }, 50);
  }
}

// Bodypainting Detail Seite schließen
function closeBodypaintingDetail() {
  const bodypaintingPage = document.getElementById("page-bodypainting");
  if (bodypaintingPage) {
    bodypaintingDetailOpen = false;

    // Zuerst zur Übersicht scrollen
    scrollToPage(1);

    // Dann die Bodypainting-Seite nach dem Scroll verstecken
    setTimeout(() => {
      bodypaintingPage.classList.add("hidden");
    }, 100);
  }
}

// Zeichnungen Detail Page functionality
var zeichnungenDetailOpen = false;

// Zeichnungen Detail Seite öffnen
function openZeichnungenDetail(event) {
  event.preventDefault();

  // Close all other detail pages first
  closeAllDetailPages();

  const zeichnungenPage = document.getElementById("page-zeichnungen");
  if (zeichnungenPage) {
    zeichnungenPage.classList.remove("hidden");
    zeichnungenDetailOpen = true;

    // Direkt zur Zeichnungen-Detail Seite scrollen
    setTimeout(() => {
      zeichnungenPage.scrollIntoView({ behavior: "smooth", block: "start" });
      handleNavbarVisibility();
    }, 50);
  }
}

// Zeichnungen Detail Seite schließen
function closeZeichnungenDetail() {
  const zeichnungenPage = document.getElementById("page-zeichnungen");
  if (zeichnungenPage) {
    zeichnungenDetailOpen = false;

    // Zuerst zur Übersicht scrollen
    scrollToPage(1);

    // Dann die Zeichnungen-Seite nach dem Scroll verstecken
    setTimeout(() => {
      zeichnungenPage.classList.add("hidden");
    }, 100);
  }
}

// Events Detail Page functionality
var eventsDetailOpen = false;

function openEventsDetail(event) {
  event.preventDefault();
  closeAllDetailPages();
  const eventsPage = document.getElementById("page-events");
  if (eventsPage) {
    eventsPage.classList.remove("hidden");
    eventsDetailOpen = true;
    setTimeout(() => {
      eventsPage.scrollIntoView({ behavior: "smooth", block: "start" });
      handleNavbarVisibility();
    }, 50);
  }
}

function closeEventsDetail() {
  const eventsPage = document.getElementById("page-events");
  if (eventsPage) {
    eventsDetailOpen = false;
    scrollToPage(1);
    setTimeout(() => {
      eventsPage.classList.add("hidden");
    }, 100);
  }
}

// Malerei Detail Page functionality
var malereiDetailOpen = false;

function openMalereiDetail(event) {
  event.preventDefault();
  closeAllDetailPages();
  const malereiPage = document.getElementById("page-malerei");
  if (malereiPage) {
    malereiPage.classList.remove("hidden");
    malereiDetailOpen = true;
    setTimeout(() => {
      malereiPage.scrollIntoView({ behavior: "smooth", block: "start" });
      handleNavbarVisibility();
    }, 50);
  }
}

function closeMalereiDetail() {
  const malereiPage = document.getElementById("page-malerei");
  if (malereiPage) {
    malereiDetailOpen = false;
    scrollToPage(1);
    setTimeout(() => {
      malereiPage.classList.add("hidden");
    }, 100);
  }
}

// Bildhauerei Detail Page functionality
var bildhauereiDetailOpen = false;

function openBildhauereiDetail(event) {
  event.preventDefault();
  closeAllDetailPages();
  const bildhauereiPage = document.getElementById("page-bildhauerei");
  if (bildhauereiPage) {
    bildhauereiPage.classList.remove("hidden");
    bildhauereiDetailOpen = true;
    setTimeout(() => {
      bildhauereiPage.scrollIntoView({ behavior: "smooth", block: "start" });
      handleNavbarVisibility();
    }, 50);
  }
}

function closeBildhauereiDetail() {
  const bildhauereiPage = document.getElementById("page-bildhauerei");
  if (bildhauereiPage) {
    bildhauereiDetailOpen = false;
    scrollToPage(1);
    setTimeout(() => {
      bildhauereiPage.classList.add("hidden");
    }, 100);
  }
}

// Sandmalerei Detail Page functionality
var sandmalereiDetailOpen = false;

function openSandmalereiDetail(event) {
  event.preventDefault();
  closeAllDetailPages();
  const sandmalereiPage = document.getElementById("page-sandmalerei");
  if (sandmalereiPage) {
    sandmalereiPage.classList.remove("hidden");
    sandmalereiDetailOpen = true;
    setTimeout(() => {
      sandmalereiPage.scrollIntoView({ behavior: "smooth", block: "start" });
      handleNavbarVisibility();
    }, 50);
  }
}

function closeSandmalereiDetail() {
  const sandmalereiPage = document.getElementById("page-sandmalerei");
  if (sandmalereiPage) {
    sandmalereiDetailOpen = false;
    scrollToPage(1);
    setTimeout(() => {
      sandmalereiPage.classList.add("hidden");
    }, 100);
  }
}

// Presse Detail Page functionality
var presseDetailOpen = false;

function openPresseDetail(event) {
  event.preventDefault();
  closeAllDetailPages();
  const pressePage = document.getElementById("page-presse");
  if (pressePage) {
    pressePage.classList.remove("hidden");
    presseDetailOpen = true;
    setTimeout(() => {
      pressePage.scrollIntoView({ behavior: "smooth", block: "start" });
      handleNavbarVisibility();
    }, 50);
  }
}

function closePresseDetail() {
  const pressePage = document.getElementById("page-presse");
  if (pressePage) {
    presseDetailOpen = false;
    scrollToPage(1);
    setTimeout(() => {
      pressePage.classList.add("hidden");
    }, 100);
  }
}
