/**
 * Admin Reports
 *
 * View attendance reports and export to CSV.
 * Requires admin authentication.
 */

// Auth gate
if (localStorage.getItem("adminAuthed") !== "true") {
  window.location.href = "admin-dashboard.html";
}

document.addEventListener("DOMContentLoaded", async () => {
  const eventSelect = document.getElementById("event-select");
  const exportCsvBtn = document.getElementById("export-csv-btn");

  // Load events into dropdown
  try {
    const result = await API.getAllEvents();

    if (result.success) {
      const events = result.events || [];

      if (events.length === 0) {
        eventSelect.innerHTML = '<option value="">No events available</option>';
        exportCsvBtn.disabled = true;
        return;
      }

      let html = '<option value="">Select an event...</option>';
      events.forEach(event => {
        html += `<option value="${event.eventId}">${escapeHtml(event.name)}</option>`;
      });

      eventSelect.innerHTML = html;
    }
  } catch(err) {
    console.error("Error loading events:", err);
    eventSelect.innerHTML = '<option value="">Error loading events</option>';
  }

  // Handle event selection
  eventSelect.addEventListener("change", async () => {
    const eventId = eventSelect.value;

    if (!eventId) {
      document.getElementById("report-container").innerHTML = "";
      exportCsvBtn.disabled = true;
      return;
    }

    exportCsvBtn.disabled = false;

    try {
      const result = await API.getReport(eventId);

      if (result.success) {
        displayReport(result.report || []);
      } else {
        document.getElementById("report-container").innerHTML =
          '<div class="alert-error">' + result.error + '</div>';
      }
    } catch(err) {
      console.error("Error loading report:", err);
      document.getElementById("report-container").innerHTML =
        '<div class="alert-error">Error: ' + err.message + '</div>';
    }
  });

  // Handle CSV export
  exportCsvBtn.addEventListener("click", async () => {
    const eventId = eventSelect.value;

    if (!eventId) {
      alert("Please select an event.");
      return;
    }

    try {
      exportCsvBtn.disabled = true;
      exportCsvBtn.textContent = "Exporting...";

      const csv = await API.exportCSV(eventId);

      // Create blob and trigger download
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "attendance-report.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      exportCsvBtn.textContent = "Export CSV";
      exportCsvBtn.disabled = false;
    } catch(err) {
      console.error("Export error:", err);
      alert("Error: " + err.message);
      exportCsvBtn.textContent = "Export CSV";
      exportCsvBtn.disabled = false;
    }
  });
});

function displayReport(rows) {
  const container = document.getElementById("report-container");

  if (rows.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666;">No registrations for this event.</p>';
    return;
  }

  let html = `
    <table class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Registered At</th>
          <th>Checked In</th>
          <th>Checked In At</th>
        </tr>
      </thead>
      <tbody>
  `;

  rows.forEach(row => {
    const checkedIn = row.checkedIn ? "Yes" : "No";
    const checkedInAt = row.checkedInAt ? new Date(row.checkedInAt).toLocaleString() : "—";
    const registeredAt = new Date(row.registeredAt).toLocaleString();

    html += `
      <tr>
        <td>${escapeHtml(row.name)}</td>
        <td>${escapeHtml(row.email)}</td>
        <td>${escapeHtml(registeredAt)}</td>
        <td>${checkedIn}</td>
        <td>${escapeHtml(checkedInAt)}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
