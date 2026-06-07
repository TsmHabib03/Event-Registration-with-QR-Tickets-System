/**
 * QR Scanner Page (Check-in)
 *
 * Allows staff to scan QR codes and check attendees in.
 * Requires camera access and HTTPS.
 */

// Auth gate: redirect if not authenticated
if (localStorage.getItem("adminAuthed") !== "true") {
  window.location.href = "admin-dashboard.html";
}

let scanner = null;
let currentFacingMode = "environment"; // back camera by default

document.addEventListener("DOMContentLoaded", async () => {
  const startBtn = document.getElementById("start-scanner-btn");
  const stopBtn = document.getElementById("stop-scanner-btn");
  const switchBtn = document.getElementById("switch-camera-btn");
  const resultDiv = document.getElementById("scan-result");

  startBtn.addEventListener("click", () => {
    startScanning();
    startBtn.style.display = "none";
    stopBtn.style.display = "inline-block";
  });

  stopBtn.addEventListener("click", () => {
    stopScanning();
    startBtn.style.display = "inline-block";
    stopBtn.style.display = "none";
    switchBtn.style.display = "none";
    resultDiv.innerHTML = "";
  });

  switchBtn.addEventListener("click", () => {
    currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
    stopScanning();
    startScanning();
  });
});

function startScanning() {
  const resultDiv = document.getElementById("scan-result");
  const switchBtn = document.getElementById("switch-camera-btn");

  try {
    scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        facingMode: currentFacingMode
      },
      false
    );

    scanner.render(onScanSuccess, onScanError);
    switchBtn.style.display = "inline-block";
  } catch(err) {
    console.error("Scanner error:", err);
    resultDiv.innerHTML = '<div class="alert-error">Camera access denied or not available. Make sure you are using HTTPS.</div>';
  }
}

function stopScanning() {
  if (scanner) {
    scanner.clear();
    scanner = null;
  }
  document.getElementById("switch-camera-btn").style.display = "none";
}

async function onScanSuccess(decodedText) {
  if (!scanner) return;

  // Pause scanner while processing
  scanner.pause();

  const resultDiv = document.getElementById("scan-result");

  try {
    // Validate QR
    const validation = await API.validateQR(decodedText);

    if (validation.status === "not_found") {
      showScanResult("error", "Invalid QR Code", "This ticket does not exist in the system.");
    } else if (validation.status === "already_checked_in") {
      showScanResult("warning", "Already Checked In", validation.name + " was already checked in at " + new Date(validation.checkedInAt).toLocaleTimeString());
    } else if (validation.status === "valid") {
      // Check in
      const checkinResult = await API.checkIn(decodedText);

      if (checkinResult.success) {
        showScanResult("success", "Welcome!", checkinResult.name + " has been checked in.");
      } else {
        showScanResult("error", "Check-in Failed", checkinResult.error || "An error occurred.");
      }
    } else {
      showScanResult("error", "Unknown Status", "Unexpected response from server.");
    }
  } catch(err) {
    console.error("Scan error:", err);
    showScanResult("error", "Error", err.message);
  }

  // Resume scanning after a delay
  setTimeout(() => {
    if (scanner) {
      scanner.resume();
    }
  }, 3000);
}

function onScanError(err) {
  // Ignore frame-level errors during scanning
  // console.log("Frame error:", err);
}

function showScanResult(type, title, message) {
  const resultDiv = document.getElementById("scan-result");

  let className = "alert-error";
  if (type === "success") className = "alert-success";
  if (type === "warning") className = "alert-warning";

  resultDiv.innerHTML = `
    <div class="${className}" style="padding: 15px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0;">${escapeHtml(title)}</h3>
      <p style="margin: 0;">${escapeHtml(message)}</p>
    </div>
  `;
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
