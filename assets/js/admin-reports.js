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

  const totalCheckedIn = rows.filter(r => r.checkedIn).length;

  let html = `
    <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px;">
      <div class="card" style="flex: 1; min-width: 120px; text-align: center; padding: 12px;">
        <div style="font-size: 28px; font-weight: bold; color: var(--color-primary);">${rows.length}</div>
        <div style="font-size: 12px; color: #666;">Registered</div>
      </div>
      <div class="card" style="flex: 1; min-width: 120px; text-align: center; padding: 12px;">
        <div style="font-size: 28px; font-weight: bold; color: var(--color-success);">${totalCheckedIn}</div>
        <div style="font-size: 12px; color: #666;">Checked In</div>
      </div>
      <div class="card" style="flex: 1; min-width: 120px; text-align: center; padding: 12px;">
        <div style="font-size: 28px; font-weight: bold; color: #888;">${rows.length - totalCheckedIn}</div>
        <div style="font-size: 12px; color: #666;">Absent</div>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Email</th>
            <th>Registered</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  rows.forEach((row, i) => {
    const regDate = new Date(row.registeredAt);
    const shortDate = regDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const statusBadge = row.checkedIn
      ? `<span style="background:#d4edda;color:#155724;padding:3px 8px;border-radius:3px;font-size:12px;">✓ Checked In</span>`
      : `<span style="background:#f8d7da;color:#721c24;padding:3px 8px;border-radius:3px;font-size:12px;">Not Yet</span>`;

    html += `
      <tr>
        <td style="color:#888;">${i + 1}</td>
        <td><strong>${escapeHtml(row.name)}</strong></td>
        <td style="font-size:13px;">${escapeHtml(row.email)}</td>
        <td style="font-size:13px;">${escapeHtml(shortDate)}</td>
        <td>${statusBadge}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
