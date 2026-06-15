// const Database = require("better-sqlite3");
// const path = require("path");

// const db = new Database(path.join(__dirname, "gallery.db"));

// console.log("🧹 Clean reset starting... (keeping bg + intro)");

// // DELETE EVERYTHING EXCEPT bg.* AND intro
// const result = db.prepare(`
//   DELETE FROM images
//   WHERE name NOT LIKE 'bg.%'
//   AND category != 'intro'
// `).run();

// console.log(`✅ Deleted rows: ${result.changes}`);

// db.close();

// console.log("🎉 Done");

const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "gallery.db"));

console.log("🧹 Smart clean reset starting...");

const rows = db.prepare(`
  SELECT id, name, category, path
  FROM images
`).all();

let deleted = 0;

// segéd: Windows + Linux path fix
function normalize(p) {
  return (p || "").replace(/\\/g, "/");
}

// eldönti: van-e alkönyvtár
function isSubfolderImage(filePath) {
  const p = normalize(filePath);

  // /img után vizsgálunk
  const afterImg = p.split("/img/")[1];
  if (!afterImg) return true;

  // ha van még "/" → subfolder
  return afterImg.includes("/");
}

for (const img of rows) {
  const name = img.name || "";
  const category = img.category || "";
  const pathStr = normalize(img.path || "");

  // 1. KEEP bg.*
  if (name.startsWith("bg.")) continue;

  // 2. KEEP intro
  if (category === "intro") continue;

  // 3. KEEP ROOT (Übersicht + homepage)
  if (!isSubfolderImage(pathStr)) continue;

  // ❌ DELETE minden más subfolderből
  db.prepare("DELETE FROM images WHERE id = ?").run(img.id);
  deleted++;
}

console.log(`✅ Deleted rows: ${deleted}`);

db.close();

console.log("🎉 Smart clean done!");