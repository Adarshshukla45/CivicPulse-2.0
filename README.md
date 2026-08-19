# 🏛️ CivicPulse — Smart Civic Grievance Redressal & Automated Escalation Platform

[![Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20AI-blue.svg)](https://github.com)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![Node](https://img.shields.io/badge/Node.js-Express-339933.svg)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Mongoose-47A248.svg)](https://www.mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **CivicPulse** is an automated, AI-powered municipal grievance redressal and administrative accountability platform. It bridges the gap between citizens and municipal authorities by combining **Google Gemini AI triage**, **automated multi-tier SLA escalation (Local → District → State)**, and **real-time governance scoring**.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Database Schema (MongoDB / Mongoose)](#-database-schema-mongodb--mongoose)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Environment Variables](#environment-variables)
- [Pre-Configured Demo Credentials](#-pre-configured-demo-credentials)
- [Directory Structure](#-directory-structure)
- [License](#-license)

---

## ✨ Key Features

### 1. 🤖 AI-Powered Grievance Triage (Google Gemini)
- Automatically analyzes citizen complaint text descriptions.
- Detects the correct **category**, extracts **urgency level** (Low/Medium/High/Critical), and routes to the appropriate department with 1-click auto-fill.
- Generates **AI Governance Recommendation Reports** for Super Admins analyzing departmental bottlenecks.

### 2. ⚡ Automated Multi-Tier SLA Escalation Engine
- Background cron worker tracks resolution turnaround times based on department-specific SLAs (e.g., 3 days).
- Unresolved grievances are automatically escalated across administrative tiers:
  $$\text{Local Tier} \xrightarrow{\text{SLA Breach}} \text{District Tier} \xrightarrow{\text{SLA Breach}} \text{State Tier (Hard Cap)}$$
- **State-Tier Hard Cap**: Escalated state-tier complaints are permanently made public to ensure maximum transparency.
- Automatically docks the department's **Governance Score** (-10 to -15 points) upon violation.

### 3. 🛡️ Role-Based Access Control (RBAC) & Authentication
- **Citizens**: File grievances, track real-time audit trails, manually escalate unaddressed issues, and rate resolutions (1–5 Stars).
- **Department Officers**: Access department-scoped dashboards to inspect, update statuses (`in_review`, `resolved`, `rejected`), and leave formal remarks.
- **Super Admins**: Oversee city-wide KPIs, configure SLA windows, manage departments/officers, execute structural overrides, and generate AI governance reports.

### 4. 📜 Immutable Audit Trail
- Embedded `statusHistory` records every status transition with actor IDs, roles, timestamps, and reason remarks.

### 5. 📊 Live Governance Scorecard & Analytics
- Dynamic real-time calculation of departmental compliance rates, average citizen satisfaction, category distributions, and SLA health indicators.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   React 19 Frontend                    │
│      (Citizen Portal / Officer Dashboard / Admin)      │
└───────────────────────────┬────────────────────────────┘
                            │ REST API / JWT Tokens
┌───────────────────────────▼────────────────────────────┐
│                  Node.js / Express API                 │
│   ├── JWT Auth & RBAC Middleware                       │
│   ├── Gemini AI Handler (Triage & Executive Reports)   │
│   └── Background SLA Cron Worker (Periodic Scan)       │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
┌─────────────▼──────────────┐ ┌───────────▼─────────────┐
│    MongoDB with Mongoose   │ │     Google Gemini API   │
│ (Users, Depts, Complaints) │ │  (Text & Trend Analysis)│
└────────────────────────────┘ └─────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend UI** | React 19, Tailwind CSS, Lucide Icons, Vite |
| **Backend API** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose ODM (with embedded fallback) |
| **AI Integration** | Google Gemini API (`@google/genai`) |
| **Authentication** | JWT (Dual-Token: Access & Refresh Tokens), Bcrypt.js |
| **Automation** | Node.js Background Interval / Cron Worker |

---

## 🗄️ Database Schema (MongoDB / Mongoose)

### `User`
- `name` (String), `email` (String, unique), `passwordHash` (String)
- `role` (`"citizen"` | `"dept_admin"` | `"super_admin"`)
- `department` (ObjectId `ref: Department`)

### `Department`
- `name` (String, unique — e.g., Roads, Water, Power, Sanitation, Health)
- `slaDays` (Number — allowed turnaround days)
- `governanceScore` (Number — 0 to 100 dynamic performance metric)
- `admin` (ObjectId `ref: User`)

### `Complaint`
- `title`, `description`, `category`, `location` (Strings)
- `department` (ObjectId `ref: Department`), `citizen` (ObjectId `ref: User`)
- `status` (`"pending"` | `"in_review"` | `"resolved"` | `"rejected"` | `"escalated"`)
- `tier` (`"local"` | `"district"` | `"state"`)
- `photos` ([String]), `isPublic` (Boolean), `satisfactionRating` (Number, 1–5)
- `statusHistory` ([`{ status, changedBy, role, remark, timestamp }`])

### `Notification`
- `recipient` (ObjectId `ref: User`), `message` (String), `complaintId` (ObjectId), `read` (Boolean)

---

## 📡 API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a citizen or officer.
- `POST /api/auth/login` — Authenticate and receive JWT tokens.
- `POST /api/auth/logout` — Clear session cookies.
- `GET /api/auth/me` — Retrieve current authenticated user profile.
- `POST /api/auth/refresh` — Refresh expired access tokens.

### Complaints (`/api/complaints`)
- `GET /api/complaints` — Retrieve complaints (filtered by role and department).
- `POST /api/complaints` — Submit a new grievance (Citizen).
- `GET /api/complaints/:id` — Get single grievance with populated audit history.
- `PUT /api/complaints/:id/status` — Update grievance status (Department Officer/Admin).
- `POST /api/complaints/:id/escalate` — Manually escalate to next tier (Citizen).
- `POST /api/complaints/:id/rate` — Rate resolution satisfaction (Citizen).
- `POST /api/complaints/:id/override` — Administrative override resolution (Super Admin).

### AI Services (`/api/ai`)
- `POST /api/ai/analyze-complaint` — Gemini AI categorization, urgency, and routing.
- `POST /api/ai/governance-report` — AI-generated departmental performance summary.

### Analytics & Departments (`/api/analytics`, `/api/departments`)
- `GET /api/analytics` — Global resolution rate, SLA compliance, and category stats.
- `GET /api/departments` — List departments and governance scores.
- `PUT /api/departments/:id/sla` — Adjust department SLA duration (Super Admin).

---

## 💻 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun** / **yarn**

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/civicpulse.git
   cd civicpulse
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

---

## 🔑 Pre-Configured Demo Credentials

The database automatically seeds with demo accounts for easy evaluation:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Super Admin** | `admin@civicpulse.org` | `adminpassword` | Full system control & SLA settings |
| **Roads Officer** | `roads@civicpulse.org` | `admin123` | Roads Department grievances |
| **Water Officer** | `water@civicpulse.org` | `admin123` | Water Department grievances |
| **Citizen (Aarav)** | `aarav@gmail.com` | `citizen123` | Filing, tracking & rating grievances |
| **Citizen (Priya)** | `priya@gmail.com` | `citizen123` | Filing, tracking & rating grievances |

---

## 📁 Directory Structure

```text
├── CIVICPULSE_INTERVIEW_GUIDE.md # Interview Q&A and technical architecture guide
├── index.html                   # HTML frontend root
├── package.json                 # Project dependencies & scripts
├── server.js                    # Full-stack Node.js server entry point
├── src/                         # React 19 Frontend Application
│   ├── App.jsx                  # Main router and state manager
│   ├── index.css                # Global Tailwind CSS
│   └── components/              # Dashboard components (Citizen, Officer, Admin)
└── server/                      # Express.js REST API Backend
    ├── ai.js                    # Gemini AI prompt handlers
    ├── config/db.js             # Mongoose MongoDB connection & fallback
    ├── middleware/auth.js       # JWT & RBAC validation
    ├── models/                  # Mongoose models (User, Department, Complaint, Notification)
    ├── routes/                  # Modular API routes
    └── utils/                   # SLA escalation cron & database seeder
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
