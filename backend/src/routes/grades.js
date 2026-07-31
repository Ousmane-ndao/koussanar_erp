import express from 'express';
import { body, validationResult } from 'express-validator';
import * as gradeController from '../controllers/gradeController.js';
import { authenticateToken, requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Routes GET
router.get('/', authenticateToken, gradeController.getAllGrades);
router.get('/:id', authenticateToken, gradeController.getGradeById);
router.get('/student/:studentId/semester/:semestreId', authenticateToken, gradeController.getGradesByStudentAndSemester);
router.get('/student/:studentId/average', authenticateToken, gradeController.getAverages);
router.get('/student/:studentId/overall-average', authenticateToken, gradeController.getOverallAverage);

// Routes POST / PUT / DELETE (avec permissions)
router.post('/', authenticateToken, requirePermission('enter_grades'), [
    body('student_id').notEmpty().withMessage('Élève requis'),
    body('note').isFloat({ min: 0, max: 20 }).withMessage('Note entre 0 et 20'),
    body('date_evaluation').isISO8601().withMessage('Date invalide'),
    body('matiere').optional().trim(),
    body('coefficient').optional().isFloat({ min: 0.1 }),
    body('type_evaluation').optional().isIn(['devoir', 'controle', 'examen', 'oral']),
    body('annee_scolaire').optional().trim(),
    body('semestre_id').optional().trim(),
    body('remarque').optional().trim(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    await gradeController.createGrade(req, res);
});

router.put('/:id', authenticateToken, requirePermission('enter_grades'), [
    body('note').optional().isFloat({ min: 0, max: 20 }),
    body('coefficient').optional().isFloat({ min: 0.1 }),
    body('type_evaluation').optional().isIn(['devoir', 'controle', 'examen', 'oral']),
    body('matiere').optional().trim(),
    body('semestre_id').optional().trim(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    await gradeController.updateGrade(req, res);
});

router.delete('/:id', authenticateToken, requirePermission('enter_grades'), gradeController.deleteGrade);

export default router;