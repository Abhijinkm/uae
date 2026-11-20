# 🥋 Samurai • Student Attendance & Fee Reminder Management System

A modern, professional, production-grade **Student Attendance and Fee Management System** built with **React.js + Vite, Tailwind CSS, Node.js + Express, and MongoDB / Mongoose**.

Designed for martial arts academies, dojos, gyms, fitness centers, combat sports clubs, and training institutes.

---

## 🌟 Key Highlights & Features

### 1. 📅 Smart Date-to-Date Fee Calculation (Core Requirement)
- Memberships are calculated based on the student's **actual joining or payment date**, not generic calendar month boundaries.
- **Example**:
  - Student joins: **November 19**
  - Package: **1 Month**
  - Membership expires: **December 19**
  - Next renewal: **December 19**
- Supports **1 Month, 3 Months, 6 Months, 12 Months, Custom Duration**, and **Class-Pack Flex Passes** (e.g. 10 classes).

### 2. 🥋 Attendance-Based Fee Tracking Against Membership Period
- Real-time counting of classes attended **between the membership start date and expiry date**.
- Computes attended classes count, remaining classes (for class-limit packages), and attendance percentage.
- Maintains a complete historical log across all renewal cycles.
- When all sessions are exhausted or time elapses, marks membership as expired.

### 3. 🔔 Multi-Tiered Automatic Fee Reminders
- **7 Days Before Expiry**: Friendly upcoming renewal reminder.
- **3 Days Before Expiry**: Advance notice reminder.
- **1 Day Before Expiry**: Urgent expiration notification.
- **On Expiry Date**: Payment due alert.
- **After Expiry**: Expired membership notice and reactivation guidance.
- **Integrated Channels**:
  - **Direct WhatsApp Chat**: One-click link (`https://wa.me/...`) pre-filled with personalized templated message.
  - **SMS Simulator & Log**: Records dispatches with recipient details.
  - **In-App Notifications**: Real-time alerts on both Admin and Student dashboards.
  - **Customizable Message Templates**: Admin can configure templates with placeholders `{student_name}`, `{package_name}`, `{expiry_date}`, `{amount_due}`, `{academy_name}`.

### 4. 💳 Payment Management & Official Receipts
- Record **Cash, Bank Transfer, Online / UPI / Card** transactions.
- **Partial Payments & Outstanding Balance**: Real-time balance tracking on the student's active membership.
- **Official Printable Receipts**: Includes academy branding, unique receipt number (`REC-YYYYMMDD-XXXX`), student details, payment method, tax, total, balance, and signature line with print/PDF layout.

### 5. 👥 Student Directory & Profile Management
- Unique auto-generated Student ID (`SAM-YYYY-XXX`).
- Stores name, phone, email, address, gender, joining date, profile photo, and emergency contacts.
- Assigns branch, batch, and instructor.
- Profile page with complete student history: attendance log, payment receipts, and membership cycles.
- Quick account deactivation / reactivation and role management.

### 6. 📋 Daily Attendance Register
- One-click daily register with toggle pills: `[ Present ]`, `[ Absent ]`, `[ Leave ]`.
- Bulk actions: **Mark All Present**, **Mark All Absent**.
- Filter by Branch, Batch, and Date.
- Search students by name or ID.
- Records check-in time and remarks.

### 7. 🥋 Dedicated Student Dashboard Portal
- Personal student login account.
- View membership package, expiry date, days remaining countdown.
- Classes attended, attendance percentage, and personal attendance calendar.
- Payment history and downloadable official receipts.
- Academy notifications and reminder alerts.

### 8. 📊 Downloadable Reports & Financial Analytics
- **Daily Attendance Report**
- **Monthly Fee Collection Report**
- **Pending Fees & Outstanding Balances Report**
- **Expired Memberships Report**
- **Branch Performance Report**
- **1-Click Export to Excel (`.xlsx`)** and **1-Click Export to PDF (`.pdf`)** on all reports!

