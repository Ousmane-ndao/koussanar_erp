import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../database/db.js';
import { generateUUID } from '../utils/uuid.js';
import { authenticateToken, requirePermission } from '../middleware/rbac.js';
import { logError } from '../utils/logger.js';

const router = express.Router();

// ============================================================
// 1. Récupérer les présences d'une date (avec filtres)
// ============================================================
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
    } else if (isEnseignant && !isAdmin) {
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

// ============================================================
// 2. Récupérer les présences d'un élève (avec stats)
// ============================================================
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { start_date, end_date } = req.query;

    // Vérifier les permissions d'accès
    const isAdmin = req.user.roles && req.user.roles.includes('admin');
    const isEleve = req.user.roles && req.user.roles.includes('eleve');
    const isEnseignant = req.user.roles && req.user.roles.includes('enseignant');

    if (isEleve && !isAdmin) {
      const [students] = await pool.execute(
        'SELECT id FROM students WHERE user_id = ? AND id = ?',
        [req.user.id, studentId]
      );
      if (students.length === 0) {
        return res.status(403).json({ message: 'Accès refusé: vous ne pouvez voir que vos propres présences' });
      }
    } else if (isEnseignant && !isAdmin) {
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

    let query = 'SELECT * FROM attendance WHERE student_id = ?';
    const params = [studentId];
    if (start_date && end_date) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    query += ' ORDER BY date DESC LIMIT 30';
    const [records] = await pool.execute(query, params);
    res.json(records);
  } catch (error) {
    logError('ATTENDANCE - Get by student', error, req);
    res.status(500).json({ message: 'Erreur lors de la récupération des présences' });
  }
});

// ============================================================
// 3. Statistiques complètes d'un élève (vue dédiée)
// ============================================================
router.get('/student/:studentId/stats', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { start_date, end_date } = req.query;

    // Vérifier les permissions (similaire à ci-dessus)
    const isAdmin = req.user.roles && req.user.roles.includes('admin');
    const isEleve = req.user.roles && req.user.roles.includes('eleve');
    const isEnseignant = req.user.roles && req.user.roles.includes('enseignant');

    if (isEleve && !isAdmin) {
      const [students] = await pool.execute(
        'SELECT id FROM students WHERE user_id = ? AND id = ?',
        [req.user.id, studentId]
      );
      if (students.length === 0) {
        return res.status(403).json({ message: 'Accès refusé' });
      }
    } else if (isEnseignant && !isAdmin) {
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
          return res.status(403).json({ message: 'Accès refusé' });
        }
      } else {
        return res.status(403).json({ message: 'Accès refusé' });
      }
    }

    let sql = `
      SELECT
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as total_presences,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as total_absences,
        SUM(CASE WHEN status = 'retard' THEN 1 ELSE 0 END) as total_lates,
        ROUND(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as attendance_rate
      FROM attendance
      WHERE student_id = ?
    `;
    const params = [studentId];
    if (start_date && end_date) {
      sql += ' AND date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    const [stats] = await pool.execute(sql, params);
    res.json(stats[0] || { total_days: 0, total_presences: 0, total_absences: 0, total_lates: 0, attendance_rate: 0 });
  } catch (error) {
    logError('ATTENDANCE - Get stats', error, req);
    res.status(500).json({ message: 'Erreur lors du calcul des statistiques' });
  }
});

// ============================================================
// 4. Enregistrer ou modifier une présence (avec validation)
// ============================================================
router.post('/', authenticateToken, requirePermission('manage_attendance'), [
  body('student_id').notEmpty().withMessage('Élève requis'),
  body('date').isISO8601().withMessage('Date invalide'),
  body('status').isIn(['present', 'absent', 'retard']).withMessage('Statut invalide'),
  body('heure_arrivee').optional().matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { student_id, date, status, heure_arrivee, remarque } = req.body;

    // Vérifier si l'élève existe
    const [studentRows] = await pool.execute('SELECT id, classe_id FROM students WHERE id = ?', [student_id]);
    if (studentRows.length === 0) {
      return res.status(404).json({ message: 'Élève non trouvé' });
    }

    // Vérifier si un enregistrement existe déjà pour ce jour
    const [existing] = await pool.execute(
      'SELECT id FROM attendance WHERE student_id = ? AND date = ?',
      [student_id, date]
    );

    if (existing.length > 0) {
      // Mise à jour
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
      // Création
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

// ============================================================
// 5. Supprimer une présence (admin uniquement)
// ============================================================
router.delete('/:id', authenticateToken, requirePermission('manage_attendance'), async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id FROM attendance WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Enregistrement non trouvé' });
    }
    await pool.execute('DELETE FROM attendance WHERE id = ?', [req.params.id]);
    res.json({ message: 'Enregistrement supprimé avec succès' });
  } catch (error) {
    logError('ATTENDANCE - Delete', error, req);
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
});

// ============================================================
// 6. Statistiques globales par date (admin/enseignant)
// ============================================================
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
    } else if (isEnseignant && !isAdmin) {
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