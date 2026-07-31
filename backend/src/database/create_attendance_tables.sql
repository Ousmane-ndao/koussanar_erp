-- ============================================================
-- 1. Statuts de présence
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_status (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    label VARCHAR(50) NOT NULL,
    is_absent BOOLEAN DEFAULT FALSE,
    is_justified BOOLEAN DEFAULT FALSE,
    color VARCHAR(7) DEFAULT '#000000',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO attendance_status (id, code, label, is_absent, is_justified, color) VALUES
(UUID(), 'present', 'Présent', FALSE, FALSE, '#22c55e'),
(UUID(), 'absent_justified', 'Absence justifiée', TRUE, TRUE, '#3b82f6'),
(UUID(), 'absent_unjustified', 'Absence non justifiée', TRUE, FALSE, '#ef4444'),
(UUID(), 'late', 'Retard', FALSE, FALSE, '#f59e0b'),
(UUID(), 'early_leave', 'Sortie anticipée', FALSE, FALSE, '#8b5cf6'),
(UUID(), 'permission', 'Permission exceptionnelle', FALSE, TRUE, '#06b6d4'),
(UUID(), 'temporary_exclusion', 'Exclusion temporaire', TRUE, TRUE, '#dc2626')
ON DUPLICATE KEY UPDATE label = VALUES(label);

-- ============================================================
-- 2. Présences
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    class_id VARCHAR(36) NOT NULL,
    status_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    hours DECIMAL(4,2) DEFAULT 1.0,
    justification TEXT NULL,
    recorded_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES attendance_status(id),
    FOREIGN KEY (recorded_by) REFERENCES profiles(id),
    UNIQUE KEY (student_id, date)
);

-- ============================================================
-- 3. Vue des statistiques par élève
-- ============================================================
CREATE OR REPLACE VIEW student_attendance_stats AS
SELECT
    s.id AS student_id,
    s.matricule,
    p.nom,
    p.prenom,
    c.id AS classe_id,
    c.nom AS classe_nom,
    COUNT(a.id) AS total_jours,
    COUNT(CASE WHEN ast.code = 'present' THEN 1 END) AS total_presences,
    COUNT(CASE WHEN ast.is_absent = TRUE THEN 1 END) AS total_absences,
    COUNT(CASE WHEN ast.code = 'absent_justified' THEN 1 END) AS absences_justifiees,
    COUNT(CASE WHEN ast.code = 'absent_unjustified' THEN 1 END) AS absences_non_justifiees,
    COUNT(CASE WHEN ast.code = 'late' THEN 1 END) AS retards,
    COUNT(CASE WHEN ast.code IN ('present', 'late', 'early_leave') THEN 1 END) AS heures_suivies,
    ROUND(
        COUNT(CASE WHEN ast.code IN ('present', 'late', 'early_leave') THEN 1 END) * 100.0 /
        NULLIF(COUNT(a.id), 0), 2
    ) AS taux_presence,
    ROUND(
        COUNT(CASE WHEN ast.is_absent = TRUE THEN 1 END) * 100.0 /
        NULLIF(COUNT(a.id), 0), 2
    ) AS taux_absence
FROM students s
JOIN profiles p ON s.user_id = p.id
LEFT JOIN classes c ON s.classe_id = c.id
LEFT JOIN attendance a ON s.id = a.student_id
LEFT JOIN attendance_status ast ON a.status_id = ast.id
GROUP BY s.id, s.matricule, p.nom, p.prenom, c.id, c.nom;