### 9. ⚙️ Admin Academy Configuration
- Multi-branch management (Downtown Dojo, Westside Arena, Uptown Hub).
- Training batch scheduling with time slots and capacity limits.
- Instructor management with belt rank and specializations.
- Custom membership package builder.
- System audit log tracking all administrative actions.

---

## 🔑 Demo Access Credentials

The system automatically initializes with realistic demo data on startup:

| Role | Email / ID | Password | Portal Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@samurai.com` | `admin123` | Full Admin Console |
| **Staff** | `staff@samurai.com` | `staff123` | Daily Operations, Attendance & Payments |
| **Student** | `student@samurai.com` (or `SAM-2026-001`) | `student123` | Dedicated Student Portal |

> *Quick One-Click buttons are also provided directly on the Login page for instant switching!*

---

## 🛠️ Technology Stack

- **Frontend**: React.js 18, Vite 6, Tailwind CSS 3, Lucide Icons, Recharts (Charts), jsPDF & jsPDF-AutoTable (PDF exports), XLSX (Excel exports).
- **Backend**: Node.js, Express.js (MVC architecture: controllers, models, routes, middlewares, services).
- **Database**: MongoDB + Mongoose with dual-mode embedded JSON/In-Memory fallback persistence engine.
- **Authentication**: JWT (JSON Web Tokens), bcryptjs password hashing, Role-Based Access Control (RBAC).
- **Scheduler**: Node-Cron automated background tasks for midnight expiry checks & reminder sweeps.

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
# Install root, backend, and frontend packages
npm --prefix backend install
npm --prefix frontend install
```

### 2. Run the Database Seed (Optional - auto-seeds on first launch)
```bash
npm --prefix backend run seed
```

### 3. Start Development Servers
```bash
# Terminal 1: Backend API (port 5000)
npm --prefix backend run dev

# Terminal 2: Frontend Vite App (port 3000)
npm --prefix frontend run dev
```

### 4. Or Run the Integrated Production Server
```bash
npm --prefix frontend run build
node backend/src/server.js
# Access the complete full-stack application at http://localhost:5000
```

---

## 📁 Project Architecture

```
samurai-attendance/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # Dual-mode Mongoose & embedded connection
│   │   │   └── embeddedMongoose.js   # Zero-dependency persistent JSON store
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── studentController.js
│   │   │   ├── attendanceController.js
│   │   │   ├── membershipController.js
│   │   │   ├── paymentController.js
│   │   │   ├── reminderController.js
│   │   │   ├── reportController.js
│   │   │   └── settingsController.js
│   │   ├── models/                   # Schemas & Model proxies
│   │   │   ├── User.js
│   │   │   ├── Student.js
│   │   │   ├── StudentMembership.js
│   │   │   ├── MembershipPackage.js
│   │   │   ├── Attendance.js
│   │   │   ├── Payment.js
│   │   │   ├── Reminder.js
│   │   │   ├── Branch.js
│   │   │   ├── Batch.js
│   │   │   ├── Instructor.js
│   │   │   ├── AuditLog.js
│   │   │   └── Settings.js
│   │   ├── routes/                   # REST API routes
│   │   ├── services/
│   │   │   ├── membershipService.js  # Date-to-date calculation & attendance tracking
│   │   │   └── reminderService.js    # Multi-tier reminder scheduler & WhatsApp generator
│   │   ├── utils/
│   │   │   └── dateUtils.js          # Date calculation utilities
│   │   ├── seeds/
│   │   │   └── seedData.js           # High-fidelity realistic demo seed
│   │   └── server.js                 # Express server & scheduled cron jobs
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/               # Navbar, Sidebar, StatCard, Modals, Badges
│   │   ├── context/                  # AuthContext, ThemeContext
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Students.jsx
│   │   │   ├── StudentDetail.jsx
│   │   │   ├── Attendance.jsx
│   │   │   ├── Memberships.jsx
│   │   │   ├── Payments.jsx
│   │   │   ├── Reminders.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── StudentPortal.jsx
│   │   ├── services/                 # REST API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
└── README.md
```

