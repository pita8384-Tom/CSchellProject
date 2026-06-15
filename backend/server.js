const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs").promises;
const cors = require("cors");
const Database = require("better-sqlite3");
const nodemailer = require("nodemailer");
require("dotenv").config();

const { sendTestMail } = require("./ethereal-mail");

const app = express();
const PORT = process.env.PORT || 3000;
const MEDIA_ROOT = path.join(__dirname, "img");

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// ============= MAIL SETUP =============
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: parseInt(process.env.SMTP_PORT || "465") === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ============= DATENBANK SETUP =============
// MIGRATION ZU POSTGRESQL (Supabase): Ersetze better-sqlite3 durch 'pg' Pool.
// SQL-Syntax bleibt fast identisch. Platzhalter ? wird zu $1, $2 ...

const DB_PATH = path.join(__dirname, "gallery.db");
const db = new Database(DB_PATH);

// Tabelle erstellen falls nicht vorhanden
db.exec(`
  CREATE TABLE IF NOT EXISTS images (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    original_name TEXT,
    path        TEXT NOT NULL,
    title       TEXT,
    category    TEXT NOT NULL,
    subcategory TEXT,
    file_type   TEXT NOT NULL DEFAULT 'image',
    mime_type   TEXT,
    size        INTEGER,
    uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_category ON images(category);
  CREATE INDEX IF NOT EXISTS idx_category_sub ON images(category, subcategory);
`);
console.log("✅ SQLite Datenbank bereit:", DB_PATH);

// DB-Hilfsfunktionen (einfach gegen PostgreSQL austauschbar)
const dbInsert = db.prepare(`
  INSERT INTO images (name, original_name, path, title, category, subcategory, file_type, mime_type, size)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const dbGetByCategory = db.prepare(`
  SELECT * FROM images
  WHERE category = ? AND subcategory IS NULL
  LIMIT ? OFFSET ?
`);

const dbGetVideos = db.prepare(`
  SELECT * FROM images
  WHERE category = ? AND subcategory IS NULL AND file_type = 'video'
`);

const dbGetSubgalleries = db.prepare(`
  SELECT * FROM images
  WHERE category = ? AND subcategory IS NOT NULL
`);

const dbCountByCategory = db.prepare(`
  SELECT COUNT(*) as total FROM images
  WHERE category = ? AND subcategory IS NULL AND file_type = 'image'
`);

const dbDeleteByName = db.prepare(`
  DELETE FROM images WHERE category = ? AND name = ?
`);

const dbDeleteSubcategory = db.prepare(`
  DELETE FROM images WHERE category = ? AND name = ? AND subcategory = ?
`);

// Zeile in Frontend-Format umwandeln
function rowToFileData(row) {
  let finalPath = normalizeMediaPath(row.path);
  
  // FIX: Sende IMMER den kompletten und absoluten Link an das Frontend (z.B. http://localhost:3000/img/...)
  const publicApiUrl = process.env.PUBLIC_API_URL || `http://localhost:${PORT}`;
  if (finalPath && finalPath.startsWith("/img/")) {
    finalPath = `${publicApiUrl}${finalPath}`;
  }

  return {
    id: row.id,
    name: row.name,
    originalName: row.original_name,
    path: finalPath,
    title: row.title || row.original_name,
    type: row.mime_type,
    fileType: row.file_type,
    size: row.size,
    timestamp: row.uploaded_at,
  };
}

