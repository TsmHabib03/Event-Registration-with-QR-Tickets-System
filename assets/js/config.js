/**
 * Global Configuration
 *
 * This file contains constants needed by all frontend files.
 * Update the GAS_URL after deploying Code.gs.
 */

// Replace with your Google Apps Script web app deployment URL (ends in /exec)
const GAS_URL = "https://script.google.com/macros/s/AKfycbxOFXmk6dSbQw9kOZ0M2yJ-6Kf7b9sjKYO23VhQ9g6smDBbxg5LjTCZ0oFGzRxqdkAt2A/exec";

// Admin password hash (SHA-256 of the admin password)
// To generate:
// crypto.subtle.digest("SHA-256", new TextEncoder().encode("yourPassword"))
//   .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")))
//
// Example: password "admin123" → hash below
// NOTE: Phase 1 client-side auth only. Phase 2 must use API key or OAuth.
const ADMIN_PASSWORD_HASH = "0ba904eae8773b70c75333db4de2f3ac45038ad6ddcb3d4ae3f806ba287d0eb9"; // password: "admin123"
