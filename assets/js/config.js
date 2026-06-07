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
const ADMIN_PASSWORD_HASH = "9f86d081884c7d6d9ffd60014fc7ee77e7c3d434b92cc6ff34c3fa1e8ff4e5a1"; // password: "test" (verified working)
