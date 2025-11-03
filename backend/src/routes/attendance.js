import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/db.js';
import { generateUUID } from '../utils/uuid.js';
import { authenticateToken } from '../middleware/auth.js';
import { logError } from '../utils/logger.js';

const router = express.Router();

// Get attendance by date - Filtré selon le rôle
router.get('/date/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    let query = `
      SELECT a.*, 
              s.matricule,
              p.nom, p.prenom,
              c.nom as classe_nom
       FROM attendance a
       LEFT JOIN students s ON a.student_id = s.id
       LEFT JOIN profiles p ON s.user_id = p.id
       LEFT JOIN classes c ON s.classe_id = c.id
       WHERE a.date = ?
    `;
    const params = [date];

    const isAdmin = req.user.roles && req.user.roles.includes('admin');
    const isEleve = req.user.roles && req.user.roles.includes('eleve');
    const isEnseignant = req.user.roles && req.user.roles.includes('enseignant');

    // Si l'utilisateur est un élève, filtrer seulement ses propres présences
    if (isEleve && !isAdmin) {
      const [students] = await pool.execute(
        'SELECT id FROM students WHERE user_id = ?',
        [req.user.id]
      );
      if (students.length > 0) {
        query += ' AND a.student_id = ?';
        params.push(students[0].id);
      } else {
        return res.json([]);
      }
    }
    // Si l'utilisateur est un professeur, filtrer seulement les élèves de ses classes
    else if (isEnseignant && !isAdmin) {
      const [teachers] = await pool.execute(
        'SELECT id FROM teachers WHERE user_id = ?',
        [req.user.id]
      );
      if (teachers.length > 0) {
        const teacherId = teachers[0].id;
        const [teacherClasses] = await pool.execute(
          'SELECT DISTINCT classe_id FROM teacher_classes WHERE teacher_id = ?',
          [teacherId]
        );
        if (teacherClasses.length > 0) {
          const classeIds = teacherClasses.map(tc => tc.classe_id);
          query += ` AND s.classe_id IN (${classeIds.map(() => '?').join(',')})`;
          params.push(...classeIds);
        } else {
          return res.json([]);
        }
      } else {
        return res.json([]);
      }
    }

    query += ' ORDER BY s.matricule';

    const [records] = await pool.execute(query, params);
    res.json(records);
  } catch (error) {
    logError('ATTENDANCE - Get by date', error, req);
    res.status(500).json({ message: 'Erreur lors de la récupération des présences' });
  }
});

// Get attendance by student - Vérifier les permissions d'accès
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    const isAdmin = req.user.roles && req.user.roles.includes('admin');
    const isEleve = req.user.roles && req.user.roles.includes('eleve');
    const isEnseignant = req.user.roles && req.user.roles.includes('enseignant');

    // Si élève, vérifier que c'est lui-même
    if (isEleve && !isAdmin) {
      const [students] = await pool.execute(
        'SELECT id FROM students WHERE user_id = ? AND id = ?',
        [req.user.id, studentId]
      );
      if (students.length === 0) {
        return res.status(403).json({ message: 'Accès refusé: vous ne pouvez voir que vos propres présences' });
      }
    }
    // Si professeur, vérifier que l'élève est dans ses classes
    else if (isEnseignant && !isAdmin) {
      const [teachers] = await pool.execute(
        'SELECT id FROM teachers WHERE user_id = ?',
        [req.user.id]
      );
      if (teachers.length > 0) {
        const teacherId = teachers[0].id;
        const [studentClasses] = await pool.execute(
          `SELECT s.classe_id FROM students s
           INNER JOIN teacher_classes tc ON s.classe_id = tc.classe_id
           WHERE s.id = ? AND tc.teacher_id = ?`,
          [studentId, teacherId]
        );
        if (studentClasses.length === 0) {
          return res.status(403).json({ message: 'Accès refusé: cet élève n\'est pas dans vos classes' });
        }
      } else {
        return res.status(403).json({ message: 'Accès refusé' });
      }
    }

    const [records] = await pool.execute(
      'SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC LIMIT 30',
      [studentId]
    );
    res.json(records);
  } catch (error) {
    logError('ATTENDANCE - Get by student', error, req);
    res.status(500).json({ message: 'Erreur lors de la récupération des présences' });
  }
});

// Create or update attendance - Seulement admin et professeurs (pour leurs classes)
router.post('/', authenticateToken, [
  body('student_id').notEmpty(),
  body('date').isISO8601(),
  body('status').isIn(['present', 'absent', 'retard']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Vérifier les permissions : élève ne peut pas modifier
    const isAdmin = req.user.roles && req.user.roles.includes('admin');
    const isEleve = req.user.roles && req.user.roles.includes('eleve');
    const isEnseignant = req.user.roles && req.user.roles.includes('enseignant');

    if (isEleve && !isAdmin) {
      return res.status(403).json({ message: 'Accès refusé: vous ne pouvez pas modifier les présences' });
    }

    // Si professeur, vérifier que l'élève est dans ses classes
    if (isEnseignant && !isAdmin) {
      const [teachers] = await pool.execute(
        'SELECT id FROM teachers WHERE user_id = ?',
        [req.user.id]
      );
      if (teachers.length > 0) {
        const teacherId = teachers[0].id;
        const [studentClasses] = await pool.execute(
          `SELECT s.classe_id FROM students s
           INNER JOIN teacher_classes tc ON s.classe_id = tc.classe_id
           WHERE s.id = ? AND tc.teacher_id = ?`,
          [req.body.student_id, teacherId]
        );
        if (studentClasses.length === 0) {
          return res.status(403).json({ message: 'Accès refusé: cet élève n\'est pas dans vos classes' });
        }
      } else {
        return res.status(403).json({ message: 'Accès refusé' });
      }
    }

    const { student_id, date, status, heure_arrivee, remarque } = req.body;

    // Check if record exists
    const [existing] = await pool.execute(
      'SELECT id FROM attendance WHERE student_id = ? AND date = ?',
      [student_id, date]
    );

    if (existing.length > 0) {
      // Update existing
      await pool.execute(
        `UPDATE attendance SET 
          status = ?, 
          heure_arrivee = ?,
          remarque = ?
         WHERE id = ?`,
        [status, heure_arrivee || null, remarque || null, existing[0].id]
      );
      res.json({ message: 'Présence mise à jour avec succès' });
    } else {
      // Create new
      const id = generateUUID();
      await pool.execute(
        'INSERT INTO attendance (id, student_id, date, status, heure_arrivee, remarque) VALUES (?, ?, ?, ?, ?, ?)',
        [id, student_id, date, status, heure_arrivee || null, remarque || null]
      );
      res.status(201).json({ message: 'Présence enregistrée avec succès', id });
    }
  } catch (error) {
    logError('ATTENDANCE - Create/Update', error, req);
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement de la présence' });
  }
});

// Get attendance statistics - Filtré selon le rôle
router.get('/stats/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'retard' THEN 1 ELSE 0 END) as retard
       FROM attendance a
       LEFT JOIN students s ON a.student_id = s.id
       WHERE a.date = ?
    `;
    const params = [date];

    const isAdmin = req.user.roles && req.user.roles.includes('admin');
    const isEleve = req.user.roles && req.user.roles.includes('eleve');
    const isEnseignant = req.user.roles && req.user.roles.includes('enseignant');

    // Si élève, seulement ses propres stats
    if (isEleve && !isAdmin) {
      const [students] = await pool.execute(
        'SELECT id FROM students WHERE user_id = ?',
        [req.user.id]
      );
      if (students.length > 0) {
        query += ' AND a.student_id = ?';
        params.push(students[0].id);
      } else {
        return res.json({ total: 0, present: 0, absent: 0, retard: 0 });
      }
    }
    // Si professeur, seulement ses classes
    else if (isEnseignant && !isAdmin) {
      const [teachers] = await pool.execute(
        'SELECT id FROM teachers WHERE user_id = ?',
        [req.user.id]
      );
      if (teachers.length > 0) {
        const teacherId = teachers[0].id;
        const [teacherClasses] = await pool.execute(
          'SELECT DISTINCT classe_id FROM teacher_classes WHERE teacher_id = ?',
          [teacherId]
        );
        if (teacherClasses.length > 0) {
          const classeIds = teacherClasses.map(tc => tc.classe_id);
          query += ` AND s.classe_id IN (${classeIds.map(() => '?').join(',')})`;
          params.push(...classeIds);
        } else {
          return res.json({ total: 0, present: 0, absent: 0, retard: 0 });
        }
      } else {
        return res.json({ total: 0, present: 0, absent: 0, retard: 0 });
      }
    }

    const [stats] = await pool.execute(query, params);
    res.json(stats[0] || { total: 0, present: 0, absent: 0, retard: 0 });
  } catch (error) {
    logError('ATTENDANCE - Get stats', error, req);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
});

export default router;

