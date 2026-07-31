import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/db.js';
import { generateUUID } from '../utils/uuid.js';
// import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all classes
router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT c.*,
             COUNT(s.id) as student_count
      FROM classes c
      LEFT JOIN students s ON c.id = s.classe_id AND s.statut_inscription = 'actif'
      WHERE 1=1
    `;
    const params = [];

    // Filtrage par rôle désactivé pour les tests
    query += ' GROUP BY c.id ORDER BY c.niveau, c.nom';

    const [classes] = await pool.execute(query, params);

    const formattedClasses = classes.map(classe => ({
      ...classe,
      _count: {
        students: classe.student_count || 0
      }
    }));

    res.json(formattedClasses);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des classes' });
  }
});

// Get class by ID
router.get('/:id', async (req, res) => {
  try {
    const [classes] = await pool.execute(
      `SELECT c.*, COUNT(s.id) as student_count
       FROM classes c
       LEFT JOIN students s ON c.id = s.classe_id
       WHERE c.id = ?
       GROUP BY c.id`,
      [req.params.id]
    );

    if (classes.length === 0) {
      return res.status(404).json({ message: 'Classe non trouvée' });
    }

    res.json({
      ...classes[0],
      _count: { students: classes[0].student_count || 0 }
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la classe' });
  }
});

// Create class
router.post('/', [
  body('nom').trim().notEmpty(),
  body('niveau').trim().notEmpty(),
  body('effectif_max').optional().isInt({ min: 1, max: 100 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nom, niveau, filiere, effectif_max } = req.body;
    const classId = generateUUID();

    await pool.execute(
      'INSERT INTO classes (id, nom, niveau, filiere, effectif_max) VALUES (?, ?, ?, ?, ?)',
      [classId, nom, niveau, filiere || null, effectif_max || 40]
    );

    res.status(201).json({ message: 'Classe créée avec succès', id: classId });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la classe' });
  }
});

// Update class
router.put('/:id', [
  body('effectif_max').optional().isInt({ min: 1, max: 100 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nom, niveau, filiere, effectif_max } = req.body;

    await pool.execute(
      `UPDATE classes SET
        nom = COALESCE(?, nom),
        niveau = COALESCE(?, niveau),
        filiere = COALESCE(?, filiere),
        effectif_max = COALESCE(?, effectif_max)
       WHERE id = ?`,
      [nom || null, niveau || null, filiere || null, effectif_max || null, req.params.id]
    );

    res.json({ message: 'Classe modifiée avec succès' });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ message: 'Erreur lors de la modification de la classe' });
  }
});

// Delete class
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM classes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Classe supprimée avec succès' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la classe' });
  }
});

export default router;