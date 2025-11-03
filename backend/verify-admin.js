import pool from './src/database/db.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function verifyAdmin() {
  try {
    const email = 'admin@koussanar.sn';
    const testPassword = 'admin123456';

    console.log('🔍 Vérification du compte admin...\n');

    // 1. Vérifier si le profil existe
    const [profiles] = await pool.execute(
      'SELECT id, email, password, nom, prenom, statut_actif FROM profiles WHERE email = ?',
      [email]
    );

    if (profiles.length === 0) {
      console.log('❌ Aucun profil trouvé avec l\'email:', email);
      process.exit(1);
    }

    const profile = profiles[0];
    console.log('✅ Profil trouvé:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Nom: ${profile.nom} ${profile.prenom}`);
    console.log(`   Statut actif: ${profile.statut_actif ? 'Oui' : 'Non'}`);
    console.log(`   Mot de passe hashé: ${profile.password.substring(0, 20)}...\n`);

    // 2. Vérifier le mot de passe
    console.log('🔑 Test du mot de passe...');
    const isValidPassword = await bcrypt.compare(testPassword, profile.password);
    if (isValidPassword) {
      console.log('✅ Le mot de passe "admin123456" est correct\n');
    } else {
      console.log('❌ Le mot de passe "admin123456" est incorrect');
      console.log('   Le hash dans la base ne correspond pas à "admin123456"\n');
    }

    // 3. Vérifier les rôles
    const [roles] = await pool.execute(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [profile.id]
    );

    console.log('👤 Rôles assignés:');
    if (roles.length === 0) {
      console.log('   ❌ AUCUN RÔLE ASSIGNÉ !');
      console.log('   ⚠️  Vous devez ajouter le rôle "admin" dans la table user_roles\n');
      
      console.log('💡 Solution: Exécutez cette commande SQL:');
      console.log(`   INSERT INTO user_roles (id, user_id, role) VALUES (UUID(), '${profile.id}', 'admin');\n`);
    } else {
      roles.forEach(r => {
        if (r.role === 'admin') {
          console.log(`   ✅ ${r.role}`);
        } else {
          console.log(`   ⚠️  ${r.role} (pas admin)`);
        }
      });
      console.log('');
    }

    // 4. Résumé
    console.log('📋 Résumé:');
    console.log(`   Profil existe: ✅`);
    console.log(`   Mot de passe valide: ${isValidPassword ? '✅' : '❌'}`);
    console.log(`   Rôle admin: ${roles.some(r => r.role === 'admin') ? '✅' : '❌'}`);
    console.log(`   Statut actif: ${profile.statut_actif ? '✅' : '❌'}\n`);

    if (isValidPassword && roles.some(r => r.role === 'admin') && profile.statut_actif) {
      console.log('✅ Tout est correct ! Vous pouvez vous connecter avec:');
      console.log(`   Email: ${email}`);
      console.log(`   Mot de passe: ${testPassword}\n`);
    } else {
      console.log('❌ Des corrections sont nécessaires. Suivez les instructions ci-dessus.\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

verifyAdmin();


