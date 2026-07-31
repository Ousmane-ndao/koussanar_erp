import express from 'express';
import { body, validationResult } from 'express-validator';
import * as lessonController from '../controllers/lessonJournalController.js';
import { authenticateToken, requirePermission } from '../middleware/rbac.js';

const router = express.Router();

console.log('✅ [lessonJournal] Routes chargées');

// Routes GET
router.get('/', authenticateToken, lessonController.getAllLessons);
router.get('/:id', authenticateToken, lessonController.getLessonById);
router.get('/:lessonId/attachments', authenticateToken, lessonController.getAttachments);

// Routes POST
router.post('/', authenticateToken, requirePermission('enter_grades'), [
    body('teacher_id').notEmpty(),
    body('class_id').notEmpty(),
    body('subject_id').notEmpty(),
    body('title').trim().notEmpty(),
    body('lesson_date').isISO8601(),
    body('content').optional().trim(),
    body('homework').optional().trim(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    await lessonController.createLesson(req, res);
});

router.post('/:lessonId/attachments', authenticateToken, requirePermission('enter_grades'), [
    body('file_name').notEmpty(),
    body('file_path').notEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    await lessonController.addAttachment(req, res);
});

// Routes PUT / DELETE
router.put('/:id', authenticateToken, requirePermission('enter_grades'), [
    body('title').optional().trim().notEmpty(),
    body('lesson_date').optional().isISO8601(),
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