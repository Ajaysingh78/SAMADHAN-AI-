# SAMADHAN — Local Setup & Execution Guide

This document provides complete instructions to set up, configure, run, test, and safely reset the **SAMADHAN** platform locally.

---

## 1. Prerequisites

Ensure your development environment meets the following minimum requirements:

* **Node.js**: `v18.x` or higher (verified on `v22.16.0`)
* **npm**: `v9.x` or higher (verified on `v10.9.2`)
* **MySQL** (Optional for local demo): `v8.0` or higher
  * *Note:* SAMADHAN incorporates an automatic dual-mode database engine. When MySQL is unavailable, the platform seamlessly boots using an isolated in-memory relational store pre-seeded with synthetic institutional data, ensuring zero-configuration local evaluation.
* **Modern Web Browser**: Chrome, Edge, Firefox, or Safari

---

## 2. Environment Configuration

### Server Configuration
Create `server/.env` using `.env.example`:

```bash
# Server Environment
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5174


# Security & Authentication
JWT_SECRET=super_secret_samadhan_jwt_key_2026_sih
JWT_EXPIRES_IN=8h

# Database Configuration (Optional MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=samadhan_db
```

### Client Configuration
The client runs on Vite and defaults to communicating with `http://localhost:5000/api/v1`.

---

## 3. Installation

From the project root directory, install dependencies for both the backend and frontend:

```bash
# 1. Install server dependencies
cd server
npm install

# 2. Install client dependencies
cd ../client
npm install
cd ..
```

---

## 4. Database Setup & Migrations (Optional MySQL Mode)

If using MySQL 8.0 locally:

1. Create the database:
   ```sql
   CREATE DATABASE IF NOT EXISTS samadhan_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Apply the ordered SQL migrations located in `server/src/db/migrations/`:
   * `001_initial_schema.sql` (Master users, institutions, complaints, case_actions, audit_logs)
   * `002_create_revoked_tokens.sql` (Token revocation blocklist)
   * `003_create_case_intelligence_schema.sql` (Match alerts and case links)
   * `004_create_workflow_and_notifications.sql` (Persistent notifications and workflow config)

---

## 5. Development Seed Accounts

In non-production environments (`NODE_ENV !== 'production'`), development accounts are automatically seeded:

| Role | Username | Password | Assigned Scope | Description |
|---|---|---|---|---|
| **System Administrator** | `admin_sys` | `Password@123` | Global (`ALL`) | Full user management, security audit log access, global policy config |
| **Bureau Officer (RB)** | `officer_rb` | `Password@123` | `REGULATION_BUREAU` | Dealing officer for Regulation Bureau inquiries and match reviews |
| **Bureau Officer (PGRC)** | `officer_pgrc` | `Password@123` | `PGRC` | Dealing officer for Public Grievance Redressal Cell cases |
| **Senior Official** | `official_senior` | `Password@123` | Executive Oversight | Cross-bureau visibility, closure sign-offs, and critical escalations |
| **Regional Officer** | `officer_ro_north` | `Password@123` | `Northern` Region | Regional college inspections and local complaint monitoring |

> [!IMPORTANT]
> These seed credentials are for local development and beta evaluation only. Never deploy seed credentials to production environments.

---

## 6. Running the Platform

### Terminal 1: Start Backend API Server
```bash
cd server
npm run dev
```
* Backend runs at: `http://localhost:5000`
* Healthcheck endpoint: `http://localhost:5000/api/v1/health`

### Terminal 2: Start Frontend Application
```bash
cd client
npm run dev
```
* Frontend runs at: `http://localhost:5174`
* Public Landing Page: `http://localhost:5174/`
* Login Portal: `http://localhost:5174/login`
* Integrated Operations Dashboard: `http://localhost:5174/app`


---

## 7. Running the Automated Test Suite

SAMADHAN includes a complete regression test suite covering all six phases:

```bash
cd server
npm test
```

### Verified Test Breakdown (66 Tests Passing):
1. **Authentication & Session Lifecycle** (`tests/auth.test.js`) — 8 tests
2. **RBAC & Bureau Scope Enforcement** (`tests/rbac.test.js`) — 10 tests
3. **Institution Registry & Dossier** (`tests/institutions.test.js`) — 5 tests
4. **Complaint Case Tracking** (`tests/complaints.test.js`) — 5 tests
5. **CSV Batch Import Engine** (`tests/import.test.js`) — 4 tests
6. **Case Intelligence & Cross-Bureau Matching** (`tests/caseIntelligence.test.js`) — 10 tests
7. **Workflow, Action Timeline, & Notifications** (`tests/workflowAndNotifications.test.js`) — 10 tests
8. **Dashboard Metrics, Scoped Search & CSV Export** (`tests/reportsAndDashboard.test.js`) — 8 tests
9. **API Service Health & Contract** (`tests/app.test.js`) — 3 tests
10. **Workflow Transition Validation** (`tests/workflow.test.js`) — 3 tests

---

## 8. Safe Local Reset

To safely reset your local demonstration environment back to clean initial seed data:

1. Stop both backend and frontend servers (`Ctrl + C`).
2. Restart the backend server (`npm run dev` in `server`).
   * In-memory store automatically reinitializes with clean baseline seed users, institutions, and synthetic complaints.
   * If running MySQL, re-run the migration and seed scripts; **never** execute destructive drops against production databases.
