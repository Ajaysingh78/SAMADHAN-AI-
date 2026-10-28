# SAMADHAN — Cross-Bureau Case Intelligence & Coordination Platform

**Smart India Hackathon 2026**  
**Problem Statement ID:** SIH26264  
**Problem Statement Title:** Integrated Dashboard for Monitoring and Tracking Institution-Related Complaint Cases Across AICTE Bureaus/Cells  
**Theme:** Smart Automation  
**Category:** Software  

---

## 1. Product Overview

**SAMADHAN** is a centralized case-management and coordination platform designed to consolidate institution-related complaints across AICTE Bureaus/Cells (e.g., Regulation Bureau and Public Grievance Redressal Cell), maintain institution-wise complaint history, track case progress, identify potentially related cases, and support accountable follow-up through an auditable workflow.

> **Crucial Governance Principle**:
>
> $$\text{Same Institution} \neq \text{Related Complaints} \neq \text{Potential Operational Overlap}$$
>
> A match score is a decision-support signal, not proof. No automatic merge, closure, reassignment, or adverse action occurs without authorized officer review. Linked cases keep independent IDs, statuses, ownership, and histories.

---

## 2. Technology Stack

* **Frontend**: React.js, React Router, TailwindCSS/Vanilla CSS design system, Vite.
* **Backend**: Node.js, Express.js (REST APIs, JWT authentication, RBAC middleware).
* **Database**: MySQL 8.0 (Relational schema, foreign keys, transactions, migrations, audit logging).
* **Case Intelligence**: Node.js natural language & rule-based engine (Identifier resolution, configurable rule checks, metadata comparison, TF-IDF + Cosine similarity).

---

## 3. Repository Structure

```
samadhan/
├── client/           # React.js frontend application
├── server/           # Node.js + Express.js backend API
├── docs/             # Architecture, security, API & integration specifications
├── scripts/          # Database migrations, seed utilities, and test helpers
├── .env.example      # Environment variables template
├── .gitignore        # Git ignore rules
├── PPT_CHANGELOG.md  # Tracking implementation evidence against SIH PPT claims
└── README.md         # Repository overview
```

---

## 4. Documentation Directory (`docs/`)

Detailed architectural contracts and design specifications are maintained in the `docs/` folder:

* [`docs/ARCHITECTURE.md`](file:///c:/Users/Hamada%20Salim%20G-Trd/SIH26264/docs/ARCHITECTURE.md) — System architecture, module boundaries, and mind map.
* [`docs/INTEGRATION_CONTRACT.md`](file:///c:/Users/Hamada%20Salim%20G-Trd/SIH26264/docs/INTEGRATION_CONTRACT.md) — Six-phase execution roadmap and integration contracts.
* [`docs/API_CONTRACT.md`](file:///c:/Users/Hamada%20Salim%20G-Trd/SIH26264/docs/API_CONTRACT.md) — Standard REST endpoints, request/response formats, and error codes.
* [`docs/DATABASE_SCHEMA.md`](file:///c:/Users/Hamada%20Salim%20G-Trd/SIH26264/docs/DATABASE_SCHEMA.md) — Relational schema, tables, foreign keys, and indexes.
* [`docs/SECURITY.md`](file:///c:/Users/Hamada%20Salim%20G-Trd/SIH26264/docs/SECURITY.md) — Authentication, RBAC model, bureau/region scoping, and audit logging.
* [`docs/TESTING.md`](file:///c:/Users/Hamada%20Salim%20G-Trd/SIH26264/docs/TESTING.md) — Test strategy, synthetic datasets, and definition of done.
* [`docs/IMPLEMENTATION_STATUS.md`](file:///c:/Users/Hamada%20Salim%20G-Trd/SIH26264/docs/IMPLEMENTATION_STATUS.md) — Phased status tracking (All 6 Phases Verified).
* [`docs/LOCAL_SETUP.md`](file:///c:/Users/Hamada%20Salim%20G-Trd/SIH26264/docs/LOCAL_SETUP.md) — Step-by-step local execution, seed credentials, and test runner guide.


---

## 5. Six-Phase Implementation Roadmap

1. **Phase 1**: Foundation, Homepage and Design System
2. **Phase 2**: JWT Authentication and RBAC
3. **Phase 3**: Institution Registry and Complaint Management
4. **Phase 4**: Explainable Case Intelligence
5. **Phase 5**: Workflow, Audit, Reminders and Notifications
6. **Phase 6**: Dashboard, Analytics and Final Integration
