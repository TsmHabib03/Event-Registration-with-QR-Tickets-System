/**
 * Admin Events Management
 *
 * Create, edit, and archive events.
 * Requires admin authentication.
 */

// Auth gate
if (localStorage.getItem("adminAuthed") !== "true") {
  window.location.href = "admin-dashboard.html";
}

let editingEventId = null;

document.addEventListener("DOMContentLoaded", async () => {
  const eventForm = document.getElementById("event-form");
  const submitBtn = document.getElementById("form-submit-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");

  // Load events list
  loadEventsList();

  // Form submission
  eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const date = document.getElementById("date").value;
    const location = document.getElementById("location").value.trim();
    const capacity = parseInt(document.getElementById("capacity").value);
    const status = document.getElementById("status").value;
    const messageDiv = document.getElementById("form-message");

    if (!name || !date || !location || !capacity || capacity <= 0) {
      messageDiv.innerHTML = '<div class="alert-error">Please fill in all fields with valid data.</div>';
      return;
    }

    messageDiv.innerHTML = '<p class="loading">Saving...</p>';

    try {
      let result;

      if (editingEventId) {
        // Update existing event
        result = await API.updateEvent(editingEventId, {
          name,
          date,
          location,
          capacity,
          status
        });
      } else {
        // Create new event
        result = await API.createEvent(name, date, location, capacity, status);
      }

      if (result.success) {
        messageDiv.innerHTML = '<div class="alert-success">' + (editingEventId ? "Event updated" : "Event created") + ' successfully!</div>';
        eventForm.reset();
        editingEventId = null;
        submitBtn.textContent = "Create Event";
        cancelEditBtn.style.display = "none";
        document.getElementById("editing-event-id").value = "";

        setTimeout(() => {
          loadEventsList();
        }, 500);
      } else {
        messageDiv.innerHTML = '<div class="alert-error">' + result.error + '</div>';
      }
    } catch(err) {
      console.error("Form error:", err);
      messageDiv.innerHTML = '<div class="alert-error">Error: ' + err.message + '</div>';
    }
  });

  cancelEditBtn.addEventListener("click", () => {
    eventForm.reset();
    editingEventId = null;
    submitBtn.textContent = "Create Event";
    cancelEditBtn.style.display = "none";
    document.getElementById("form-message").innerHTML = "";
  });
});

async function loadEventsList() {
  const container = document.getElementById("events-list");

  try {
    const result = await API.getAllEvents();

    if (!result.success) {
      container.innerHTML = '<div class="alert-error">' + result.error + '</div>';
      return;
    }

    const events = result.events || [];

    if (events.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #666;">No events yet.</p>';
      return;
    }

    let html = `
      <table class="table">
        <thead>
          <tr>
            <th>Event Name</th>
            <th>Date</th>
            <th>Location</th>
            <th>Capacity</th>
            <th>Status</th>
            <th>Actions</th>
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
          <td>${event.capacity}</td>
          <td><span style="padding: 5px 10px; background: #e8f5e9; border-radius: 3px; font-size: 12px;">${escapeHtml(event.status)}</span></td>
          <td>
            <button class="btn" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;" onclick="editEvent('${event.eventId}', '${escapeHtml(event.name).replace(/'/g, "\\'")}', '${event.date}', '${escapeHtml(event.location).replace(/'/g, "\\'")}', ${event.capacity}, '${event.status}')">Edit</button>
            <button class="btn" style="padding: 5px 10px; font-size: 12px; background: #ff6b6b;" onclick="archiveEvent('${event.eventId}', '${escapeHtml(event.name).replace(/'/g, "\\'")}')">Archive</button>
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    container.innerHTML = html;
  } catch(err) {
    console.error("Load events error:", err);
    container.innerHTML = '<div class="alert-error">Error: ' + err.message + '</div>';
  }
}

function editEvent(eventId, name, date, location, capacity, status) {
  document.getElementById("name").value = name;
  document.getElementById("date").value = date;
  document.getElementById("location").value = location;
  document.getElementById("capacity").value = capacity;
  document.getElementById("status").value = status;

  editingEventId = eventId;
  document.getElementById("editing-event-id").value = eventId;
  document.getElementById("form-submit-btn").textContent = "Update Event";
  document.getElementById("cancel-edit-btn").style.display = "inline-block";
  document.getElementById("form-message").innerHTML = "";

  // Scroll to form
  document.getElementById("event-form").scrollIntoView({ behavior: "smooth" });
}

async function archiveEvent(eventId, eventName) {
  if (!confirm("Are you sure you want to archive '" + eventName + "'?")) {
    return;
  }

  try {
    const result = await API.archiveEvent(eventId);

    if (result.success) {
      alert("Event archived successfully.");
      loadEventsList();
    } else {
      alert("Error: " + result.error);
    }
  } catch(err) {
    alert("Error: " + err.message);
  }
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
