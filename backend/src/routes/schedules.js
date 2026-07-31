import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/db.js';
import { generateUUID } from '../utils/uuid.js';
import { authenticateToken, requirePermission } from '../middleware/rbac.js';
import { logError } from '../utils/logger.js';

const router = express.Router();

/**
 * Vérifie les conflits pour un créneau donné
 * Retourne un tableau de messages d'erreur
 */
async function checkConflicts(classe_id, teacher_id, salle, jour, heure_debut, heure_fin, excludeId = null) {
    const conflicts = [];

    // 1. Vérifier conflit enseignant
    if (teacher_id) {
        const [teacherConflicts] = await pool.execute(
            `SELECT * FROM schedules
             WHERE teacher_id = ? AND jour = ?
               AND (
                 (heure_debut < ? AND heure_fin > ?) OR
                 (heure_debut < ? AND heure_fin > ?) OR
                 (heure_debut >= ? AND heure_debut < ?)
               )
               ${excludeId ? 'AND id != ?' : ''}`,
            teacher_id, jour, heure_fin, heure_debut, heure_fin, heure_debut, heure_debut, heure_fin,
            ...(excludeId ? [excludeId] : [])
        );
        if (teacherConflicts.length > 0) {
            conflicts.push('L\'enseignant a déjà un cours à cet horaire');
        }
    }

    // 2. Vérifier conflit salle
    if (salle) {
        const [roomConflicts] = await pool.execute(
            `SELECT * FROM schedules
             WHERE salle = ? AND jour = ?
               AND (
                 (heure_debut < ? AND heure_fin > ?) OR
                 (heure_debut < ? AND heure_fin > ?) OR
                 (heure_debut >= ? AND heure_debut < ?)
               )
               ${excludeId ? 'AND id != ?' : ''}`,
            salle, jour, heure_fin, heure_debut, heure_fin, heure_debut, heure_debut, heure_fin,
            ...(excludeId ? [excludeId] : [])
        );
        if (roomConflicts.length > 0) {
            conflicts.push('La salle est déjà réservée à cet horaire');
        }
    }

    // 3. Vérifier conflit classe
    if (classe_id) {
        const [classConflicts] = await pool.execute(
            `SELECT * FROM schedules
             WHERE classe_id = ? AND jour = ?
               AND (
                 (heure_debut < ? AND heure_fin > ?) OR
                 (heure_debut < ? AND heure_fin > ?) OR
                 (heure_debut >= ? AND heure_debut < ?)
               )
               ${excludeId ? 'AND id != ?' : ''}`,
            classe_id, jour, heure_fin, heure_debut, heure_fin, heure_debut, heure_debut, heure_fin,
            ...(excludeId ? [excludeId] : [])
        );
        if (classConflicts.length > 0) {
            conflicts.push('La classe a déjà un cours à cet horaire');
        }
    }

    return conflicts;
}

// ============================================================
// GET /api/schedules - Liste des emplois du temps
// ============================================================
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { classe_id, jour, teacher_id, school_year_id, academic_period_id } = req.query;
        let query = `
            SELECT s.*,
                   c.nom as classe_nom, c.niveau,
                   t.nom as teacher_nom, t.prenom as teacher_prenom
            FROM schedules s
            LEFT JOIN classes c ON s.classe_id = c.id
            LEFT JOIN teachers te ON s.teacher_id = te.id
            LEFT JOIN profiles t ON te.user_id = t.id
            WHERE 1=1
        `;
        const params = [];

        if (classe_id) { query += ' AND s.classe_id = ?'; params.push(classe_id); }
        if (jour) { query += ' AND s.jour = ?'; params.push(jour); }
        if (teacher_id) { query += ' AND s.teacher_id = ?'; params.push(teacher_id); }
        if (school_year_id) { query += ' AND s.school_year_id = ?'; params.push(school_year_id); }
        if (academic_period_id) { query += ' AND s.academic_period_id = ?'; params.push(academic_period_id); }

        query += ' ORDER BY s.jour, s.heure_debut';

        const [schedules] = await pool.execute(query, params);
        res.json(schedules);
    } catch (error) {
        logError('SCHEDULES - Get all', error, req);
        res.status(500).json({ message: 'Erreur lors de la récupération des emplois du temps' });
    }
});

// ============================================================
// GET /api/schedules/:id - Détail d'un emploi du temps
// ============================================================
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [schedules] = await pool.execute(
            `SELECT s.*,
                    c.nom as classe_nom, c.niveau,
                    t.nom as teacher_nom, t.prenom as teacher_prenom
             FROM schedules s
             LEFT JOIN classes c ON s.classe_id = c.id
             LEFT JOIN teachers te ON s.teacher_id = te.id
             LEFT JOIN profiles t ON te.user_id = t.id
             WHERE s.id = ?`,
            [req.params.id]
        );

        if (schedules.length === 0) {
            return res.status(404).json({ message: 'Emploi du temps non trouvé' });
        }

        res.json(schedules[0]);
    } catch (error) {
        logError('SCHEDULES - Get by ID', error, req);
        res.status(500).json({ message: 'Erreur lors de la récupération de l\'emploi du temps' });
    }
});

