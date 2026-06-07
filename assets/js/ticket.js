/**
 * My Ticket Page
 *
 * Displays the attendee's QR ticket with event details and check-in status.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");
  const eventId = params.get("eventId");

  const ticketInfo = document.getElementById("ticket-info");

  if (!email || !eventId) {
    ticketInfo.innerHTML = '<div class="alert-error">Invalid ticket link. Please use the link from your confirmation email.</div>';
    return;
  }

  try {
    // Fetch registration details
    const regResult = await API.getRegistration(email, eventId);

    if (!regResult.success) {
      ticketInfo.innerHTML = '<div class="alert-error">Ticket not found.</div>';
      return;
    }

    const reg = regResult.registration;

    // Fetch event details
    const eventResult = await API.getEvent(eventId);

    if (!eventResult.success) {
      ticketInfo.innerHTML = '<div class="alert-error">Event not found.</div>';
      return;
    }

    const event = eventResult.event;
    const date = new Date(event.date);

    // Display ticket info
    const checkinStatus = reg.checkedIn
      ? `<div class="alert-success" style="margin: 20px 0;">Checked in at ${escapeHtml(new Date(reg.checkedInAt).toLocaleString())}</div>`
      : `<div style="margin: 20px 0; padding: 10px; background: #fff9e6; border: 1px solid #ffc107; border-radius: 5px;">Not yet checked in</div>`;

    ticketInfo.innerHTML = `
      <div style="text-align: center;">
        <h2>${escapeHtml(reg.name)}</h2>

        <div id="qr-container" style="margin: 30px 0;"></div>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 30px 0; text-align: left;">
          <h3>Event Details</h3>
          <p><strong>Event:</strong> ${escapeHtml(event.name)}</p>
          <p><strong>Date:</strong> ${escapeHtml(date.toLocaleString())}</p>
          <p><strong>Location:</strong> ${escapeHtml(event.location)}</p>
          <p style="color: #666; font-size: 12px; margin-top: 10px;">
            <strong>QR Token:</strong> ${reg.qrToken}
          </p>
        </div>

        <div id="checkin-status">
          ${checkinStatus}
        </div>

        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Please present your QR code at check-in. You can print this page or show your screen to the staff member.
        </p>
      </div>
    `;

    // Render QR code using QRCode.js
    const qrContainer = document.getElementById("qr-container");
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
      text: reg.qrToken,
      width: 256,
      height: 256,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  } catch(err) {
    console.error("Error loading ticket:", err);
    ticketInfo.innerHTML = '<div class="alert-error">Error: ' + err.message + '</div>';
  }
});

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
