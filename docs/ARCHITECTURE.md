# SAMADHAN — System Architecture & Mind Map

**Document Version:** 1.0.0  
**Status:** Approved Foundation  
**System Title:** Cross-Bureau Case Intelligence & Coordination Platform (SIH26264)  

---

## 1. Architectural Principles

1. **Solve Stated Problem First**: Focus squarely on cross-bureau visibility, overlap identification, and coordinated follow-up between AICTE cells (Regulation Bureau & PGRC).
2. **Preserve Record Autonomy**: Each complaint maintains its own lifecycle, unique ID, assigned officer, and history. No automated destruction or merging.
3. **Explainable AI Matching**: Case intelligence provides evidence breakdowns (common identifiers, overlapping categories, high-weight semantic keywords) rather than opaque percentages.
4. **Human-in-the-Loop Governance**: Case linkage requires explicit officer review with recorded justifications.
5. **Security at Backend**: Frontend handles interaction and presentation; backend enforces all permissions, scopes, and business rules.

---

## 2. Logical System Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │             Public Experience                │
                  │   Landing Page, System Overview, Sign In     │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │          Authenticated Client (React)        │
                  │  Design System, Navigation, Route Guard,     │
                  │  Dashboard, Institution 360°, Case Intake,    │
                  │  Match Review Portal, Case Timeline & Audit  │
                  └──────────────────────┬───────────────────────┘
                                         │ HTTPS / REST (JSON)
                                         │ Bearer JWT
                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Backend API (Node.js + Express)                 │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │   Auth & Security     │  │          API Route Handlers           │  │
│  │ JWT Verify, RBAC,     │  │ /auth, /institutions, /complaints,    │  │
│  │ Scope (Bureau/Region) │  │ /case-intelligence, /workflow,        │  │
│  │ Rate Limit, CORS      │  │ /notifications, /reports, /audit      │  │
│  └───────────┬───────────┘  └───────────────────┬───────────────────┘  │
│              │                                  │                      │
│              ▼                                  ▼                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Service Business Logic                       │  │
│  │  - Institution Service       - Workflow & SLA Engine             │  │
│  │  - Complaint Service         - Notification Dispatcher           │  │
│  │  - Audit Logging Service     - Reports & Aggregator              │  │
│  └──────────────────┬───────────────────────────┬───────────────────┘  │
│                     │                           │                      │
│                     ▼                           ▼                      │
│  ┌────────────────────────────────────┐ ┌───────────────────────────┐  │
│  │   Case Intelligence Engine         │ │    Database Access Layer  │  │
│  │   - Identifier Normalization       │ │    - MySQL Connection Pool│  │
│  │   - Candidate Retrieval Query      │ │    - Transaction Manager  │  │
│  │   - Rule & Metadata Comparison     │ │    - Prepared Statements  │  │
│  │   - TF-IDF + Cosine Similarity     │ │                           │  │
│  │   - Explainability Card Generator  │ │                           │  │
│  └────────────────────────────────────┘ └─────────────┬─────────────┘  │
└───────────────────────────────────────────────────────┼────────────────┘
                                                        │
                                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Database Layer (MySQL 8.0)                       │
│                                                                        │
│  - institutions        - complaints          - case_assignments        │
│  - users & roles       - case_actions        - potential_matches       │
│  - user_scopes         - confirmed_links     - audit_logs              │
│  - notifications       - system_settings                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Master Mind Map

```
SAMADHAN
|
|-- A. Public Experience
|   |-- Homepage & Landing Hero
|   |-- Problem Context & Vision (SIH26264)
|   |-- Key Capabilities (360° Profile, Intelligence, Traceability)
|   |-- How-It-Works (Step-by-step Bureau Coordination)
|   |-- Security, Privacy & Governance Safeguards
|   |-- Secure Officer Sign-In Portal
|
|-- B. Authentication & Authorization
|   |-- JWT Session Token Lifecycle (Access + Expiry)
|   |-- Secure Password Hashing (bcrypt)
|   |-- 4 Core Roles:
|   |   |-- System Administrator (User/Scope/Settings management)
|   |   |-- Bureau Officer (RB / PGRC dealing officer actions)
|   |   |-- Regional Officer (Regional inspection & tracking)
|   |   |-- Senior Official (Executive oversight, SLA monitoring)
|   |-- Data Scoping: Bureau-level & Region-level access boundaries
|   |-- Protected API Middleware & Centralized Error Handlers
|
|-- C. Institution Registry
|   |-- Unique AICTE Permanent ID Resolution
|   |-- Institution Master Details (Name, Region, Address, Status)
|   |-- Consolidated 360° Complaint History
|   |-- Institution Search & Filter by Region/State
|
|-- D. Complaint Management
|   |-- Unique Case ID Generation (e.g., CMP-2026-PGRC-001)
|   |-- Complaint Intake Form (Category, Description, Complainant Info)
|   |-- Validated CSV/Excel Batch Import with Preview & Duplicate Check
|   |-- Case Details View with History & Document Reference
|   |-- Category & Severity Tagging (Standard, High, Critical/Urgent)
|
|-- E. Cross-Bureau Case Intelligence (Differentiator)
|   |-- Normalized Entity & Candidate Case Retrieval
|   |-- 3-Tier Matching Engine:
|   |   |-- Exact Identifier Check (AICTE Permanent ID)
|   |   |-- Rule & Metadata Checks (Category, Time Window, Subject)
|   |   |-- Text Similarity (TF-IDF Vectorizer + Cosine Similarity)
|   |-- Explainable Overlap Alert:
|   |   |-- Shared Evidence Card (Matched Keywords, Category, Bureau)
|   |   |-- Distinction: Same Institution vs Overlap vs Unrelated
|   |-- Officer Review Workflow (Confirm Link, Dismiss Alert)
|   |-- Immutable Link Reason & Officer Attribution
|
|-- F. Case Workflow & Action History
|   |-- Valid State Transitions:
|   |   Received -> Under Scrutiny -> Action Initiated -> Hearing/Committee -> Disposed
|   |-- Traceable Chronological Action Timeline
|   |-- Dynamic SLA & Overdue Calculation:
|   |   |-- Normal (< 20 days)
|   |   |-- Approaching SLA (20-30 days)
|   |   |-- Overdue (> 30 days -> Auto-flagged for Escalation)
|   |-- Authorized Transfer & Coordination Notes
|
|-- G. Notifications & Audit
|   |-- In-App Alerts (New Overlap Detected, Approaching Due Date, Escalation)
|   |-- Mark Read / Unread Functionality
|   |-- Security Event Auditing (Login, Auth Failure, Scope Violation)
|   |-- Business Audit Trail (Case Link, Status Transition, Reopening)
|
|-- H. Operational Dashboard & Analytics
|   |-- KPI Metric Cards (Total, Pending, Disposed, Overdue, Cross-Bureau Links)
|   |-- Bureau Workload Distribution (RB vs PGRC vs Regional)
|   |-- SLA Ageing Analysis Bar Chart (<15d, 15-30d, >30d)
|   |-- Regional Case Density Heatmap / Table
|   |-- Exportable Institution Dossier (PDF / CSV format)
|
|-- I. Quality, Security & Operations
    |-- Automated Integration & Service Tests
    |-- Input Sanitization & SQL Injection Prevention
    |-- Fully Responsive Public Sector Design System
    |-- PPT Claim Tracking & Evaluation Benchmark Reporting
```
