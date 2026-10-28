# SAMADHAN — Security & Authorization Architecture

**Document Version:** 1.0.0  
**Status:** Approved Foundation  

---

## 1. Security Philosophy

1. **Deny by Default**: Every API endpoint is unauthenticated unless explicitly declared public (e.g., login, landing page assets).
2. **Backend is the Sole Authority**: The React client renders UI states based on claims, but the Express API strictly authenticates, authorizes, and scopes every query against the database.
3. **No Secret Leaks**: Secrets and tokens are managed via environment variables. Passwords and tokens are never printed to terminal or saved in audit logs.
4. **Least-Privilege Scoping**: Bureau officers can view and take action only within their assigned bureau/region scope unless cross-bureau visibility is authorized via confirmed case links or senior executive privileges.

---

## 2. Authentication Strategy

* **Token Format**: Standard JSON Web Token (JWT) signed using HMAC-SHA256 (`HS256`).
* **Payload Claims**:
  ```json
  {
    "sub": "user-uuid-1029",
    "username": "officer_rb_01",
    "role": "BUREAU_OFFICER",
    "bureau": "REGULATION_BUREAU",
    "region": "ALL",
    "iat": 1729000000,
    "exp": 1729028800
  }
  ```
* **Password Hashing**: Passwords are salted and hashed using `bcrypt` (10 rounds minimum). Plaintext passwords are never stored or transmitted in responses.
* **Token Invalidation & Revocation**: Upon calling `/api/v1/auth/logout`, the active JWT's SHA-256 hash is recorded in `revoked_tokens`. Subsequent requests with the same token are rejected with HTTP 401 `TOKEN_REVOKED`.
* **Brute-Force Rate Limiting**: The `/api/v1/auth/login` endpoint is guarded by a sliding-window rate limiter allowing max 5 failed attempts per 15-minute window per IP/username, returning HTTP 429 `RATE_LIMIT_EXCEEDED`.
* **Account Deactivation Protection**: Deactivated accounts (`is_active = FALSE`) are blocked during login and in the auth middleware with HTTP 403 `ACCOUNT_DISABLED`.
* **Secure Development Seeds**: Seed accounts are only initialized when `NODE_ENV !== 'production'` and are explicitly guarded against production instantiation.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Operation / Endpoint | System Admin | Bureau Officer | Regional Officer | Senior Official |
|---|:---:|:---:|:---:|:---:|
| User / Scope Management | ✅ Full | ❌ None | ❌ None | ❌ None |
| View Public Landing Page | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| View Bureau Complaints | ✅ Full | ✅ Own Bureau | ❌ Restricted | ✅ All Bureaus |
| Register New Complaint | ✅ Full | ✅ Own Bureau | ❌ Restricted | ❌ Read Only |
| Record Case Action / Timeline | ✅ Full | ✅ Assigned Cases | ✅ Assigned Cases | ❌ Read Only |
| View Overlap Alerts | ✅ Full | ✅ Relevant Cases | ❌ Restricted | ✅ All Bureaus |
| Confirm / Dismiss Case Link | ✅ Full | ✅ Relevant Cases | ❌ Restricted | ✅ Approved |
| View Operational Analytics | ✅ Full | ✅ Own Bureau | ✅ Own Region | ✅ All AICTE |
| Export SCC Dossier | ✅ Full | ✅ Own Bureau | ❌ Restricted | ✅ All AICTE |

---

## 4. Cross-Bureau Scoping Rules

When a Bureau Officer from **PGRC** accesses cases:
1. They can query and edit PGRC cases freely.
2. In the **Case Intelligence** portal, when an overlap is detected with **Regulation Bureau (RB)**:
   * The officer is shown metadata: Case ID, Category, Institution Name, AICTE ID, Date Received, and Overlapping Keywords.
   * Internal sensitive remarks or privileged investigatory notes from the other bureau are masked until a **Confirmed Case Link** is authorized by both parties or a Senior Official.
3. Once linked, a coordinated cross-bureau view is unlocked for both dealing officers.

---

## 5. Audit Logging & Security Events

All of the following events write an immutable row to `audit_logs`:
* `AUTH_LOGIN_SUCCESS` / `AUTH_LOGIN_FAILURE`
* `AUTH_UNAUTHORIZED_ACCESS_ATTEMPT`
* `COMPLAINT_REGISTERED`
* `CASE_STATUS_CHANGED`
* `CASE_LINK_CONFIRMED` (records officer ID and justification)
* `CASE_LINK_DISMISSED`
* `CASE_TRANSFERRED`
* `BATCH_CSV_IMPORTED`
