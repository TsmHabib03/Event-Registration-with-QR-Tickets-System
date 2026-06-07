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
const ADMIN_PASSWORD_HASH = "e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7";
