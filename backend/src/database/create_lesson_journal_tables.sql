-- ============================================================
-- 1. Table lesson_journal (cahier de texte)
-- ============================================================
CREATE TABLE IF NOT EXISTS lesson_journal (
    id VARCHAR(36) PRIMARY KEY,
    teacher_id VARCHAR(36) NOT NULL,
    class_id VARCHAR(36) NOT NULL,
    subject_id VARCHAR(36) NOT NULL,
    schedule_id VARCHAR(36) NULL,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NULL,
    homework LONGTEXT NULL,
    resources JSON NULL,
    lesson_date DATE NOT NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    duration INT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES matieres(id) ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES profiles(id),
    INDEX (lesson_date, class_id, subject_id)
);

-- ============================================================
-- 2. Table lesson_attachments (documents joints)
-- ============================================================
CREATE TABLE IF NOT EXISTS lesson_attachments (
    id VARCHAR(36) PRIMARY KEY,
    lesson_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NULL,
    file_size INT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lesson_journal(id) ON DELETE CASCADE
);