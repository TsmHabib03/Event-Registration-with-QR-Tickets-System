# Deployment Guide

## Step-by-Step Setup Instructions

### Part 1: Google Apps Script Backend Setup

#### 1.1 Create Google Sheets Database

1. Open [Google Drive](https://drive.google.com) and log in
2. Click "Create" > "Google Sheets"
3. Name it "Event Registration System"
4. In the spreadsheet:
   - Right-click the first sheet tab and select "Rename"
   - Rename to `Events`
   - Create a second sheet and name it `Registrations`

#### 1.2 Create Events Sheet Headers

1. Click on the `Events` sheet tab
2. In cell A1, type: `Event ID`
3. In cell B1, type: `Event Name`
4. In cell C1, type: `Date`
5. In cell D1, type: `Location`
6. In cell E1, type: `Capacity`
7. In cell F1, type: `Status`

Leave row 1 as headers. Data will start in row 2.

#### 1.3 Create Registrations Sheet Headers

1. Click on the `Registrations` sheet tab
2. In cell A1, type: `Registration ID`
3. In cell B1, type: `Event ID`
4. In cell C1, type: `Name`
5. In cell D1, type: `Email`
6. In cell E1, type: `QR Token`
7. In cell F1, type: `Checked In`
8. In cell G1, type: `Registered At`
9. In cell H1, type: `Checked In At`

Leave row 1 as headers. Data will start in row 2.

#### 1.4 Get Your Spreadsheet ID

1. Look at your browser URL in the Google Sheets tab
2. Extract the ID from the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. Save this ID (you'll need it in step 1.5)

#### 1.5 Deploy Google Apps Script

1. In your Google Sheets spreadsheet, click **Extensions** in the top menu
2. Select **Apps Script**
3. A new tab opens with the Apps Script editor
4. Delete the default code (everything in the editor)
5. Open the file `apps-script/Code.gs` from this project
6. Copy the entire contents
7. Paste into the Apps Script editor
8. Replace the values at the top of the file:
   ```javascript
   const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
   ```
   Replace `YOUR_SPREADSHEET_ID_HERE` with the ID from step 1.4

9. Replace:
   ```javascript
   const ADMIN_EMAIL = "YOUR_ADMIN_EMAIL_HERE";
   ```
   Replace `YOUR_ADMIN_EMAIL_HERE` with your Google email address (where check-in alerts will be sent)

10. Click the **Save** icon (or Ctrl+S)

#### 1.6 Deploy to Web

1. In the Apps Script editor, click the **Deploy** button (top right)
2. Click **New Deployment**
3. Click the gear icon and select **Web app**
4. Fill in the form:
   - **Execute as**: Select your Google account
   - **Who has access**: Select "Anyone (even anonymous)"
5. Click **Deploy**
6. You'll see a dialog with a deployment URL that looks like:
   ```
   https://script.google.com/macros/s/DEPLOYMENT_ID/exec
   ```
7. Copy this entire URL (you'll need it in step 2.2)

---

### Part 2: Frontend Configuration

#### 2.1 Get Your GAS Deployment URL

From step 1.6, you should have a URL like:
```
https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

#### 2.2 Update config.js

1. Open the file `assets/js/config.js`
2. Find this line:
   ```javascript
   const GAS_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
   ```
3. Replace `YOUR_DEPLOYMENT_ID` with the URL from step 2.1:
   ```javascript
   const GAS_URL = "https://script.google.com/macros/s/DEPLOYMENT_ID/exec";
   ```
   (Keep the full URL including `/exec`)

4. Save the file

#### 2.3 (Optional) Change Admin Password

Default admin password is `admin123`. To change it:

1. Open your browser developer console (F12)
2. Paste this code and press Enter:
   ```javascript
   crypto.subtle.digest("SHA-256", new TextEncoder().encode("yourNewPassword"))
     .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")))
   ```
   Replace `yourNewPassword` with your desired password

3. Copy the output (the long hex string)
4. Open `assets/js/config.js`
5. Replace the `ADMIN_PASSWORD_HASH` value:
   ```javascript
   const ADMIN_PASSWORD_HASH = "paste-your-hash-here";
   ```

---

### Part 3: Deploy Frontend

Choose one of the following options:

#### Option A: Deploy to GitHub Pages

**Prerequisites**: Git and GitHub account

1. Open command line / terminal
2. Navigate to your project directory:
   ```bash
   cd path/to/Event_Registration_QR_Tickets
   ```

3. Initialize a git repository:
   ```bash
   git init
   ```

4. Create `.gitignore` file:
   ```bash
   echo "node_modules/" > .gitignore
   echo ".env" >> .gitignore
   ```

5. Add all files:
   ```bash
   git add .
   ```

6. Create initial commit:
   ```bash
   git commit -m "Initial commit: Event Registration Phase 1"
   ```

7. Create a repository on GitHub (https://github.com/new)
   - Name: `event-registration-qr-tickets`
   - Description: "Event Registration with QR Tickets"
   - Do NOT initialize with README (we already have one)

8. Add remote and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/event-registration-qr-tickets.git
   git branch -M main
   git push -u origin main
   ```

9. Go to your repository settings on GitHub
10. Scroll to "GitHub Pages" section
11. Under "Source", select:
    - Branch: `main`
    - Folder: `/ (root)`
12. Click Save
13. Wait 2-3 minutes
14. Your site is live at: `https://YOUR_USERNAME.github.io/event-registration-qr-tickets/`

#### Option B: Deploy to Vercel

**Prerequisites**: GitHub account and git (optional), Vercel account

1. Go to [Vercel.com](https://vercel.com)
2. Sign in or create account
3. Click "Add New..." > "Project"
4. If you pushed to GitHub, import the repository
5. If local only, drag and drop the project folder onto Vercel
6. Vercel will auto-detect and deploy
7. Your site is live at the provided URL (e.g., `your-project.vercel.app`)

---

### Part 4: Verify Everything Works

#### 4.1 Test Backend Health

1. Open the GAS URL you created in Part 1, step 1.6 in a browser:
   ```
   https://script.google.com/macros/s/DEPLOYMENT_ID/exec?action=getDashboard
   ```

2. You should see JSON response like:
   ```json
   {
     "success": true,
     "totalEvents": 0,
     "publishedEvents": 0,
     "totalRegistrations": 0,
     "totalCheckIns": 0
   }
   ```

3. If you see HTML error page instead:
   - Check that deployment access is set to "Anyone (even anonymous)"
   - Try redeploying (Deploy > Manage Deployments > Edit > New version)

#### 4.2 Test Frontend

1. Open your deployed site URL (from Part 3)
2. You should see a landing page with navigation
3. Click "Browse Events"
4. You should see "No events available at this time" (since we haven't created any yet)

#### 4.3 Create Test Event

1. Navigate to:
   ```
   https://script.google.com/macros/s/DEPLOYMENT_ID/exec?action=createEvent&name=Demo+Event&date=2026-07-15T18:00:00Z&location=Main+Hall&capacity=100&status=published
   ```

2. You should see:
   ```json
   {
     "success": true,
     "eventId": "some-uuid-here"
   }
   ```

3. Save the `eventId` for testing

#### 4.4 Test Admin Dashboard

1. Go to your site's `admin-dashboard.html` page
2. You should see a login form
3. Enter password: `admin123`
4. Click Login
5. You should see the dashboard with statistics
6. Stats should show: 1 event, 0 registrations, 0 check-ins
7. An events table should appear below

#### 4.5 Create Event via Admin Panel

1. While logged in, click "Manage Events"
2. Fill out the form:
   - Event Name: "Test Event"
   - Date: Pick any future date
   - Location: "Test Venue"
   - Capacity: 50
   - Status: "Published"
3. Click "Create Event"
4. You should see success message
5. The event should appear in the list below

#### 4.6 Test Registration

1. Go back to your site's `events.html`
2. Refresh the page
3. You should see your Test Event card
4. Click "Register"
5. Fill in:
   - Name: "John Doe"
   - Email: "john@example.com"
6. Click Register
7. You should be redirected to a QR code ticket page
8. A QR code should be rendered on the page
9. Check your admin email for the registration confirmation with QR code

#### 4.7 Test Check-in (Scanner)

**Note**: Scanner requires HTTPS. If testing locally, use the deployed GitHub Pages/Vercel URL.

1. Navigate to `scanner.html` on your deployed site
2. You should be redirected to admin dashboard (authentication check)
3. Log in with `admin123`
4. Navigate back to `scanner.html`
5. Click "Start Camera"
6. Allow camera access when prompted
7. Point your phone camera at the QR code from step 4.6
8. You should see a green success message with the attendee's name

---

## Troubleshooting Common Issues

### Issue: API returns "Unknown action"

**Cause**: Invalid query parameter or GAS endpoint not reached  
**Solution**:
- Double-check the GAS URL in config.js matches your deployment
- Verify the action parameter spelling is correct
- Try the health check endpoint directly: `?action=getDashboard`

### Issue: Frontend loads but shows "Cannot GET..."

**Cause**: Static files not being served (likely local testing)  
**Solution**:
- Deploy to GitHub Pages or Vercel instead of opening local files
- If local testing needed, use a local web server: `python -m http.server 8000`

### Issue: Emails not sending

**Cause**: 
- MailApp quota exceeded (100 emails/day for free accounts)
- ADMIN_EMAIL is incorrect
**Solution**:
- Check ADMIN_EMAIL in Code.gs is your correct Google email
- Wait until next day if quota is exceeded
- For production, upgrade to Google Workspace (1500 emails/day)

### Issue: QR Scanner shows "Camera access denied"

**Cause**: Not HTTPS or page not properly deployed  
**Solution**:
- Use GitHub Pages or Vercel (both HTTPS by default)
- Don't test locally with file:// URLs
- Check browser permissions for camera access

### Issue: Dashboard stats show wrong numbers

**Cause**: Stale cache or network error  
**Solution**:
- Refresh the page (F5)
- Check browser console (F12) for errors
- Verify GAS endpoint responds with `?action=getDashboard`

### Issue: Can't log in to admin panel

**Cause**: Wrong password or hash mismatch  
**Solution**:
- Default password is `admin123`
- Verify ADMIN_PASSWORD_HASH in config.js hasn't been accidentally changed
- If changed, use the hash generation code from Part 2, step 2.3

---

## Post-Deployment Checklist

- [ ] GAS backend deployed and health check passes
- [ ] Frontend deployed to GitHub Pages or Vercel
- [ ] config.js updated with correct GAS URL
- [ ] Test event created successfully
- [ ] Admin can log in with password
- [ ] User can register for event
- [ ] Registration confirmation email received
- [ ] QR code displays on ticket page
- [ ] Scanner works (HTTPS + camera)
- [ ] Check-in creates attendance record
- [ ] Check-in alert email received
- [ ] Admin dashboard shows correct stats
- [ ] CSV export works

---

## After Deployment

### Managing Events

1. Navigate to `admin-events.html`
2. Log in with your admin password
3. Create, edit, or archive events
4. Published events appear on the public events page

### Monitoring Attendance

1. Navigate to `admin-reports.html`
2. Select an event from the dropdown
3. View attendance report with registration details
4. Export to CSV for external analysis

### Real-Time Check-ins

1. At the event, open `scanner.html` on a tablet/phone
2. Staff scan attendees' QR codes
3. Green success message appears when valid
4. Admin receives email alert for each check-in
5. Dashboard updates in real-time (auto-refresh every 5 seconds)

---

## Next Steps (Phase 2)

Consider these improvements for production:

1. **Security**:
   - Replace client-side password with API key or OAuth
   - Use POST instead of GET for data mutations
   - Add CORS headers properly

2. **UI/UX**:
   - Professional design and responsive layouts
   - Mobile-optimized forms and scanner
   - Better error messages and feedback

3. **Features**:
   - Payment integration
   - SMS reminders
   - Offline check-in capability
   - Advanced analytics

4. **Infrastructure**:
   - Migrate to dedicated backend (Node.js, Python, etc.)
   - Use traditional database (PostgreSQL, MongoDB)
   - Add authentication service
   - Implement proper API versioning
