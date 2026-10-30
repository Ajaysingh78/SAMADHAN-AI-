# samadhanX — Relational Database Schema (MySQL 8.0)

**Target Engine:** InnoDB  
**Charset / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`  

---

## 1. Entity-Relationship Overview

```
institutions (1) ────< complaints (N) ────< case_actions (N)
                           │
                           ├────< case_assignments (N)
                           │
                           ├────< confirmed_links (as primary or related)
                           │
                           └────< potential_matches (as primary or candidate)

users (1) ────< user_scopes (N)
users (1) ────< case_actions (N)
users (1) ────< audit_logs (N)
```

---

## 2. Table Definitions

### 2.1 `institutions`
Stores master information for AICTE-approved and technical institutions.
* `id` VARCHAR(36) PRIMARY KEY (UUID)
* `aicte_permanent_id` VARCHAR(50) UNIQUE NOT NULL (Index)
* `name` VARCHAR(255) NOT NULL (Index, Fulltext)
* `normalized_name` VARCHAR(255) NOT NULL (Index)
* `address` TEXT NOT NULL
* `city` VARCHAR(100) NOT NULL
* `state` VARCHAR(100) NOT NULL
* `region` VARCHAR(50) NOT NULL (Index - e.g., 'Northern', 'Western', 'Southern')
* `pin_code` VARCHAR(10) NOT NULL
* `approval_status` VARCHAR(50) DEFAULT 'APPROVED'
* `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
* `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

### 2.2 `users` & `roles`
* `id` VARCHAR(36) PRIMARY KEY
* `username` VARCHAR(50) UNIQUE NOT NULL
* `email` VARCHAR(100) UNIQUE NOT NULL
* `password_hash` VARCHAR(255) NOT NULL
* `full_name` VARCHAR(150) NOT NULL
* `role` ENUM('ADMIN', 'BUREAU_OFFICER', 'REGIONAL_OFFICER', 'SENIOR_OFFICIAL') NOT NULL
* `primary_bureau` VARCHAR(50) NULL (e.g., 'REGULATION_BUREAU', 'PGRC')
* `is_active` BOOLEAN DEFAULT TRUE
* `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### 2.3 `complaints`
Primary complaint case entity.
* `id` VARCHAR(36) PRIMARY KEY
* `case_id` VARCHAR(50) UNIQUE NOT NULL (Index - e.g., 'CMP-2026-PGRC-0012')
* `institution_id` VARCHAR(36) NOT NULL (FK -> `institutions.id`)
* `bureau` ENUM('REGULATION_BUREAU', 'PGRC', 'APPROVAL_BUREAU', 'REGIONAL_OFFICE') NOT NULL (Index)
* `category` VARCHAR(100) NOT NULL (e.g., 'FACULTY_GRIEVANCE', 'CAPITATION_FEE', 'INFRASTRUCTURE', 'RAGGING')
* `severity` ENUM('STANDARD', 'HIGH', 'CRITICAL') DEFAULT 'STANDARD'
* `status` ENUM('RECEIVED', 'SCRUTINY', 'UNDER_PROCESS', 'HEARING_COMMITTEE', 'DISPOSED', 'REOPENED') DEFAULT 'RECEIVED' (Index)
* `subject` VARCHAR(255) NOT NULL
* `description` TEXT NOT NULL
* `complainant_type` ENUM('STUDENT', 'FACULTY', 'PARENT', 'CITIZEN', 'ANONYMOUS') NOT NULL
* `received_date` DATE NOT NULL
* `sla_due_date` DATE NOT NULL (Index)
* `disposed_date` DATE NULL
* `created_by` VARCHAR(36) NOT NULL (FK -> `users.id`)
* `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
* `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

