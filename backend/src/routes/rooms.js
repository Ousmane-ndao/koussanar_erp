import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/db.js';
import { generateUUID } from '../utils/uuid.js';
import { authenticateToken, requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// ============================================================
// GET /api/rooms - Liste des salles
// ============================================================
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM rooms ORDER BY name');
    res.json(rows);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des salles' });
  }
});

// ============================================================
// GET /api/rooms/:id - Détail d'une salle
// ============================================================
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Salle non trouvée' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la salle' });
  }
});

// ============================================================
// POST /api/rooms - Création d'une salle (admin)
// ============================================================
router.post('/', authenticateToken, requirePermission('manage_users'), [
  body('name').trim().notEmpty().withMessage('Le nom est requis'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('La capacité doit être ≥ 1'),
  body('type').optional().isIn(['classroom', 'laboratory', 'computer_room', 'amphitheater', 'library']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, capacity, type, building, floor, status } = req.body;

    // Vérifier l'unicité du nom
    const [existing] = await pool.execute('SELECT id FROM rooms WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Une salle avec ce nom existe déjà' });
    }

    const id = generateUUID();
    await pool.execute(
      `INSERT INTO rooms (id, name, capacity, type, building, floor, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, capacity || 30, type || 'classroom', building || null, floor || null, status || 'available']
    );

    res.status(201).json({ message: 'Salle créée avec succès', id });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la salle' });
  }
});

// ============================================================
// PUT /api/rooms/:id - Modification d'une salle (admin)
// ============================================================
router.put('/:id', authenticateToken, requirePermission('manage_users'), [
  body('name').optional().trim().notEmpty(),
  body('capacity').optional().isInt({ min: 1 }),
  body('type').optional().isIn(['classroom', 'laboratory', 'computer_room', 'amphitheater', 'library']),
  body('status').optional().isIn(['available', 'occupied', 'maintenance', 'closed']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, capacity, type, building, floor, status } = req.body;

    // Vérifier que la salle existe
    const [existing] = await pool.execute('SELECT id FROM rooms WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Salle non trouvée' });
    }

    // Vérifier l'unicité du nom (si changement)
    if (name) {
      const [duplicate] = await pool.execute(
        'SELECT id FROM rooms WHERE name = ? AND id != ?',
        [name, req.params.id]
      );
      if (duplicate.length > 0) {
        return res.status(400).json({ message: 'Une autre salle porte déjà ce nom' });
      }
    }

    await pool.execute(
      `UPDATE rooms SET
        name = COALESCE(?, name),
        capacity = COALESCE(?, capacity),
        type = COALESCE(?, type),
        building = COALESCE(?, building),
        floor = COALESCE(?, floor),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [name || null, capacity || null, type || null, building || null, floor || null, status || null, req.params.id]
    );

    res.json({ message: 'Salle modifiée avec succès' });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ message: 'Erreur lors de la modification de la salle' });
  }
});

// ============================================================
// DELETE /api/rooms/:id - Suppression d'une salle (admin)
// ============================================================
router.delete('/:id', authenticateToken, requirePermission('manage_users'), async (req, res) => {
  try {
    // Vérifier que la salle n'est pas utilisée dans des emplois du temps
    const [used] = await pool.execute(
      'SELECT id FROM schedules WHERE room_id = ? LIMIT 1',
      [req.params.id]
    );
    if (used.length > 0) {
      return res.status(400).json({ message: 'Cette salle est utilisée dans des emplois du temps, impossible de la supprimer' });
    }

    await pool.execute('DELETE FROM rooms WHERE id = ?', [req.params.id]);
    res.json({ message: 'Salle supprimée avec succès' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la salle' });
  }
});

export default router;