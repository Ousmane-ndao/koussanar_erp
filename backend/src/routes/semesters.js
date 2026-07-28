import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/db.js';
import { generateUUID } from '../utils/uuid.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Get all semesters
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { annee_scolaire, actif } = req.query;

        let query = `
      SELECT * FROM semesters
      WHERE 1=1
    `;
        const params = [];

        if (annee_scolaire) {
            query += ' AND annee_scolaire = ?';
            params.push(annee_scolaire);
        }

        if (actif !== undefined) {
            // Gérer les deux formats possibles : actif (BOOLEAN) ou statut (ENUM)
            const actifValue = actif === 'true' || actif === '1';
            query += ' AND (actif = ? OR statut = ?)';
            params.push(actifValue, actifValue ? 'actif' : 'ferme');
        }

        query += ' ORDER BY annee_scolaire DESC, numero ASC';

        const [semesters] = await pool.execute(query, params);

        // Normaliser les données pour le frontend
        const normalizedSemesters = semesters.map(s => ({
            ...s,
            actif: s.actif !== undefined ? s.actif : (s.statut === 'actif'),
            statut: s.statut || (s.actif ? 'actif' : 'ferme')
        }));

        res.json(normalizedSemesters);
    } catch (error) {
        console.error('Get semesters error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des semestres' });
    }
});

// Get semester by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [semesters] = await pool.execute(
            'SELECT * FROM semesters WHERE id = ?',
            [req.params.id]
        );

        if (semesters.length === 0) {
            return res.status(404).json({ message: 'Semestre non trouvé' });
        }

        res.json(semesters[0]);
    } catch (error) {
        console.error('Get semester error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du semestre' });
    }
});

// Get semesters by year
router.get('/annee/:annee_scolaire', authenticateToken, async (req, res) => {
    try {
        const { annee_scolaire } = req.params;
        // Gérer les deux formats : actif (BOOLEAN) ou statut (ENUM)
        const [semesters] = await pool.execute(
            'SELECT * FROM semesters WHERE annee_scolaire = ? AND (actif = TRUE OR statut = \'actif\') ORDER BY numero ASC',
            [annee_scolaire]
        );

        // Normaliser les données
        const normalizedSemesters = semesters.map(s => ({
            ...s,
            actif: s.actif !== undefined ? s.actif : (s.statut === 'actif'),
            statut: s.statut || (s.actif ? 'actif' : 'ferme')
        }));

        res.json(normalizedSemesters);
    } catch (error) {
        console.error('Get semesters by year error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des semestres' });
    }
});

// Create semester
router.post('/', authenticateToken, requirePermission('manage_schedule'), [
    body('nom').trim().notEmpty().withMessage('Le nom est requis'),
    body('numero').isInt({ min: 1, max: 3 }).withMessage('Le numéro doit être entre 1 et 3'),
    body('annee_scolaire').trim().notEmpty().withMessage('L\'année scolaire est requise'),
    body('date_debut').isISO8601().withMessage('La date de début doit être valide'),
    body('date_fin').isISO8601().withMessage('La date de fin doit être valide'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { nom, numero, annee_scolaire, date_debut, date_fin, actif } = req.body;

        // Check if semester number already exists for this year
        const [existing] = await pool.execute(
            'SELECT id FROM semesters WHERE annee_scolaire = ? AND numero = ?',
            [annee_scolaire, numero]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: `Le semestre ${numero} existe déjà pour cette année scolaire` });
        }

        const id = generateUUID();

        // Vérifier si la table utilise 'actif' ou 'statut'
        const [columns] = await pool.execute('DESCRIBE semesters');
        const hasActifColumn = columns.some(col => col.Field === 'actif');
        const hasStatutColumn = columns.some(col => col.Field === 'statut');

        if (hasActifColumn) {
            await pool.execute(
                `INSERT INTO semesters (id, nom, numero, annee_scolaire, date_debut, date_fin, actif) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, nom, numero, annee_scolaire, date_debut, date_fin, actif !== undefined ? actif : true]
            );
        } else if (hasStatutColumn) {
            await pool.execute(
                `INSERT INTO semesters (id, nom, numero, annee_scolaire, date_debut, date_fin, statut) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, nom, numero, annee_scolaire, date_debut, date_fin, actif !== undefined && actif ? 'actif' : 'ferme']
            );
        } else {
            await pool.execute(
                `INSERT INTO semesters (id, nom, numero, annee_scolaire, date_debut, date_fin) 
         VALUES (?, ?, ?, ?, ?, ?)`,
                [id, nom, numero, annee_scolaire, date_debut, date_fin]
            );
        }

        res.status(201).json({ message: 'Semestre créé avec succès', id });
    } catch (error) {
        console.error('Create semester error:', error);
        res.status(500).json({ message: 'Erreur lors de la création du semestre' });
    }
});

