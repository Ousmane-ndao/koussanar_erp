import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/db.js';
import { generateUUID } from '../utils/uuid.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { logError } from '../utils/logger.js';

const router = express.Router();

// Get all schedules
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { classe_id, jour } = req.query;
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

    if (classe_id) {
      query += ' AND s.classe_id = ?';
      params.push(classe_id);
    }
    if (jour) {
      query += ' AND s.jour = ?';
      params.push(jour);
    }

    query += ' ORDER BY s.jour, s.heure_debut';

    const [schedules] = await pool.execute(query, params);
    res.json(schedules);
  } catch (error) {
    logError('SCHEDULES - Get all', error, req);
    res.status(500).json({ message: 'Erreur lors de la récupération des emplois du temps' });
  }
});

// Get schedule by ID
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

// Create schedule - Admin uniquement
router.post('/', authenticateToken, requirePermission('manage_schedule'), [
  body('classe_id').notEmpty(),
  body('jour').isIn(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']),
  body('heure_debut').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  body('heure_fin').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  body('matiere').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      classe_id, jour, heure_debut, heure_fin, matiere, teacher_id, salle
    } = req.body;
    const id = generateUUID();

    await pool.execute(
      `INSERT INTO schedules (id, classe_id, jour, heure_debut, heure_fin, matiere, teacher_id, salle) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, classe_id, jour, heure_debut, heure_fin, matiere, teacher_id || null, salle || null]
    );

    res.status(201).json({ message: 'Emploi du temps créé avec succès', id });
  } catch (error) {
    logError('SCHEDULES - Create', error, req);
    res.status(500).json({ message: 'Erreur lors de la création de l\'emploi du temps' });
  }
});

// Update schedule - Admin uniquement
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

    const { classe_id, jour, heure_debut, heure_fin, matiere, teacher_id, salle } = req.body;

    await pool.execute(
      `UPDATE schedules SET 
        classe_id = COALESCE(?, classe_id),
        jour = COALESCE(?, jour),
        heure_debut = COALESCE(?, heure_debut),
        heure_fin = COALESCE(?, heure_fin),
        matiere = COALESCE(?, matiere),
        teacher_id = COALESCE(?, teacher_id),
        salle = COALESCE(?, salle)
       WHERE id = ?`,
      [classe_id || null, jour || null, heure_debut || null, heure_fin || null,
        matiere || null, teacher_id || null, salle || null, req.params.id]
    );

    res.json({ message: 'Emploi du temps modifié avec succès' });
  } catch (error) {
    logError('SCHEDULES - Update', error, req);
    res.status(500).json({ message: 'Erreur lors de la modification de l\'emploi du temps' });
  }
});

// Delete schedule - Admin uniquement
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




















