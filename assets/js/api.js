/**
 * API Module
 *
 * Central location for all network calls to the Google Apps Script backend.
 * No other file should call fetch() directly.
 */

const API = (() => {
  // Helper for GET requests (Phase 1 uses GET for all API calls)
  async function apiGet(params) {
    const url = GAS_URL + "?" + new URLSearchParams(params).toString();
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`API error: HTTP ${res.status}`);
    }
    return res.json();
  }

  // Helper for CSV export (returns text instead of JSON)
  async function apiGetCSV(params) {
    const url = GAS_URL + "?" + new URLSearchParams(params).toString();
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`API error: HTTP ${res.status}`);
    }
    return res.text();
  }

  return {
    // Read endpoints
    getEvents: async () => {
      const result = await apiGet({ action: "getEvents" });
      return result;
    },

    getAllEvents: async () => {
      const result = await apiGet({ action: "getAllEvents" });
      return result;
    },

    getEvent: async (eventId) => {
      const result = await apiGet({ action: "getEvent", eventId });
      return result;
    },

    validateQR: async (token) => {
      const result = await apiGet({ action: "validateQR", token });
      return result;
    },

    getRegistration: async (email, eventId) => {
      const result = await apiGet({
        action: "getRegistration",
        email,
        eventId
      });
      return result;
    },

    getDashboard: async () => {
      const result = await apiGet({ action: "getDashboard" });
      return result;
    },

    getReport: async (eventId) => {
      const result = await apiGet({ action: "getReport", eventId });
      return result;
    },

    exportCSV: async (eventId) => {
      const csv = await apiGetCSV({ action: "exportCSV", eventId });
      return csv;
    },

    // Write endpoints
    createEvent: async (name, date, location, capacity, status = "draft") => {
      const result = await apiGet({
        action: "createEvent",
        name,
        date,
        location,
        capacity,
        status
      });
      return result;
    },

    updateEvent: async (eventId, updates) => {
      const params = { action: "updateEvent", eventId, ...updates };
      const result = await apiGet(params);
      return result;
    },

    archiveEvent: async (eventId) => {
      const result = await apiGet({ action: "archiveEvent", eventId });
      return result;
    },

    registerAttendee: async (name, email, eventId) => {
      const result = await apiGet({
        action: "register",
        name,
        email,
        eventId
      });
      return result;
    },

    checkIn: async (token) => {
      const result = await apiGet({ action: "checkIn", token });
      return result;
    }
  };
})();
