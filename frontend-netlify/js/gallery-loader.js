// Gallery loader - Thema-Grid System
// 3 Ebenen: Übersicht → Thema-Grid (Kacheln) → Thema-Galerie (alle Fotos)

const GALLERY_API_LIMIT = 200;

function apiEndpoint(path) {
  if (window.APP_CONFIG && typeof window.APP_CONFIG.getEndpoint === "function") {
    return window.APP_CONFIG.getEndpoint(path);
  }
  return `http://localhost:3000${path}`;
}

function mediaUrl(path) {
  if (!path) return "";
  // Wenn der Pfad bereits eine volle URL ist (beginnt mit http), direkt zurückgeben
  if (path.startsWith("http")) return path;

  if (typeof window.resolveMediaUrl === "function") {
    return window.resolveMediaUrl(path);
  }
  return path;
}

// ======== HILFSFUNKTIONEN ========

// Thema-Namen bereinigen: "11. Fluo Abstrakt" → "Fluo Abstrakt", "bild.jpg" → "bild"
function cleanThemaName(rawName) {
  if (!rawName) return '';
  // Nur echte Dateiendungen entfernen (2–5 Zeichen wie .jpg .png .jpeg .webp)
  let name = rawName.replace(/\.\w{2,5}$/, '');
  // Führende Nummerierung entfernen: "1. " oder "12. "
  name = name.replace(/^\d+\.\s+/, '');
  return name.trim();
}

// Eine Thema-Kachel erstellen (Foto + Hover-Overlay mit Name)
function createThemaTile(imagePath, themaTitle, onClickFn, itemCount = null) {
  const tile = document.createElement('div');
  tile.className = 'bp-cell thema-tile';
  tile.innerHTML = `
    <img src="${imagePath}" alt="${themaTitle}" class="bp-img" loading="lazy" />
    <div class="thema-overlay">
      <span class="thema-title">${themaTitle}</span>
    </div>
  `;
  
  // Speichere die Anzahl der Fotos als Data-Attribut (für Admin-Controls)
  if (itemCount !== null) {
    tile.dataset.itemCount = itemCount;
  }
  
  tile.addEventListener('click', onClickFn);
  return tile;
}

// Lightbox öffnen (einzelnes Foto) - nutzt gallery-slider Lightbox
function openImageLightbox(src, title) {
  if (typeof window.openThemaSlider === 'function') {
    window.openThemaSlider([{ src, alt: title }], 0);
  }
}

async function loadGalleryImages() {
  // Warten, bis die Konfiguration geladen ist
  if (window.APP_CONFIG && typeof window.APP_CONFIG.load === "function") {
    await window.APP_CONFIG.load();
  }

  const categories = ["bodypainting", "zeichnungen", "events", "malerei", "bildhauerei", "sandmalerei", "presse"];

  for (const category of categories) {
    loadCategoryImages(category); // Nicht awaiten, um Kategorien parallel zu laden
  }

  if (window.location.pathname.endsWith("Upload.html")) {
    addAdminControls();
  }
}

