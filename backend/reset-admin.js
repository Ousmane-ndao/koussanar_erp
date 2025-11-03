import bcrypt from 'bcryptjs';
import pool from './src/database/db.js';
import { generateUUID } from './src/utils/uuid.js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

async function resetAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@koussanar.sn';
    const password = process.env.ADMIN_PASSWORD || 'admin123456';
    const nom = process.env.ADMIN_NOM || 'Admin';
    const prenom = process.env.ADMIN_PRENOM || 'Système';

    console.log('🔧 Réinitialisation du compte administrateur...');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Nouveau mot de passe: ${password}`);
    console.log('');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Vérifier si le compte existe
    const [existing] = await pool.execute(
      'SELECT id, email, nom, prenom, password FROM profiles WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      const userId = existing[0].id;
      console.log('⚠️  Compte existant trouvé. Mise à jour du mot de passe...');

      // Mettre à jour le mot de passe
      await pool.execute(
        'UPDATE profiles SET password = ?, nom = ?, prenom = ?, statut_actif = ? WHERE id = ?',
        [hashedPassword, nom, prenom, true, userId]
      );

      console.log('✅ Mot de passe mis à jour');

      // Vérifier si le rôle admin existe
      const [existingRoles] = await pool.execute(
        'SELECT role FROM user_roles WHERE user_id = ? AND role = ?',
        [userId, 'admin']
      );

      if (existingRoles.length === 0) {
        // Ajouter le rôle admin
        await pool.execute(
          'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
          [generateUUID(), userId, 'admin']
        );
        console.log('✅ Rôle admin ajouté');
      } else {
        console.log('✅ Rôle admin déjà présent');
      }
    } else {
      console.log('📝 Création d\'un nouveau compte admin...');
      const userId = generateUUID();

      // Créer le compte
      await pool.execute(
        'INSERT INTO profiles (id, email, password, nom, prenom, statut_actif) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, email, hashedPassword, nom, prenom, true]
      );

      // Ajouter le rôle admin
      await pool.execute(
        'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
        [generateUUID(), userId, 'admin']
      );

      console.log('✅ Nouveau compte admin créé');
    }

    // Test de vérification du mot de passe
    console.log('\n🔍 Vérification du mot de passe...');
    const [verify] = await pool.execute(
      'SELECT password FROM profiles WHERE email = ?',
      [email]
    );

    if (verify.length > 0) {
      const isValid = await bcrypt.compare(password, verify[0].password);
      if (isValid) {
        console.log('✅ Vérification réussie ! Le mot de passe fonctionne.');
      } else {
        console.log('❌ Erreur: La vérification du mot de passe a échoué');
      }
    }

    console.log('\n✅ Réinitialisation terminée !');
    console.log('\n📋 Identifiants de connexion:');
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Mot de passe: ${password}`);
    console.log('\n🌐 Vous pouvez maintenant vous connecter avec ces identifiants');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors de la réinitialisation:', error.message);
    console.error('\nDétails de l\'erreur:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Assurez-vous que:');
      console.error('   1. MySQL est démarré');
      console.error('   2. Le fichier .env est correctement configuré dans backend/.env');
      console.error('   3. La base de données koussanar_erp existe');
    }
    
    process.exit(1);
  }
}

resetAdmin();