// Update semester
router.put('/:id', authenticateToken, requirePermission('manage_schedule'), [
    body('date_debut').optional().isISO8601().withMessage('La date de début doit être valide'),
    body('date_fin').optional().isISO8601().withMessage('La date de fin doit être valide'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { nom, numero, annee_scolaire, date_debut, date_fin, actif } = req.body;

        // Check if semester exists
        const [existing] = await pool.execute(
            'SELECT id FROM semesters WHERE id = ?',
            [req.params.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Semestre non trouvé' });
        }

        // If numero or annee_scolaire is being changed, check for duplicates
        if (numero || annee_scolaire) {
            const [current] = await pool.execute(
                'SELECT numero, annee_scolaire FROM semesters WHERE id = ?',
                [req.params.id]
            );

            const checkNumero = numero || current[0].numero;
            const checkAnnee = annee_scolaire || current[0].annee_scolaire;

            const [duplicate] = await pool.execute(
                'SELECT id FROM semesters WHERE annee_scolaire = ? AND numero = ? AND id != ?',
                [checkAnnee, checkNumero, req.params.id]
            );

            if (duplicate.length > 0) {
                return res.status(400).json({ message: `Le semestre ${checkNumero} existe déjà pour cette année scolaire` });
            }
        }

        // Vérifier si la table utilise 'actif' ou 'statut'
        const [columns] = await pool.execute('DESCRIBE semesters');
        const hasActifColumn = columns.some(col => col.Field === 'actif');
        const hasStatutColumn = columns.some(col => col.Field === 'statut');

        if (hasActifColumn) {
            await pool.execute(
                `UPDATE semesters SET 
          nom = COALESCE(?, nom),
          numero = COALESCE(?, numero),
          annee_scolaire = COALESCE(?, annee_scolaire),
          date_debut = COALESCE(?, date_debut),
          date_fin = COALESCE(?, date_fin),
          actif = COALESCE(?, actif)
         WHERE id = ?`,
                [
                    nom || null,
                    numero || null,
                    annee_scolaire || null,
                    date_debut || null,
                    date_fin || null,
                    actif !== undefined ? actif : null,
                    req.params.id
                ]
            );
        } else if (hasStatutColumn) {
            await pool.execute(
                `UPDATE semesters SET 
          nom = COALESCE(?, nom),
          numero = COALESCE(?, numero),
          annee_scolaire = COALESCE(?, annee_scolaire),
          date_debut = COALESCE(?, date_debut),
          date_fin = COALESCE(?, date_fin),
          statut = COALESCE(?, statut)
         WHERE id = ?`,
                [
                    nom || null,
                    numero || null,
                    annee_scolaire || null,
                    date_debut || null,
                    date_fin || null,
                    actif !== undefined ? (actif ? 'actif' : 'ferme') : null,
                    req.params.id
                ]
            );
        } else {
            await pool.execute(
                `UPDATE semesters SET 
          nom = COALESCE(?, nom),
          numero = COALESCE(?, numero),
          annee_scolaire = COALESCE(?, annee_scolaire),
          date_debut = COALESCE(?, date_debut),
          date_fin = COALESCE(?, date_fin)
         WHERE id = ?`,
                [
                    nom || null,
                    numero || null,
                    annee_scolaire || null,
                    date_debut || null,
                    date_fin || null,
                    req.params.id
                ]
            );
        }

        res.json({ message: 'Semestre modifié avec succès' });
    } catch (error) {
        console.error('Update semester error:', error);
        res.status(500).json({ message: 'Erreur lors de la modification du semestre' });
    }
});

// Delete semester
router.delete('/:id', authenticateToken, requirePermission('manage_schedule'), async (req, res) => {
    try {
        // Check if semester exists
        const [existing] = await pool.execute(
            'SELECT id FROM semesters WHERE id = ?',
            [req.params.id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Semestre non trouvé' });
        }

        // Check if semester is used in grades
        const [grades] = await pool.execute(
            'SELECT COUNT(*) as count FROM grades WHERE semester_id = ?',
            [req.params.id]
        );

        if (grades[0].count > 0) {
            // Soft delete: set actif to false or statut to 'ferme' instead of deleting
            const [columns] = await pool.execute('DESCRIBE semesters');
            const hasActifColumn = columns.some(col => col.Field === 'actif');
            const hasStatutColumn = columns.some(col => col.Field === 'statut');

            if (hasActifColumn) {
                await pool.execute('UPDATE semesters SET actif = FALSE WHERE id = ?', [req.params.id]);
            } else if (hasStatutColumn) {
                await pool.execute('UPDATE semesters SET statut = \'ferme\' WHERE id = ?', [req.params.id]);
            }
            return res.json({ message: 'Semestre désactivé (utilisé dans des notes)' });
        }

        // Hard delete if not used
        await pool.execute('DELETE FROM semesters WHERE id = ?', [req.params.id]);
        res.json({ message: 'Semestre supprimé avec succès' });
    } catch (error) {
        console.error('Delete semester error:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du semestre' });
    }
});

export default router;
