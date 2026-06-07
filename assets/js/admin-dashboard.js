/**
 * Admin Dashboard
 *
 * Login gate with client-side password hash verification.
 * Displays live stats with auto-refresh every 5 seconds.
 *
 * NOTE: Phase 1 client-side auth only (not secure). Phase 2 must use API key or OAuth.
 */

// Logout function (called directly from HTML onclick)
function doLogout() {
  localStorage.removeItem("adminAuthed");
  location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
  const loginSection = document.getElementById("login-section");
  const dashboardSection = document.getElementById("dashboard-section");
  const loginForm = document.getElementById("login-form");

  // Check if already authenticated
  if (localStorage.getItem("adminAuthed") === "true") {
    loginSection.style.display = "none";
    dashboardSection.style.display = "block";
    loadDashboard();
  } else {
    loginSection.style.display = "block";
    dashboardSection.style.display = "none";
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const passwordInput = document.getElementById("password");
    const password = passwordInput.value;
    const messageDiv = document.getElementById("login-message");
    const btn = loginForm.querySelector("button[type=submit]");

    if (!password) {
      messageDiv.innerHTML = '<div class="alert-error">Please enter a password.</div>';
      return;
    }

    btn.disabled = true;
    btn.textContent = "Logging in...";
    messageDiv.innerHTML = "";

    hashPassword(password).then(hash => {
      if (hash === ADMIN_PASSWORD_HASH) {
        localStorage.setItem("adminAuthed", "true");
        messageDiv.innerHTML = '<div class="alert-success">Login successful!</div>';
        setTimeout(() => {
          loginSection.style.display = "none";
          dashboardSection.style.display = "block";
          loadDashboard();
        }, 500);
      } else {
        btn.disabled = false;
        btn.textContent = "Login";
        messageDiv.innerHTML = '<div class="alert-error">Incorrect password.</div>';
      }
    });
  });

  // Logout is now handled via onclick in HTML
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
          <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Location</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Checked In</th>
              </tr>
            </thead>
            <tbody>
        `;

        events.forEach(event => {
          const date = new Date(event.date);
          const statusClass = event.status === "published" ? "badge-success"
                            : event.status === "draft"     ? "badge-warning"
                            :                                "badge-secondary";
          html += `
            <tr>
              <td>${escapeHtml(event.name)}</td>
              <td>${escapeHtml(date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }))}</td>
              <td>${escapeHtml(event.location)}</td>
              <td><span class="badge ${statusClass}">${escapeHtml(event.status)}</span></td>
              <td>${event.registrationCount || 0} / ${event.capacity}</td>
              <td>${event.checkinCount || 0}</td>
            </tr>
          `;
        });

        html += `
            </tbody>
          </table>
          </div>
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