### 2.4 `potential_matches`
Calculated matches between cases awaiting human review.
* `id` VARCHAR(36) PRIMARY KEY
* `source_case_id` VARCHAR(36) NOT NULL (FK -> `complaints.id`)
* `candidate_case_id` VARCHAR(36) NOT NULL (FK -> `complaints.id`)
* `match_score` DECIMAL(5, 4) NOT NULL (e.g., 0.8520)
* `match_type` ENUM('SAME_INSTITUTION_ONLY', 'POTENTIAL_OPERATIONAL_OVERLAP') NOT NULL
* `evidence_json` JSON NOT NULL (Stores overlapping keywords, categories, bureau flags)
* `review_status` ENUM('PENDING_REVIEW', 'CONFIRMED_LINKED', 'DISMISSED') DEFAULT 'PENDING_REVIEW'
* `reviewed_by` VARCHAR(36) NULL (FK -> `users.id`)
* `reviewed_at` TIMESTAMP NULL
* `review_justification` TEXT NULL
* `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### 2.5 `confirmed_links`
Traceable links between complaints confirmed by authorized officers.
* `id` VARCHAR(36) PRIMARY KEY
* `primary_case_id` VARCHAR(36) NOT NULL (FK -> `complaints.id`)
* `linked_case_id` VARCHAR(36) NOT NULL (FK -> `complaints.id`)
* `link_reason` TEXT NOT NULL
* `linked_by` VARCHAR(36) NOT NULL (FK -> `users.id`)
* `linked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
* CONSTRAINT `uk_case_pair` UNIQUE (`primary_case_id`, `linked_case_id`)

### 2.6 `case_actions`
Immutable chronological audit history of operations on a complaint.
* `id` VARCHAR(36) PRIMARY KEY
* `complaint_id` VARCHAR(36) NOT NULL (FK -> `complaints.id`)
* `action_type` VARCHAR(100) NOT NULL (e.g., 'ASSIGNED', 'NOTICE_ISSUED', 'HEARING_SCHEDULED', 'DISPOSED')
* `previous_status` VARCHAR(50) NULL
* `new_status` VARCHAR(50) NULL
* `remarks` TEXT NOT NULL
* `document_reference` VARCHAR(255) NULL
* `performed_by` VARCHAR(36) NOT NULL (FK -> `users.id`)
* `performed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### 2.7 `notifications`
Persistent in-app alerts and task notifications for officers and administrators.
* `id` VARCHAR(36) PRIMARY KEY
* `user_id` VARCHAR(36) NOT NULL (FK -> `users.id`)
* `event_type` ENUM('ASSIGNMENT_CHANGED', 'CASE_TRANSFERRED', 'DUE_DATE_REMINDER', 'CASE_OVERDUE', 'CASE_ESCALATED', 'MATCH_REVIEW_TASK', 'CLOSURE_APPROVAL_REQUEST', 'CASE_REOPENED') NOT NULL
* `title` VARCHAR(255) NOT NULL
* `message` TEXT NOT NULL
* `complaint_id` VARCHAR(36) NULL (FK -> `complaints.id`)
* `case_id` VARCHAR(50) NULL
* `read_status` BOOLEAN DEFAULT FALSE
* `navigation_url` VARCHAR(255) NULL
* `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### 2.8 `workflow_config`
System-wide workflow policy toggles and demo thresholds (e.g., configurable closure review, SLA duration defaults).
* `id` VARCHAR(36) PRIMARY KEY
* `config_key` VARCHAR(100) UNIQUE NOT NULL
* `config_value` VARCHAR(255) NOT NULL
* `description` TEXT NULL
* `updated_by` VARCHAR(36) NULL
* `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

### 2.9 `audit_logs`
System-wide immutable security & administrative audit log.
* `id` VARCHAR(36) PRIMARY KEY
* `user_id` VARCHAR(36) NULL (FK -> `users.id`)
* `event_type` VARCHAR(100) NOT NULL (e.g., 'LOGIN_SUCCESS', 'AUTH_FAILED', 'CASE_STATUS_TRANSITION', 'CASE_TRANSFERRED', 'CASE_ESCALATED', 'WORKFLOW_CONFIG_UPDATED')
* `ip_address` VARCHAR(45) NULL
* `user_agent` VARCHAR(255) NULL
* `payload_json` JSON NULL
* `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

