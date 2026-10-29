# SAMADHAN — Final Test Matrix & Verification Log

**Total Verified Tests:** 66  
**Passed:** 66  
**Failed:** 0  
**Blocked:** 0  
**Execution Environment:** Node.js v22.16.0, Node Test Runner (`node --test`), Windows 11  
**Execution Date:** October 29, 2026  

---

## 1. System Health & Contract Envelope (`tests/app.test.js`)

| Test ID | Scenario | Expected Result | Actual Result | Status | Evidence Reference |
|---|---|---|---|:---:|---|
| **SYS-001** | `GET /` service information | Returns 200 with service metadata and documentation links | 200 OK returned with valid JSON envelope | **PASS** | `tests/app.test.js:ok 24` |
| **SYS-002** | `GET /api/v1/health` health probe | Returns 200 with `healthy: true` and uptime | 200 OK with operational status | **PASS** | `tests/app.test.js:ok 25` |
| **SYS-003** | `GET /api/v1/non-existent-route` | Returns standard 404 envelope with error code | 404 NOT_FOUND returned | **PASS** | `tests/app.test.js:ok 26` |

---

## 2. Authentication & Token Lifecycle (`tests/auth.test.js`)

| Test ID | Scenario | Expected Result | Actual Result | Status | Evidence Reference |
|---|---|---|---|:---:|---|
| **AUTH-001** | Login with valid credentials | 200 OK with signed JWT token and user profile | Token issued and user details returned | **PASS** | `tests/auth.test.js:ok 1` |
| **AUTH-002** | Login with invalid password | 401 INVALID_CREDENTIALS | 401 returned with generic error message | **PASS** | `tests/auth.test.js:ok 2` |
| **AUTH-003** | Login with non-existent user | 401 INVALID_CREDENTIALS (no username enumeration) | 401 returned without username disclosure | **PASS** | `tests/auth.test.js:ok 3` |
| **AUTH-004** | Login with disabled account | 403 ACCOUNT_DISABLED | 403 returned with deactivation notice | **PASS** | `tests/auth.test.js:ok 4` |
| **AUTH-005** | `GET /api/v1/auth/me` with valid token | 200 OK with authenticated user profile | User profile returned | **PASS** | `tests/auth.test.js:ok 5` |
| **AUTH-006** | `GET /api/v1/auth/me` without token | 401 UNAUTHENTICATED | 401 returned | **PASS** | `tests/auth.test.js:ok 6` |
| **AUTH-007** | `GET /api/v1/auth/me` with malformed token | 401 INVALID_TOKEN | 401 returned | **PASS** | `tests/auth.test.js:ok 7` |
| **AUTH-008** | Token revocation on logout | 200 OK; subsequent token usage returns 401 | Token recorded in revocation table and rejected | **PASS** | `tests/auth.test.js:ok 8` |

---

## 3. RBAC & Bureau Jurisdiction Scoping (`tests/rbac.test.js`)

| Test ID | Scenario | Expected Result | Actual Result | Status | Evidence Reference |
|---|---|---|---|:---:|---|
| **RBAC-001** | Bureau Officer attempts admin user access | 403 FORBIDDEN_ROLE | 403 returned; audit log recorded | **PASS** | `tests/rbac.test.js:ok 36` |
| **RBAC-002** | System Admin views user list | 200 OK with user array (passwords stripped) | 200 OK returned with safe fields | **PASS** | `tests/rbac.test.js:ok 37` |
| **RBAC-003** | RB Officer accesses RB-scoped records | 200 OK | 200 OK with RB cases | **PASS** | `tests/rbac.test.js:ok 38` |
| **RBAC-004** | RB Officer accesses PGRC-scoped records | 403 FORBIDDEN_BUREAU_SCOPE | 403 returned; cross-bureau attempt blocked | **PASS** | `tests/rbac.test.js:ok 39` |
| **RBAC-005** | PGRC Officer accesses PGRC-scoped records | 200 OK | 200 OK with PGRC cases | **PASS** | `tests/rbac.test.js:ok 40` |
| **RBAC-006** | Senior Official accesses cross-bureau oversight | 200 OK | 200 OK across all bureaus | **PASS** | `tests/rbac.test.js:ok 41` |
| **RBAC-007** | Bureau Officer accesses oversight endpoint | 403 FORBIDDEN_ROLE | 403 returned | **PASS** | `tests/rbac.test.js:ok 42` |
| **RBAC-008** | Admin provisions new officer account | 201 Created with hashed password | 201 Created; user provisioned | **PASS** | `tests/rbac.test.js:ok 43` |
| **RBAC-009** | Non-admin attempts account provisioning | 403 FORBIDDEN_ROLE | 403 returned | **PASS** | `tests/rbac.test.js:ok 44` |
| **RBAC-010** | Admin retrieves security audit trail | 200 OK with audit history | 200 OK with event logs | **PASS** | `tests/rbac.test.js:ok 45` |

---

## 4. Institution Registry & Dossier (`tests/institutions.test.js`)

