# Event Registration with QR Tickets System

## Phase 1: Complete Implementation

A serverless event registration system with QR-code ticketing, real-time check-in, and attendance reporting.

**Technology Stack:**
- **Backend**: Google Apps Script (serverless REST API)
- **Database**: Google Sheets
- **Frontend**: Static HTML + Vanilla JavaScript (no frameworks)
- **QR Generation**: QRCode.js (client-side)
- **QR Scanning**: html5-qrcode (camera-based)
- **Email**: Google MailApp (built-in)
- **Hosting**: GitHub Pages or Vercel

---

## Quick Start

### Phase 1: Set Up the Backend

#### 1. Create a Google Sheets Spreadsheet

1. Go to [Google Drive](https://drive.google.com)
2. Create a new Google Sheets spreadsheet named "Event Registration System"
3. Create two sheets:
   - **Sheet 1**: Rename to `Events`
   - **Sheet 2**: Rename to `Registrations`

#### 2. Add Headers to Events Sheet

In the `Events` sheet, add this header row in row 1:
```
A1: Event ID
B1: Event Name
C1: Date
D1: Location
E1: Capacity
F1: Status
```

#### 3. Add Headers to Registrations Sheet

In the `Registrations` sheet, add this header row in row 1:
```
A1: Registration ID
B1: Event ID
C1: Name
D1: Email
E1: QR Token
F1: Checked In
G1: Registered At
H1: Checked In At
```

#### 4. Deploy Google Apps Script

1. In your spreadsheet, go to **Extensions > Apps Script**
2. Delete the default code
3. Copy the entire contents of `apps-script/Code.gs` and paste it
4. Update these constants at the top:
   - `SPREADSHEET_ID`: Your spreadsheet's ID (from the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`)
   - `ADMIN_EMAIL`: Your email address (for check-in alerts)
5. Click **Save**
6. Click **Deploy > New Deployment**
7. Select type: **Web app**
8. Execute as: **Me** (your Google account)
9. Who has access: **Anyone (even anonymous)**
10. Click **Deploy**
11. Copy the deployment URL (ends in `/exec`)

#### 5. Configure Frontend

1. Open `assets/js/config.js`
2. Replace `YOUR_DEPLOYMENT_ID` with your deployment URL:
   ```javascript
   const GAS_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
   ```
3. (Optional) Change the default admin password hash. Current default is `admin123`.
   - To change: run this in browser console and copy the output:
   ```javascript
   crypto.subtle.digest("SHA-256", new TextEncoder().encode("yourNewPassword"))
     .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")))
   ```

### Phase 2: Deploy Frontend

#### Option A: GitHub Pages

1. Create a GitHub repository
2. Push the entire project to the `main` branch
3. Go to Settings > Pages > Source: Deploy from a branch > `main` > `/root`
4. Your site is live at `https://yourusername.github.io/repository-name/`

#### Option B: Vercel

1. Push the project to GitHub
2. Go to [Vercel](https://vercel.com) and sign in
3. Click "New Project" and select your repository
4. Vercel auto-detects the project and deploys
5. Your site is live at the provided Vercel URL

---

## Testing the System

### 1. Health Check

Navigate to your GAS deployment URL:
```
https://script.google.com/macros/s/YOUR_ID/exec?action=getDashboard
```

Expected response:
```json
{
  "success": true,
  "totalEvents": 0,
  "publishedEvents": 0,
  "totalRegistrations": 0,
  "totalCheckIns": 0
}
```

### 2. Create a Test Event

Open your browser and navigate to:
```
https://script.google.com/macros/s/YOUR_ID/exec?action=createEvent&name=Test+Event&date=2026-07-15T18:00:00Z&location=Main+Hall&capacity=100&status=published
```

Expected response:
```json
{
  "success": true,
  "eventId": "uuid-string-here"
}
```

Copy the `eventId` for the next step.

### 3. Register an Attendee

Replace `EVENT_ID` with the value from step 2:
```
https://script.google.com/macros/s/YOUR_ID/exec?action=register&name=John+Doe&email=john@example.com&eventId=EVENT_ID
```

Expected response:
```json
{
  "success": true,
  "qrToken": "uuid-string-here",
  "registrationId": "uuid-string-here"
}
```

Check your admin email for a confirmation email with the QR code.

### 4. Validate QR

Replace `QR_TOKEN` with the value from step 3:
```
https://script.google.com/macros/s/YOUR_ID/exec?action=validateQR&token=QR_TOKEN
```

Expected response:
```json
{
  "status": "valid",
  "name": "John Doe",
  "email": "john@example.com",
  "eventId": "...",
  "registrationId": "..."
}
```

### 5. Check In

Replace `QR_TOKEN` with the value from step 3:
```
https://script.google.com/macros/s/YOUR_ID/exec?action=checkIn&token=QR_TOKEN
```

Expected response:
```json
{
  "success": true,
  "name": "John Doe",
  "eventId": "..."
}
```

Check your admin email for a check-in alert.

### 6. Test Frontend - Events Page

Open `frontend/events.html` in your browser (or access via GitHub Pages/Vercel URL). You should see the Test Event card.

### 7. Test Registration Flow

1. Click "Register" on the event card
2. Fill in the form with a different email
3. Submit
4. You should be redirected to `my-ticket.html` where a QR code is rendered

### 8. Test Admin Dashboard

1. Open `frontend/admin-dashboard.html`
2. Log in with password: `admin123`
3. View the dashboard stats (1 event, 1+ registrations, 1+ check-in)
4. Stats auto-refresh every 5 seconds

### 9. Test Check-in Scanner

**Note**: Scanner requires HTTPS and camera access. Use GitHub Pages/Vercel URL or localhost with SSL.

1. Open `frontend/scanner.html`
2. You'll be redirected to admin dashboard (auth gate)
3. Log in, then navigate back to scanner
4. Click "Start Camera" and allow camera access
5. Point camera at the QR code on `my-ticket.html`
6. You should see a green success message with the attendee name

### 10. Test Reports

1. Open `frontend/admin-reports.html`
2. Log in
3. Select the test event from the dropdown
4. View the attendance report table
5. Click "Export CSV" to download the report

---

## File Structure

```
Event_Registration_QR_Tickets/
├── apps-script/
│   └── Code.gs                 # Google Apps Script backend (REST API)
│
├── frontend/
│   ├── index.html              # Landing page
│   ├── events.html             # Browse events
│   ├── register.html           # Registration form
│   ├── my-ticket.html          # View QR ticket
│   ├── scanner.html            # QR scanner for check-in
│   ├── admin-dashboard.html    # Admin stats & login
│   ├── admin-events.html       # Create/edit/archive events
│   └── admin-reports.html      # Attendance reports & CSV export
│
├── assets/
│   ├── js/
│   │   ├── config.js           # Constants (GAS URL, admin password)
│   │   ├── api.js              # All fetch() calls (single source of truth)
│   │   ├── events.js           # Events listing logic
│   │   ├── register.js         # Registration form logic
│   │   ├── ticket.js           # QR display logic
│   │   ├── scanner.js          # QR scanning + check-in logic
│   │   ├── admin-dashboard.js  # Dashboard stats & auth
│   │   ├── admin-events.js     # Event CRUD operations
│   │   └── admin-reports.js    # Reports & CSV export
│   └── css/
│       └── main.css            # Minimal shared styles (Phase 1 only)
│
└── README.md
```

---

## API Reference

All endpoints are accessed via GET requests to the GAS deployment URL.

### Read Operations

| Action | Params | Returns |
|--------|--------|---------|
| `getEvents` | — | Array of published events |
| `getAllEvents` | — | Array of all events (admin) |
| `getEvent` | `eventId` | Single event object |
| `validateQR` | `token` | QR status (valid/already_checked_in/not_found) |
| `getRegistration` | `email`, `eventId` | Registration object |
| `getDashboard` | — | Stats (totalEvents, totalRegistrations, totalCheckIns) |
| `getReport` | `eventId` | Array of attendance records |
| `exportCSV` | `eventId` | CSV text (direct download) |

### Write Operations

| Action | Params | Returns |
|--------|--------|---------|
| `createEvent` | `name`, `date`, `location`, `capacity`, `status` | { success, eventId } |
| `updateEvent` | `eventId`, + fields to update | { success } |
| `archiveEvent` | `eventId` | { success } |
| `register` | `name`, `email`, `eventId` | { success, qrToken, registrationId } |
| `checkIn` | `token` | { success, name, eventId } |

---

## Default Admin Password

**Password**: `admin123`  
**Hash**: `0ba904eae8773b70c75333db4de2f3ac45038ad6ddcb3d4ae3f806ba287d0eb9`

To change:
1. Run this in your browser console:
   ```javascript
   crypto.subtle.digest("SHA-256", new TextEncoder().encode("yourNewPassword"))
     .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")))
   ```
2. Update `ADMIN_PASSWORD_HASH` in `assets/js/config.js`

---

## Important Notes

### Phase 1 Limitations (Known)

- **Client-side auth only**: Admin login uses localStorage and password hash. Not secure for production.
  - Phase 2: Switch to API key or Google OAuth for real security
- **GET-based API**: All mutations (create, update, check-in) use GET to avoid CORS complexity.
  - Phase 2: Migrate to proper POST with CORS headers
- **No framework**: HTML/CSS/JS are plain vanilla, intentionally minimal.
  - Phase 2: Frontend developers will redesign the UI and may use frameworks
- **Minimal styling**: Basic placeholder CSS only.
  - Phase 2: Professional UI design and responsive layouts

### Camera Requirements

- `scanner.html` requires **HTTPS** (GitHub Pages, Vercel, or localhost with SSL)
- Does not work on `file://` URLs
- Mobile browsers must grant camera permission

### Email Limits

- Free Google accounts: 100 emails/day via MailApp
- Workspace accounts: 1500 emails/day
- High-volume events need batching or external email service in Phase 2

### Data Storage

- All data stored in Google Sheets (no SQL database)
- Dates stored as ISO 8601 strings
- Booleans stored as "FALSE" / "TRUE" strings for consistency

---

## Phase 2 Roadmap (Future)

- [ ] Secure authentication (API keys or OAuth)
- [ ] Proper POST-based API with CORS handling
- [ ] Professional UI redesign (responsive, modern)
- [ ] Payment integration (Stripe, PayPal)
- [ ] SMS reminders (Twilio)
- [ ] Offline check-in (PWA)
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Webhook integrations (Slack, Google Sheets sync)

---

## Troubleshooting

### Frontend shows "Cannot GET /assets/..."

**Cause**: Static files not being served properly.  
**Fix**: Deploy to GitHub Pages or Vercel (not local file://).

### API returns error "Unknown action"

**Cause**: Typo in query parameter or GAS not deployed.  
**Fix**: Double-check the `action` parameter spelling.

### Camera not working on scanner.html

**Cause**: Not HTTPS or camera permission denied.  
**Fix**: Use GitHub Pages/Vercel URL. Check browser permissions.

### Emails not sending

**Cause**: MailApp quota exceeded or admin email incorrect.  
**Fix**: Check `ADMIN_EMAIL` in Code.gs. Wait until quota resets (daily).

### QR code not rendering

**Cause**: QRCode.js CDN not loaded or QR token missing.  
**Fix**: Check browser console for CDN errors. Verify registration completed.

### Dashboard doesn't auto-refresh

**Cause**: JavaScript error or fetch failure.  
**Fix**: Check browser console (F12) for errors. Verify GAS URL in config.js.

---

## Support

For issues:
1. Check the browser console (F12) for error messages
2. Verify the GAS deployment URL and admin email in Code.gs
3. Test API endpoints directly in the browser address bar
4. Review the Phase 1 limitations listed above

---

## License

This project is provided as-is for educational and event management purposes.
