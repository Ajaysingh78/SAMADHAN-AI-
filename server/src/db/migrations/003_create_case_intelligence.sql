-- Migration: 003_create_case_intelligence.sql
-- Description: Create match_alerts and case_links tables for explainable cross-bureau intelligence

CREATE TABLE IF NOT EXISTS match_alerts (
  id VARCHAR(36) PRIMARY KEY,
  source_complaint_id VARCHAR(36) NOT NULL,
  candidate_complaint_id VARCHAR(36) NOT NULL,
  confidence_score DECIMAL(5, 4) NOT NULL,
  relationship_classification ENUM('SAME_INSTITUTION', 'POTENTIALLY_RELATED_COMPLAINTS', 'POTENTIAL_OPERATIONAL_OVERLAP') NOT NULL,
  institution_match_type ENUM('EXACT_PERMANENT_ID', 'NORMALIZED_NAME', 'DIFFERENT_INSTITUTION', 'UNKNOWN') NOT NULL,
  rule_flags JSON NOT NULL,
  evidence_breakdown JSON NOT NULL,
  explanation TEXT NOT NULL,
  status ENUM('PENDING_REVIEW', 'CONFIRMED', 'DISMISSED') DEFAULT 'PENDING_REVIEW',
  reviewed_by VARCHAR(36) NULL,
  reviewed_at TIMESTAMP NULL,
  decision_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_match_pair (source_complaint_id, candidate_complaint_id),
  INDEX idx_alert_source (source_complaint_id),
  INDEX idx_alert_candidate (candidate_complaint_id),
  INDEX idx_alert_status (status),
  INDEX idx_alert_classification (relationship_classification),
  CONSTRAINT fk_alert_source FOREIGN KEY (source_complaint_id) REFERENCES complaints (id) ON DELETE CASCADE,
  CONSTRAINT fk_alert_candidate FOREIGN KEY (candidate_complaint_id) REFERENCES complaints (id) ON DELETE CASCADE,
  CONSTRAINT fk_alert_reviewer FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS case_links (
  id VARCHAR(36) PRIMARY KEY,
  source_complaint_id VARCHAR(36) NOT NULL,
  target_complaint_id VARCHAR(36) NOT NULL,
  match_alert_id VARCHAR(36) NULL,
  link_type ENUM('CROSS_BUREAU_COORDINATION', 'COMMON_INSTITUTION_CORRELATION', 'POLICY_SYSTEMIC_ISSUE') NOT NULL,
  link_reason TEXT NOT NULL,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_link_pair (source_complaint_id, target_complaint_id),
  INDEX idx_link_source (source_complaint_id),
  INDEX idx_link_target (target_complaint_id),
  CONSTRAINT fk_link_source FOREIGN KEY (source_complaint_id) REFERENCES complaints (id) ON DELETE RESTRICT,
  CONSTRAINT fk_link_target FOREIGN KEY (target_complaint_id) REFERENCES complaints (id) ON DELETE RESTRICT,
  CONSTRAINT fk_link_alert FOREIGN KEY (match_alert_id) REFERENCES match_alerts (id) ON DELETE SET NULL,
  CONSTRAINT fk_link_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
