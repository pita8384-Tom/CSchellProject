// Browser-only admin gate.
// This is a UI lock, not real security. Sensitive actions need server-side protection.
const ADMIN_CONFIG = {
  // Change these credentials for local testing only.
  username: "admin",
  password: "a",

  // Session storage key
  sessionKey: "cschell_admin_session",

  // Categories for upload
  categories: {
    bodypainting: { name: "Bodypainting", folder: "bodypainting" },
    zeichnungen: { name: "Zeichnungen", folder: "zeichnungen" },
    events: { name: "Events", folder: "events" },
    malerei: { name: "Malerei", folder: "malerei" },
    bildhauerei: { name: "Bildhauerei", folder: "bildhauerei" },
    sandmalerei: { name: "Sandmalerei", folder: "sandmalerei" },
    presse: { name: "Presse", folder: "presse" },
    videos: { name: "Videos", folder: "videos" },
  },
};

// Check if user is logged in
function isAdminLoggedIn() {
  const session = sessionStorage.getItem(ADMIN_CONFIG.sessionKey);
  if (!session) return false;

  try {
    const data = JSON.parse(session);
    const now = new Date().getTime();
    // Session expires after 2 hours
    if (now - data.timestamp > 2 * 60 * 60 * 1000) {
      sessionStorage.removeItem(ADMIN_CONFIG.sessionKey);
      return false;
    }
    return data.loggedIn === true;
  } catch (e) {
    return false;
  }
}

// Login function
function adminLogin(username, password) {
  if (username === ADMIN_CONFIG.username && password === ADMIN_CONFIG.password) {
    const sessionData = {
      loggedIn: true,
      timestamp: new Date().getTime(),
      username: username,
    };
    sessionStorage.setItem(ADMIN_CONFIG.sessionKey, JSON.stringify(sessionData));
    return true;
  }
  return false;
}

// Logout function
function adminLogout() {
  sessionStorage.removeItem(ADMIN_CONFIG.sessionKey);
  window.location.href = "index.html";
}

// Protect admin pages
function protectAdminPage() {
  if (!isAdminLoggedIn()) {
    window.location.href = "login.html";
  }
}
