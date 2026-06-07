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
        <h2 style="margin-bottom: 4px;">${escapeHtml(reg.name)}</h2>
        <p style="color: #666; margin-top: 0;">${escapeHtml(event.name)}</p>

        <div class="ticket-qr-wrap">
          <div id="qr-container"></div>
          <button onclick="downloadQR()" class="btn" style="margin-top: 14px; padding: 10px 28px;">
            Download QR Code
          </button>
        </div>

        <div style="background: #f5f5f5; padding: 16px 20px; border-radius: 5px; margin: 20px 0; text-align: left;">
          <h3 style="margin-top: 0; font-size: 15px;">Event Details</h3>
          <p style="margin: 6px 0;"><strong>Event:</strong> ${escapeHtml(event.name)}</p>
          <p style="margin: 6px 0;"><strong>Date:</strong> ${escapeHtml(date.toLocaleString())}</p>
          <p style="margin: 6px 0;"><strong>Location:</strong> ${escapeHtml(event.location)}</p>
        </div>

        <div id="checkin-status">
          ${checkinStatus}
        </div>

        <p style="color: #888; font-size: 12px; margin-top: 20px;">
          Present your QR code at check-in. Print this page or show your screen to staff.
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

function downloadQR() {
  const container = document.getElementById("qr-container");
  if (!container) return;

  const canvas = container.querySelector("canvas");
  const img = container.querySelector("img");

  let dataUrl;
  if (canvas) {
    dataUrl = canvas.toDataURL("image/png");
  } else if (img) {
    dataUrl = img.src;
  } else {
    alert("QR code is not ready yet. Please wait a moment.");
    return;
  }

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "qr-ticket.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