async function loadCategoryImages(category) {
  const apiBase = (window.APP_CONFIG && window.APP_CONFIG.API_URL) ? window.APP_CONFIG.API_URL : "http://localhost:3000";
  let galleryData = { images: [], videos: [], subgalleries: {} };

  try {
    const response = await fetch(`${apiBase}/api/gallery/${category}?page=1&limit=${GALLERY_API_LIMIT}`);
    if (response.ok) {
      galleryData = await response.json();
    } else {
      console.error(`Fehler beim Laden der Galerie: ${category}`);
    }
  } catch (error) {
    console.error(`Fehler beim Laden der Galerie ${category}:`, error);
  }

  const { images, videos, subgalleries } = galleryData;

  const galleryPage = document.getElementById(`page-${category}`);
  if (!galleryPage) return;

  const imageGrid = galleryPage.querySelector(".bp-grid");
  if (!imageGrid) return;

  // Grid leeren
  imageGrid.innerHTML = "";

  // === Album-Gruppierung im Frontend ===
  const albumGroups = [];
  const globalSeenPaths = new Set();

  // Hilfsfunktion: Filtert Duplikate basierend auf dem Pfad (eindeutige ID)
  const filterUnique = (items) => (items || []).filter(img => {
    if (globalSeenPaths.has(img.path)) return false;
    globalSeenPaths.add(img.path);
    return true;
  });

  // 1. Bilder im Hauptverzeichnis als ein Album ("Root-Album") zusammenfassen
  const uniqueRootImages = filterUnique(images);
  if (uniqueRootImages.length > 0) {
    albumGroups.push({
      name: category.charAt(0).toUpperCase() + category.slice(1), // Name der Kategorie als Titel
      items: uniqueRootImages.sort((a, b) => 
        (a.originalName || a.name || "").localeCompare(b.originalName || b.name || "", undefined, { numeric: true, sensitivity: 'base' })
      )
    });
  }

  // 2. Unterkategorien (Themen) als weitere Alben hinzufügen
  Object.entries(subgalleries || {}).forEach(([subName, items]) => {
    const uniqueSubItems = filterUnique(items);
    if (uniqueSubItems.length > 0) {
      albumGroups.push({
        displayName: cleanThemaName(subName),
        rawName: subName, // Behalte den Namen mit Nummer für die Sortierung
        items: uniqueSubItems.sort((a, b) => 
          (a.originalName || a.name || "").localeCompare(b.originalName || b.name || "", undefined, { numeric: true, sensitivity: 'base' })
        )
      });
    }
  });

  // Alben numerisch nach dem ursprünglichen Namen (rawName) sortieren
  albumGroups.sort((a, b) => a.rawName.localeCompare(b.rawName, undefined, { numeric: true, sensitivity: 'base' }));

  // Alben als Kacheln im Grid rendern
  albumGroups.forEach(album => {
    const firstPhoto = album.items[0];
    const tile = createThemaTile(mediaUrl(firstPhoto.path), album.displayName, () => {
      // Beim Klick alle Bilder des Albums an den Slider übergeben
      const photos = album.items.map(f => ({
        src: mediaUrl(f.path),
        alt: f.title || cleanThemaName(f.name)
      }));
      if (typeof window.openThemaSlider === 'function') {
        window.openThemaSlider(photos, 0);
      }
    }, album.items.length);
    imageGrid.appendChild(tile);
  });

  // === Videos ===
  const uniqueVideos = filterUnique(videos);
  if (uniqueVideos.length > 0) {
    updateVideoSection(galleryPage, uniqueVideos, category);
  }
}

// Thema-Lightbox: Alle Fotos eines Themas laden und direkt in gallery-slider Lightbox öffnen
async function openThemaLightbox(category, subcategoryName, firstImagePath, themaTitle, apiBase) {
  let photos = [{ src: firstImagePath, alt: themaTitle }];

  try {
    const encodedSub = encodeURIComponent(subcategoryName);
    const resp = await fetch(`${apiBase}/api/gallery/${category}/${encodedSub}`);
    const data = await resp.json();
    if (data.images && data.images.length > 0) {
      photos = data.images
        .sort((a, b) => (a.originalName || a.name || "").localeCompare(b.originalName || b.name || "", undefined, { numeric: true }))
        .map(f => ({
          src: mediaUrl(f.path),
          alt: f.title || cleanThemaName(f.name)
        }));
    }
  } catch (err) {
    console.error('Fehler beim Laden der Thema-Fotos:', err);
  }

  if (typeof window.openThemaSlider === 'function') {
    window.openThemaSlider(photos, 0);
  }
}

// Delete a single image
async function deleteImage(category, filename) {
  if (!confirm("Wirklich löschen?")) return;

  try {
    const response = await fetch(apiEndpoint(`/api/upload/${category}/${filename}`), {
      method: "DELETE",
    });

    if (response.ok) {
      await reloadCategoryGallery(category);
    } else {
      alert("Fehler beim Löschen");
    }
  } catch (error) {
    console.error("Delete error:", error);
    alert("Fehler beim Löschen");
  }
}

