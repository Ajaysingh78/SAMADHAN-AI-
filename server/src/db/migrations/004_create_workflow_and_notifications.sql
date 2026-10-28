-- Migration: 004_create_workflow_and_notifications.sql
-- Description: Create notifications table and workflow extension fields

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  event_type ENUM(
    'ASSIGNMENT_CHANGED',
    'CASE_TRANSFERRED',
    'DUE_DATE_REMINDER',
    'CASE_OVERDUE',
    'CASE_ESCALATED',
    'MATCH_REVIEW_TASK',
    'CLOSURE_APPROVAL_REQUEST',
    'CASE_REOPENED'
  ) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  complaint_id VARCHAR(36) NULL,
  case_id VARCHAR(50) NULL,
  read_status BOOLEAN DEFAULT FALSE,
  navigation_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user_read (user_id, read_status),
  INDEX idx_notif_complaint (complaint_id),
  INDEX idx_notif_created_at (created_at),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_complaint FOREIGN KEY (complaint_id) REFERENCES complaints (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional workflow policy configuration table
CREATE TABLE IF NOT EXISTS workflow_config (
  id VARCHAR(36) PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value VARCHAR(255) NOT NULL,
  description TEXT NULL,
  updated_by VARCHAR(36) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
