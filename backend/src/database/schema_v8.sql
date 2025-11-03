-- Database Schema for Koussanar ERP System (MySQL 8.0+ with CHECK constraints)
-- Use this version if you have MySQL 8.0.16 or higher

-- Grades/Evaluations Table with CHECK constraint (MySQL 8.0.16+)
CREATE TABLE IF NOT EXISTS grades (
  id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  matiere VARCHAR(100) NOT NULL,
  note DECIMAL(5, 2) NOT NULL CHECK (note >= 0 AND note <= 20),
  coefficient DECIMAL(3, 1) DEFAULT 1.0,
  type_evaluation ENUM('devoir', 'controle', 'examen', 'oral') DEFAULT 'devoir',
  date_evaluation DATE NOT NULL,
  annee_scolaire VARCHAR(20) NOT NULL,
  remarque TEXT,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_student (student_id),
  INDEX idx_matiere (matiere),
  INDEX idx_date (date_evaluation)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


