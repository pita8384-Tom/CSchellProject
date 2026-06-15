// Full page scrolling functionality
var currentPage = 0;
var pages = () => document.querySelectorAll(".page:not(.hidden)");
var totalPages = () => pages().length;
var isScrolling = false;
var scrollTimeout = null;
var introDetailOpen = false;

// Scroll to specific page
function scrollToPage(pageIndex) {
  const tp = totalPages();
  if (pageIndex < 0 || pageIndex >= tp || isScrolling) return;

  // Schließe alle Detail-Unterseiten (Sub-Galerien), wenn wir zwischen den Haupt-Sektionen navigieren.
  if (typeof closeAllDetailPages === 'function') {
    closeAllDetailPages();
  }

  console.log(`scrollToPage called with pageIndex: ${pageIndex}, currentPage: ${currentPage}, isScrolling: ${isScrolling}`);

  isScrolling = true;
  currentPage = pageIndex;

  // Handle special case for intro detail page
  let targetElement;
  if (introDetailOpen && pageIndex === 2) {
    targetElement = document.getElementById("page-intro");
  } else if (pageIndex === 0) {
    targetElement = document.getElementById("page-0");
  } else if (pageIndex === 1) {
    targetElement = document.getElementById("page-1");
  } else if (pageIndex === 2) {
    targetElement = document.getElementById("page-2");
    console.log('Target element found:', targetElement);
  } else {
    targetElement = document.getElementById(`page-${pageIndex}`);
  }

  if (targetElement) {
    console.log('Scrolling to element:', targetElement);
    targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  updateNavDots();
  updateNavLinks();
  closeMobileMenu();
  handleNavbarVisibility();

  // Reset scrolling flag after animation completes
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  scrollTimeout = setTimeout(() => {
    isScrolling = false;
    scrollTimeout = null;
  }, 1000);
}

// Handle wheel scroll (one page at a time)
function handleScroll(e) {
  // Allow normal scrolling on any detail page
  const detailPages = ["page-intro", "page-bodypainting", "page-zeichnungen", "page-events", "page-malerei", "page-bildhauerei", "page-sandmalerei", "page-presse"];

  for (const pageId of detailPages) {
    const page = document.getElementById(pageId);
    if (page && !page.classList.contains("hidden")) {
      return; // Allow normal scrolling
    }
  }

  // Prevent default scrolling
  e.preventDefault();

  if (isScrolling) return;

  // Scroll to next/previous page based on scroll direction
  if (e.deltaY > 0) {
    scrollToPage(currentPage + 1);
  } else if (e.deltaY < 0) {
    scrollToPage(currentPage - 1);
  }
}

// Handle keyboard navigation
function handleKeydown(e) {
  // Disable keyboard navigation on any detail page
  const detailPages = ["page-intro", "page-bodypainting", "page-zeichnungen", "page-events", "page-malerei", "page-bildhauerei", "page-sandmalerei", "page-presse"];

  for (const pageId of detailPages) {
    const page = document.getElementById(pageId);
    if (page && !page.classList.contains("hidden")) {
      return; // Keyboard navigation disabled
    }
  }

  if (e.key === "ArrowDown") {
    e.preventDefault();
    scrollToPage(currentPage + 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    scrollToPage(currentPage - 1);
  } else if (e.key >= "1" && e.key <= String(totalPages())) {
    e.preventDefault();
    scrollToPage(parseInt(e.key) - 1);
  }
}

// Function to find which page is most visible in the viewport
function getMostVisiblePage() {
  const pageElements = Array.from(document.querySelectorAll(".page:not(.hidden)"));
  let maxVisiblePage = 0;
  let maxVisibleArea = 0;

  pageElements.forEach((page) => {
    const rect = page.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Calculate how much of the page is visible
    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
    const visibleArea = Math.max(0, visibleHeight);

    if (visibleArea > maxVisibleArea) {
      maxVisibleArea = visibleArea;
      // Determine page index from ID
      const pageId = page.id;
      if (pageId === "page-0") maxVisiblePage = 0;
      else if (pageId === "page-1") maxVisiblePage = 1;
      else if (pageId === "page-intro") maxVisiblePage = 2;
      else if (pageId === "page-2") maxVisiblePage = introDetailOpen ? 3 : 2;
    }
  });

  return maxVisiblePage;
}

// Scroll to Top Button functionality
const scrollToTopBtn = document.getElementById("scroll-to-top");

if (scrollToTopBtn) {
  // Function to update button visibility
  function updateScrollButton() {
    // Check if we're not on the first page
    if (currentPage > 0) {
      scrollToTopBtn.classList.add("visible");
    } else {
      scrollToTopBtn.classList.remove("visible");
    }
  }

  // Update when scrolling to a new page
  const originalScrollToPage = scrollToPage;
  scrollToPage = function (pageIndex) {
    originalScrollToPage.call(this, pageIndex);
    setTimeout(updateScrollButton, 100);
  };

  // Check on page load
  updateScrollButton();

  // Scroll to top when clicked
  scrollToTopBtn.addEventListener("click", function (e) {
    e.preventDefault();
    scrollToPage(0);
  });
}