| Test ID | Scenario | Expected Result | Actual Result | Status | Evidence Reference |
|---|---|---|---|:---:|---|
| **INST-001** | Paginated institution listing | 200 OK with pagination metadata and items | List returned with pagination | **PASS** | `tests/institutions.test.js:ok 31` |
| **INST-002** | 360° Institution Dossier retrieval | 200 OK with profile, AICTE ID, and complaint history | 200 OK with full cross-bureau history | **PASS** | `tests/institutions.test.js:ok 32` |
| **INST-003** | Register new institution | 201 Created with internal UUID | Record created successfully | **PASS** | `tests/institutions.test.js:ok 33` |
| **INST-004** | Duplicate AICTE Permanent ID registration | 409 Conflict | 409 CONFLICT returned | **PASS** | `tests/institutions.test.js:ok 34` |
| **INST-005** | Missing AICTE ID registration | Created with `identity_flag: REVIEW_REQUIRED` | Flagged for review without duplicate merge | **PASS** | `tests/institutions.test.js:ok 35` |

---

## 5. Complaint Management (`tests/complaints.test.js`)

| Test ID | Scenario | Expected Result | Actual Result | Status | Evidence Reference |
|---|---|---|---|:---:|---|
| **CMP-001** | List complaints with bureau scoping | 200 OK with scoped complaints | Scoped list returned | **PASS** | `tests/complaints.test.js:ok 19` |
| **CMP-002** | Register complaint with Case ID generation | 201 Created with `CMP-YYYY-BUREAU-XXXX` format | Record created with unique Case ID | **PASS** | `tests/complaints.test.js:ok 20` |
| **CMP-003** | Retrieve single complaint by ID | 200 OK with enriched institution metadata | 200 OK with dossier fields | **PASS** | `tests/complaints.test.js:ok 21` |
| **CMP-004** | Cross-bureau complaint intake by non-permitted user | 403 FORBIDDEN | 403 returned | **PASS** | `tests/complaints.test.js:ok 22` |
| **CMP-005** | Referencing non-existent institution | 404 NOT_FOUND | 404 returned | **PASS** | `tests/complaints.test.js:ok 23` |

---

## 6. CSV Batch Import (`tests/import.test.js`)

| Test ID | Scenario | Expected Result | Actual Result | Status | Evidence Reference |
|---|---|---|---|:---:|---|
| **IMP-001** | Preview validates rows, reports errors & resolves IDs | Valid rows flagged; invalid rows report row index & error | Row-by-row validation report returned | **PASS** | `tests/import.test.js:ok 27` |
| **IMP-002** | Preview detects duplicate Case ID in batch | Row rejected with duplicate ID error | Duplicate flagged | **PASS** | `tests/import.test.js:ok 28` |
| **IMP-003** | Commit requires explicit confirmation flag | 400 MISSING_CONFIRMATION | Rejected without write | **PASS** | `tests/import.test.js:ok 29` |
| **IMP-004** | Commit executes batch write and logs audit event | 201 Created; records inserted and audited | All valid records committed; audit logged | **PASS** | `tests/import.test.js:ok 30` |

---

## 7. Workflow State Machine (`tests/workflow.test.js`)

| Test ID | Scenario | Expected Result | Actual Result | Status | Evidence Reference |
|---|---|---|---|:---:|---|
| **WF-001** | Valid status progression (`RECEIVED` $\rightarrow$ `UNDER_PROCESS`) | Status updated; timeline action recorded | Status updated; action history logged | **PASS** | `tests/workflow.test.js:ok 54` |
| **WF-002** | Illegal jump (`RECEIVED` $\rightarrow$ `DISPOSED`) | 400 INVALID_WORKFLOW_TRANSITION | 400 returned; transition blocked | **PASS** | `tests/workflow.test.js:ok 55` |
| **WF-003** | Officer assignment update | Handling officer updated; assigned notification generated | Assigned officer updated; timeline logged | **PASS** | `tests/workflow.test.js:ok 56` |

---

## 8. Case Intelligence & Matching (`tests/caseIntelligence.test.js`)

| Test ID | Scenario | Expected Result | Actual Result | Status | Evidence Reference |
|---|---|---|---|:---:|---|
| **INTEL-001** | Run matching on complaint | 200 OK with explainable alerts and scores | Alerts returned with confidence scores | **PASS** | `tests/caseIntelligence.test.js:ok 9` |
| **INTEL-002** | Scope masking for non-cleared officer | Subject line summarized with `[CROSS-BUREAU]` tag | Sensitive allegations masked | **PASS** | `tests/caseIntelligence.test.js:ok 10` |
| **INTEL-003** | Senior Official sees unmasked intelligence | Full subject and details visible | Full details accessible | **PASS** | `tests/caseIntelligence.test.js:ok 11` |
| **INTEL-004** | Confirm match link with mandatory justification | Link created in `case_links`; independent cases preserved | Link recorded without destructive merger | **PASS** | `tests/caseIntelligence.test.js:ok 12` |
| **INTEL-005** | Confirm link without justification | 400 MISSING_JUSTIFICATION | 400 returned | **PASS** | `tests/caseIntelligence.test.js:ok 13` |
| **INTEL-006** | Dismiss false alert with rationale | Alert status set to `DISMISSED` | Alert dismissed with reason | **PASS** | `tests/caseIntelligence.test.js:ok 14` |
| **INTEL-007** | List links for complaint | Returns list of confirmed cross-bureau links | Associated links returned | **PASS** | `tests/caseIntelligence.test.js:ok 15` |
| **INTEL-008** | Synthetic benchmark evaluation endpoint | Returns 14-scenario benchmark metrics | 100% Precision / Recall returned | **PASS** | `tests/caseIntelligence.test.js:ok 16` |
| **INTEL-009** | Unauthorized officer matching attempt | 403 FORBIDDEN_JURISDICTION | 403 returned | **PASS** | `tests/caseIntelligence.test.js:ok 17` |
| **INTEL-010** | Non-existent complaint matching | 404 NOT_FOUND | 404 returned | **PASS** | `tests/caseIntelligence.test.js:ok 18` |

