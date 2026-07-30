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
    const semestre = semestreRows[0] || { nom: 'Semestre 1', numero: 1 };

    // 4. Calculer les moyennes par matière
    const matieresMap = new Map();
    grades.forEach(g => {
        if (!matieresMap.has(g.matiere)) {
            matieresMap.set(g.matiere, { notes: [], coefficients: [] });
        }
        matieresMap.get(g.matiere).notes.push(parseFloat(g.note));
        matieresMap.get(g.matiere).coefficients.push(parseFloat(g.coefficient || 1));
    });

    const matieresBulletin = [];
    let totalPoints = 0;
    let totalCoefs = 0;

    matieresMap.forEach((value, matiere) => {
        const notes = value.notes;
        const coefs = value.coefficients;
        const moyenne = notes.reduce((a, b) => a + b, 0) / notes.length;
        let sommePonderee = 0;
        let sommeCoefs = 0;
        notes.forEach((n, i) => {
            sommePonderee += n * coefs[i];
            sommeCoefs += coefs[i];
        });
        const moyennePonderee = sommeCoefs > 0 ? sommePonderee / sommeCoefs : moyenne;
        const coef = coefs[0] || 1;

        matieresBulletin.push({
            matiere,
            moyenne: parseFloat(moyenne.toFixed(3)),
            moyenne_ponderee: parseFloat(moyennePonderee.toFixed(3)),
            coefficient: coef,
            total_points: parseFloat((moyennePonderee * coef).toFixed(2)),
            notes: notes.map(n => parseFloat(n.toFixed(2)))
        });

        totalPoints += moyennePonderee * coef;
        totalCoefs += coef;
    });

    const moyenneGenerale = totalCoefs > 0 ? parseFloat((totalPoints / totalCoefs).toFixed(3)) : 0;

    // 5. Calcul du rang
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

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=bulletin_${data.eleve.matricule}_${data.semestre.nom}.pdf`);
            res.send(pdfData);
        });

        // En-tête
        doc.fontSize(16).text('BULLETIN DE NOTES', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).text(`Lycée de Koussanar - ${data.semestre.annee_scolaire}`, { align: 'center' });
        doc.moveDown(0.5);

        doc.fontSize(10);
        doc.text(`Prénom: ${data.eleve.prenom}`, { continued: true });
        doc.text(`  Nom: ${data.eleve.nom}`, { align: 'right' });
        doc.text(`Né(e) le: ${data.eleve.date_naissance} à ${data.eleve.lieu_naissance}`);
        doc.text(`Classe: ${data.eleve.classe_nom} (${data.eleve.niveau || ''})`);
        doc.text(`Matricule: ${data.eleve.matricule}`);
        doc.text(`Semestre: ${data.semestre.nom}`);
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const col1 = 40;
        const col2 = 200;
        const col3 = 100;
        const col4 = 80;
        const col5 = 80;

        doc.font('Helvetica-Bold');
        doc.text('Disciplines', col1, tableTop);
        doc.text('Moyenne', col2, tableTop);
        doc.text('Coeff', col3, tableTop);
        doc.text('Total', col4, tableTop);
        doc.text('Appréciation', col5, tableTop);

        doc.moveTo(40, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        doc.font('Helvetica');
        let yPos = tableTop + 25;
        data.matieres.forEach(m => {
            doc.text(m.matiere, col1, yPos);
            doc.text(m.moyenne_ponderee.toFixed(3), col2, yPos);
            doc.text(m.coefficient, col3, yPos);
            doc.text(m.total_points.toFixed(2), col4, yPos);
            let appr = '';
            if (m.moyenne_ponderee >= 16) appr = 'Excellent';
            else if (m.moyenne_ponderee >= 14) appr = 'Très bon';
            else if (m.moyenne_ponderee >= 12) appr = 'Bon';
            else if (m.moyenne_ponderee >= 10) appr = 'Assez bien';
            else if (m.moyenne_ponderee >= 8) appr = 'Passable';
            else if (m.moyenne_ponderee >= 6) appr = 'Faible';
            else appr = 'Très faible';
            doc.text(appr, col5, yPos);
            yPos += 20;
        });

        doc.moveTo(40, yPos + 5).lineTo(550, yPos + 5).stroke();
        yPos += 15;

        doc.font('Helvetica-Bold');
        doc.text(`Moyenne Générale: ${data.moyenne_generale.toFixed(3)} / 20`, 40, yPos);
        doc.text(`Rang: ${data.rang} / ${data.total_eleves}`, 250, yPos);
        doc.text(`Moyenne de la classe: ${data.moyenne_classe.toFixed(3)}`, 400, yPos);
        yPos += 20;

        doc.text(`Absences: ${data.absences}`, 40, yPos);
        doc.text(`Retards: ${data.retards}`, 200, yPos);
        yPos += 20;

        doc.font('Helvetica-Bold').fontSize(12);
        doc.text(`Appréciation: ${data.appreciation}`, 40, yPos);

        doc.moveDown(2);
        doc.fontSize(8).text('Lycée de Koussanar - Système ERP', 40, 750, { align: 'center' });
        doc.text('SICAP MBAO VILLA N°88 - Tél: +221338345648', { align: 'center' });

        doc.end();
    } catch (error) {
        console.error('Erreur génération PDF:', error);
        res.status(500).json({ message: error.message || 'Erreur lors de la génération du PDF' });
    }
});

export default router;