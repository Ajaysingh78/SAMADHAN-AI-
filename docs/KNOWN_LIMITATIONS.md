# SAMADHAN — Known Limitations & Operational Boundaries

This document provides transparent, factual disclosure of the current operational boundaries, architectural assumptions, and prototype scope for **SAMADHAN (SIH26264)**.

---

## 1. Data & Environment Boundaries

### 1.1 Synthetic Demonstration Datasets
* **Current State:** All institutions (e.g., *Apex Institute of Technology*, *Delhi Institute of Engineering*), complaint narratives, Case IDs, and officer assignments are realistic synthetic test fixtures.
* **Boundary:** No live connection to AICTE internal intranet databases (e.g., AICTE Web Portal / Approval Bureau legacy servers) is claimed or attempted.
* **Safety:** No real student, faculty, or institutional confidential grievance data is stored or processed in this environment.

### 1.2 Dual-Mode Persistence Architecture
* **Current State:** The backend operates with dual-mode storage: it connects to MySQL 8.0 when configured, or transparently falls back to an in-memory transactional relational store.
* **Boundary:** In the in-memory fallback mode, data modifications persist during server runtime but reinitialize to clean baseline seeds upon process restart. For permanent local persistence, configure a local MySQL instance as detailed in [`docs/LOCAL_SETUP.md`](file:///c:/Users/Hamada%20Salim%20G-Trd/SIH26264/docs/LOCAL_SETUP.md).

---

## 2. Governance & Workflow Rules

### 2.1 Configurable Demo Policies vs. Official Statutes
* **SLA Thresholds:** The application uses prototype demonstration SLA durations (`CRITICAL`: 7 days, `HIGH`: 14 days, `STANDARD`: 30 days). These are development settings configured in `workflow_config` and must not be cited as verified statutory AICTE procedural limits.
* **Optional Closure Review:** The `REQUIRE_CLOSURE_REVIEW` toggle is disabled (`false`) by default to allow authorized dealing officers to close cases without mandatory senior approval bottlenecking routine disposals. Enabling this policy routes closures to `CLOSURE_REQUESTED` awaiting Senior Official sign-off.
* **Escalations:** Escalations to `CRITICAL` represent application priority flags for prioritized inquiry and notification, not statutory penal actions.

---

## 3. Automation & External Integrations

### 3.1 Background Processing Runner
* **Current State:** The SLA reminder and overdue detection engine is implemented as an idempotent service endpoint:
  ```http
  POST /api/v1/workflow/cron/check-slas
  ```
  It incorporates a 24-hour suppression window to prevent duplicate alert generation.
* **Boundary:** No continuous daemon process or OS cron job is started by default in the local development environment. Administrators or evaluators can trigger scans on-demand via the Workflow Operations UI or an external curl/cron call.

### 3.2 External Communication Channels
* **In-App Notifications:** Persistent in-app notifications with real-time polling and unread counters are fully functional.
* **Boundary:** External SMS alerts (e.g., via CDAC / NIC SMS Gateway) and external SMTP email dispatch are not integrated into the prototype. In-app alerts serve as the complete prototype notification center.

---

## 4. Case Intelligence Quality Constraints

### 4.1 Evaluation Scope
* **Benchmark Size:** The case intelligence benchmark consists of 14 ground-truth test pairs covering multi-bureau overlaps, capitation fee disputes, salary non-payments, and disjoint matters at identical colleges.
* **Performance:** While the benchmark demonstrates 100% precision and recall on these curated test scenarios, natural-language variance, non-English regional dialects, or poorly drafted complaints in real-world scenarios may require continuous dictionary expansion and domain tuning.
* **Human-in-the-Loop:** Case matching is explicitly a decision-support indicator. Under no circumstances should automated matches be permitted to auto-adjudicate, merge, or dispose of complaints without human officer authorization.
