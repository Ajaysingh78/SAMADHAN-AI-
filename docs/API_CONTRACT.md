# SAMADHAN — REST API Contract

**API Version:** `v1`  
**Base URL:** `/api/v1`  
**Data Format:** `application/json`  

---

## 1. Authentication & User Management

### `POST /api/v1/auth/login`
* **Access**: Public
* **Request**:
  ```json
  {
    "username": "officer_rb",
    "password": "Password@123"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "usr-01",
        "name": "Rajesh Kumar",
        "username": "officer_rb",
        "role": "BUREAU_OFFICER",
        "bureau": "REGULATION_BUREAU",
        "region": "ALL"
      }
    }
  }
  ```

### `GET /api/v1/auth/me`
* **Access**: Authenticated (Bearer Token)
* **Response (200 OK)**: Current authenticated user details and active permissions.

---

## 2. Institution Registry Endpoints

### `GET /api/v1/institutions`
* **Access**: Authenticated
* **Query Parameters**: `search`, `region`, `status`, `page`, `limit`
* **Response (200 OK)**: List of institutions with active complaint summary counts.

### `GET /api/v1/institutions/:id`
* **Access**: Authenticated
* **Response (200 OK)**: Full 360° institution dossier including AICTE Permanent ID, address, approved courses, and chronological complaint history across all bureaus.

---

## 3. Complaint Management Endpoints

### `GET /api/v1/complaints`
* **Access**: Authenticated (Scoped by Bureau/Region unless Senior Official or Admin)
* **Query Parameters**: `bureau`, `status`, `category`, `search`, `overdueOnly`, `page`, `limit`
* **Response (200 OK)**: Paginated list of complaints with SLA indicators.

### `POST /api/v1/complaints`
* **Access**: Authorized Bureau Officers / Admin
* **Request**:
  ```json
  {
    "institutionId": "inst-102",
    "bureau": "PGRC",
    "category": "FACULTY_GRIEVANCE",
    "subject": "Delayed salary disbursement and arbitrary contract modification",
    "description": "Faculty members of Department of CS report non-payment of salaries for 4 months...",
    "complainantType": "FACULTY",
    "severity": "HIGH",
    "slaDays": 30
  }
  ```
* **Response (201 Created)**: Created complaint record with auto-generated unique case ID.

### `POST /api/v1/complaints/import-csv`
* **Access**: Authorized Bureau Officers / Admin
* **Request**: Multipart CSV or validated JSON array payload
* **Response (200 OK)**: Import report (valid rows imported, duplicate case IDs skipped, validation errors).

---

## 4. Case Intelligence & Overlap Endpoints

