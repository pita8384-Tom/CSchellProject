// Sub-gallery system - Each main image can have its own sub-gallery
const subGalleries = {};

// Initialize sub-galleries from localStorage
function loadSubGalleries() {
  const categories = ["bodypainting", "zeichnungen", "events", "malerei", "bildhauerei", "sandmalerei", "presse"];

  categories.forEach((category) => {
    const storageKey = `subgallery_${category}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        subGalleries[category] = JSON.parse(stored);
      } catch (e) {
        subGalleries[category] = {};
      }
    } else {
      subGalleries[category] = {};
    }
  });
}

// Save sub-galleries to localStorage
function saveSubGalleries(category) {
  const storageKey = `subgallery_${category}`;
  localStorage.setItem(storageKey, JSON.stringify(subGalleries[category]));
}

// Get sub-gallery for a specific main image
function getSubGallery(category, imageId) {
  if (!subGalleries[category]) subGalleries[category] = {};
  if (!subGalleries[category][imageId]) subGalleries[category][imageId] = [];
  return subGalleries[category][imageId];
}

// Add image to sub-gallery
function addToSubGallery(category, imageId, imageData) {
  if (!subGalleries[category]) subGalleries[category] = {};
  if (!subGalleries[category][imageId]) subGalleries[category][imageId] = [];

  subGalleries[category][imageId].push(imageData);
  saveSubGalleries(category);
}

// Remove image from sub-gallery
function removeFromSubGallery(category, imageId, index) {
  if (!subGalleries[category] || !subGalleries[category][imageId]) return;

  subGalleries[category][imageId].splice(index, 1);
  saveSubGalleries(category);
}

// Enhanced lightbox with sub-gallery support
let currentMainImage = null;
let currentSubGalleryImages = [];
let currentSubIndex = 0;

function openSubGalleryLightbox(category, imageElement) {
  const imageId = imageElement.dataset.imageId;
  const imageTitle = imageElement.dataset.imageTitle || imageElement.alt;

  currentMainImage = {
    src: imageElement.src,
    alt: imageTitle,
    id: imageId,
    category: category,
  };

  // Get sub-gallery images
  const subGallery = getSubGallery(category, imageId);
  currentSubGalleryImages = [currentMainImage, ...subGallery];
  currentSubIndex = 0;

  showSubGalleryImage(0);

  const lightboxModal = document.getElementById("lightbox-modal");
  if (lightboxModal) {
    lightboxModal.classList.remove("hidden");
    lightboxModal.classList.add("flex");
  }
}

function showSubGalleryImage(index) {
  if (currentSubGalleryImages.length === 0) return;

  // Wrap around
  if (index < 0) index = currentSubGalleryImages.length - 1;
  if (index >= currentSubGalleryImages.length) index = 0;

  currentSubIndex = index;
  const image = currentSubGalleryImages[index];

  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxTitle = document.getElementById("lightbox-title");
  const lightboxCurrent = document.getElementById("lightbox-current");
  const lightboxTotal = document.getElementById("lightbox-total");
  const lightboxPrev = document.getElementById("lightbox-prev");
  const lightboxNext = document.getElementById("lightbox-next");

  if (lightboxImg) {
    lightboxImg.src = image.src || image.data;
    lightboxImg.alt = image.title || image.alt || image.name || "";
  }

  // Try to get the title from the data-image-title attribute if available
  let displayTitle = image.title || image.alt || image.name || currentMainImage.alt;
  // If the image element exists in the grid, use its data-image-title
  const gridImage = document.querySelector(`img[src='${image.src}']`);
  if (gridImage && gridImage.getAttribute("data-image-title")) {
    displayTitle = gridImage.getAttribute("data-image-title");
  }
  if (lightboxTitle) {
    lightboxTitle.textContent = displayTitle;
  }

  if (lightboxCurrent && lightboxTotal) {
    lightboxCurrent.textContent = index + 1;
    lightboxTotal.textContent = currentSubGalleryImages.length;
  }

  // Show/hide arrows based on sub-gallery count
  const hasMultipleImages = currentSubGalleryImages.length > 1;
  if (lightboxPrev) lightboxPrev.style.display = hasMultipleImages ? "block" : "none";
  if (lightboxNext) lightboxNext.style.display = hasMultipleImages ? "block" : "none";
}

function navigateSubGallery(direction) {
  showSubGalleryImage(currentSubIndex + direction);
}

function closeSubGalleryLightbox() {
  const lightboxModal = document.getElementById("lightbox-modal");
  if (lightboxModal) {
    lightboxModal.classList.add("hidden");
    lightboxModal.classList.remove("flex");
  }

  const lightboxImg = document.getElementById("lightbox-img");
  if (lightboxImg) lightboxImg.src = "";

  currentMainImage = null;
  currentSubGalleryImages = [];
  currentSubIndex = 0;
}

// Initialize when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadSubGalleries);
} else {
  loadSubGalleries();
}
