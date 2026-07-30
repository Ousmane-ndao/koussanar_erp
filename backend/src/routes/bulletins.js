import express from 'express';
import pool from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';

const router = express.Router();

// ---------- Fonction réutilisable de récupération des données ----------
async function getBulletinData(eleveId, semestreId) {
    // 1. Récupérer les infos de l'élève (en priorité via student_id, fallback via user_id)
    let [eleveRows] = await pool.execute(`
        SELECT p.id as user_id, p.nom, p.prenom, p.email, p.telephone,
               s.id as student_id, s.matricule, s.date_naissance, s.lieu_naissance, s.sexe,
               c.id as classe_id, c.nom as classe_nom, c.niveau
        FROM students s
        JOIN profiles p ON s.user_id = p.id
        LEFT JOIN classes c ON s.classe_id = c.id
        WHERE s.id = ?
    `, [eleveId]);

    if (eleveRows.length === 0) {
        [eleveRows] = await pool.execute(`
            SELECT p.id as user_id, p.nom, p.prenom, p.email, p.telephone,
                   s.id as student_id, s.matricule, s.date_naissance, s.lieu_naissance, s.sexe,
                   c.id as classe_id, c.nom as classe_nom, c.niveau
            FROM profiles p
            JOIN students s ON s.user_id = p.id
            LEFT JOIN classes c ON s.classe_id = c.id
            WHERE p.id = ?
        `, [eleveId]);
    }

    if (eleveRows.length === 0) {
        throw new Error('Élève non trouvé');
    }

    const eleve = eleveRows[0];

    // 2. Récupérer les notes de l'élève pour ce semestre
    const [grades] = await pool.execute(`
        SELECT g.*
        FROM grades g
        WHERE g.student_id = ? AND g.semestre_id = ?
    `, [eleve.student_id, semestreId]);

    // 3. Récupérer les infos du semestre
    const [semestreRows] = await pool.execute(`
        SELECT * FROM semesters WHERE id = ?
    `, [semestreId]);
    const semestre = semestreRows[0] || { nom: 'Semestre 1', numero: 1, annee_scolaire: '2026-2027' };

    // 4. Calculer les moyennes par matière
    const matieresMap = new Map();
    grades.forEach(g => {
        const key = g.matiere;
        if (!matieresMap.has(key)) {
            matieresMap.set(key, { notes: [], coefficients: [] });
        }
        matieresMap.get(key).notes.push(parseFloat(g.note));
        matieresMap.get(key).coefficients.push(parseFloat(g.coefficient || 1));
    });

    const matieresBulletin = [];
    let totalPoints = 0;
    let totalCoefs = 0;

    matieresMap.forEach((value, matiere) => {
        const notes = value.notes;
        const coefs = value.coefficients;
        // Moyenne simple des notes (pour la colonne "Devoir")
        const moyenneSimple = notes.reduce((a, b) => a + b, 0) / notes.length;
        // Moyenne pondérée (pour la colonne "Moy/20")
        let sommePonderee = 0;
        let sommeCoefs = 0;
        notes.forEach((n, i) => {
            sommePonderee += n * coefs[i];
            sommeCoefs += coefs[i];
        });
        const moyennePonderee = sommeCoefs > 0 ? sommePonderee / sommeCoefs : moyenneSimple;
        const coef = coefs[0] || 1;

        matieresBulletin.push({
            matiere,
            moyenne_simple: parseFloat(moyenneSimple.toFixed(3)),
            moyenne_ponderee: parseFloat(moyennePonderee.toFixed(3)),
            coefficient: coef,
            total_points: parseFloat((moyennePonderee * coef).toFixed(2)),
            notes: notes.map(n => parseFloat(n.toFixed(2)))
        });

        totalPoints += moyennePonderee * coef;
        totalCoefs += coef;
    });

    const moyenneGenerale = totalCoefs > 0 ? parseFloat((totalPoints / totalCoefs).toFixed(3)) : 0;

    // 5. Calcul du rang dans la classe pour ce semestre
    const [classRanks] = await pool.execute(`
        SELECT s.user_id,
               (SELECT AVG(g.note * g.coefficient) / AVG(g.coefficient)
                FROM grades g
                WHERE g.student_id = s.user_id AND g.semestre_id = ?
               ) as moyenne
        FROM students s
        WHERE s.classe_id = ?
        ORDER BY moyenne DESC
    `, [semestreId, eleve.classe_id]);

    let rang = 1;
    let totalEleves = classRanks.length;
    let moyennesEleves = classRanks.map(r => parseFloat(r.moyenne) || 0);
    const moyenneClasse = moyennesEleves.length > 0 ? moyennesEleves.reduce((a, b) => a + b, 0) / moyennesEleves.length : 0;
    const index = moyennesEleves.findIndex(m => m === moyenneGenerale);
    if (index !== -1) rang = index + 1;

    // 6. Appréciation
    let appreciation = '';
    if (moyenneGenerale >= 16) appreciation = 'EXCELLENT(E) ELEVE';
    else if (moyenneGenerale >= 14) appreciation = 'TRES BON ELEVE';
    else if (moyenneGenerale >= 12) appreciation = 'BON ELEVE';
    else if (moyenneGenerale >= 10) appreciation = 'ASSEZ BON ELEVE';
    else if (moyenneGenerale >= 8) appreciation = 'ELEVE PASSABLE';
    else if (moyenneGenerale >= 6) appreciation = 'ELEVE FAIBLE';
    else appreciation = 'ELEVE TRES FAIBLE';

    // 7. Absences et retards
    const [absenceData] = await pool.execute(`
        SELECT COUNT(*) as nb_absences,
               SUM(CASE WHEN status = 'retard' THEN 1 ELSE 0 END) as nb_retards
        FROM attendance
        WHERE student_id = ? AND DATE BETWEEN ? AND ?
    `, [eleve.student_id, semestre.date_debut, semestre.date_fin]);

    const nbAbsences = absenceData[0]?.nb_absences || 0;
    const nbRetards = absenceData[0]?.nb_retards || 0;

    // 8. Construire l'objet bulletin
    return {
        eleve: {
            ...eleve,
            date_naissance: eleve.date_naissance ? new Date(eleve.date_naissance).toLocaleDateString('fr-FR') : '',
            lieu_naissance: eleve.lieu_naissance || 'Non renseigné'
        },
        semestre: {
            nom: semestre.nom,
            numero: semestre.numero,
            annee_scolaire: semestre.annee_scolaire
        },
        matieres: matieresBulletin,
        moyenne_generale: moyenneGenerale,
        rang: rang,
        total_eleves: totalEleves,
        moyenne_classe: parseFloat(moyenneClasse.toFixed(3)),
        absences: nbAbsences,
        retards: nbRetards,
        appreciation: appreciation,
        total_points: parseFloat(totalPoints.toFixed(2))
    };
}