function normalizeMediaPath(inputPath) {
  if (!inputPath || typeof inputPath !== "string") return inputPath;
  let normalized = inputPath;
  if (normalized.includes("/backend/img/")) {
    normalized = normalized.replace(/\/backend\/img\//g, "/img/");
  }
  if (normalized.startsWith("backend/img/")) {
    normalized = "/" + normalized.replace("backend/img/", "img/");
  } else if (normalized.startsWith("/backend/img/")) {
    normalized = normalized.replace("/backend/img/", "/img/");
  } else if (normalized.startsWith("img/")) {
    normalized = "/" + normalized;
  }
  return normalized;
}

function mediaPathToDiskPath(inputPath) {
  const normalized = normalizeMediaPath(inputPath);
  if (!normalized || typeof normalized !== "string") return null;
  if (!normalized.startsWith("/img/")) return null;

  const relPath = normalized.slice("/img/".length);
  return path.join(MEDIA_ROOT, ...relPath.split("/"));
}

function rowHasPhysicalFile(row) {
  const diskPath = mediaPathToDiskPath(row.path);
  if (!diskPath) return false;
  return fs.existsSync(diskPath);
}

function titleFromFilename(filename) {
  return path.basename(filename, path.extname(filename))
    .replace(/^\d+\.\s*/, "")
    .trim();
}

function resolveMediaFolderName(category, fileType) {
  const lowerFolder = fileType === "video" ? "videos" : "fotos";
  const upperFolder = fileType === "video" ? "Video" : "Foto";
  const lowerPath = path.join(MEDIA_ROOT, category, lowerFolder);
  if (fs.existsSync(lowerPath)) return lowerFolder;
  return upperFolder;
}

function mimeTypeForFile(ext, fileType) {
  const normalizedExt = ext.toLowerCase();
  if (fileType === "video") {
    if (normalizedExt === ".webm") return "video/webm";
    if (normalizedExt === ".mov") return "video/quicktime";
    return "video/mp4";
  }

  if (normalizedExt === ".png") return "image/png";
  if (normalizedExt === ".webp") return "image/webp";
  if (normalizedExt === ".gif") return "image/gif";
  return "image/jpeg";
}

function syncMediaTree(category, rootFolderName, fileType) {
  const rootPath = path.join(MEDIA_ROOT, category, rootFolderName);
  if (!fs.existsSync(rootPath)) return 0;

  let syncedCount = 0;

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const lowerName = entry.name.toLowerCase();
      if (lowerName === "thumbs.db" || lowerName === "desktop.ini") continue;

      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;

      const relativeDir = path.relative(rootPath, currentDir);
      const subcategory = relativeDir ? relativeDir.split(path.sep)[0] : null;

      const relativePath = path.relative(rootPath, fullPath).split(path.sep).join("/");
      const dbPath = `/img/${category}/${rootFolderName}/${relativePath}`;

      const existing = db.prepare(
        "SELECT id, path, subcategory FROM images WHERE category = ? AND name = ?",
      ).get(category, entry.name);

      if (existing) {
        // Update path and subcategory if they differ
        if (existing.path !== dbPath || (existing.subcategory || '') !== (subcategory || '')) {
          db.prepare("UPDATE images SET path = ?, subcategory = ? WHERE id = ?")
            .run(dbPath, subcategory, existing.id);
          syncedCount++; // Count as updated
        }
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      const mimeType = mimeTypeForFile(ext, fileType);
      const stats = fs.statSync(fullPath);

      dbInsert.run(
        entry.name,
        entry.name,
        dbPath,
        titleFromFilename(entry.name),
        category,
        subcategory,
        fileType,
        mimeType,
        stats.size,
      );
      syncedCount++;
    }
  }

  walk(rootPath);
  return syncedCount;
}

// ============= MIDDLEWARE =============

const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://localhost:3001",
  ...FRONTEND_ORIGINS,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isNetlifyPreview = /^https:\/\/[a-z0-9-]+--[a-z0-9-]+\.netlify\.app$/i.test(origin);
      const isNetlifySite = /^https:\/\/[a-z0-9-]+\.netlify\.app$/i.test(origin);
      const isAllowed = allowedOrigins.includes(origin) || isNetlifyPreview || isNetlifySite;

      if (isAllowed) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "50mb" }));

// ============= MULTER (Datei-Speicher) =============

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let category = "general";
    if (req.query && req.query.category) {
      category = req.query.category;
    } else if (req.body && req.body.category) {
      category = req.body.category;
    }
    const subFolder = file.mimetype.startsWith("video/") ? "Video" : "Foto";
    const dir = path.join(MEDIA_ROOT, category, subFolder);
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Verzeichnis erstellt: ${dir}`);
      }
      cb(null, dir);
    } catch (error) {
      console.error("❌ Fehler beim Verzeichnis erstellen:", error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

const uploadHandler = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("❌ Multer Fehler:", err.message);
      return res.status(400).json({ error: "Upload Fehler", details: err.message });
    }
    next();
  });
};

// ============= API ENDPOINTS =============

// Config Endpoint
app.get("/api/config", (req, res) => {
  const publicApiUrl = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get("host")}`;

  res.json({
    API_URL: publicApiUrl,
    MAX_FILE_SIZE_MB: 100,
    ALLOWED_EXTENSIONS: "jpg,jpeg,png,webp,gif,mp4,webm",
    status: "ok",
  });
});

