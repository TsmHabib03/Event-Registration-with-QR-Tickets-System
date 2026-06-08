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
          <button class="btn" onclick="openRegisterModal('${event.eventId}', '${escapeHtml(event.name).replace(/'/g, "\\'")}', '${escapeHtml(dateStr).replace(/'/g, "\\'")}', '${escapeHtml(event.location).replace(/'/g, "\\'")}')">Register</button>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch(err) {
    console.error("Error loading events:", err);
    container.innerHTML = '<div class="alert-error">Error: ' + err.message + '</div>';
  }

  // Handle modal close
  const registerModal = document.getElementById("register-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      registerModal.classList.remove("active");
    });
  }
  
  if (registerModal) {
    registerModal.addEventListener("click", (e) => {
      if (e.target === registerModal) {
        registerModal.classList.remove("active");
      }
    });
  }

  // Handle registration form submission
  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById("name");
      const emailInput = document.getElementById("email");
      const eventIdInput = document.getElementById("modal-event-id");
      const messageDiv = document.getElementById("form-message");

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const eventId = eventIdInput.value;

      if (!name || !email) {
        messageDiv.innerHTML = '<div class="alert-error">Please fill in all fields.</div>';
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        messageDiv.innerHTML = '<div class="alert-error">Please enter a valid email.</div>';
        return;
      }

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
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
});

// Open Registration Modal
window.openRegisterModal = function(eventId, name, date, location) {
  document.getElementById("modal-event-id").value = eventId;
  
  document.getElementById("modal-event-summary").innerHTML = `
    <div style="margin-bottom: 20px; padding: 15px; background: var(--surface-0); border-radius: 4px; border: 1px solid var(--border);">
      <h3 style="margin-top: 0; margin-bottom: 10px;">${name}</h3>
      <p style="margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${date}</p>
      <p style="margin: 5px 0; font-size: 14px;"><strong>Location:</strong> ${location}</p>
    </div>
  `;
  
  document.getElementById("form-message").innerHTML = "";
  document.getElementById("register-form").reset();
  
  document.getElementById("register-modal").classList.add("active");
};

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
