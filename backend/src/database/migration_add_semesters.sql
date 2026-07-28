-- Migration: Add semesters table
-- Run this if the semesters table doesn't exist in your database

CREATE TABLE IF NOT EXISTS semesters (
  id VARCHAR(36) PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  numero INT NOT NULL,
  annee_scolaire VARCHAR(20) NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_semester_annee (annee_scolaire, numero),
  INDEX idx_annee (annee_scolaire),
  INDEX idx_actif (actif),
  INDEX idx_date_debut (date_debut),
  INDEX idx_date_fin (date_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: Add semester_id to grades table if you want to associate grades with semesters
-- ALTER TABLE grades ADD COLUMN semester_id VARCHAR(36) NULL AFTER annee_scolaire;
-- ALTER TABLE grades ADD FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL;
-- ALTER TABLE grades ADD INDEX idx_semester (semester_id);


















