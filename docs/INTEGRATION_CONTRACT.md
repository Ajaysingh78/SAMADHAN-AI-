# samadhanX — Integration Contract & Six-Phase Roadmap

**Document Version:** 1.0.0  
**Status:** Approved Foundation  

---

## 1. Six-Phase Implementation Boundaries

Each phase delivers a cohesive increment of the same unified codebase. Later phases build strictly upon the foundation and contracts established in earlier phases.

```
┌────────────────────────────────────────────────────────┐
│  PHASE 1: Foundation, Homepage & Design System         │
│  - App skeleton, Vite/React client, Express server     │
│  - Reusable Gov-grade UI Design System & Tokens        │
│  - Public Homepage, Routing Shell, API Client base     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  PHASE 2: JWT Authentication & Role-Based Access       │
│  - User/Role/Scope models, password hashing (bcrypt)   │
│  - JWT token lifecycle, backend authorization guards   │
│  - Protected routes, role switching, seed accounts     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  PHASE 3: Institution Registry & Complaint Management  │
│  - MySQL schema: institutions, complaints, assignments │
│  - AICTE Permanent ID resolution & 360° dossier        │
│  - Complaint registration, search, filtering, CSV import│
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  PHASE 4: Explainable Case Intelligence Engine         │
│  - Node.js TF-IDF + Cosine similarity + Rules          │
│  - Overlap alert generation with explainability card   │
│  - Human-in-the-loop review (Link / Dismiss / Reason)  │
│  - Synthetic benchmark evaluation (Precision/Recall/F1)│
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  PHASE 5: Workflow, Timeline, Reminders & Audit Logs   │
│  - Validated state transitions, action logging         │
│  - Dynamic SLA overdue calculation & automated alerts  │
│  - In-app notification center & full audit history     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  PHASE 6: Dashboard, Analytics & Final Integration QA  │
│  - Role-aware executive & operational dashboards       │
│  - Bureau workloads, ageing distribution, export tools │
│  - End-to-end integration tests & PPT changelog audit  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Shared Cross-Phase Conventions

### 2.1 Communication Protocol
* All client-to-server communication occurs over HTTP/REST using JSON payloads.
* API endpoints are versioned with the `/api/v1` prefix.
* Authentication credentials are sent via the HTTP Authorization header: `Authorization: Bearer <jwt_token>`.

### 2.2 Standard Error Response Format
All error responses from the backend follow this strict envelope:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The provided complaint data contains errors.",
    "details": [
      { "field": "institutionId", "message": "Valid AICTE Permanent ID is required" }
    ]
  }
}
```

### 2.3 Standard Success Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 85
  }
}
```

### 2.4 State Management
* The React frontend will maintain session authentication state centrally via React Context or a lightweight store.
* Server state (API data) will use clean, centralized API services to fetch and refresh data upon mutations.

---

## 3. Module Boundaries & Dependencies

| Module | Source Location | Depends On | Exposes To |
|---|---|---|---|
| **Design System** | `client/src/styles/`, `components/common/` | None | Entire frontend |
| **Auth & RBAC** | `server/src/modules/auth/`, `middleware/auth.js` | MySQL `users`, `roles` | Protected endpoints, Router guards |
| **Institution Registry** | `server/src/modules/institutions/` | Database layer, Auth | Complaint forms, Institution 360° |
| **Complaint Mgmt** | `server/src/modules/complaints/` | Institution Registry, Auth | Dashboard, Case Intelligence |
| **Case Intelligence** | `server/src/modules/case-intelligence/` | Complaints, Institutions | Match Review Portal, Overlap Alerts |
| **Workflow & Audit** | `server/src/modules/workflow/`, `audit/` | Complaints, Users | Case Timeline, Audit Logs, Reminders |
| **Dashboard Analytics**| `server/src/modules/reports/` | All data tables | Executive & Operational Dashboards |

---

## 4. Anti-Corruption & Governance Rules

1. **No Destructive Merges**: A link between Case A (Regulation Bureau) and Case B (PGRC) creates a record in `confirmed_links`. Neither case is altered or subsumed.
2. **Deterministic Overdue Calculation**: Overdue days are calculated dynamically as $\max(0, \text{current\_date} - \text{sla\_deadline})$. Status values are not hard-coded flags.
3. **Traceable Attribution**: Every action (status change, case assignment, link confirmation, alert dismissal) must write a row to `case_actions` and `audit_logs` capturing `user_id`, `timestamp`, `action_type`, and `remarks`.
