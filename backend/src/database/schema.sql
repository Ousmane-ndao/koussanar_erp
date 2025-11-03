-- Database Schema for Koussanar ERP System
-- MySQL Database Schema

-- Create database (run this manually if database doesn't exist)
-- CREATE DATABASE IF NOT EXISTS koussanar_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE koussanar_erp;

-- Users/Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  telephone VARCHAR(20),
  adresse TEXT,
  photo_url VARCHAR(500),
  statut_actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_statut (statut_actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  role ENUM('admin', 'enseignant', 'eleve', 'parent', 'comptable', 'surveillant') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_role (user_id, role),
  INDEX idx_user_id (user_id),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Classes Table
CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR(36) PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  niveau VARCHAR(50) NOT NULL,
  filiere VARCHAR(100),
  effectif_max INT DEFAULT 40,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_niveau (niveau),
  INDEX idx_nom (nom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students Table
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  matricule VARCHAR(50) UNIQUE NOT NULL,
  date_naissance DATE NOT NULL,
  lieu_naissance VARCHAR(100),
  sexe ENUM('M', 'F') NOT NULL,
  classe_id VARCHAR(36),
  parent_id VARCHAR(36),
  statut_inscription ENUM('actif', 'inactif', 'diplome', 'transfere') DEFAULT 'actif',
  annee_scolaire VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_matricule (matricule),
  INDEX idx_classe (classe_id),
  INDEX idx_statut (statut_inscription)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  matricule VARCHAR(50) UNIQUE NOT NULL,
  specialite VARCHAR(100),
  statut ENUM('actif', 'inactif') DEFAULT 'actif',
  date_embauche DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_matricule (matricule),
  INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teacher-Class Assignments
CREATE TABLE IF NOT EXISTS teacher_classes (
  id VARCHAR(36) PRIMARY KEY,
  teacher_id VARCHAR(36) NOT NULL,
  classe_id VARCHAR(36) NOT NULL,
  matiere VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_teacher_class_matiere (teacher_id, classe_id, matiere),
  INDEX idx_teacher (teacher_id),
  INDEX idx_classe (classe_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent', 'retard') NOT NULL,
  heure_arrivee TIME,
  remarque TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_date (student_id, date),
  INDEX idx_student (student_id),
  INDEX idx_date (date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  montant DECIMAL(10, 2) NOT NULL,
  type_paiement ENUM('inscription', 'scolarite', 'autre') NOT NULL,
  mois_paye VARCHAR(50),
  annee_scolaire VARCHAR(20) NOT NULL,
  statut ENUM('paye', 'en_attente', 'annule') DEFAULT 'paye',
  remarque TEXT,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL,
  INDEX idx_student (student_id),
  INDEX idx_date (created_at),
  INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fee Types Table
CREATE TABLE IF NOT EXISTS fee_types (
  id VARCHAR(36) PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  montant DECIMAL(10, 2) NOT NULL,
  annee_scolaire VARCHAR(20) NOT NULL,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_annee (annee_scolaire),
  INDEX idx_actif (actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Announcements/Messages Table
CREATE TABLE IF NOT EXISTS announcements (
  id VARCHAR(36) PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  contenu TEXT NOT NULL,
  type ENUM('info', 'important', 'urgence') DEFAULT 'info',
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_type (type),
  INDEX idx_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(36) PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  categorie ENUM('releves_notes', 'emplois_temps', 'circulaires', 'bulletins', 'autre') DEFAULT 'autre',
  type_fichier VARCHAR(100),
  taille BIGINT,
  url VARCHAR(500),
  uploaded_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_categorie (categorie),
  INDEX idx_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Grades/Evaluations Table
CREATE TABLE IF NOT EXISTS grades (
  id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  matiere VARCHAR(100) NOT NULL,
  note DECIMAL(5, 2) NOT NULL,
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

-- Schedules/Timetable Table
CREATE TABLE IF NOT EXISTS schedules (
  id VARCHAR(36) PRIMARY KEY,
  classe_id VARCHAR(36) NOT NULL,
  jour ENUM('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi') NOT NULL,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  matiere VARCHAR(100) NOT NULL,
  teacher_id VARCHAR(36),
  salle VARCHAR(50),
  annee_scolaire VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (classe_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
  INDEX idx_classe (classe_id),
  INDEX idx_jour (jour),
  INDEX idx_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Helper function to generate UUID (compatible with older MySQL versions)
-- Note: CHECK constraint removed for compatibility with MySQL < 8.0.16
-- The application layer will validate note values (0-20)