// UPLOAD Endpoint
app.post("/api/upload", uploadHandler, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Keine Datei hochgeladen" });
    }

    // Prüfe ob Datei wirklich gespeichert wurde
    try {
      await fsPromises.access(req.file.path);
    } catch (err) {
      return res.status(500).json({ error: "Datei konnte nicht gespeichert werden" });
    }

    const { category, title, isSubcategory, subcategoryId, fileType } = req.body;

    if (!category) {
      return res.status(400).json({ error: "Kategorie ist erforderlich" });
    }

    const resolvedFileType = fileType || (req.file.mimetype.startsWith("image/") ? "image" : "video");
    const resolvedSubcategory = (isSubcategory === "true" && subcategoryId) ? subcategoryId : null;
    const subFolder = resolveMediaFolderName(category, resolvedFileType);
    const filePath = `/img/${category}/${subFolder}/${req.file.filename}`;

    // In SQLite speichern
    const result = dbInsert.run(
      req.file.filename,
      req.file.originalname,
      filePath,
      title || req.file.originalname,
      category,
      resolvedSubcategory,
      resolvedFileType,
      req.file.mimetype,
      req.file.size
    );

    console.log(`✅ In DB gespeichert: ID ${result.lastInsertRowid} | ${category} | ${req.file.filename}`);

    const fileData = {
      id: result.lastInsertRowid,
      name: req.file.filename,
      originalName: req.file.originalname,
      path: filePath,
      title: title || req.file.originalname,
      type: req.file.mimetype,
      fileType: resolvedFileType,
      size: req.file.size,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json({ success: true, file: fileData, message: "Upload erfolgreich!" });
  } catch (error) {
    console.error("❌ Upload Fehler:", error);
    res.status(500).json({ error: "Upload fehlgeschlagen", details: error.message });
  }
});

// Thema-Galerie abrufen (alle Fotos eines Themas)
// GET /api/gallery/:category/:subcategory
app.get("/api/gallery/:category/:subcategory", (req, res) => {
  try {
    const { category } = req.params;
    const subcategory = decodeURIComponent(req.params.subcategory);
    // Entferne ORDER BY, da SQLite keine numerische Sortierung beherrscht. 
    // Die Sortierung erfolgt nun konsistent im Frontend.
    const stmt = db.prepare(
      `SELECT * FROM images WHERE category = ? AND subcategory = ?`
    );
    const rows = stmt.all(category, subcategory).filter(rowHasPhysicalFile);
    const images = rows.filter(r => r.file_type === "image").map(rowToFileData);
    const videos = rows.filter(r => r.file_type === "video").map(rowToFileData);
    res.json({ images, videos, total: images.length });
  } catch (error) {
    console.error("Fehler beim Laden des Themas:", error);
    res.status(500).json({ error: "Fehler beim Laden des Themas" });
  }
});

// Galerie abrufen (mit Paginierung)
// GET /api/gallery/:category?page=1&limit=24
app.get("/api/gallery/:category", (req, res) => {
  try {
    const { category } = req.params;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(500, parseInt(req.query.limit) || 24);
    const offset = (page - 1) * limit;

    // Bilder (paginiert)
    const imageRows = dbGetByCategory.all(category, limit, offset).filter(rowHasPhysicalFile);
    const images = imageRows.filter(r => r.file_type === "image").map(rowToFileData);

    // Videos (immer alle, meist wenige)
    const videos = dbGetVideos.all(category).filter(rowHasPhysicalFile).map(rowToFileData);

    // Unterkategorien (gruppiert)
    const subRows = dbGetSubgalleries.all(category).filter(rowHasPhysicalFile);
    const subgalleries = {};
    for (const row of subRows) {
      if (!subgalleries[row.subcategory]) subgalleries[row.subcategory] = [];
      subgalleries[row.subcategory].push(rowToFileData(row));
    }

    // Gesamtanzahl für Paginierung
    const { total } = dbCountByCategory.get(category);

    res.json({
      images,
      videos,
      subgalleries,
      total,
      page,
      limit,
      hasMore: offset + images.length < total,
    });
  } catch (error) {
    console.error("Fehler beim Laden der Galerie:", error);
    res.status(500).json({ error: "Galerie konnte nicht geladen werden" });
  }
});

