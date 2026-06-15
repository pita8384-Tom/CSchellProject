// Contact form functionality

function initContactForm() {
  const kontaktForm = document.getElementById("kontakt-form");
  const kontaktStatus = document.getElementById("kontakt-status");
  const kontaktSubmit = document.getElementById("kontakt-submit");

  // Get references to input fields (assuming these IDs exist in your HTML)
  const nameInput = document.getElementById("kontakt-name");
  const emailInput = document.getElementById("kontakt-email");
  const messageInput = document.getElementById("kontakt-message");

  // Debugging: Prüfen, ob die Elemente gefunden werden
  console.log("Kontaktformular Elemente:", { kontaktForm, kontaktStatus, kontaktSubmit, nameInput, emailInput, messageInput });
  if (!kontaktForm || !nameInput || !emailInput || !messageInput) {
    console.error("FEHLER: Nicht alle Kontaktformular-Elemente wurden im HTML gefunden. Bitte IDs prüfen!");
  }

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Function to validate a single field and apply classes
  function validateField(inputElement) {
    if (!inputElement) return false;
    const value = inputElement.value.trim();

    // Wenn das Feld leer ist: Alle Klassen entfernen (Hintergrund bleibt schwarz)
    if (value === "") {
      inputElement.classList.remove("is-valid", "is-invalid");
      return false;
    }

    // Validierung: E-Mail via Regex, Name/Nachricht via Mindestlänge (z.B. 2 Zeichen)
    const isValid = inputElement.type === "email" 
      ? emailRegex.test(value) 
      : value.length >= 2;

    if (isValid) {
      inputElement.classList.add("is-valid");
      inputElement.classList.remove("is-invalid");
    } else {
      inputElement.classList.add("is-invalid");
      inputElement.classList.remove("is-valid");
    }
    return isValid;
  }

  // Add event listeners for real-time validation feedback
  if (nameInput) nameInput.addEventListener("input", () => validateField(nameInput));
  if (emailInput) emailInput.addEventListener("input", () => validateField(emailInput));
  if (messageInput) messageInput.addEventListener("input", () => validateField(messageInput));

  if (kontaktForm) {
    kontaktForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Validate all fields on submit
      const isNameValid = validateField(nameInput);
      const isEmailValid = validateField(emailInput);
      const isMessageValid = validateField(messageInput);

      if (!isNameValid || !isEmailValid || !isMessageValid) {
        if (kontaktStatus) kontaktStatus.textContent = "Bitte füllen Sie alle Felder korrekt aus.";
        // Ensure status message is visible and red
        if (kontaktStatus) kontaktStatus.style.color = "#dc2626"; // Tailwind red-600
        return; // Stop submission if any field is invalid
      }

      const formData = new FormData(kontaktForm);
      const data = Object.fromEntries(formData.entries());
      
      const apiBase = (window.APP_CONFIG && window.APP_CONFIG.API_URL) ? window.APP_CONFIG.API_URL : "";

      if (kontaktSubmit) {
        kontaktSubmit.disabled = true;
        kontaktSubmit.textContent = "Senden…";
      }
      if (kontaktStatus) kontaktStatus.textContent = ""; // Statusmeldung leeren
      if (kontaktStatus) kontaktStatus.style.color = ""; // Farbe zurücksetzen

      try {
        const response = await fetch(`${apiBase}/api/contact`, {
          method: "POST",
          body: JSON.stringify(data),
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json" 
          },
        });

        if (response.ok) {
          // Formular zurücksetzen, um alle Textfelder zu leeren
          kontaktForm.reset();

          // Clear validation classes after successful submission
          if (nameInput) nameInput.classList.remove("is-valid", "is-invalid");
          if (emailInput) emailInput.classList.remove("is-valid", "is-invalid");
          if (messageInput) messageInput.classList.remove("is-valid", "is-invalid");

          const result = await response.json();
          if (kontaktStatus) {
            kontaktStatus.innerHTML = result.message;
            if (result.previewUrl) {
              kontaktStatus.innerHTML += `<br><a href="${result.previewUrl}" target="_blank" style="color: #667eea; text-decoration: underline;">➔ Hier E-Mail-Vorschau öffnen (Test)</a>`;
            }
          }
        } else {
          // Fehler vom Server
          let msg = "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.";
          try {
            const errData = await response.json();
            if (errData.error) msg = errData.error;
          } catch (_) {
            // ignore JSON parse errors
          }
          if (kontaktStatus) kontaktStatus.textContent = msg;
          if (kontaktStatus) kontaktStatus.style.color = "#dc2626"; // Fehlermeldung rot
        }
      } catch (err) {
        // Netzwerkfehler
        console.error("Fetch Fehler im Kontaktformular:", err);
        if (kontaktStatus) kontaktStatus.textContent = "Netzwerkfehler. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.";
        if (kontaktStatus) kontaktStatus.style.color = "#dc2626"; // Fehlermeldung rot
      } finally {
        if (kontaktSubmit) {
          kontaktSubmit.disabled = false;
          kontaktSubmit.textContent = "Nachricht senden";
        }
      }
    });
  }
}
