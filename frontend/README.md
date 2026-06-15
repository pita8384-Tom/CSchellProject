# Caroline Schell � Portfolio Website

K�nstler-Portfolio mit Galerien: Bodypainting, Malerei, Zeichnungen, Bildhauerei, Sandmalerei, Events, Presse.

---

## Projekt-Struktur

```
index.html              # Haupt-HTML (27 Zeilen, alles via Components geladen)
admin-config.js         # Admin-Konfiguration
login.html              # Admin-Login
Upload.html             # Bild-Upload Seite
favicon.svg

css/
  tailwind.css          # Kompiliertes Tailwind CSS (nicht manuell bearbeiten)
  main.css              # Haupt-Styles (importiert base, navigation, portfolio, modals)
  navigation.css        # Navbar Styles
  gallery.css           # Galerie Styles + Lightbox
  bodypainting.css      # Bodypainting-Seite (reines CSS, kein Tailwind)
  base.css              # Basis-Styles
  portfolio.css         # Portfolio-Styles
  modals.css            # Modal-Styles

js/
  component-loader.js   # L�dt alle HTML-Komponenten + Scripts dynamisch
  gallery-slider.js     # Lightbox f�r Galerie-Bilder
  gallery.js            # Galerie-Logik
  gallery-loader.js     # Bilder vom Backend laden
  navigation.js         # Navbar-Logik
  intro.js              # Intro-Seite
  subgallery.js         # Unter-Galerien
  language.js           # DE/EN Sprachumschaltung
  contact-form.js       # Kontaktformular
  scroll.js             # Scroll-Animationen
  init.js               # Initialisierung
  config.js             # Konfiguration

components/             # HTML-Komponenten (werden dynamisch geladen)
  navbar.html
  page-bodypainting.html
  page-zeichnungen.html
  page-malerei.html
  page-bildhauerei.html
  page-sandmalerei.html
  page-events.html
  page-presse.html
  page-intro.html
  ...

src/
  input.css             # Tailwind-Eingabedatei

backend/
  server.js             # Express-Server (Port 3000)
  gallery-data.json     # Bild-Metadaten (auto-generiert)
  start-server.bat      # Windows Starter-Script
  img/                  # Hochgeladene Bilder (vom Server)

img/                    # Statische Bilder (im Repo)
```

---

## Entwicklung starten

**Backend-Server:**
```powershell
npm run dev
```
? Server l�uft auf http://localhost:3000

**Tailwind CSS (Watch-Modus):**
```powershell
npm run watch
```
? Beobachtet alle HTML/JS Dateien, baut `css/tailwind.css` automatisch neu

**Tailwind einmalig bauen:**
```powershell
npm run build
```

---

## Netlify Frontend + separates Backend (2-Laptop Test)

Ziel:
- Laptop A: Backend + Datenbank laufen lassen
- Laptop B: Frontend auf Netlify deployen

### 1) Backend auf Laptop A oeffentlich erreichbar machen

- Starte Backend auf Laptop A.
- Gib dem Backend eine oeffentliche URL (z. B. Tunnel oder eigene Domain).
- Setze in Backend `.env`:

```env
PUBLIC_API_URL=https://dein-backend.example.com
FRONTEND_ORIGINS=https://dein-netlify-site.netlify.app
```

### 2) Frontend fuer Netlify konfigurieren

- In [js/runtime-config.js](js/runtime-config.js) die Backend-URL setzen:

```js
window.__APP_API_URL__ = "https://dein-backend.example.com";
```

- Danach Frontend wie gewohnt zu Netlify deployen. Das ist der einzige vorgesehene Laufzeit-Schalter fuer die API-URL.

### 3) Testen

- Oeffne Netlify-URL im Browser.
- Pruefe Galerie laden, Upload, Loeschen.
- Wenn CORS-Fehler kommen: `FRONTEND_ORIGINS` auf Backend erweitern (mehrere mit Komma trennen).

---

## Backend API

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/upload` | POST | Bild/Video hochladen |
| `/api/gallery/:category` | GET | Bilder einer Kategorie |
| `/api/gallery-data` | GET | Alle Galerie-Daten |
| `/api/upload/:category/:filename` | DELETE | Bild l�schen |

Hochgeladene Dateien werden gespeichert in: `img/{category}/{timestamp}-{dateiname}`

## Admin-Hinweis

Die Login- und Upload-Seiten sind aktuell nur clientseitig abgesichert. Das ist praktisch fuer einfache Tests, aber keine echte Sicherheitsgrenze. Wenn du den Admin-Zugang wirklich schuetzen willst, braucht es eine serverseitige Authentifizierung.

---

## Technologien

- **Frontend:** Vanilla JS, Tailwind CSS (kompiliert), eigene CSS-Klassen
- **Backend:** Node.js, Express.js
- **CSS-Strategie:** Tailwind f�r Layout-Klassen, `bp-*` / eigene Klassen f�r komplexe Komponenten
- **Sprachen:** Deutsch / Englisch (via `js/language.js`)