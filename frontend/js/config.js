// Frontend Configuration Module
// Priority order:
// 1) window.__APP_API_URL__ (runtime override)
// 2) localStorage APP_API_URL (manual test override)
// 3) same-origin relative API (best for local static serving)
// 4) localhost fallback for local development

window.APP_CONFIG = {
  API_URL:
    window.__APP_API_URL__ ||
    localStorage.getItem("APP_API_URL") ||
    "",
  
  _initialized: null,

  async load() {
    if (this._initialized) return this._initialized;
    
    const fallbackLocal = "http://localhost:3000";
    const isLocalFrontend = ["localhost", "127.0.0.1"].includes(window.location.hostname);

    this._initialized = (async () => {
      try {
      const configEndpoint = this.API_URL ? `${this.API_URL}/api/config` : "/api/config";
      console.log("Loading config from:", configEndpoint);

      const response = await fetch(configEndpoint, { mode: "cors" });
      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("/api/config did not return JSON");
        }

        const config = await response.json();
        const resolved = (config.API_URL || this.API_URL || "").trim();
        this.API_URL = resolved;
        console.log("Config loaded. API_URL:", this.API_URL || "<same-origin>");
        return;
      }
    } catch (error) {
      console.warn("Config endpoint unavailable, using fallback strategy:", error.message);
    }

    if (!this.API_URL && isLocalFrontend) {
      this.API_URL = fallbackLocal;
      console.log("Using localhost fallback API:", this.API_URL);
    }

    if (!this.API_URL && !isLocalFrontend) {
      console.warn(
        "No API URL configured. Set window.__APP_API_URL__ in js/runtime-config.js for Netlify deployments, or use localStorage APP_API_URL for temporary testing.",
      );
    }
    })();

    return this._initialized;
  },

  getEndpoint(path) {
    const url = this.API_URL ? `${this.API_URL}${path}` : path;
    console.log("API call:", url);
    return url;
  },
};

window.resolveMediaUrl = function resolveMediaUrl(path) {
  if (!path || typeof path !== "string") return path;
  if (/^https?:\/\//i.test(path)) return path;

  if (path.includes("/backend/img/")) {
    path = path.replace(/\/backend\/img\//g, "/img/");
  } else if (path.startsWith("backend/img/")) {
    path = "/" + path;
  }

  if (path.startsWith("/img/")) {
    const base = (window.APP_CONFIG && window.APP_CONFIG.API_URL) || "";
    return base ? `${base}${path}` : path;
  }

  if (path.startsWith("img/")) {
    const base = (window.APP_CONFIG && window.APP_CONFIG.API_URL) || "";
    return base ? `${base}/${path}` : path;
  }

  return path;
};

// Load config ASAP
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.APP_CONFIG.load();
  });
} else {
  // DOM already ready
  window.APP_CONFIG.load();
}

console.log("Config.js loaded - initial API_URL:", window.APP_CONFIG.API_URL || "<same-origin>");