// Alle Kategorien (für Upload-Seite)
app.get("/api/gallery-data", (req, res) => {
  try {
    const categories = ["bodypainting", "zeichnungen", "events", "malerei", "bildhauerei", "sandmalerei", "presse", "videos", "general"];
    const result = {};
    for (const cat of categories) {
      const images = dbGetByCategory
        .all(cat, 1000, 0)
        .filter(rowHasPhysicalFile)
        .filter(r => r.file_type === "image")
        .map(rowToFileData);
      const videos = dbGetVideos.all(cat).filter(rowHasPhysicalFile).map(rowToFileData);
      result[cat] = { images, videos, subgalleries: {} };
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Daten konnten nicht geladen werden" });
  }
});

// KONTAKTFORMULAR Endpoint
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Alle Felder sind erforderlich." });
    }

    // ENTSCHEIDUNG: Test-Modus oder Echter Versand
    // Setze MAIL_TEST_MODE=true in deiner .env um Ethereal zu nutzen
    const isTestMode = process.env.MAIL_TEST_MODE === "true" || !process.env.SMTP_HOST;

    if (isTestMode) {
      // TEST: Über Ethereal senden
      const previewUrl = await sendTestMail({ name, email, message });
      console.log(`🧪 TEST-MODUS: E-Mail-Vorschau unter: ${previewUrl}`);
      return res.status(200).json({ 
        success: true, 
        message: "Test-Modus: Nachricht wurde an Ethereal gesendet.", 
        previewUrl: previewUrl 
      });
    } else {
      // PRODUKTION: Über echten SMTP-Server an contact@cschell.art senden
      const mailOptions = {
        from: `"Portfolio Kontaktformular" <${process.env.SMTP_USER}>`,
        replyTo: email,
        to: "contact@cschell.art",
        subject: `Neue Kontaktanfrage von ${name}`,
        text: `Name: ${name}\nE-Mail: ${email}\n\nNachricht:\n${message}`,
        html: `
          <h3>Neue Kontaktanfrage</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>E-Mail:</strong> ${email}</p>
          <p><strong>Nachricht:</strong></p>
          <p>${message.replace(/\n/g, "<br>")}</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`📧 E-Mail erfolgreich an contact@cschell.art versendet.`);
      return res.status(200).json({ success: true, message: "Nachricht wurde erfolgreich gesendet." });
    }
  } catch (error) {
    console.error("❌ Mail Fehler:", error);
    res.status(500).json({ 
      error: "Nachricht konnte nicht gesendet werden.", 
      details: error.message 
    });
  }
});

// ============= STATISCHE DATEIEN =============
app.use("/img", express.static(MEDIA_ROOT));
app.use(express.static(path.join(__dirname, "..", "frontend-netlify")));

// Titel / Namen eines Mediums aktualisieren (Bearbeiten)
app.put("/api/upload/:category/:filename", async (req, res) => {
  try {
    const { category, filename } = req.params;
    const { newTitle } = req.body;

    if (!newTitle || newTitle.trim() === "") {
      return res.status(400).json({ error: "Kein neuer Titel angegeben" });
    }

    // Aktualisiere den Titel und den original_name in der Datenbank
    const stmt = db.prepare(`UPDATE images SET title = ?, original_name = ? WHERE category = ? AND name = ?`);
    const result = stmt.run(newTitle.trim(), newTitle.trim(), category, filename);

    if (result.changes > 0) {
      res.json({ success: true, message: "Titel erfolgreich aktualisiert" });
    } else {
      res.status(404).json({ error: "Datei nicht gefunden" });
    }
  } catch (error) {
    console.error("Fehler beim Aktualisieren:", error);
    res.status(500).json({ error: "Titel konnte nicht aktualisiert werden" });
  }
});

// Datei löschen
app.delete("/api/upload/:category/:filename", async (req, res) => {
  try {
    const { category, filename } = req.params;
    const { subcategoryId } = req.query;

    // Aus DB löschen
    if (subcategoryId) {
      dbDeleteSubcategory.run(category, filename, subcategoryId);
    } else {
      dbDeleteByName.run(category, filename);
    }

    // Physikalische Datei löschen
    let filePath = path.join(MEDIA_ROOT, category, filename);
    
    const fileRecord = db.prepare(`SELECT path FROM images WHERE category = ? AND name = ?`).get(category, filename);
    if (fileRecord && fileRecord.path) {
      const diskPath = mediaPathToDiskPath(fileRecord.path);
      if (diskPath) filePath = diskPath;
    }

    try {
      await fsPromises.unlink(filePath);
      console.log(`🗑️ Datei gelöscht: ${filePath}`);
    } catch (err) {
      console.log("Datei existiert nicht mehr auf Disk:", filename);
    }

    res.json({ success: true, message: "Datei gelöscht" });
  } catch (error) {
    console.error("Löschfehler:", error);
    res.status(500).json({ error: "Datei konnte nicht gelöscht werden" });
  }
});

// ============= SERVER START =============

async function startServer() {
  // CLEANUP: Einträge entfernen, für die keine physische Datei mehr existiert
  try {
    const allRows = db.prepare("SELECT id, path FROM images").all();
    let deletedCount = 0;
    for (const row of allRows) {
      if (!rowHasPhysicalFile(row)) {
        db.prepare("DELETE FROM images WHERE id = ?").run(row.id);
        deletedCount++;
      }
    }
    if (deletedCount > 0) console.log(`🧹 Cleanup: ${deletedCount} verwaiste Datenbank-Einträge ohne Datei entfernt.`);
  } catch (err) { console.error("Cleanup Fehler:", err); }

  // MIGRATION: Alte Bilder in Foto/Video-Ordner verschieben & Datenbank updaten
  try {
    const allImages = db.prepare("SELECT id, path, category, file_type, name FROM images").all();
    let updatedCount = 0;
    for (const img of allImages) {
      if (
        !img.path.includes("/Foto/") &&
        !img.path.includes("/fotos/") &&
        !img.path.includes("/Video/") &&
        !img.path.includes("/videos/")
      ) {
        const subFolder = resolveMediaFolderName(img.category, img.file_type);
        const oldDiskPath = path.join(MEDIA_ROOT, img.category, img.name);
        const newDiskPath = path.join(MEDIA_ROOT, img.category, subFolder, img.name);
        
        // Fix: Wenn das Bild bereits in einem Unterordner registriert ist, Pfad beibehalten
        let newDbPath = `/img/${img.category}/${subFolder}/${img.name}`;
        if (img.path.split('/').length > 4) {
           // Pfad scheint bereits komplex zu sein, Migration überspringen für diesen Eintrag
           continue;
        }

        // Wenn die Datei noch im alten Hauptordner liegt, verschiebe sie physisch!
        if (fs.existsSync(oldDiskPath)) {
          if (!fs.existsSync(path.join(MEDIA_ROOT, img.category, subFolder))) {
            fs.mkdirSync(path.join(MEDIA_ROOT, img.category, subFolder), { recursive: true });
          }
          fs.renameSync(oldDiskPath, newDiskPath);
        }

        // Datenbank-Pfad updaten
        db.prepare("UPDATE images SET path = ? WHERE id = ?").run(newDbPath, img.id);
        updatedCount++;
      }
    }
    if (updatedCount > 0) console.log(`🔄 Migration: ${updatedCount} alte Dateien & DB-Einträge in Foto/Video Ordner korrigiert!`);
  } catch(err) { console.error("Migrationsfehler:", err); }

  // AUTO-SYNC: Manuell hinzugefügte Dateien auf der Festplatte lesen & in DB eintragen
  try {
    let syncCount = 0;
    const categoriesList = ["bodypainting", "events", "zeichnungen", "malerei", "bildhauerei", "sandmalerei", "presse", "videos", "general"];

    const syncTargets = [
      { folder: "Foto", fileType: "image" },
      { folder: "fotos", fileType: "image" },
      { folder: "Video", fileType: "video" },
      { folder: "videos", fileType: "video" },
    ];

    categoriesList.forEach((cat) => {
      syncTargets.forEach(({ folder, fileType }) => {
        syncCount += syncMediaTree(cat, folder, fileType);
      });
    });

    if (syncCount > 0) {
      console.log(`✨ AUTO-SYNC: ${syncCount} manuell in Ordner kopierte Dateien erkannt und in die Datenbank aufgenommen!`);
    }
  } catch (err) {
    console.error("Auto-Sync Fehler:", err);
  }

  app.listen(PORT, () => {
    console.log("\n" + "=".repeat(50));
    console.log(`✅ SERVER LÄUFT!`);
    
    //Hostmaschine könnte localhost
    //console.log(`🌍 URL: http://localhost:${PORT}`);
    //console.log(`📤 Upload: http://localhost:${PORT}/api/upload`);
    //console.log(`🖼️  Galerie: http://localhost:${PORT}/api/gallery/bodypainting`);

    // Render setzt automatisch die korrekte PUBLIC_API_URL, daher hier nur allgemeine Info:
    console.log(`🌍 URL: https://cschell-backend.onrender.com`);
    console.log(`📤 Upload: /api/upload`);
    console.log(`🖼️  Galerie: /api/gallery/bodypainting`);
    console.log(`🗄️  Datenbank: ${DB_PATH}`);
    console.log("=".repeat(50) + "\n");
  });
}

startServer();
