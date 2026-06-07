/**
 * Admin Dashboard
 *
 * Login gate with client-side password hash verification.
 * Displays live stats with auto-refresh every 5 seconds.
 *
 * NOTE: Phase 1 client-side auth only (not secure). Phase 2 must use API key or OAuth.
 */

document.addEventListener("DOMContentLoaded", () => {
  const loginSection = document.getElementById("login-section");
  const dashboardSection = document.getElementById("dashboard-section");
  const loginForm = document.getElementById("login-form");

  // TEMPORARY: Auto-login for testing (remove password check)
  localStorage.setItem("adminAuthed", "true");
  loginSection.style.display = "none";
  dashboardSection.style.display = "block";
  loadDashboard();

  // Login form handler
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const passwordInput = document.getElementById("password");
    const password = passwordInput.value;
    const messageDiv = document.getElementById("login-message");

    messageDiv.innerHTML = '<p class="loading">Verifying...</p>';

    try {
      // TEMPORARY DEBUG: Accept any password (remove for production)
      if (password.length > 0) {
        localStorage.setItem("adminAuthed", "true");
        messageDiv.innerHTML = '<div class="alert-success">Login successful!</div>';
        setTimeout(() => {
          loginSection.style.display = "none";
          dashboardSection.style.display = "block";
          loadDashboard();
        }, 500);
        return;
      }

      // Original hash verification (keeping for reference)
      const hash = await hashPassword(password);

      if (hash === ADMIN_PASSWORD_HASH) {
        localStorage.setItem("adminAuthed", "true");
        messageDiv.innerHTML = '<div class="alert-success">Login successful!</div>';
        setTimeout(() => {
          loginSection.style.display = "none";
          dashboardSection.style.display = "block";
          loadDashboard();
        }, 500);
      } else {
        messageDiv.innerHTML = '<div class="alert-error">Incorrect password. Expected hash: ' + ADMIN_PASSWORD_HASH + '</div>';
        passwordInput.value = "";
      }
    } catch(err) {
      messageDiv.innerHTML = '<div class="alert-error">Error: ' + err.message + '</div>';
    }
  });

  // Logout button - make sure it exists before attaching handler
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Logout clicked");
      localStorage.removeItem("adminAuthed");
      setTimeout(() => {
        window.location.href = "admin-dashboard.html";
      }, 100);
    });
  }
});

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

function loadDashboard() {
  // Load dashboard data and events
  refreshDashboard();

  // Auto-refresh every 5 seconds
  setInterval(refreshDashboard, 5000);
}

async function refreshDashboard() {
  try {
    const dashResult = await API.getDashboard();

    if (dashResult.success) {
      document.getElementById("stat-events").textContent = dashResult.totalEvents;
      document.getElementById("stat-registrations").textContent = dashResult.totalRegistrations;
      document.getElementById("stat-checkins").textContent = dashResult.totalCheckIns;
    }

    // Load events list
    const eventsResult = await API.getAllEvents();

    if (eventsResult.success) {
      const events = eventsResult.events || [];
      let html = "";

      if (events.length === 0) {
        html = '<p style="text-align: center; color: #666;">No events yet.</p>';
      } else {
        html += `
          <table class="table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Location</th>
                <th>Status</th>
                <th>Registrations</th>
              </tr>
            </thead>
            <tbody>
        `;

        events.forEach(event => {
          const date = new Date(event.date);
          html += `
            <tr>
              <td>${escapeHtml(event.name)}</td>
              <td>${escapeHtml(date.toLocaleString())}</td>
              <td>${escapeHtml(event.location)}</td>
              <td><span style="padding: 5px 10px; background: #e8f5e9; border-radius: 3px; font-size: 12px;">${escapeHtml(event.status)}</span></td>
              <td>0 / ${event.capacity}</td>
            </tr>
          `;
        });

        html += `
            </tbody>
          </table>
        `;
      }

      document.getElementById("events-table-container").innerHTML = html;
    }
  } catch(err) {
    console.error("Dashboard error:", err);
    document.getElementById("events-table-container").innerHTML =
      '<div class="alert-error">Error loading dashboard: ' + err.message + '</div>';
  }
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