// Delete subcategory image
async function deleteSubcategoryImage(category, subcategoryId, filename) {
  if (!confirm("Wirklich löschen?")) return;

  try {
    const response = await fetch(apiEndpoint(`/api/upload/${category}/${filename}?subcategoryId=${subcategoryId}`), {
      method: "DELETE",
    });

    if (response.ok) {
      await reloadCategoryGallery(category);
    } else {
      alert("Fehler beim Löschen");
    }
  } catch (error) {
    console.error("Delete error:", error);
    alert("Fehler beim Löschen");
  }
}

// Delete all images in a subcategory group
async function deleteAllSubcategoryImages(category, subId) {
  if (!confirm("Wirklich alle Bilder dieser Unterkategorie löschen?")) return;

  try {
    const response = await fetch(apiEndpoint(`/api/gallery/${category}`));
    if (!response.ok) return;

    const galleryData = await response.json();
    const items = galleryData.subgalleries[subId] || [];

    for (const item of items) {
      await fetch(apiEndpoint(`/api/upload/${category}/${item.name}?subcategoryId=${subId}`), {
        method: "DELETE",
      });
    }

    await reloadCategoryGallery(category);
  } catch (error) {
    console.error("Delete error:", error);
    alert("Fehler beim Löschen");
  }
}

// Add admin controls to all images/videos
function addAdminControls() {
  const isAdmin = window.location.pathname.endsWith("Upload.html") && typeof isAdminLoggedIn === "function" && isAdminLoggedIn();
  if (!isAdmin) return;

  // Add delete buttons to all existing placeholder images
  const categories = ["bodypainting", "zeichnungen", "events", "malerei", "bildhauerei", "sandmalerei", "presse"];

  categories.forEach((category) => {
    const galleryPage = document.getElementById(`page-${category}`);
    if (!galleryPage) return;

    // Get all image containers that don't already have delete buttons
    const imageContainers = galleryPage.querySelectorAll(".relative.overflow-hidden:not(.gallery-uploaded-item):not(.admin-controlled)");

    imageContainers.forEach((container) => {
      // Mark as admin controlled to avoid adding button twice
      container.classList.add("admin-controlled", "group");

      const img = container.querySelector("img.body-img");
      if (!img) return;

      const imgSrc = img.src;

      // Create delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.className =
        "absolute z-10 flex items-center justify-center w-8 h-8 text-white transition-opacity duration-300 bg-red-600 rounded-full opacity-0 top-2 right-2 hover:bg-red-700 group-hover:opacity-100";
      deleteBtn.title = "Delete image";
      deleteBtn.innerHTML = '<i class="fas fa-trash text-sm"></i>';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        showDeleteModal(category, "placeholder", imgSrc, container);
      };

      container.appendChild(deleteBtn);
    });
  });
}

// Show custom delete confirmation modal
function showDeleteModal(category, type, indexOrSrc, element = null) {
  const modal = document.getElementById("delete-confirm-modal");
  if (!modal) {
    createDeleteModal();
    setTimeout(() => showDeleteModal(category, type, indexOrSrc, element), 100);
    return;
  }

  modal.style.display = "flex";

  // Store deletion info
  modal.dataset.category = category;
  modal.dataset.type = type;
  modal.dataset.index = indexOrSrc;

  if (element) {
    modal.dataset.element = "placeholder";
  }

  // Update modal text
  const messageEl = modal.querySelector(".delete-message");
  if (type === "placeholder") {
    messageEl.textContent = "Are you sure you want to remove this image from the gallery?";
  } else {
    messageEl.textContent = `Are you sure you want to delete this ${type === "image" ? "image" : "video"}?`;
  }
}

