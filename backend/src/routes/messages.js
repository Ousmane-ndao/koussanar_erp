import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/db.js';
import { generateUUID } from '../utils/uuid.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get messages for current user (inbox)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get user roles
    let roles = [];
    try {
      const [rolesRows] = await pool.execute('SELECT role FROM user_roles WHERE user_id = ?', [req.user.id]);
      roles = rolesRows.map(r => r.role);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      // Continue with empty roles array
    }

    const isAdmin = roles.includes('admin');
    const isEnseignant = roles.includes('enseignant');
    const isEleve = roles.includes('eleve');

    let userClasseIds = [];
    try {
      if (isEleve) {
        // 🔥 Correction : remplacer statut_inscription par statut
        const [studentRows] = await pool.execute('SELECT classe_id FROM students WHERE user_id = ? AND statut = "actif"', [req.user.id]);
        userClasseIds = studentRows.filter(r => !!r.classe_id).map(r => r.classe_id);
      } else if (isEnseignant) {
        const [teachers] = await pool.execute('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
        if (teachers.length > 0) {
          const teacherId = teachers[0].id;
          const [teacherClasses] = await pool.execute('SELECT DISTINCT classe_id FROM teacher_classes WHERE teacher_id = ?', [teacherId]);
          userClasseIds = teacherClasses.filter(r => !!r.classe_id).map(r => r.classe_id);
        }
      }
    } catch (error) {
      console.error('Error fetching user classes:', error);
      // Continue with empty classeIds array
    }

    // Build query to fetch messages where user is recipient or sender
    // For simplicity, get all messages where user is recipient (or sent by user)
    // We will use a simplified version: messages sent to the user directly or to roles/classes the user belongs to
    const conditions = ["m.receiver_id = ?"];
    const params = [req.user.id];

    // Add role-based conditions: if user has roles, messages sent to that role
    if (roles.length > 0) {
      const rolePlaceholders = roles.map(() => '?').join(',');
      conditions.push(`(m.receiver_type = 'role' AND m.receiver_value IN (${rolePlaceholders}))`);
      params.push(...roles);
    }

    // Add class-based conditions
    if (userClasseIds.length > 0) {
      const classPlaceholders = userClasseIds.map(() => '?').join(',');
      conditions.push(`(m.receiver_type = 'class' AND m.receiver_value IN (${classPlaceholders}))`);
      params.push(...userClasseIds);
    }

    // Also include messages sent by the user (sent items)
    // We'll separate, but we can add a union later.

    const where = conditions.join(' OR ');

    const query = `
      SELECT m.*,
             p_sender.nom as sender_nom, p_sender.prenom as sender_prenom,
             p_receiver.nom as receiver_nom, p_receiver.prenom as receiver_prenom
      FROM messages m
      LEFT JOIN profiles p_sender ON m.sender_id = p_sender.id
      LEFT JOIN profiles p_receiver ON m.receiver_id = p_receiver.id
      WHERE ${where}
      ORDER BY m.created_at DESC
    `;

    const [messages] = await pool.execute(query, params);
    res.json(messages || []);
  } catch (error) {
    console.error('Get messages error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    res.status(500).json({
      message: 'Erreur lors de la récupération des messages',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// Send a message
router.post('/', authenticateToken, [
  body('receiver_id').optional().isString().isLength({ min: 1 }),
  body('receiver_type').optional().isIn(['user', 'role', 'class']),
  body('receiver_value').optional().isString().isLength({ min: 1 }),
  body('sujet').trim().notEmpty(),
  body('contenu').trim().notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { receiver_id, receiver_type, receiver_value, sujet, contenu } = req.body;

    // Determine receiver: if receiver_id provided, send to that user directly
    // Otherwise, use receiver_type and receiver_value (role or class)
    let finalReceiverId = receiver_id || null;
    let finalReceiverType = null;
    let finalReceiverValue = null;

    if (receiver_id) {
      finalReceiverType = 'user';
      finalReceiverValue = receiver_id;
    } else if (receiver_type && receiver_value) {
      finalReceiverType = receiver_type;
      finalReceiverValue = receiver_value;
    } else {
      return res.status(400).json({ message: 'Destinataire non spécifié' });
    }

    const id = generateUUID();
    await pool.execute(
      `INSERT INTO messages (id, sender_id, receiver_id, receiver_type, receiver_value, sujet, contenu, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, req.user.id, finalReceiverId, finalReceiverType, finalReceiverValue, sujet, contenu]
    );

    res.status(201).json({ message: 'Message envoyé avec succès', id });
  } catch (error) {
    console.error('Send message error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({
      message: 'Erreur lors de l\'envoi du message',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// Get a single message
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [messages] = await pool.execute(
      `SELECT m.*,
              p_sender.nom as sender_nom, p_sender.prenom as sender_prenom,
              p_receiver.nom as receiver_nom, p_receiver.prenom as receiver_prenom
       FROM messages m
       LEFT JOIN profiles p_sender ON m.sender_id = p_sender.id
       LEFT JOIN profiles p_receiver ON m.receiver_id = p_receiver.id
       WHERE m.id = ?`,
      [req.params.id]
    );

    if (messages.length === 0) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    // Mark as read if user is receiver
    if (messages[0].receiver_id === req.user.id) {
      await pool.execute('UPDATE messages SET lu = TRUE WHERE id = ?', [req.params.id]);
    }

    res.json(messages[0]);
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du message' });
  }
});

// Delete a message (only sender or admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [messages] = await pool.execute(
      'SELECT sender_id FROM messages WHERE id = ?',
      [req.params.id]
    );

    if (messages.length === 0) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }

    // Check if user is sender or admin
    const [roles] = await pool.execute(
      'SELECT role FROM user_roles WHERE user_id = ? AND role = "admin"',
      [req.user.id]
    );

    if (messages[0].sender_id !== req.user.id && roles.length === 0) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce message' });
    }

    await pool.execute('DELETE FROM messages WHERE id = ?', [req.params.id]);
    res.json({ message: 'Message supprimé avec succès' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du message' });
  }
});

export default router;