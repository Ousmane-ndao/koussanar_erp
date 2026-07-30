-- Création de la table school_years
CREATE TABLE school_years (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Création de la table academic_periods
CREATE TABLE academic_periods (
    id VARCHAR(36) PRIMARY KEY,
    school_year_id VARCHAR(36) NOT NULL,
    name VARCHAR(50) NOT NULL,
    type ENUM('semester', 'trimester', 'quarter', 'bimester') NOT NULL,
    sequence INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_year_id) REFERENCES school_years(id) ON DELETE CASCADE,
    UNIQUE KEY (school_year_id, sequence),
    CHECK (start_date <= end_date)
);

-- Index pour les recherches courantes
CREATE INDEX idx_school_years_active ON school_years(is_active);
CREATE INDEX idx_academic_periods_active ON academic_periods(is_active);
CREATE INDEX idx_academic_periods_school_year ON academic_periods(school_year_id);