// ---------- Route GET (renvoie le JSON) ----------
router.get('/:eleveId/:semestreId', authenticateToken, async (req, res) => {
    try {
        const { eleveId, semestreId } = req.params;
        const data = await getBulletinData(eleveId, semestreId);
        res.json(data);
    } catch (error) {
        console.error('Erreur bulletin:', error);
        res.status(404).json({ message: error.message || 'Données non trouvées' });
    }
});

// ---------- Route POST (génère le PDF) ----------
router.post('/generate-pdf', authenticateToken, async (req, res) => {
    try {
        const { eleveId, semestreId } = req.body;
        const data = await getBulletinData(eleveId, semestreId);

        if (!data.eleve) {
            return res.status(404).json({ message: 'Données non trouvées' });
        }

        // Création du document PDF
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=bulletin_${data.eleve.matricule}_${data.semestre.nom}.pdf`);
            res.send(pdfData);
        });

        // ----- EN-TÊTE -----
        doc.fontSize(14).font('Helvetica-Bold').text('BULLETIN DE NOTES', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text(`Année Scolaire: ${data.semestre.annee_scolaire} - ${data.semestre.nom}`, { align: 'center' });
        doc.moveDown(0.8);

        // Informations élève
        const leftX = 50;
        let y = doc.y;
        doc.fontSize(10).font('Helvetica');
        doc.text(`Prénoms: ${data.eleve.prenom || ''}`, leftX, y);
        doc.text(`Né(e) le: ${data.eleve.date_naissance || ''}`, leftX + 300, y);
        y += 16;
        doc.text(`Nom: ${data.eleve.nom || ''}`, leftX, y);
        doc.text(`Matricule: ${data.eleve.matricule || ''}`, leftX + 300, y);
        y += 16;
        doc.text(`Classe: ${data.eleve.classe_nom || ''} (${data.eleve.niveau || ''})`, leftX, y);
        doc.text(`Nbre d'élèves: ${data.total_eleves}`, leftX + 300, y);
        y += 20;

        // ----- TABLEAU DES NOTES -----
        const tableTop = y;
        const col1 = 50;    // Discipline
        const col2 = 160;   // Devoir (moyenne simple)
        const col3 = 210;   // Comp (coefficient)
        const col4 = 260;   // Moy/20 (moyenne pondérée)
        const col5 = 320;   // Coef (même que comp)
        const col6 = 375;   // Moy x T.HR (total points)
        const col7 = 450;   // Rang
        const col8 = 490;   // Appréciations (text)
        const rowHeight = 20;

        // En-têtes du tableau
        doc.font('Helvetica-Bold').fontSize(8);
        doc.text('DISCIPLINES', col1, tableTop);
        doc.text('Devoir', col2, tableTop);
        doc.text('Comp', col3, tableTop);
        doc.text('Moy/20', col4, tableTop);
        doc.text('Coef', col5, tableTop);
        doc.text('Moy x T.HR', col6, tableTop);
        doc.text('Rang', col7, tableTop);
        doc.text('Appréciations', col8, tableTop);

        // Ligne horizontale sous en-têtes
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let yPos = tableTop + 18;
        doc.font('Helvetica').fontSize(8);
        let totalCoefs = 0;
        let totalPoints = 0;

        // Trier les matières par ordre alphabétique
        const matieresSorted = data.matieres.sort((a, b) => a.matiere.localeCompare(b.matiere));

        matieresSorted.forEach((m, index) => {
            const y = yPos + index * rowHeight;
            // Discipline
            doc.text(m.matiere || '', col1, y);
            // Devoir (moyenne simple)
            doc.text(m.moyenne_simple.toFixed(2), col2, y);
            // Comp (coefficient)
            doc.text(m.coefficient.toFixed(1), col3, y);
            // Moy/20 (moyenne pondérée)
            doc.text(m.moyenne_ponderee.toFixed(2), col4, y);
            // Coef (même)
            doc.text(m.coefficient.toFixed(1), col5, y);
            // Moy x T.HR (total points)
            doc.text(m.total_points.toFixed(2), col6, y);
            // Rang (non disponible par matière, on met un tiret)
            doc.text('-', col7, y);
            // Appréciation
            let appr = '';
            if (m.moyenne_ponderee >= 16) appr = 'Excellent';
            else if (m.moyenne_ponderee >= 14) appr = 'Très bon';
            else if (m.moyenne_ponderee >= 12) appr = 'Bon';
            else if (m.moyenne_ponderee >= 10) appr = 'Assez bien';
            else if (m.moyenne_ponderee >= 8) appr = 'Passable';
            else if (m.moyenne_ponderee >= 6) appr = 'Faible';
            else appr = 'Très faible';
            doc.text(appr, col8, y);

            totalCoefs += m.coefficient;
            totalPoints += m.total_points;
        });

        // Ligne horizontale de fin de tableau
        const lastY = yPos + matieresSorted.length * rowHeight + 5;
        doc.moveTo(50, lastY).lineTo(550, lastY).stroke();

        // Tracer les verticales (bordures de colonnes)
        [col1, col2, col3, col4, col5, col6, col7, col8, 550].forEach(x => {
            doc.moveTo(x, tableTop).lineTo(x, lastY).stroke();
        });

        // ----- RÉSUMÉ -----
        let resumeY = lastY + 15;
        doc.font('Helvetica-Bold').fontSize(9);
        const moyenneGen = data.moyenne_generale;
        doc.text(`Moyenne générale: ${moyenneGen.toFixed(2)} / 20`, 50, resumeY);
        doc.text(`Rang: ${data.rang} / ${data.total_eleves}`, 250, resumeY);
        doc.text(`Retards: ${data.retards}`, 400, resumeY);
        resumeY += 18;
        doc.text(`Absences: ${data.absences}`, 50, resumeY);
        resumeY += 18;

        doc.font('Helvetica-Bold').fontSize(11);
        doc.text(`Appréciation: ${data.appreciation}`, 50, resumeY);

        // ----- OBSERVATIONS (vide pour l'instant) -----
        resumeY += 30;
        doc.fontSize(9).font('Helvetica');
        doc.text('Observations du conseil des professeurs:', 50, resumeY);
        // On pourrait ajouter un champ libre ici si nécessaire.

        // ----- PIED DE PAGE -----
        doc.moveDown(3);
        doc.fontSize(8).text('Lycée de Koussanar - Système ERP', 50, 750, { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('Erreur génération PDF:', error);
        res.status(500).json({ message: error.message || 'Erreur lors de la génération du PDF' });
    }
});

export default router;