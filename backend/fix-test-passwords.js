import bcrypt from 'bcryptjs';
import pool from './src/database/db.js';
import dotenv from 'dotenv';

dotenv.config();

const testUsers = [
  { email: 'admin@koussanar.sn', password: 'admin123456' },
  { email: 'superadmin@koussanar.sn', password: 'superadmin123' },
  { email: 'professeur.math@koussanar.sn', password: 'prof123456' },
  { email: 'professeur.francais@koussanar.sn', password: 'prof123456' },
  { email: 'professeur.anglais@koussanar.sn', password: 'prof123456' },
  { email: 'eleve1@koussanar.sn', password: 'eleve123456' },
  { email: 'eleve2@koussanar.sn', password: 'eleve123456' },
  { email: 'eleve3@koussanar.sn', password: 'eleve123456' },
  { email: 'comptable@koussanar.sn', password: 'comptable123' },
  { email: 'parent@koussanar.sn', password: 'parent123456' },
  { email: 'surveillant@koussanar.sn', password: 'surveillant123' },
];

async function fixPasswords() {
  try {
    console.log('🔧 Mise à jour des mots de passe...\n');
    for (const user of testUsers) {
      const hashed = await bcrypt.hash(user.password, 10);
      const [result] = await pool.execute(
        'UPDATE profiles SET password = ? WHERE email = ?',
        [hashed, user.email]
      );
      if (result.affectedRows > 0) {
        console.log(`✅ ${user.email} mis à jour`);
      } else {
        console.log(`⚠️  ${user.email} introuvable`);
      }
    }
    console.log('\n✅ Terminé !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

fixPasswords();