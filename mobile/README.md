# Radhix CRM - Flutter Mobile Application (Android & iOS)

A modern, cross-platform mobile application for **Radhix CRM** built with Flutter.

## 📱 Features Included

### 1. Authentication & Security
- JWT token-based authentication with persistent session storage.
- Auto-login on app launch with splash verification.
- Remember me functionality and secure sign-out.
- Dynamic Server / API Endpoint switcher (Production, Android Emulator, iOS Simulator, Custom IP).

### 2. Browser-Matched Executive Dashboard & Admin View
- **Dual View Modes**: Switch seamlessly between **Admin View** and **Employee View** with a single tap.
  - **Admin View**: Organization-wide KPIs, revenue trends, HRM distribution, sales performance, and audit trails.
  - **Employee View**: Personalized punch in/out banner, live leave balance counters, and personal task checklist.
- **5 Dashboard Tabs (Identical to Web Browser)**:
  - **Summary**: Total Leads, Active Deals, Invoices, Tasks, Monthly Revenue bar chart, Lead Acquisition area chart, and Recent Leads.
  - **Finance**: Revenue, Total Expenses, Pending Invoices, Processed Payroll, and Income vs Expense split chart.
  - **Sales**: Total Leads, Conversion %, Orders, Pipeline Value, and Top Products popularity ranking bars.
  - **HRM**: Total Staff, Pending Leaves, Open Roles, New Hires, Attendance donut chart, and Department distribution bars.
  - **System Health**: Server Uptime, API Latency, Active Alerts, Security check, and Real-time Activity Stream audit log.
- **Quick Actions Modal Sheet**: Matches browser `QuickActions.jsx` (Add Lead, Create Invoice, Punch In/Out, Apply Leave, Create Task, Add Expense).
- **In-App Error Diagnostics & Banner**: Shows exact failing API route (e.g. `[GET /api/dashboard/overview]`), error description, instant retry button, and server settings shortcut.
- **100% Responsive Layout**: Built with `LayoutBuilder` adaptive grids and constraints to eliminate all `RenderFlex` overflow errors on phones and tablets.

### 3. Sales & CRM Module
- Searchable leads list with status filtering tabs (All, New, Contacted, Qualified, Converted, Lost).
- One-tap phone dialer (`tel:`) and email composer (`mailto:`).
- Detailed lead profile with lead temperature (Cold, Warm, Hot), deal value, and source.
- Status update workflow and notes/discussion log.
- Create new lead form with validation.

### 4. Employee Self-Service (Attendance & HR)
- One-tap punch-in and punch-out with timestamps and hours calculated.
- Attendance history timeline with status badges (Present, WFH, Late, Absent).
- Leave management: View leave balances (Casual, Sick, Annual, Used).
- Apply for leave dialog with date pickers, half-day toggles, and reason validation.
- Task management: View assigned tasks, filter by priority, toggle status, and submit for approval.

### 5. Finance & Invoices Module
- Total collected revenue and outstanding balance banner.
- Filter invoices by status (All, Paid, Pending, Overdue).
- Search invoices by invoice number or client name.
- Mark invoices as paid with real-time UI updates.

---

## 🚀 How to Run the App

### Prerequisites
- [Flutter SDK](https://docs.flutter.dev/get-started/install) (3.24+ recommended)
- Android Studio or Xcode (for iOS)

### Step 1: Navigate to the mobile folder
```bash
cd mobile
```

### Step 2: Install dependencies
```bash
flutter pub get
```

### Step 3: Run the application

#### On Android Emulator:
```bash
flutter run
```

#### On iOS Simulator:
```bash
open -a Simulator
flutter run
```

#### On Chrome (for rapid testing):
```bash
flutter run -d chrome
```

---

## 🌐 Server Configuration

By default, the app connects to the production backend:
`https://radhix-crm.onrender.com/api`

To test locally:
1. Tap the **Settings icon** on the top right of the Login screen (or inside the drawer).
2. Choose one of the quick presets:
   - **Android Emulator**: `http://10.0.2.2:5000/api`
   - **iOS Simulator**: `http://localhost:5000/api`
   - **Physical Device**: `http://<YOUR_COMPUTER_IP>:5000/api`
3. Tap **Save & Apply**.
