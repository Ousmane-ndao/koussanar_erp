import bcrypt from 'bcryptjs';
import pool from './src/database/db.js';
import { generateUUID } from './src/utils/uuid.js';
import dotenv from 'dotenv';

dotenv.config();

const testUsers = [
  // Admin
  {
    email: 'admin@koussanar.sn',
    password: 'admin123456',
    nom: 'Admin',
    prenom: 'Système',
    role: 'admin',
    description: 'Administrateur principal'
  },
  
  // Super Admin
  {
    email: 'superadmin@koussanar.sn',
    password: 'superadmin123',
    nom: 'Super',
    prenom: 'Administrateur',
    role: 'super_admin',
    description: 'Super administrateur technique'
  },
  
  // Enseignants
  {
    email: 'professeur.math@koussanar.sn',
    password: 'prof123456',
    nom: 'Diop',
    prenom: 'Amadou',
    role: 'enseignant',
    specialite: 'Mathématiques',
    description: 'Professeur de Mathématiques'
  },
  {
    email: 'professeur.francais@koussanar.sn',
    password: 'prof123456',
    nom: 'Ndiaye',
    prenom: 'Fatou',
    role: 'enseignant',
    specialite: 'Français',
    description: 'Professeur de Français'
  },
  {
    email: 'professeur.anglais@koussanar.sn',
    password: 'prof123456',
    nom: 'Ba',
    prenom: 'Moussa',
    role: 'enseignant',
    specialite: 'Anglais',
    description: 'Professeur d\'Anglais'
  },
  
  // Élèves
  {
    email: 'eleve1@koussanar.sn',
    password: 'eleve123456',
    nom: 'Sall',
    prenom: 'Ibrahima',
    role: 'eleve',
    matricule: 'ELEV001',
    description: 'Élève - Terminale S'
  },
  {
    email: 'eleve2@koussanar.sn',
    password: 'eleve123456',
    nom: 'Diallo',
    prenom: 'Aissatou',
    role: 'eleve',
    matricule: 'ELEV002',
    description: 'Élève - Première L'
  },
  {
    email: 'eleve3@koussanar.sn',
    password: 'eleve123456',
    nom: 'Fall',
    prenom: 'Ousmane',
    role: 'eleve',
    matricule: 'ELEV003',
    description: 'Élève - Seconde A'
  },
  
  // Comptable
  {
    email: 'comptable@koussanar.sn',
    password: 'comptable123',
    nom: 'Kane',
    prenom: 'Mariama',
    role: 'comptable',
    description: 'Comptable principal'
  },
  
  // Parent
  {
    email: 'parent@koussanar.sn',
    password: 'parent123456',
    nom: 'Sy',
    prenom: 'Mamadou',
    role: 'parent',
    description: 'Parent d\'élève'
  },
  
  // Surveillant
  {
    email: 'surveillant@koussanar.sn',
    password: 'surveillant123',
    nom: 'Thiam',
    prenom: 'Abdou',
    role: 'surveillant',
    description: 'Surveillant général'
  }
];

async function createTestUsers() {
  try {
    console.log('🔧 Création des comptes de test...\n');

    for (const userData of testUsers) {
      try {
        // Vérifier si l'utilisateur existe déjà
        const [existing] = await pool.execute(
          'SELECT id FROM profiles WHERE email = ?',
          [userData.email]
        );

        if (existing.length > 0) {
          console.log(`⊘ ${userData.email} existe déjà - ignoré`);
          
          // Vérifier et ajouter le rôle s'il manque
          const userId = existing[0].id;
          const [existingRoles] = await pool.execute(
            'SELECT role FROM user_roles WHERE user_id = ? AND role = ?',
            [userId, userData.role]
          );

          if (existingRoles.length === 0) {
            await pool.execute(
              'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
              [generateUUID(), userId, userData.role]
            );
            console.log(`  ✅ Rôle ${userData.role} ajouté`);
          }
          continue;
        }

        // Créer le profil
        const userId = generateUUID();
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        await pool.execute(
          'INSERT INTO profiles (id, email, password, nom, prenom) VALUES (?, ?, ?, ?, ?)',
          [userId, userData.email, hashedPassword, userData.nom, userData.prenom]
        );

        // Assigner le rôle
        await pool.execute(
          'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
          [generateUUID(), userId, userData.role]
        );

        // Si c'est un enseignant, créer l'entrée dans teachers
        if (userData.role === 'enseignant' && userData.specialite) {
          const teacherId = generateUUID();
          await pool.execute(
            'INSERT INTO teachers (id, user_id, matricule, specialite, statut) VALUES (?, ?, ?, ?, ?)',
            [teacherId, userId, `TEA${Date.now()}`, userData.specialite, 'actif']
          );
        }

        // Si c'est un élève, créer l'entrée dans students
        if (userData.role === 'eleve' && userData.matricule) {
          const studentId = generateUUID();
          const currentYear = new Date().getFullYear();
          const anneeScolaire = `${currentYear}-${currentYear + 1}`;
          
          await pool.execute(
            `INSERT INTO students (id, user_id, matricule, date_naissance, sexe, annee_scolaire, statut_inscription) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [studentId, userId, userData.matricule, '2010-01-01', 'M', anneeScolaire, 'actif']
          );
        }

        console.log(`✅ ${userData.email} créé (${userData.description})`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⊘ ${userData.email} existe déjà`);
        } else {
          console.error(`❌ Erreur pour ${userData.email}:`, error.message);
        }
      }
    }

    console.log('\n📋 Résumé des comptes de test créés :\n');
    console.log('='.repeat(80));
    console.log('ROLE'.padEnd(20) + 'EMAIL'.padEnd(35) + 'MOT DE PASSE');
    console.log('='.repeat(80));
    
    testUsers.forEach(user => {
      console.log(user.role.padEnd(20) + user.email.padEnd(35) + user.password);
    });
    
    console.log('='.repeat(80));
    console.log('\n✅ Création des comptes de test terminée !\n');
    console.log('💡 Vous pouvez maintenant vous connecter avec ces identifiants.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\nDétails:', error);
    process.exit(1);
  }
}

createTestUsers();

