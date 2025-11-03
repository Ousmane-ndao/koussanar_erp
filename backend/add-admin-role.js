import pool from './src/database/db.js';
import { generateUUID } from './src/utils/uuid.js';
import dotenv from 'dotenv';

dotenv.config();

async function addAdminRole() {
  try {
    const email = 'admin@koussanar.sn';

    console.log('🔧 Ajout du rôle admin...\n');

    // Récupérer le compte admin
    const [profiles] = await pool.execute(
      'SELECT id, email, nom, prenom FROM profiles WHERE email = ?',
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
    console.log(`   Nom: ${profile.nom} ${profile.prenom}\n`);

    // Vérifier si le rôle admin existe déjà
    const [existingRoles] = await pool.execute(
      'SELECT role FROM user_roles WHERE user_id = ? AND role = ?',
      [profile.id, 'admin']
    );

    if (existingRoles.length > 0) {
      console.log('✅ Le rôle admin est déjà assigné à ce compte\n');
      process.exit(0);
    }

    // Ajouter le rôle admin
    console.log('📝 Ajout du rôle admin...');
    await pool.execute(
      'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
      [generateUUID(), profile.id, 'admin']
    );
    console.log('✅ Rôle admin ajouté avec succès\n');

    // Vérification finale
    const [roles] = await pool.execute(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [profile.id]
    );

    console.log('📋 Rôles assignés:');
    roles.forEach(r => {
      console.log(`   ✅ ${r.role}`);
    });

    console.log('\n✅ Tout est prêt !');
    console.log('📋 Vous pouvez maintenant vous connecter avec:');
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Mot de passe: admin123456\n`);

    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('✅ Le rôle admin existe déjà\n');
      process.exit(0);
    }
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

addAdminRole();


