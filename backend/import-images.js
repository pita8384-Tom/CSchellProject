/**
 * Import-Skript: Alle bestehenden Bilder aus img/ in die SQLite-Datenbank importieren
 * Ausführen mit: node backend/import-images.js
 */

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

/*const ROOT = path.join(__dirname, "..");*/
const ROOT = __dirname;
const DB_PATH = path.join(__dirname, "gallery.db");
const db = new Database(DB_PATH);

// MIME-Typ aus Dateiendung
function getMimeType(ext) {
  const map = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".webp": "image/webp", ".gif": "image/gif",
    ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
  };
  return map[ext.toLowerCase()] || "application/octet-stream";
}

// Dateigröße
function getSize(filePath) {
  try { return fs.statSync(filePath).size; } catch { return 0; }
}

// Titel aus Dateiname ableiten (z.B. "1. Ohne Titel.jpg" → "Ohne Titel")
function titleFromName(name) {
  return path.basename(name, path.extname(name))
    .replace(/^\d+\.\s*/, "")  // "1. " am Anfang entfernen
    .trim();
}

// INSERT Statement
const insert = db.prepare(`
  INSERT OR IGNORE INTO images (name, original_name, path, title, category, subcategory, file_type, mime_type, size)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Statistik
let imported = 0;
let skipped = 0;

// Dateien die übersprungen werden (keine Galerie-Bilder)
const SKIP_NAMES = new Set([
  "bg.jpg", "bg.mp4", "bodypainting.gif", "bodypainting_static.jpg",
  "sculpture.gif", "sculpture_static.jpg", "sandpainting.gif", "sandpainting_static.jpg",
  "image_total.jpg",
]);

const SKIP_EXTS = new Set([".psd", ".ai", ".svg"]);

function shouldSkip(filename) {
  const ext = path.extname(filename).toLowerCase();
  return SKIP_NAMES.has(filename.toLowerCase()) || SKIP_EXTS.has(ext);
}

/**
 * Importiert Dateien aus einem Ordner
 * @param {string} folderPath - absoluter Pfad zum Ordner
 * @param {string} category - Kategorie
 * @param {string|null} subcategory - Unterkategorie (oder null)
 * @param {string} webBasePath - Web-Pfad Prefix (z.B. "/img/bodypainting/fotos")
 */
function importFolder(folderPath, category, subcategory, webBasePath) {
  if (!fs.existsSync(folderPath)) return;

  // Numerische Sortierung (1, 2, 10) sicherstellen
  const entries = fs.readdirSync(folderPath, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    const webPath = `${webBasePath}/${entry.name}`;

    if (entry.isDirectory()) {
      // Unterkategorie-Ordner: nur eine Ebene tief
      if (subcategory === null) {
        importFolder(fullPath, category, entry.name, webPath);
      }
      continue;
    }

    if (!entry.isFile()) continue;
    if (shouldSkip(entry.name)) { skipped++; continue; }

    const ext = path.extname(entry.name).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm", ".mov"].includes(ext)) {
      skipped++;
      continue;
    }

    const fileType = [".mp4", ".webm", ".mov"].includes(ext) ? "video" : "image";
    const mime = getMimeType(ext);
    const size = getSize(fullPath);
    const title = titleFromName(entry.name);

    try {
      const result = insert.run(
        entry.name,       // name
        entry.name,       // original_name
        webPath,          // path (Web-Pfad)
        title,            // title
        category,         // category
        subcategory,      // subcategory (null = kein Unterordner)
        fileType,         // file_type
        mime,             // mime_type
        size              // size
      );
      if (result.changes > 0) {
        imported++;
        console.log(`  ✅ ${category.padEnd(14)} | ${subcategory ? `[${subcategory}] ` : ""}${entry.name}`);
      } else {
        skipped++;
      }
    } catch (err) {
      console.warn(`  ⚠️  Fehler bei ${entry.name}: ${err.message}`);
      skipped++;
    }
  }
}

// ============= IMPORT STARTEN =============

console.log("\n" + "=".repeat(60));
console.log("  BILDER-IMPORT in SQLite Datenbank");
console.log("=".repeat(60) + "\n");

// Kategorien mit ihrer Ordner-Struktur
const CATEGORIES = [
  // { category, folderPath, webBase, hasFotosSubfolder }
    {
    category: "intro",
    fotosPath: path.join(ROOT, "img", "intro"),
    webFotosBase: "/img/intro",
    videosPath: null,
    webVideosBase: null,
  },
  {
    category: "bodypainting",
    fotosPath: path.join(ROOT, "img", "bodypainting", "fotos"),
    webFotosBase: "/img/bodypainting/fotos",
    videosPath: path.join(ROOT, "img", "bodypainting", "videos"),
    webVideosBase: "/img/bodypainting/videos",
  },
  {
    category: "bildhauerei",
    fotosPath: path.join(ROOT, "img", "bildhauerei", "fotos"),
    webFotosBase: "/img/bildhauerei/fotos",
    videosPath: path.join(ROOT, "img", "bildhauerei", "videos"),
    webVideosBase: "/img/bildhauerei/videos",
  },
  {
    category: "malerei",
    fotosPath: path.join(ROOT, "img", "malerei", "fotos"),
    webFotosBase: "/img/malerei/fotos",
    videosPath: path.join(ROOT, "img", "malerei", "videos"),
    webVideosBase: "/img/malerei/videos",
  },
  {
    category: "sandmalerei",
    fotosPath: path.join(ROOT, "img", "sandmalerei", "fotos"),
    webFotosBase: "/img/sandmalerei/fotos",
    videosPath: path.join(ROOT, "img", "sandmalerei", "videos"),
    webVideosBase: "/img/sandmalerei/videos",
  },
  // Kategorien ohne fotos/ Unterordner
  {
    category: "events",
    fotosPath: path.join(ROOT, "img", "events", "fotos"),
    webFotosBase: "/img/events/fotos",
    videosPath: path.join(ROOT, "img", "events", "videos"),
    webVideosBase: "/img/events/videos",
  },
  {
    category: "presse",
    fotosPath: path.join(ROOT, "img", "presse", "fotos"),
    webFotosBase: "/img/presse/fotos",
    videosPath: path.join(ROOT, "img", "presse", "videos"),
    webVideosBase: "/img/presse/videos",
  },
  {
    category: "zeichnungen",
    fotosPath: path.join(ROOT, "img", "zeichnungen", "fotos"),
    webFotosBase: "/img/zeichnungen/fotos",
    videosPath: path.join(ROOT, "img", "zeichnungen", "videos"),
    webVideosBase: "/img/zeichnungen/videos",
  },
];

const importAll = db.transaction(() => {
  // DATENBANK BEREINIGEN: Löscht alle alten Einträge vor dem Neu-Import
  console.log("🧹 Bereinige Datenbank: Lösche alle bestehenden Einträge...");
  db.prepare("DELETE FROM images").run();

  for (const cat of CATEGORIES) {
    console.log(`\n📁 Kategorie: ${cat.category.toUpperCase()}`);

    // Fotos importieren
    if (cat.fotosPath && fs.existsSync(cat.fotosPath)) {
      importFolder(cat.fotosPath, cat.category, null, cat.webFotosBase);
    }

    // Videos importieren
    if (cat.videosPath && fs.existsSync(cat.videosPath)) {
      const videoFiles = fs.readdirSync(cat.videosPath).filter(f => !shouldSkip(f));
      for (const vf of videoFiles) {
        const ext = path.extname(vf).toLowerCase();
        if (![".mp4", ".webm", ".mov"].includes(ext)) continue;
        const fullPath = path.join(cat.videosPath, vf);
        const webPath = `${cat.webVideosBase}/${vf}`;
        const result = insert.run(vf, vf, webPath, titleFromName(vf), cat.category, null, "video", getMimeType(ext), getSize(fullPath));
        if (result.changes > 0) {
          imported++;
          console.log(`  ✅ ${cat.category.padEnd(14)} | [VIDEO] ${vf}`);
        }
      }
    }
  }
});

importAll();

// ============= ERGEBNIS ANZEIGEN =============

console.log("\n" + "=".repeat(60));
console.log(`  IMPORT ABGESCHLOSSEN`);
console.log(`  Importiert: ${imported} Dateien`);
console.log(`  Übersprungen: ${skipped} Dateien`);
console.log("=".repeat(60));

console.log("\n=== DATENBANK ÜBERSICHT ===\n");

const counts = db.prepare(`
  SELECT category, file_type, COUNT(*) as anzahl
  FROM images
  GROUP BY category, file_type
  ORDER BY category, file_type
`).all();

let lastCat = "";
for (const row of counts) {
  if (row.category !== lastCat) {
    console.log(`\n  📂 ${row.category.toUpperCase()}`);
    lastCat = row.category;
  }
  const icon = row.file_type === "video" ? "🎬" : "🖼️ ";
  console.log(`     ${icon}  ${row.anzahl.toString().padStart(4)} ${row.file_type}(s)`);
}

const total = db.prepare("SELECT COUNT(*) as n FROM images").get();
console.log(`\n  GESAMT: ${total.n} Einträge\n`);

db.close();
