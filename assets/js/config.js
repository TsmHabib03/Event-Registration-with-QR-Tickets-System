/**
 * Global Configuration
 *
 * This file contains constants needed by all frontend files.
 * Update the GAS_URL after deploying Code.gs.
 */

// Replace with your Google Apps Script web app deployment URL (ends in /exec)
const GAS_URL = "https://script.google.com/macros/s/AKfycbxUvD_Hvn95PvQVVINCDd2lJQGUlxeLhCTEcWYUsXBbMNY9o1XR6zNexVe0c9Zm4qOttw/exec";

// Admin password hash (SHA-256 of the admin password)
// To generate:
// crypto.subtle.digest("SHA-256", new TextEncoder().encode("yourPassword"))
//   .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")))
//
// Example: password "admin123" → hash below
// NOTE: Phase 1 client-side auth only. Phase 2 must use API key or OAuth.
const ADMIN_PASSWORD_HASH = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";

// Custom Modal Utilities
window.customAlert = function(message, title = "Notice") {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "custom-modal-overlay";
    overlay.innerHTML = `
      <div class="custom-modal">
        <div class="custom-modal-title">${escapeHtmlModal(title)}</div>
        <div class="custom-modal-message">${escapeHtmlModal(message)}</div>
        <div class="custom-modal-actions">
          <button class="btn" id="modal-ok-btn">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    setTimeout(() => overlay.classList.add("active"), 10);
    
    const close = () => {
      overlay.classList.remove("active");
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve();
      }, 400);
    };
    
    overlay.querySelector("#modal-ok-btn").addEventListener("click", close);
  });
};

window.customConfirm = function(message, title = "Confirm Action") {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "custom-modal-overlay";
    overlay.innerHTML = `
      <div class="custom-modal">
        <div class="custom-modal-title">${escapeHtmlModal(title)}</div>
        <div class="custom-modal-message">${escapeHtmlModal(message)}</div>
        <div class="custom-modal-actions">
          <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
          <button class="btn" id="modal-confirm-btn">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    setTimeout(() => overlay.classList.add("active"), 10);
    
    const close = (result) => {
      overlay.classList.remove("active");
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(result);
      }, 400);
    };
    
    overlay.querySelector("#modal-cancel-btn").addEventListener("click", () => close(false));
    overlay.querySelector("#modal-confirm-btn").addEventListener("click", () => close(true));
  });
};

function escapeHtmlModal(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
