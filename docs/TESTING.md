# SAMADHAN — Testing Strategy & Verification Plan

**Document Version:** 1.0.0  
**Status:** Approved Foundation  

---

## 1. Testing Philosophy

* **Evidence over Assumption**: Features are never marked "complete" or "verified" without concrete test scripts, commands, or visual confirmation.
* **Responsible Automation**: The Case Intelligence matching engine must be tested against labelled synthetic datasets to evaluate precision, recall, and false-positive rates.
* **No Broken Regressions**: Each implementation phase must maintain and execute the tests established in previous phases.

---

## 2. Testing Tiers

### 2.1 Unit & Service Tests
* Input validation rules (case ID format, required AICTE ID, valid email/password).
* Text similarity calculation: TF-IDF vectorization and cosine similarity logic.
* SLA overdue date difference calculator.

### 2.2 Integration & API Tests
* Authentication: Token generation, expiration handling, password verification.
* RBAC Guards: Bureau Officer attempting cross-bureau write access $\rightarrow$ 403 Forbidden.
* Case Linking: Ensuring `confirmed_links` writes correctly without destroying either complaint record.

### 2.3 Synthetic Evaluation Benchmark (Phase 4)
* A controlled synthetic dataset of 50 case pairs:
  1. **True Overlaps (20 pairs)**: Same college, same core issue across RB & PGRC with different phrasing.
  2. **Same Institution / Different Issues (15 pairs)**: Same college, but one is a student capitation fee issue and another is a faculty salary issue $\rightarrow$ Same Institution flag, but NOT operational overlap.
  3. **Different Institutions / Similar Phrasing (15 pairs)**: Generic complaint text submitted against two completely different colleges $\rightarrow$ Negative overlap match.
* **Metrics to Calculate**:
  $$\text{Precision} = \frac{TP}{TP + FP}, \quad \text{Recall} = \frac{TP}{TP + FN}, \quad F_1 = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$

---

## 3. Definition of Done (DoD)

A user story or phase component is complete ONLY when:
1. All required functional requirements and backend APIs are implemented.
2. Form validation, error boundaries, empty states, and loading states are present.
3. Relevant unit and integration tests pass.
4. Security permissions and data scopes are enforced on the backend.
5. The UI adheres to the professional public-sector design system.
6. Documentation files (`docs/`, `PPT_CHANGELOG.md`) are updated with actual results.
