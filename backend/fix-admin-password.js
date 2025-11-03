import bcrypt from 'bcryptjs';
import pool from './src/database/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixAdminPassword() {
  try {
    const email = 'admin@koussanar.sn';
    const password = 'admin123456';

    console.log('🔧 Correction du mot de passe admin...\n');

    // Récupérer le compte admin
    const [profiles] = await pool.execute(
      'SELECT id, email, password FROM profiles WHERE email = ?',
      [email]
    );

    if (profiles.length === 0) {
      console.log('❌ Aucun compte trouvé avec l\'email:', email);
      process.exit(1);
    }

    const profile = profiles[0];
    console.log('✅ Compte trouvé:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Hash actuel: ${profile.password.substring(0, 30)}...\n`);

    // Générer un nouveau hash pour admin123456
    console.log('🔑 Génération d\'un nouveau hash pour "admin123456"...');
    const newHash = await bcrypt.hash(password, 10);
    console.log(`   Nouveau hash: ${newHash.substring(0, 30)}...\n`);

    // Vérifier que le nouveau hash fonctionne
    const testMatch = await bcrypt.compare(password, newHash);
    if (!testMatch) {
      console.log('❌ Erreur: Le hash généré ne fonctionne pas !');
      process.exit(1);
    }
    console.log('✅ Vérification: Le nouveau hash fonctionne correctement\n');

    // Mettre à jour le mot de passe dans la base de données
    console.log('📝 Mise à jour du mot de passe dans la base de données...');
    await pool.execute(
      'UPDATE profiles SET password = ? WHERE id = ?',
      [newHash, profile.id]
    );
    console.log('✅ Mot de passe mis à jour\n');

    // Vérifier que ça fonctionne en lisant depuis la base
    const [verify] = await pool.execute(
      'SELECT password FROM profiles WHERE id = ?',
      [profile.id]
    );

    const isValid = await bcrypt.compare(password, verify[0].password);
    if (isValid) {
      console.log('✅ Vérification finale: Le mot de passe fonctionne !');
    } else {
      console.log('❌ Erreur: La vérification finale a échoué');
      process.exit(1);
    }

    // Vérifier que le rôle admin existe
    const [roles] = await pool.execute(
      'SELECT role FROM user_roles WHERE user_id = ? AND role = ?',
      [profile.id, 'admin']
    );

    if (roles.length === 0) {
      console.log('\n⚠️  ATTENTION: Le rôle admin n\'est pas assigné !');
      console.log('   Exécutez cette commande SQL:');
      console.log(`   INSERT INTO user_roles (id, user_id, role) VALUES (UUID(), '${profile.id}', 'admin');`);
    } else {
      console.log('\n✅ Le rôle admin est déjà assigné');
    }

    console.log('\n📋 Identifiants de connexion:');
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Mot de passe: ${password}`);
    console.log('\n✅ Vous pouvez maintenant vous connecter !\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\nDétails:', error);
    process.exit(1);
  }
}

fixAdminPassword();


