/**
 * Event Registration with QR Tickets — Google Apps Script Backend
 *
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Create a Google Sheets spreadsheet
 * 2. Create two sheets: "Events" and "Registrations" with headers in row 1
 * 3. In the spreadsheet, open Extensions > Apps Script
 * 4. Replace default code with this entire file
 * 5. Update SPREADSHEET_ID and ADMIN_EMAIL constants below
 * 6. Deploy > New Deployment > Web app
 *    - Execute as: Me (your Google account)
 *    - Who has access: Anyone (even anonymous)
 * 7. Copy the deployment URL (ends in /exec) to frontend/assets/js/config.js as GAS_URL
 * 8. Every future edit requires: Deploy > Manage Deployments > Edit > New version
 *
 * API DESIGN NOTE (Phase 1):
 * All API calls use GET requests with query params to avoid CORS issues.
 * In Phase 2, migrate mutations (create, update, delete, check-in) to proper POST with CORS headers.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
const ADMIN_EMAIL = "YOUR_ADMIN_EMAIL_HERE";

// Events sheet column indices (0-based for array access, 1-based for getRange)
const EVT_ID = 0, EVT_NAME = 1, EVT_DATE = 2, EVT_LOC = 3, EVT_CAP = 4, EVT_STATUS = 5;

// Registrations sheet column indices
const REG_ID = 0, REG_EVT_ID = 1, REG_NAME = 2, REG_EMAIL = 3,
      REG_TOKEN = 4, REG_CHECKED = 5, REG_REG_AT = 6, REG_CHECKED_AT = 7;

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

function doGet(e) {
  const action = e.parameter.action;
  let result;

  try {
    switch(action) {
      case "getEvents":
        result = getEvents();
        break;
      case "getAllEvents":
        result = getAllEvents();
        break;
      case "getEvent":
        result = getEvent(e.parameter.eventId);
        break;
      case "validateQR":
        result = validateQR(e.parameter.token);
        break;
      case "getRegistration":
        result = getRegistration(e.parameter.email, e.parameter.eventId);
        break;
      case "getDashboard":
        result = getDashboard();
        break;
      case "getReport":
        result = getReport(e.parameter.eventId);
        break;
      case "exportCSV":
        return exportCSV(e.parameter.eventId);
      case "createEvent":
        result = createEvent(e.parameter);
        break;
      case "updateEvent":
        result = updateEvent(e.parameter);
        break;
      case "archiveEvent":
        result = archiveEvent(e.parameter.eventId);
        break;
      case "register":
        result = registerAttendee(e.parameter);
        break;
      case "checkIn":
        result = checkIn(e.parameter.token);
        break;
      default:
        result = { success: false, error: "Unknown action: " + action };
    }
  } catch(err) {
    result = { success: false, error: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getSheet(sheetName) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
}

function findEventById(eventId) {
  const sheet = getSheet("Events");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][EVT_ID] === eventId) {
      return { row: i + 1, data: data[i] };
    }
  }
  return null;
}

function findRegistrationByToken(token) {
  const sheet = getSheet("Registrations");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][REG_TOKEN] === token) {
      return { row: i + 1, data: data[i] };
    }
  }
  return null;
}

function findRegistrationByEmailAndEvent(email, eventId) {
  const sheet = getSheet("Registrations");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][REG_EMAIL] === email && data[i][REG_EVT_ID] === eventId) {
      return { row: i + 1, data: data[i] };
    }
  }
  return null;
}

function countRegistrationsForEvent(eventId) {
  const sheet = getSheet("Registrations");
  const data = sheet.getDataRange().getValues();
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][REG_EVT_ID] === eventId) {
      count++;
    }
  }
  return count;
}

function eventToObject(row) {
  return {
    eventId: row[EVT_ID],
    name: row[EVT_NAME],
    date: row[EVT_DATE],
    location: row[EVT_LOC],
    capacity: row[EVT_CAP],
    status: row[EVT_STATUS]
  };
}

function registrationToObject(row) {
  return {
    registrationId: row[REG_ID],
    eventId: row[REG_EVT_ID],
    name: row[REG_NAME],
    email: row[REG_EMAIL],
    qrToken: row[REG_TOKEN],
    checkedIn: String(row[REG_CHECKED]).toUpperCase() === "TRUE",
    registeredAt: row[REG_REG_AT],
    checkedInAt: row[REG_CHECKED_AT]
  };
}

// ============================================================================
// READ ENDPOINTS
// ============================================================================

function getEvents() {
  const sheet = getSheet("Events");
  const data = sheet.getDataRange().getValues();
  const events = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][EVT_STATUS] === "published") {
      events.push(eventToObject(data[i]));
    }
  }

  return { success: true, events: events };
}

function getAllEvents() {
  const eventsSheet = getSheet("Events");
  const regsSheet = getSheet("Registrations");

  const eventsData = eventsSheet.getDataRange().getValues();
  const regsData = regsSheet.getDataRange().getValues();

  // Build count maps in one pass through Registrations
  const regCount = {};
  const checkinCount = {};
  for (let i = 1; i < regsData.length; i++) {
    const eid = regsData[i][REG_EVT_ID];
    if (!eid) continue;
    regCount[eid] = (regCount[eid] || 0) + 1;
    if (String(regsData[i][REG_CHECKED]).toUpperCase() === "TRUE") {
      checkinCount[eid] = (checkinCount[eid] || 0) + 1;
    }
  }

  const events = [];
  for (let i = 1; i < eventsData.length; i++) {
    const ev = eventToObject(eventsData[i]);
    ev.registrationCount = regCount[ev.eventId] || 0;
    ev.checkinCount = checkinCount[ev.eventId] || 0;
    events.push(ev);
  }

  return { success: true, events: events };
}

function getEvent(eventId) {
  const result = findEventById(eventId);
  if (!result) {
    return { success: false, error: "Event not found" };
  }

  return { success: true, event: eventToObject(result.data) };
}

function validateQR(token) {
  const result = findRegistrationByToken(token);

  if (!result) {
    return { status: "not_found" };
  }

  const reg = result.data;
  const checkedIn = String(reg[REG_CHECKED]).toUpperCase() === "TRUE";

  if (checkedIn) {
    return {
      status: "already_checked_in",
      name: reg[REG_NAME],
      checkedInAt: reg[REG_CHECKED_AT]
    };
  }

  return {
    status: "valid",
    name: reg[REG_NAME],
    email: reg[REG_EMAIL],
    eventId: reg[REG_EVT_ID],
    registrationId: reg[REG_ID]
  };
}

function getRegistration(email, eventId) {
  const result = findRegistrationByEmailAndEvent(email, eventId);

  if (!result) {
    return { success: false, error: "Registration not found" };
  }

  return { success: true, registration: registrationToObject(result.data) };
}

function getDashboard() {
  const eventsSheet = getSheet("Events");
  const regsSheet = getSheet("Registrations");

  const events = eventsSheet.getDataRange().getValues();
  const regs = regsSheet.getDataRange().getValues();

  let totalEvents = events.length - 1;
  let publishedEvents = 0;
  for (let i = 1; i < events.length; i++) {
    if (events[i][EVT_STATUS] === "published") {
      publishedEvents++;
    }
  }

  let totalRegistrations = regs.length - 1;
  let totalCheckIns = 0;
  for (let i = 1; i < regs.length; i++) {
    if (String(regs[i][REG_CHECKED]).toUpperCase() === "TRUE") {
      totalCheckIns++;
    }
  }

  return {
    success: true,
    totalEvents: totalEvents,
    publishedEvents: publishedEvents,
    totalRegistrations: totalRegistrations,
    totalCheckIns: totalCheckIns
  };
}

function getReport(eventId) {
  const sheet = getSheet("Registrations");
  const data = sheet.getDataRange().getValues();
  const report = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][REG_EVT_ID] === eventId) {
      report.push({
        name: data[i][REG_NAME],
        email: data[i][REG_EMAIL],
        registeredAt: data[i][REG_REG_AT],
        checkedIn: String(data[i][REG_CHECKED]).toUpperCase() === "TRUE",
        checkedInAt: data[i][REG_CHECKED_AT]
      });
    }
  }

  return { success: true, report: report };
}

function exportCSV(eventId) {
  const result = getReport(eventId);
  if (!result.success) {
    return ContentService
      .createTextOutput("error")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  const rows = result.report;

  let csv = "Name,Email,Registered At,Checked In,Checked In At\n";
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const checkedInAt = row.checkedInAt || "—";
    csv += escapeCSV(row.name) + "," +
           escapeCSV(row.email) + "," +
           escapeCSV(row.registeredAt) + "," +
           (row.checkedIn ? "Yes" : "No") + "," +
           escapeCSV(checkedInAt) + "\n";
  }

  return ContentService
    .createTextOutput(csv)
    .setMimeType(ContentService.MimeType.CSV)
    .downloadAsFile("attendance-report.csv");
}

function escapeCSV(field) {
  if (field === null || field === undefined) {
    return "";
  }
  field = String(field);
  if (field.includes(",") || field.includes("\"") || field.includes("\n")) {
    return "\"" + field.replace(/"/g, "\"\"") + "\"";
  }
  return field;
}

// ============================================================================
// WRITE ENDPOINTS
// ============================================================================

function createEvent(params) {
  const name = params.name;
  const date = params.date;
  const location = params.location;
  const capacity = params.capacity;
  const status = params.status || "draft";

  if (!name || !date || !location || !capacity) {
    return { success: false, error: "Missing required fields: name, date, location, capacity" };
  }

  const eventId = Utilities.getUuid();
  const sheet = getSheet("Events");

  sheet.appendRow([eventId, name, date, location, capacity, status]);

  return { success: true, eventId: eventId };
}

function updateEvent(params) {
  const eventId = params.eventId;

  if (!eventId) {
    return { success: false, error: "Missing eventId" };
  }

  const result = findEventById(eventId);
  if (!result) {
    return { success: false, error: "Event not found" };
  }

  const sheet = getSheet("Events");
  const rowNum = result.row;

  if (params.name) sheet.getRange(rowNum, EVT_NAME + 1).setValue(params.name);
  if (params.date) sheet.getRange(rowNum, EVT_DATE + 1).setValue(params.date);
  if (params.location) sheet.getRange(rowNum, EVT_LOC + 1).setValue(params.location);
  if (params.capacity) sheet.getRange(rowNum, EVT_CAP + 1).setValue(params.capacity);
  if (params.status) sheet.getRange(rowNum, EVT_STATUS + 1).setValue(params.status);

  return { success: true };
}

function archiveEvent(eventId) {
  if (!eventId) {
    return { success: false, error: "Missing eventId" };
  }

  const result = findEventById(eventId);
  if (!result) {
    return { success: false, error: "Event not found" };
  }

  const sheet = getSheet("Events");
  sheet.getRange(result.row, EVT_STATUS + 1).setValue("archived");

  return { success: true };
}

function registerAttendee(params) {
  const name = params.name;
  const email = params.email;
  const eventId = params.eventId;

  if (!name || !email || !eventId) {
    return { success: false, error: "Missing required fields: name, email, eventId" };
  }

  if (!isValidEmail(email)) {
    return { success: false, error: "Invalid email format" };
  }

  // Check if already registered
  const existing = findRegistrationByEmailAndEvent(email, eventId);
  if (existing) {
    return { success: false, error: "already_registered" };
  }

  // Check if event exists and is published
  const eventResult = findEventById(eventId);
  if (!eventResult) {
    return { success: false, error: "Event not found" };
  }
  const event = eventResult.data;
  if (event[EVT_STATUS] !== "published") {
    return { success: false, error: "Event is not available for registration" };
  }

  // Check capacity
  const capacity = event[EVT_CAP];
  const currentCount = countRegistrationsForEvent(eventId);
  if (currentCount >= capacity) {
    return { success: false, error: "event_full" };
  }

  // Generate UUIDs
  const registrationId = Utilities.getUuid();
  const qrToken = Utilities.getUuid();
  const now = new Date().toISOString();

  // Append registration
  const sheet = getSheet("Registrations");
  sheet.appendRow([registrationId, eventId, name, email, qrToken, "FALSE", now, ""]);

  // Send email
  sendConfirmationEmail(email, name, eventToObject(event), qrToken);

  return {
    success: true,
    qrToken: qrToken,
    registrationId: registrationId
  };
}

function checkIn(token) {
  if (!token) {
    return { success: false, error: "Missing token" };
  }

  const validation = validateQR(token);

  if (validation.status === "not_found") {
    return { success: false, error: "Invalid QR code" };
  }

  if (validation.status === "already_checked_in") {
    return { success: false, error: "already_checked_in", name: validation.name };
  }

  // valid status: proceed with check-in
  const result = findRegistrationByToken(token);
  const sheet = getSheet("Registrations");
  const rowNum = result.row;
  const reg = result.data;

  const now = new Date().toISOString();
  sheet.getRange(rowNum, REG_CHECKED + 1).setValue("TRUE");
  sheet.getRange(rowNum, REG_CHECKED_AT + 1).setValue(now);

  // Get event name for alert email
  const eventResult = findEventById(reg[REG_EVT_ID]);
  const eventName = eventResult ? eventResult.data[EVT_NAME] : "Unknown Event";

  // Send alert email
  sendCheckInAlert(reg[REG_EMAIL], reg[REG_NAME], eventName);

  return {
    success: true,
    name: reg[REG_NAME],
    eventId: reg[REG_EVT_ID]
  };
}

// ============================================================================
// EMAIL FUNCTIONS
// ============================================================================

function sendConfirmationEmail(email, name, event, qrToken) {
  const subject = "Registration Confirmed: " + event.name;
  const qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=" + encodeURIComponent(qrToken);
  const eventDate = new Date(event.date).toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  const htmlBody = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">

      <div style="background:#007bff;padding:28px 24px;text-align:center;">
        <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">Registration Confirmed</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Your ticket has been issued</p>
      </div>

      <div style="padding:28px 24px 0;">
        <h2 style="margin:0 0 8px;color:#222;font-size:18px;">Hi ${name},</h2>
        <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
          You're all set for <strong>${event.name}</strong>. Show the QR code below when you arrive — staff will scan it to check you in.
        </p>
      </div>

      <div style="padding:24px;text-align:center;">
        <div style="display:inline-block;background:#f8f9fa;border:2px dashed #ced4da;border-radius:10px;padding:20px;">
          <img src="${qrImageUrl}" alt="QR Ticket" width="240" height="240" style="display:block;border:none;">
          <p style="margin:12px 0 0;color:#888;font-size:11px;letter-spacing:0.5px;text-transform:uppercase;">Your unique entry QR code</p>
        </div>
      </div>

      <div style="margin:0 24px 24px;background:#f8f9fa;border-radius:8px;overflow:hidden;">
        <div style="background:#e9ecef;padding:10px 16px;">
          <strong style="color:#444;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Event Details</strong>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:12px 16px;color:#666;font-size:13px;width:80px;vertical-align:top;">Event</td>
            <td style="padding:12px 16px;color:#222;font-size:13px;font-weight:600;border-left:1px solid #e0e0e0;">${event.name}</td>
          </tr>
          <tr style="background:white;">
            <td style="padding:12px 16px;color:#666;font-size:13px;vertical-align:top;">Date</td>
            <td style="padding:12px 16px;color:#222;font-size:13px;border-left:1px solid #e0e0e0;">${eventDate}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;color:#666;font-size:13px;vertical-align:top;">Location</td>
            <td style="padding:12px 16px;color:#222;font-size:13px;border-left:1px solid #e0e0e0;">${event.location}</td>
          </tr>
        </table>
      </div>

      <div style="margin:0 24px 28px;background:#e8f4fd;border-left:4px solid #007bff;border-radius:4px;padding:12px 16px;">
        <p style="margin:0;color:#004085;font-size:13px;line-height:1.5;">
          <strong>Tip:</strong> Save this email or screenshot your QR code. You can also print this page for a physical ticket.
        </p>
      </div>

      <div style="background:#f8f9fa;border-top:1px solid #e0e0e0;padding:16px 24px;text-align:center;">
        <p style="margin:0;color:#999;font-size:11px;">This QR code is unique to you — please do not share it.</p>
        <p style="margin:6px 0 0;color:#bbb;font-size:11px;">Event Registration System</p>
      </div>

    </div>
  `;

  try {
    MailApp.sendEmail({ to: email, subject: subject, htmlBody: htmlBody });
  } catch(err) {
    Logger.log("Failed to send confirmation email: " + err);
  }
}

function sendCheckInAlert(attendeeEmail, attendeeName, eventName) {
  const subject = "Check-in Alert: " + attendeeName + " at " + eventName;
  const checkInTime = new Date().toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });

  const htmlBody = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:500px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">

      <div style="background:#28a745;padding:24px;text-align:center;">
        <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">Attendee Checked In</h1>
      </div>

      <div style="padding:24px 24px 8px;">
        <p style="margin:0 0 16px;color:#555;font-size:14px;">An attendee just checked in at your event.</p>
        <table style="width:100%;border-collapse:collapse;background:#f8f9fa;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:12px 16px;color:#666;font-size:13px;width:80px;">Attendee</td>
            <td style="padding:12px 16px;color:#222;font-size:13px;font-weight:600;border-left:1px solid #e0e0e0;">${attendeeName}</td>
          </tr>
          <tr style="background:white;">
            <td style="padding:12px 16px;color:#666;font-size:13px;">Email</td>
            <td style="padding:12px 16px;color:#222;font-size:13px;border-left:1px solid #e0e0e0;">${attendeeEmail}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;color:#666;font-size:13px;">Event</td>
            <td style="padding:12px 16px;color:#222;font-size:13px;border-left:1px solid #e0e0e0;">${eventName}</td>
          </tr>
          <tr style="background:white;">
            <td style="padding:12px 16px;color:#666;font-size:13px;">Time</td>
            <td style="padding:12px 16px;color:#222;font-size:13px;border-left:1px solid #e0e0e0;">${checkInTime}</td>
          </tr>
        </table>
      </div>

      <div style="padding:16px 24px;text-align:center;border-top:1px solid #e0e0e0;margin-top:16px;">
        <p style="margin:0;color:#bbb;font-size:11px;">Event Registration System — Check-in Alert</p>
      </div>

    </div>
  `;

  try {
    MailApp.sendEmail({ to: ADMIN_EMAIL, subject: subject, htmlBody: htmlBody });
  } catch(err) {
    Logger.log("Failed to send check-in alert: " + err);
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
