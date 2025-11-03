import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/db.js';
import { generateUUID } from '../utils/uuid.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { requirePermission, requireAnyPermission } from '../middleware/rbac.js';

const router = express.Router();

// Get all payments - Admin et comptable voient tout, élèves ne peuvent pas accéder
router.get('/', authenticateToken, requireAnyPermission('manage_payments', 'view_payments'), async (req, res) => {
  try {
    const query = `
      SELECT p.*,
             s.matricule,
             prof.nom, prof.prenom,
             creator.nom as creator_nom, creator.prenom as creator_prenom
      FROM payments p
      LEFT JOIN students s ON p.student_id = s.id
      LEFT JOIN profiles prof ON s.user_id = prof.id
      LEFT JOIN profiles creator ON p.created_by = creator.id
      ORDER BY p.created_at DESC
      LIMIT 100
    `;
    const [payments] = await pool.execute(query);
    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des paiements' });
  }
});

// Get payments by student - Élèves peuvent voir leurs propres paiements
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    // Si l'utilisateur est un élève, vérifier que c'est bien son propre ID
    if (req.user.roles && req.user.roles.includes('eleve') && !req.user.roles.includes('admin')) {
      const [students] = await pool.execute(
        'SELECT id FROM students WHERE user_id = ? AND id = ?',
        [req.user.id, req.params.studentId]
      );
      if (students.length === 0) {
        return res.status(403).json({ message: 'Accès refusé: vous ne pouvez voir que vos propres paiements' });
      }
    }

    const [payments] = await pool.execute(
      'SELECT * FROM payments WHERE student_id = ? ORDER BY created_at DESC',
      [req.params.studentId]
    );
    res.json(payments);
  } catch (error) {
    console.error('Get student payments error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des paiements' });
  }
});

// Create payment
router.post('/', authenticateToken, requirePermission('manage_payments'), [
  body('student_id').notEmpty(),
  body('montant').isFloat({ min: 0 }),
  body('type_paiement').isIn(['inscription', 'scolarite', 'autre']),
  body('annee_scolaire').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { student_id, montant, type_paiement, mois_paye, annee_scolaire, remarque, statut } = req.body;
    const paymentId = generateUUID();

    await pool.execute(
      `INSERT INTO payments (id, student_id, montant, type_paiement, mois_paye, 
        annee_scolaire, remarque, statut, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [paymentId, student_id, montant, type_paiement, mois_paye || null,
        annee_scolaire, remarque || null, statut || 'paye', req.user.id]
    );

    res.status(201).json({ message: 'Paiement enregistré avec succès', id: paymentId });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement du paiement' });
  }
});

// Get finance statistics
router.get('/stats/:anneeScolaire?', authenticateToken, async (req, res) => {
  try {
    const anneeScolaire = req.params.anneeScolaire || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(montant) as total_recettes,
        SUM(CASE WHEN statut = 'paye' THEN montant ELSE 0 END) as total_paye,
        SUM(CASE WHEN statut = 'en_attente' THEN montant ELSE 0 END) as total_attente
       FROM payments
       WHERE annee_scolaire = ?`,
      [anneeScolaire]
    );

    const [studentCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM students WHERE annee_scolaire = ?',
      [anneeScolaire]
    );

    res.json({
      ...stats[0],
      total_students: studentCount[0].count,
      annee_scolaire: anneeScolaire
    });
  } catch (error) {
    console.error('Get finance stats error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
});

export default router;

