import pool from './src/database/db.js';

async function checkSemestersTable() {
  try {
    console.log('Vérification de la table semesters...');
    
    // Vérifier si la table existe
    const [tables] = await pool.execute(
      "SHOW TABLES LIKE 'semesters'"
    );
    
    if (tables.length === 0) {
      console.log('❌ La table semesters n\'existe PAS dans la base de données');
      console.log('\nPour créer la table, exécutez le fichier migration:');
      console.log('  backend/src/database/migration_add_semesters.sql');
      console.log('\nOu exécutez directement:');
      console.log('  mysql -u votre_user -p votre_database < backend/src/database/migration_add_semesters.sql');
      return;
    }
    
    console.log('✅ La table semesters existe');
    
    // Vérifier la structure
    const [columns] = await pool.execute('DESCRIBE semesters');
    console.log('\nStructure de la table:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });
    
    // Compter les enregistrements
    const [count] = await pool.execute('SELECT COUNT(*) as count FROM semesters');
    console.log(`\n📊 Nombre de semestres: ${count[0].count}`);
    
    if (count[0].count > 0) {
      const [semesters] = await pool.execute('SELECT * FROM semesters ORDER BY annee_scolaire DESC, numero ASC LIMIT 5');
      console.log('\nExemples de semestres:');
      semesters.forEach(s => {
        console.log(`  - ${s.nom} (${s.annee_scolaire}) - Semestre ${s.numero}: ${s.date_debut} au ${s.date_fin} [${s.actif ? 'Actif' : 'Inactif'}]`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkSemestersTable();


