// ============================================================
// POST /api/schedules - Création avec vérification des conflits
// ============================================================
router.post('/', authenticateToken, requirePermission('manage_schedule'), [
    body('classe_id').notEmpty().withMessage('Classe requise'),
    body('jour').isIn(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']).withMessage('Jour invalide'),
    body('heure_debut').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Heure de début invalide'),
    body('heure_fin').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Heure de fin invalide'),
    body('matiere').trim().notEmpty().withMessage('Matière requise'),
    body('teacher_id').optional(),
    body('salle').optional().trim(),
    body('school_year_id').optional(),
    body('academic_period_id').optional(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            classe_id, jour, heure_debut, heure_fin, matiere,
            teacher_id, salle, school_year_id, academic_period_id
        } = req.body;

        // Vérifier les conflits
        const conflicts = await checkConflicts(classe_id, teacher_id, salle, jour, heure_debut, heure_fin);
        if (conflicts.length > 0) {
            return res.status(409).json({ message: 'Conflit d\'horaire', conflicts });
        }

        const id = generateUUID();
        await pool.execute(
            `INSERT INTO schedules
             (id, classe_id, jour, heure_debut, heure_fin, matiere, teacher_id, salle, school_year_id, academic_period_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, classe_id, jour, heure_debut, heure_fin, matiere,
             teacher_id || null, salle || null,
             school_year_id || null, academic_period_id || null]
        );

        res.status(201).json({ message: 'Emploi du temps créé avec succès', id });
    } catch (error) {
        logError('SCHEDULES - Create', error, req);
        res.status(500).json({ message: 'Erreur lors de la création de l\'emploi du temps' });
    }
});

// ============================================================
// PUT /api/schedules/:id - Modification avec vérification des conflits
// ============================================================
router.put('/:id', authenticateToken, requirePermission('manage_schedule'), [
    body('jour').optional().isIn(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']),
    body('heure_debut').optional().matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    body('heure_fin').optional().matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { classe_id, jour, heure_debut, heure_fin, matiere, teacher_id, salle, school_year_id, academic_period_id } = req.body;

        // Récupérer l'ancien enregistrement pour les conflits (avec exclusion de l'ID courant)
        const [old] = await pool.execute('SELECT * FROM schedules WHERE id = ?', [req.params.id]);
        if (old.length === 0) {
            return res.status(404).json({ message: 'Emploi du temps non trouvé' });
        }
        const oldRecord = old[0];

        const finalClasse = classe_id || oldRecord.classe_id;
        const finalTeacher = teacher_id || oldRecord.teacher_id;
        const finalRoom = salle || oldRecord.salle;
        const finalDay = jour || oldRecord.jour;
        const finalStart = heure_debut || oldRecord.heure_debut;
        const finalEnd = heure_fin || oldRecord.heure_fin;

        // Vérifier les conflits en excluant l'enregistrement en cours
        const conflicts = await checkConflicts(finalClasse, finalTeacher, finalRoom, finalDay, finalStart, finalEnd, req.params.id);
        if (conflicts.length > 0) {
            return res.status(409).json({ message: 'Conflit d\'horaire', conflicts });
        }

        await pool.execute(
            `UPDATE schedules SET
                classe_id = COALESCE(?, classe_id),
                jour = COALESCE(?, jour),
                heure_debut = COALESCE(?, heure_debut),
                heure_fin = COALESCE(?, heure_fin),
                matiere = COALESCE(?, matiere),
                teacher_id = COALESCE(?, teacher_id),
                salle = COALESCE(?, salle),
                school_year_id = COALESCE(?, school_year_id),
                academic_period_id = COALESCE(?, academic_period_id)
             WHERE id = ?`,
            [classe_id || null, jour || null, heure_debut || null, heure_fin || null,
             matiere || null, teacher_id || null, salle || null,
             school_year_id || null, academic_period_id || null,
             req.params.id]
        );

        res.json({ message: 'Emploi du temps modifié avec succès' });
    } catch (error) {
        logError('SCHEDULES - Update', error, req);
        res.status(500).json({ message: 'Erreur lors de la modification de l\'emploi du temps' });
    }
});

// ============================================================
// DELETE /api/schedules/:id - Suppression
// ============================================================
router.delete('/:id', authenticateToken, requirePermission('manage_schedule'), async (req, res) => {
    try {
        await pool.execute('DELETE FROM schedules WHERE id = ?', [req.params.id]);
        res.json({ message: 'Emploi du temps supprimé avec succès' });
    } catch (error) {
        logError('SCHEDULES - Delete', error, req);
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'emploi du temps' });
    }
});

export default router;