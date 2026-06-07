/**
 * QR Scanner Page (Check-in)
 *
 * Uses Html5Qrcode (not Html5QrcodeScanner) for full camera API control.
 * Requires HTTPS and admin authentication.
 */

if (localStorage.getItem("adminAuthed") !== "true") {
  window.location.href = "admin-dashboard.html";
}

let html5QrCode = null;
let currentFacingMode = "environment";
let isScanning = false;
let isBusy = false;

document.addEventListener("DOMContentLoaded", () => {
  const startBtn  = document.getElementById("start-btn");
  const stopBtn   = document.getElementById("stop-btn");
  const switchBtn = document.getElementById("switch-btn");

  startBtn.addEventListener("click", async () => {
    if (isBusy) return;
    isBusy = true;
    setStatus("starting");
    try {
      await startScanning();
      setStatus("scanning");
      startBtn.style.display  = "none";
      stopBtn.style.display   = "flex";
      switchBtn.style.display = "flex";
    } catch (err) {
      console.error("Start error:", err);
      showResult("error", "Camera Error", "Could not access camera. Make sure you are using HTTPS and camera permission is granted.");
      setStatus("idle");
    }
    isBusy = false;
  });

  stopBtn.addEventListener("click", async () => {
    if (isBusy) return;
    isBusy = true;
    setStatus("stopping");
    await stopScanning();
    setStatus("idle");
    startBtn.style.display  = "flex";
    stopBtn.style.display   = "none";
    switchBtn.style.display = "none";
    document.getElementById("scan-result").innerHTML = "";
    isBusy = false;
  });

  switchBtn.addEventListener("click", async () => {
    if (isBusy || !isScanning) return;
    isBusy = true;
    switchBtn.disabled = true;
    switchBtn.querySelector(".btn-label").textContent = "Switching...";
    setStatus("starting");

    currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
    await stopScanning();
    try {
      await startScanning();
      setStatus("scanning");
      updateSwitchLabel();
    } catch (err) {
      console.error("Switch error:", err);
      setStatus("idle");
    }
    switchBtn.disabled = false;
    isBusy = false;
  });
});

async function startScanning() {
  html5QrCode = new Html5Qrcode("qr-reader");
  await html5QrCode.start(
    { facingMode: currentFacingMode },
    { fps: 10, qrbox: { width: 240, height: 240 } },
    onScanSuccess,
    () => {}
  );
  isScanning = true;
}

async function stopScanning() {
  if (html5QrCode && isScanning) {
    try {
      await html5QrCode.stop();
    } catch (e) { /* ignore stop errors */ }
    html5QrCode.clear();
    html5QrCode = null;
  }
  isScanning = false;
}

// Fixed Rapid Re-scanning of the Same QR Code by adding cooldown
let lastScannedText = null;
let lastScanTime = 0;

async function onScanSuccess(decodedText) {
  if (!isScanning || isBusy) return;

  if (decodedText === lastScannedText && (Date.now() - lastScanTime) < 3000) {
    return;
  }

  isBusy = true;
  lastScannedText = decodedText;
  lastScanTime = Date.now();
  setStatus("processing");

  try {
    const validation = await API.validateQR(decodedText);

    if (validation.status === "not_found") {
      showResult("error", "Invalid QR Code", "This ticket does not exist in the system.");
    } else if (validation.status === "already_checked_in") {
      showResult("warning", "Already Checked In", validation.name + " was already checked in at " + new Date(validation.checkedInAt).toLocaleTimeString());
    } else if (validation.status === "valid") {
      const checkinResult = await API.checkIn(decodedText);
      if (checkinResult.success) {
        showResult("success", "Checked In", checkinResult.name + " has been successfully checked in.");
      } else {
        showResult("error", "Check-in Failed", checkinResult.error || "An error occurred.");
      }
    } else {
      showResult("error", "Unknown Response", "Unexpected response from server.");
    }
  } catch (err) {
    console.error("Scan error:", err);
    showResult("error", "Network Error", err.message);
  }

  setStatus("scanning");
  isBusy = false;
}

function setStatus(state) {
  const dot  = document.getElementById("status-dot");
  const text = document.getElementById("status-text");

  dot.className = "scanner-status-dot";
  switch (state) {
    case "idle":
      text.textContent = "Idle — camera off";
      break;
    case "starting":
      dot.classList.add("pending");
      text.textContent = "Starting camera...";
      break;
    case "scanning":
      dot.classList.add("active");
      text.textContent = "Scanning — point at QR code";
      break;
    case "processing":
      dot.classList.add("pending");
      text.textContent = "Processing scan...";
      break;
    case "stopping":
      text.textContent = "Stopping...";
      break;
  }
}

function updateSwitchLabel() {
  const label = document.getElementById("switch-btn").querySelector(".btn-label");
  label.textContent = currentFacingMode === "environment" ? "Switch to Front Camera" : "Switch to Back Camera";
}

function showResult(type, title, message) {
  const resultDiv = document.getElementById("scan-result");
  const cls = type === "success" ? "alert-success" : type === "warning" ? "alert-warning" : "alert-error";
  resultDiv.innerHTML = `
    <div class="${cls} scan-result-box">
      <strong>${escapeHtml(title)}</strong>
      <p style="margin:6px 0 0;">${escapeHtml(message)}</p>
    </div>
  `;
}

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
