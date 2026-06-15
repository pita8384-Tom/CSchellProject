const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "gallery.db"));

console.log("\n=== TABELLEN ===");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables.map(t => t.name).join(", ") || "(keine)");

console.log("\n=== SPALTEN der Tabelle 'images' ===");
const columns = db.prepare("PRAGMA table_info(images)").all();
const maxLen = Math.max(...columns.map(c => c.name.length));
columns.forEach(c => {
  const pk = c.pk ? " [PRIMARY KEY]" : "";
  const notnull = c.notnull ? " NOT NULL" : "";
  const def = c.dflt_value ? ` DEFAULT ${c.dflt_value}` : "";
  console.log(`  ${c.name.padEnd(maxLen)}  ${c.type}${pk}${notnull}${def}`);
});

console.log("\n=== INDIZES ===");
const indexes = db.prepare("SELECT name, tbl_name FROM sqlite_master WHERE type='index'").all();
indexes.forEach(i => console.log(`  ${i.name}  →  Tabelle: ${i.tbl_name}`));

console.log("\n=== ANZAHL EINTRÄGE pro Kategorie ===");
const counts = db.prepare("SELECT category, COUNT(*) as anzahl FROM images GROUP BY category ORDER BY anzahl DESC").all();
if (counts.length === 0) {
  console.log("  (Datenbank ist leer — noch keine Bilder hochgeladen)");
} else {
  counts.forEach(r => console.log(`  ${r.category.padEnd(15)} ${r.anzahl} Bilder`));
}

console.log("\n=== LETZTE 5 EINTRÄGE ===");
const last5 = db.prepare("SELECT id, name, category, file_type, uploaded_at FROM images ORDER BY id DESC LIMIT 5").all();
if (last5.length === 0) {
  console.log("  (noch keine Einträge)");
} else {
  last5.forEach(r => console.log(`  ID:${r.id} | ${r.category} | ${r.file_type} | ${r.name} | ${r.uploaded_at}`));
}

console.log("");
db.close();
