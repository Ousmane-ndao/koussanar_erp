import express from 'express';
import { body, validationResult } from 'express-validator';
import * as lessonController from '../controllers/lessonJournalController.js';
import { authenticateToken, requirePermission } from '../middleware/rbac.js';

const router = express.Router();

router.get('/', authenticateToken, lessonController.getAllLessons);
router.get('/:id', authenticateToken, lessonController.getLessonById);
router.get('/:lessonId/attachments', authenticateToken, lessonController.getAttachments);

router.post('/', authenticateToken, requirePermission('enter_grades'), [
    body('teacher_id').notEmpty().withMessage('Enseignant requis'),
    body('class_id').notEmpty().withMessage('Classe requise'),
    body('subject_id').notEmpty().withMessage('Matière requise'),
    body('title').trim().notEmpty().withMessage('Titre requis'),
    body('lesson_date').isISO8601().withMessage('Date invalide'),
    body('content').optional().trim(),
    body('homework').optional().trim(),
    body('start_time').optional().matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    body('end_time').optional().matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    body('is_published').optional().isBoolean(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    await lessonController.createLesson(req, res);
});

router.post('/:lessonId/attachments', authenticateToken, requirePermission('enter_grades'), [
    body('file_name').notEmpty().withMessage('Nom du fichier requis'),
    body('file_path').notEmpty().withMessage('Chemin du fichier requis'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    await lessonController.addAttachment(req, res);
});

router.put('/:id', authenticateToken, requirePermission('enter_grades'), [
    body('title').optional().trim().notEmpty(),
    body('lesson_date').optional().isISO8601(),
    body('content').optional().trim(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    await lessonController.updateLesson(req, res);
});

router.delete('/:id', authenticateToken, requirePermission('enter_grades'), lessonController.deleteLesson);
router.delete('/attachments/:id', authenticateToken, requirePermission('enter_grades'), lessonController.deleteAttachment);

export default router;