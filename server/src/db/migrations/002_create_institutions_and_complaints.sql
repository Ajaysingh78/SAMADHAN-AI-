-- Migration: 002_create_institutions_and_complaints.sql
-- Description: Create institutions, complaints, and case_actions tables

CREATE TABLE IF NOT EXISTS institutions (
  id VARCHAR(36) PRIMARY KEY,
  aicte_permanent_id VARCHAR(50) UNIQUE NULL,
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  region VARCHAR(50) NOT NULL,
  pin_code VARCHAR(10) NOT NULL,
  approval_status VARCHAR(50) DEFAULT 'APPROVED',
  identity_flag ENUM('VERIFIED', 'FLAGGED_FOR_REVIEW', 'MISSING_AICTE_ID') DEFAULT 'VERIFIED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_inst_aicte_id (aicte_permanent_id),
  INDEX idx_inst_normalized_name (normalized_name),
  INDEX idx_inst_region (region),
  INDEX idx_inst_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS complaints (
  id VARCHAR(36) PRIMARY KEY,
  case_id VARCHAR(50) UNIQUE NOT NULL,
  institution_id VARCHAR(36) NOT NULL,
  bureau ENUM('REGULATION_BUREAU', 'PGRC', 'APPROVAL_BUREAU', 'REGIONAL_OFFICE') NOT NULL,
  category VARCHAR(100) NOT NULL,
  severity ENUM('STANDARD', 'HIGH', 'CRITICAL') DEFAULT 'STANDARD',
  complainant_type ENUM('STUDENT', 'FACULTY', 'PARENT', 'CITIZEN', 'ANONYMOUS') NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  received_date DATE NOT NULL,
  status ENUM('RECEIVED', 'VALIDATION_ASSIGNMENT', 'UNDER_PROCESS', 'REVIEW_COORDINATION', 'DISPOSED', 'REOPENED') DEFAULT 'RECEIVED',
  assigned_officer_id VARCHAR(36) NULL,
  last_action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  next_action_due_date DATE NULL,
  expected_disposal_date DATE NOT NULL,
  disposed_date TIMESTAMP NULL,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cmp_case_id (case_id),
  INDEX idx_cmp_institution (institution_id),
  INDEX idx_cmp_bureau (bureau),
  INDEX idx_cmp_status (status),
  INDEX idx_cmp_category (category),
  INDEX idx_cmp_disposal_date (expected_disposal_date),
  CONSTRAINT fk_cmp_institution FOREIGN KEY (institution_id) REFERENCES institutions (id) ON DELETE RESTRICT,
  CONSTRAINT fk_cmp_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS case_actions (
  id VARCHAR(36) PRIMARY KEY,
  complaint_id VARCHAR(36) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  previous_status VARCHAR(50) NULL,
  new_status VARCHAR(50) NULL,
  remarks TEXT NOT NULL,
  document_reference VARCHAR(255) NULL,
  performed_by VARCHAR(36) NOT NULL,
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_act_complaint (complaint_id),
  INDEX idx_act_performed_at (performed_at),
  CONSTRAINT fk_act_complaint FOREIGN KEY (complaint_id) REFERENCES complaints (id) ON DELETE CASCADE,
  CONSTRAINT fk_act_performed_by FOREIGN KEY (performed_by) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
