// Language switching — no second HTML file needed
// Usage: setLanguage('en') or setLanguage('de')

const TRANSLATIONS = {
  de: {
    'nav.overview':       'Übersicht',
    'nav.contact':        'Kontakt',
    'nav.menu':           'Menü',
    'tile.intro':         'INTRO',
    'tile.malerei':       'MALEREI',
    'tile.zeichnungen':   'ZEICHNUNGEN',
    'tile.events':        'EVENTS',
    'tile.bildhauerei':   'BILDHAUEREI',
    'tile.sandmalerei':   'SANDMALEREI',
    'tile.bodypainting':  'BODYPAINTING',
    'tile.presse':        'PRESSE',
    'page.intro':         'Intro',
    'page.bodypainting':  'Bodypainting',
    'page.zeichnungen':   'Zeichnungen',
    'page.events':        'Events',
    'page.malerei':       'Malerei',
    'page.bildhauerei':   'Bildhauerei',
    'page.sandmalerei':   'Sandmalerei',
    'page.presse':        'Presse',
    'page.back':          'Zurück zur Übersicht',
    'kontakt.heading':    'Kontakt',
    'kontakt.subtitle':   'Schreiben Sie mir eine Nachricht',
    'kontakt.send':       'Nachricht senden',
    'kontakt.impressum':  'Impressum',
  },
  en: {
    'nav.overview':       'Overview',
    'nav.contact':        'Contact',
    'nav.menu':           'Menu',
    'tile.intro':         'INTRO',
    'tile.malerei':       'PAINTING',
    'tile.zeichnungen':   'DRAWINGS',
    'tile.events':        'EVENTS',
    'tile.bildhauerei':   'SCULPTURE',
    'tile.sandmalerei':   'SAND ART',
    'tile.bodypainting':  'BODYPAINTING',
    'tile.presse':        'PRESS',
    'page.intro':         'Intro',
    'page.bodypainting':  'Bodypainting',
    'page.zeichnungen':   'Drawings',
    'page.events':        'Events',
    'page.malerei':       'Painting',
    'page.bildhauerei':   'Sculpture',
    'page.sandmalerei':   'Sand Art',
    'page.presse':        'Press',
    'page.back':          'Back to Overview',
    'kontakt.heading':    'Contact',
    'kontakt.subtitle':   'Send me a message',
    'kontakt.send':       'Send Message',
    'kontakt.impressum':  'Imprint',
  }
};

function setLanguage(lang) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.de;

  // Apply text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.textContent = t[key];
  });

  // Apply placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key] !== undefined) el.placeholder = t[key];
  });

  // Update active button state
  document.querySelectorAll('[id^="lang-"]').forEach(btn => {
    const btnLang = btn.id.replace('lang-', '').replace(/-desktop|-mobile/, '');
    btn.classList.toggle('active', btnLang === lang);
  });

  // Update html lang attribute
  document.documentElement.lang = lang;

  // Save preference
  localStorage.setItem('lang', lang);
}

// Auto-apply saved language on load — called by component-loader after all components are injected
function initLanguage() {
  const saved = localStorage.getItem('lang') || 'de';
  if (saved !== 'de') setLanguage(saved);
}
