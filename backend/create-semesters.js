import pool from './src/database/db.js';
import { generateUUID } from './src/utils/uuid.js';
import dotenv from 'dotenv';

dotenv.config();

async function createSemesters() {
  try {
    console.log('📅 Création des semestres pour l\'année scolaire...');
    
    const currentYear = new Date().getFullYear();
    const anneeScolaire = `${currentYear}-${currentYear + 1}`;
    
    // Vérifier si des semestres existent déjà pour cette année
    const [existing] = await pool.execute(
      'SELECT * FROM semesters WHERE annee_scolaire = ?',
      [anneeScolaire]
    );
    
    if (existing.length > 0) {
      console.log(`⚠️  Des semestres existent déjà pour l'année ${anneeScolaire}:`);
      existing.forEach(s => {
        console.log(`  - ${s.nom} (Semestre ${s.numero})`);
      });
      console.log('\nVoulez-vous les remplacer ? (O/N)');
      return;
    }
    
    // Vérifier la structure de la table
    const [columns] = await pool.execute('DESCRIBE semesters');
    const hasActifColumn = columns.some(col => col.Field === 'actif');
    const hasStatutColumn = columns.some(col => col.Field === 'statut');
    
    console.log(`Structure détectée: ${hasActifColumn ? 'actif (BOOLEAN)' : hasStatutColumn ? 'statut (ENUM)' : 'inconnue'}`);
    
    // Dates pour les semestres
    const semestre1Debut = new Date(currentYear, 8, 1); // 1er septembre
    const semestre1Fin = new Date(currentYear + 1, 0, 31); // 31 janvier
    const semestre2Debut = new Date(currentYear + 1, 1, 1); // 1er février
    const semestre2Fin = new Date(currentYear + 1, 5, 30); // 30 juin
    
    const semesters = [
      {
        nom: 'Premier semestre',
        numero: 1,
        annee_scolaire: anneeScolaire,
        date_debut: semestre1Debut.toISOString().split('T')[0],
        date_fin: semestre1Fin.toISOString().split('T')[0],
      },
      {
        nom: 'Deuxième semestre',
        numero: 2,
        annee_scolaire: anneeScolaire,
        date_debut: semestre2Debut.toISOString().split('T')[0],
        date_fin: semestre2Fin.toISOString().split('T')[0],
      },
    ];
    
    console.log(`\nCréation des semestres pour ${anneeScolaire}:`);
    
    for (const semester of semesters) {
      const id = generateUUID();
      
      // Vérifier si le semestre existe déjà
      const [check] = await pool.execute(
        'SELECT id FROM semesters WHERE annee_scolaire = ? AND numero = ?',
        [semester.annee_scolaire, semester.numero]
      );
      
      if (check.length > 0) {
        console.log(`  ⚠️  Semestre ${semester.numero} existe déjà, ignoré`);
        continue;
      }
      
      if (hasActifColumn) {
        await pool.execute(
          `INSERT INTO semesters (id, nom, numero, annee_scolaire, date_debut, date_fin, actif) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, semester.nom, semester.numero, semester.annee_scolaire, semester.date_debut, semester.date_fin, true]
        );
      } else if (hasStatutColumn) {
        await pool.execute(
          `INSERT INTO semesters (id, nom, numero, annee_scolaire, date_debut, date_fin, statut) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, semester.nom, semester.numero, semester.annee_scolaire, semester.date_debut, semester.date_fin, 'actif']
        );
      } else {
        await pool.execute(
          `INSERT INTO semesters (id, nom, numero, annee_scolaire, date_debut, date_fin) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, semester.nom, semester.numero, semester.annee_scolaire, semester.date_debut, semester.date_fin]
        );
      }
      
      console.log(`  ✅ ${semester.nom} créé (${semester.date_debut} au ${semester.date_fin})`);
    }
    
    console.log('\n✅ Semestres créés avec succès !');
    
    // Afficher les semestres créés
    const [allSemesters] = await pool.execute(
      'SELECT * FROM semesters WHERE annee_scolaire = ? ORDER BY numero ASC',
      [anneeScolaire]
    );
    
    console.log(`\n📋 Liste des semestres pour ${anneeScolaire}:`);
    allSemesters.forEach(s => {
      const statut = s.actif !== undefined ? (s.actif ? 'Actif' : 'Inactif') : (s.statut || 'N/A');
      console.log(`  - ${s.nom} (Semestre ${s.numero}): ${s.date_debut} au ${s.date_fin} [${statut}]`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des semestres:', error);
  } finally {
    await pool.end();
  }
}

createSemesters();


















