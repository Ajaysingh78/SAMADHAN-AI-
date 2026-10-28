# SAMADHAN — PPT Change Log & Claim Verification

This document tracks all features and architectural capabilities claimed in the official **Smart India Hackathon 2026 Presentation (SIH26264)** for **SamadhanX**, mapping each claim to its engineering reality, implementation status, and verification evidence.

---

## 1. Principles of Verification

* **Safe Claims Only**: No claim is presented as "tested" or "implemented" until working code, database migrations, and automated/manual tests exist in the repository.
* **Preserving Distinction**: Maintain the key differentiator that *Same Institution $\neq$ Related Complaints $\neq$ Potential Operational Overlap*.
* **Decision Support vs. Automation**: The platform is an explainable decision-support system, not an unverified auto-adjudication engine.

---

## 2. Capability Verification Matrix

| 0 | **Institutional Public Portal & Design System** | Slide 1, 2, 3 | Public landing experience, clear institutional governance model, responsive design tokens, and gated application shell. | **Phase 1 VERIFIED** | Frontend build passed (Vite production bundle), 3 API contract tests passed. | "Standardized public-sector design system and institutional governance landing experience." |
| 1 | **Unified Institution Profile** | Slide 2, 3, 5 | Resolves college identity using AICTE Permanent ID and maintains consolidated 360° history. | **Phase 3 Planned** | Pending Phase 3 schema and institution lookup tests. | "Consolidates institution complaint history mapped by AICTE Permanent ID." |
| 2 | **End-to-End Case Tracking** | Slide 2, 3 | Maintains unique case IDs, lifecycle stages, assigned bureau/officer, and action history. | **Phase 3 Planned** | Pending Phase 3 case creation and lifecycle tests. | "Provides granular case tracking with timestamps and officer accountability." |
| 3 | **Explainable Case Intelligence** | Slide 2, 3, 4 | Primary differentiator: Combines exact ID match, rule checks, metadata, and TF-IDF/cosine similarity. | **Phase 4 Planned** | Pending Phase 4 synthetic evaluation suite. | "Explainable similarity scoring with evidence breakdown (keyword overlap + bureau conflict)." |
| 4 | **Human-Reviewed Case Coordination** | Slide 2, 3, 4 | Prevents automated false mergers; authorized officers confirm, dismiss, or link cases with logged reasons. | **Phase 4 Planned** | Pending Phase 4 link/dismiss API tests. | "Decision-support signal: requires authorized human review before linking cases." |
| 5 | **Independent Case Integrity** | Slide 2, 4 | Linked cases retain distinct case IDs, ownership, and statuses without destructive merges. | **Phase 4 Planned** | Pending Phase 4 database constraint validation. | "Preserves independent record integrity; linked cases maintain separate lifecycles." |
| 6 | **JWT Authentication & RBAC** | Slide 3, 4 | Role-based access (Admin, Bureau Officer, Regional Officer, Senior Official) enforced at backend API. | **Phase 2 VERIFIED** | 21 backend tests passed (`tests/auth.test.js`, `tests/rbac.test.js`). | "Backend-enforced role and bureau-level access control with token revocation." |
| 7 | **Operational Dashboard & SLA Reminders** | Slide 2, 3, 5 | Real-time counters for pending, under-process, disposed, and overdue cases with automatic SLA tracking. | **Phase 6 Planned** | Pending Phase 6 aggregate queries and frontend tests. | "Real-time visibility into bureau workload and overdue SLA compliance." |
| 8 | **Synthetic Data & Validated CSV Import** | Slide 3, 4 | Safe intake for prototype validation without pretending live production database access. | **Phase 3 Planned** | Pending Phase 3 CSV parser tests. | "Demonstrated using realistic synthetic datasets with batch import validation." |

---

## 3. Evaluation Metrics Log (Planned for Phase 4)

| Metric | Target / Benchmark | Actual Measured | Dataset / Test Reference | Notes |
|---|---|---|---|---|
| Precision | $> 85\%$ | *To be measured in Phase 4* | Labelled synthetic benchmark (50 test pairs) | Minimizes false-positive alerts across bureaus |
| Recall | $> 80\%$ | *To be measured in Phase 4* | Labelled synthetic benchmark (50 test pairs) | Captures genuine cross-bureau overlaps |
| F1-Score | $> 82\%$ | *To be measured in Phase 4* | Labelled synthetic benchmark (50 test pairs) | Harmonic balance |
| False-Positive Rate | $< 10\%$ | *To be measured in Phase 4* | Non-overlapping multi-complaint test set | Prevents officer alert fatigue |
