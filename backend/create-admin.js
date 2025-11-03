import bcrypt from 'bcryptjs';
import pool from './src/database/db.js';
import { generateUUID } from './src/utils/uuid.js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

async function createAdmin() {
  try {
    // Configuration par défaut - Modifiez ces valeurs si nécessaire
    const email = process.env.ADMIN_EMAIL || 'admin@koussanar.sn';
    const password = process.env.ADMIN_PASSWORD || 'admin123456';
    const nom = process.env.ADMIN_NOM || 'Admin';
    const prenom = process.env.ADMIN_PRENOM || 'Système';

    console.log('🔧 Création du compte administrateur...');
    console.log(`📧 Email: ${email}`);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateUUID();

    // Check if admin exists
    const [existing] = await pool.execute(
      'SELECT id FROM profiles WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      console.log('⚠️  Un compte avec cet email existe déjà');
      
      // Check if user already has admin role
      const [existingRoles] = await pool.execute(
        'SELECT role FROM user_roles WHERE user_id = ? AND role = ?',
        [existing[0].id, 'admin']
      );

      if (existingRoles.length > 0) {
        console.log('✅ Ce compte a déjà le rôle admin');
      } else {
        // Add admin role to existing user
        await pool.execute(
          'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
          [generateUUID(), existing[0].id, 'admin']
        );
        console.log('✅ Rôle admin ajouté au compte existant');
      }
      
      console.log('\n🔐 Vous pouvez vous connecter avec:');
      console.log(`   Email: ${email}`);
      console.log(`   Mot de passe: (votre mot de passe actuel)`);
      process.exit(0);
    }

    // Create user
    await pool.execute(
      'INSERT INTO profiles (id, email, password, nom, prenom, statut_actif) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, email, hashedPassword, nom, prenom, true]
    );

    // Assign admin role
    await pool.execute(
      'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
      [generateUUID(), userId, 'admin']
    );

    console.log('✅ Compte admin créé avec succès !');
    console.log('\n📋 Identifiants de connexion:');
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Mot de passe: ${password}`);
    console.log('\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion !');
    console.log('\n🌐 Connectez-vous à l\'application avec ces identifiants');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création du compte admin:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Assurez-vous que:');
      console.error('   1. MySQL est démarré');
      console.error('   2. Le fichier .env est correctement configuré dans backend/.env');
      console.error('   3. La base de données koussanar_erp existe');
    }
    process.exit(1);
  }
}

createAdmin();

