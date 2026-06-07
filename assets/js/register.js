/**
 * Event Registration Page
 *
 * Allows attendees to register for an event.
 * Generates a QR token, saves registration, sends confirmation email.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const eventId = params.get("eventId");

  // Redirect if no eventId
  if (!eventId) {
    window.location.href = "events.html";
    return;
  }

  // Load and display event details
  try {
    const eventResult = await API.getEvent(eventId);

    if (!eventResult.success) {
      document.getElementById("event-summary").innerHTML =
        '<div class="alert-error">Event not found.</div>';
      document.getElementById("register-form").style.display = "none";
      return;
    }

    const event = eventResult.event;
    const date = new Date(event.date);

    document.getElementById("event-summary").innerHTML = `
      <div class="card" style="background: #f9f9f9;">
        <h2 style="margin-top: 0;">${escapeHtml(event.name)}</h2>
        <p><strong>Date:</strong> ${escapeHtml(date.toLocaleString())}</p>
        <p><strong>Location:</strong> ${escapeHtml(event.location)}</p>
        <p><strong>Capacity:</strong> ${event.capacity} attendees</p>
      </div>
    `;
  } catch(err) {
    console.error("Error loading event:", err);
    document.getElementById("event-summary").innerHTML =
      '<div class="alert-error">Error loading event details.</div>';
    return;
  }

  // Handle form submission
  document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const messageDiv = document.getElementById("form-message");

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    // Validate
    if (!name || !email) {
      messageDiv.innerHTML = '<div class="alert-error">Please fill in all fields.</div>';
      return;
    }

    if (!isValidEmail(email)) {
      messageDiv.innerHTML = '<div class="alert-error">Please enter a valid email.</div>';
      return;
    }

    // Fixed unrestricted form submissions (missing UI lock)
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    messageDiv.innerHTML = '<p class="loading">Processing...</p>';

    try {
      // Check if already registered
      const existingResult = await API.getRegistration(email, eventId);
      if (existingResult.success) {
        messageDiv.innerHTML = `
          <div class="alert-warning">
            You are already registered for this event.
            <a href="my-ticket.html?email=${encodeURIComponent(email)}&eventId=${encodeURIComponent(eventId)}">
              View your ticket
            </a>
          </div>
        `;
        return;
      }

      // Register
      const registerResult = await API.registerAttendee(name, email, eventId);

      if (!registerResult.success) {
        if (registerResult.error === "event_full") {
          messageDiv.innerHTML = '<div class="alert-error">This event is full.</div>';
        } else if (registerResult.error === "already_registered") {
          messageDiv.innerHTML = '<div class="alert-error">You are already registered.</div>';
        } else {
          messageDiv.innerHTML = '<div class="alert-error">' + registerResult.error + '</div>';
        }
        return;
      }

      // Success: redirect to ticket page
      messageDiv.innerHTML = '<div class="alert-success">Registration successful! Redirecting...</div>';
      setTimeout(() => {
        window.location.href = `my-ticket.html?email=${encodeURIComponent(email)}&eventId=${encodeURIComponent(eventId)}`;
      }, 1500);
    } catch(err) {
      console.error("Registration error:", err);
      messageDiv.innerHTML = '<div class="alert-error">Error: ' + err.message + '</div>';
    } finally {
      // Re-enable submit button
      if (submitBtn) submitBtn.disabled = false;
    }
  });
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

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