### `GET /api/v1/case-intelligence/candidates/:complaintId`
* **Access**: Authorized Officers / Senior Officials
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "targetComplaint": { "caseId": "CMP-2026-PGRC-042", "institutionName": "Apex Institute of Tech" },
      "potentialMatches": [
        {
          "candidateCaseId": "CMP-2026-RB-019",
          "candidateBureau": "REGULATION_BUREAU",
          "matchScore": 0.82,
          "matchType": "POTENTIAL_OPERATIONAL_OVERLAP",
          "evidence": {
            "sameInstitution": true,
            "aictePermanentId": "1-30491823",
            "categoryMatch": true,
            "category": "FACULTY_GRIEVANCE",
            "overlappingKeywords": ["salary", "delay", "faculty", "non-payment"],
            "crossBureauAlert": "PGRC vs REGULATION_BUREAU active concurrent inquiry"
          }
        }
      ]
    }
  }
  ```

### `POST /api/v1/case-intelligence/review`
* **Access**: Authorized Bureau Officers / Admin
* **Request**:
  ```json
  {
    "primaryCaseId": "CMP-2026-PGRC-042",
    "targetCaseId": "CMP-2026-RB-019",
    "decision": "CONFIRM_LINK", // or "DISMISS_ALERT"
    "justification": "Both complaints allege systematic withholding of salaries in CS department under same management."
  }
  ```
* **Response (200 OK)**: Link confirmation recorded, audit trail generated, no destructive data merge.

---

## 5. Workflow, Action Timeline, Notifications & SLA Endpoints

### `GET /api/v1/workflow/complaints/:id/actions`
* **Access**: Authenticated (Scope enforced by Bureau)
* **Response (200 OK)**: Complete chronological action history (registration, status changes, transfers, escalations, reviews, reopenings).

### `POST /api/v1/workflow/complaints/:id/transition`
* **Access**: Authorized Officer / Senior Official
* **Request**:
  ```json
  {
    "newStatus": "UNDER_PROCESS", // or "HEARING_COMMITTEE", "DISPOSED", "REOPENED", etc.
    "remarks": "Review of response documents conducted; proceeding to hearing committee stage.",
    "documentReference": "DOC-REF-2026-092"
  }
  ```
* **Response (200 OK)**: Updated case record and newly recorded action history entry. Dverts to `CLOSURE_REQUESTED` if configurable closure review is active.

### `POST /api/v1/workflow/complaints/:id/transfer`
* **Access**: Authorized Officer of source Bureau / Senior Official / Admin
* **Request**:
  ```json
  {
    "destinationBureau": "APPROVAL_BUREAU",
    "transferReason": "Matter pertains to institutional approval deficiency and accreditation compliance.",
    "targetOfficerId": "usr-officer-approval-01"
  }
  ```
* **Response (200 OK)**: Case jurisdiction updated with old/new owner tracking, action logged, destination notified.

### `POST /api/v1/workflow/complaints/:id/escalate`
* **Access**: Authorized Officer / Senior Official / Admin
* **Request**:
  ```json
  {
    "escalationReason": "Institution failed to respond within 14 days and student safety concerns raised."
  }
  ```
* **Response (200 OK)**: Case escalated to `CRITICAL` priority, logged to timeline, Senior Official alerted.

### `GET /api/v1/workflow/notifications`
* **Access**: Authenticated (User-scoped)
* **Query Parameters**: `unreadOnly=true|false`, `limit=50`
* **Response (200 OK)**: List of persistent notifications with unread count.

### `GET /api/v1/workflow/notifications/unread-count`
* **Access**: Authenticated
* **Response (200 OK)**: `{ "unreadCount": 3 }`

### `PATCH /api/v1/workflow/notifications/:id/read`
* **Access**: Notification recipient
* **Response (200 OK)**: Notification marked as read.

### `PATCH /api/v1/workflow/notifications/read-all`
* **Access**: Authenticated
* **Response (200 OK)**: Marks all user's notifications as read.

### `POST /api/v1/workflow/cron/check-slas`
* **Access**: Authenticated / Scheduled Service
* **Response (200 OK)**: Scans cases, calculates dynamic SLA status, and dispatches deduplicated alerts for approaching or overdue deadlines.

### `GET /api/v1/workflow/config`
* **Access**: Authenticated
* **Response (200 OK)**: Current workflow policy parameters (`REQUIRE_CLOSURE_REVIEW`, SLA duration defaults).

### `PATCH /api/v1/workflow/config`
* **Access**: System Administrator only (`ADMIN`)
* **Request**: `{ "key": "REQUIRE_CLOSURE_REVIEW", "value": "true" }`
* **Response (200 OK)**: Configuration updated and logged to security audit trail.

### `GET /api/v1/workflow/audit`
* **Access**: Senior Official (`SENIOR_OFFICIAL`) / Admin (`ADMIN`)
* **Query Parameters**: `limit`, `offset`, `eventType`
* **Response (200 OK)**: System-wide immutable security and administrative audit log trail.

---

## 6. Dashboard & Analytics Endpoints

### `GET /api/v1/reports/metrics`
* **Access**: Authenticated (Role-aware aggregation)
* **Response (200 OK)**:
  ```json
  {
    "totalCases": 142,
    "pending": 48,
    "underProcess": 65,
    "disposed": 29,
    "overdue": 14,
    "crossBureauLinkedCases": 12,
    "bureauWorkload": {
      "REGULATION_BUREAU": 62,
      "PGRC": 58,
      "APPROVAL_BUREAU": 22
    },
    "ageingDistribution": {
      "within15Days": 55,
      "between15And30Days": 43,
      "overdue30PlusDays": 14
    }
  }
  ```