---

## 9. Workflow, Transfers, Notifications & SLA (`tests/workflowAndNotifications.test.js`)

| Test ID | Scenario | Expected Result | Actual Result | Status | Evidence Reference |
|---|---|---|---|:---:|---|
| **WFN-001** | Valid status transition execution | Status updated; `case_actions` entry created | Status updated; timeline entry logged | **PASS** | `tests/workflowAndNotifications.test.js:ok 57` |
| **WFN-002** | Invalid status transition rejected | 400 Bad Request | 400 returned | **PASS** | `tests/workflowAndNotifications.test.js:ok 58` |
| **WFN-003** | Unauthorized transfer attempt by other bureau officer | 403 FORBIDDEN_JURISDICTION | 403 returned | **PASS** | `tests/workflowAndNotifications.test.js:ok 59` |
| **WFN-004** | Authorized bureau transfer | Bureau updated; old/new owner logged in timeline | Transfer executed and audited | **PASS** | `tests/workflowAndNotifications.test.js:ok 60` |
| **WFN-005** | Case priority escalation | Severity set to `CRITICAL`; Senior Official notified | Escalated to CRITICAL; alert created | **PASS** | `tests/workflowAndNotifications.test.js:ok 61` |
| **WFN-006** | Case closure with review disabled | Directly transitions to `DISPOSED` | Directly marked as DISPOSED | **PASS** | `tests/workflowAndNotifications.test.js:ok 62` |
| **WFN-007** | Case reopening requires Senior Official | Non-senior rejected with 403; Senior succeeds with `CASE_REOPENED` | Reopened only by Senior Official | **PASS** | `tests/workflowAndNotifications.test.js:ok 63` |
| **WFN-008** | Dynamic SLA calculation | Calculates overdue days for active cases; sets 0 for disposed | Dynamic state computed accurately | **PASS** | `tests/workflowAndNotifications.test.js:ok 64` |
| **WFN-009** | SLA reminder 24-hour deduplication | Scans complaints and skips alerts already generated within 24h | Duplicate alert generation prevented | **PASS** | `tests/workflowAndNotifications.test.js:ok 65` |
| **WFN-010** | Notification read toggle & unread count | Marks notification as read; decreases unread counter | Notification read state updated | **PASS** | `tests/workflowAndNotifications.test.js:ok 66` |

---

## 10. Dashboard, Scoped Search & CSV Export (`tests/reportsAndDashboard.test.js`)

| Test ID | Scenario | Expected Result | Actual Result | Status | Evidence Reference |
|---|---|---|---|:---:|---|
| **REP-001** | Unauthenticated metrics request | 401 UNAUTHENTICATED | 401 returned | **PASS** | `tests/reportsAndDashboard.test.js:ok 46` |
| **REP-002** | Senior Official receives consolidated metrics | Real database counts; no double-counting; sum equals total | Metrics reconcile with 100% precision | **PASS** | `tests/reportsAndDashboard.test.js:ok 47` |
| **REP-003** | Bureau Officer scoped metrics | Counts restricted to officer's assigned bureau | Scoped total matches bureau workload | **PASS** | `tests/reportsAndDashboard.test.js:ok 48` |
| **REP-004** | Multi-criteria search by category, status, bureau | Filtered items match all criteria with dynamic SLA | Filtered items match correctly | **PASS** | `tests/reportsAndDashboard.test.js:ok 49` |
| **REP-005** | Search scope enforcement on Bureau Officer | Backend restricts search to officer's bureau | Query overridden to assigned bureau | **PASS** | `tests/reportsAndDashboard.test.js:ok 50` |
| **REP-006** | Overdue-only search filter | Returns only active complaints past SLA deadline | All items verified overdue | **PASS** | `tests/reportsAndDashboard.test.js:ok 51` |
| **REP-007** | CSV report export with download headers | 200 OK with `text/csv` and attachment filename | Streamed CSV with correct headers | **PASS** | `tests/reportsAndDashboard.test.js:ok 52` |
| **REP-008** | Anti-Formula-Injection protection in CSV | Cells starting with `=`, `+`, `-`, `@` are prepended with `'` | Dangerous formula prefix prepended with `'` | **PASS** | `tests/reportsAndDashboard.test.js:ok 53` |