// Create delete confirmation modal
function createDeleteModal() {
  const modal = document.createElement("div");
  modal.id = "delete-confirm-modal";
  modal.style.cssText = `
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 9999;
    align-items: center;
    justify-content: center;
  `;

  modal.innerHTML = `
    <div style="
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%);
      backdrop-filter: blur(10px);
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.18);
      max-width: 400px;
      text-align: center;
    ">
      <h3 style="color: white; font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem;">Confirm Deletion</h3>
      <p class="delete-message" style="color: rgba(255, 255, 255, 0.9); margin-bottom: 2rem; line-height: 1.6;"></p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button onclick="cancelDelete()" style="
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.3);
          border: none;
          border-radius: 0.5rem;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        ">Cancel</button>
        <button onclick="confirmDelete()" style="
          padding: 0.75rem 1.5rem;
          background: rgba(220, 38, 38, 0.9);
          border: none;
          border-radius: 0.5rem;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        ">Delete</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

// Cancel deletion
function cancelDelete() {
  const modal = document.getElementById("delete-confirm-modal");
  if (modal) modal.style.display = "none";
}

// Confirm deletion
function confirmDelete() {
  const modal = document.getElementById("delete-confirm-modal");
  if (!modal) return;

  const category = modal.dataset.category;
  const type = modal.dataset.type;
  const indexOrSrc = modal.dataset.index;

  if (type === "placeholder") {
    // Find and remove the placeholder element
    const containers = document.querySelectorAll(`#page-${category} .admin-controlled`);
    containers.forEach((container) => {
      const img = container.querySelector("img");
      if (img && img.src === indexOrSrc) {
        container.remove();
      }
    });
  } else {
    // Delete from localStorage
    deleteGalleryImage(category, type, parseInt(indexOrSrc));
  }

  modal.style.display = "none";
}

// Delete image from gallery
function deleteGalleryImage(category, type, index) {
  const storageKey = `gallery_${category}_${type}`;
  const files = JSON.parse(localStorage.getItem(storageKey) || "[]");
  files.splice(index, 1);
  localStorage.setItem(storageKey, JSON.stringify(files));

  // Reload the gallery
  reloadCategoryGallery(category);
}

// Reload a specific category gallery
async function reloadCategoryGallery(category) {
  const galleryPage = document.getElementById(`page-${category}`);
  if (!galleryPage) return;

  // Remove all uploaded items
  const uploadedItems = galleryPage.querySelectorAll(".gallery-uploaded-item");
  uploadedItems.forEach((item) => item.remove());

  // Reload category
  await loadCategoryImages(category);
}

function updateVideoSection(galleryPage, videos, category) {
  // Ziel: .bp-video-section > .bp-video-grid
  const videoSection = galleryPage.querySelector(".bp-video-section");
  if (!videoSection) return;

  const videoGrid = videoSection.querySelector(".bp-video-grid");
  if (!videoGrid) return;

  const isAdmin = typeof isAdminLoggedIn === "function" && isAdminLoggedIn();

  // Bestehende Video-Zellen leeren
  videoGrid.querySelectorAll(".bp-video-cell").forEach(el => el.remove());

  videos.forEach((file, index) => {
    const videoDiv = document.createElement("div");
    videoDiv.className = "bp-video-cell";
    videoDiv.innerHTML = `
      <video
        src="${mediaUrl(file.path)}"
        controls playsinline preload="metadata"
        class="bp-video"
      ></video>
      ${isAdmin ? `
      <button
        onclick="showDeleteModal('${category}', 'video', ${index}); event.stopPropagation();"
        class="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
        title="Video löschen"
      ><i class="fas fa-trash text-sm"></i></button>` : ""}
    `;
    videoGrid.appendChild(videoDiv);
  });
}

// Initialize lightbox for dynamically loaded images
function initDynamicLightbox() {
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("body-img")) {
      const lightbox = document.getElementById("lightbox-modal");
      const lightboxImg = document.getElementById("lightbox-img");

      if (lightbox && lightboxImg) {
        lightboxImg.src = e.target.src;
        lightbox.classList.remove("hidden");
        lightbox.classList.add("flex");
      }
    }
  });
}

// Pausiert alle anderen Videos, wenn ein neues gestartet wird
function initVideoPauseLogic() {
  document.addEventListener('play', function(e) {
    if (e.target.tagName === 'VIDEO') {
      document.querySelectorAll('video').forEach(v => {
        if (v !== e.target) v.pause();
      });
    }
  }, true); // true = Capture-Phase, da 'play' nicht von selbst aufsteigt
}

// Load gallery images when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    loadGalleryImages();
    initDynamicLightbox();
    initVideoPauseLogic();
  });
} else {
  loadGalleryImages();
  initDynamicLightbox();
  initVideoPauseLogic();
}
