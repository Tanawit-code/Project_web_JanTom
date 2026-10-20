-- Audit trail for administrative and approval actions.
-- No employee foreign key: history must remain after an account is deleted.
CREATE TABLE IF NOT EXISTS ACTIVITY_LOG (
  log_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_emp_id INT NULL,
  actor_name VARCHAR(100) NOT NULL,
  action VARCHAR(40) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(64) NULL,
  summary VARCHAR(255) NOT NULL,
  before_data LONGTEXT NULL,
  after_data LONGTEXT NULL,
  ip_address VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  KEY idx_activity_created (created_at),
  KEY idx_activity_entity (entity_type, entity_id),
  KEY idx_activity_actor (actor_emp_id),
  KEY idx_activity_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
