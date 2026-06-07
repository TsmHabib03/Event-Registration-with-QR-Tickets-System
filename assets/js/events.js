/**
 * Events Listing Page
 *
 * Loads published events from the API and displays them as cards.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("events-container");

  // Show loading state
  container.innerHTML = '<p class="loading">Loading events...</p>';

  try {
    const result = await API.getEvents();

    if (!result.success) {
      container.innerHTML = '<div class="alert-error">Failed to load events: ' + result.error + '</div>';
      return;
    }

    const events = result.events || [];

    if (events.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #666;">No events available at this time.</p>';
      return;
    }

    let html = "";
    events.forEach(event => {
      const date = new Date(event.date);
      const dateStr = date.toLocaleString();

      html += `
        <div class="card" style="margin-bottom: 20px;">
          <h3 style="margin-top: 0;">${escapeHtml(event.name)}</h3>
          <p><strong>Date:</strong> ${escapeHtml(dateStr)}</p>
          <p><strong>Location:</strong> ${escapeHtml(event.location)}</p>
          <p><strong>Capacity:</strong> ${event.capacity} attendees</p>
          <a href="register.html?eventId=${encodeURIComponent(event.eventId)}" class="btn">Register</a>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch(err) {
    console.error("Error loading events:", err);
    container.innerHTML = '<div class="alert-error">Error: ' + err.message + '</div>';
  }
});

// Fixed DOM-based XSS via flawed escapeHtml function
function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
