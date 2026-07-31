import express from 'express';
import { body, validationResult } from 'express-validator';
import * as lessonJournalController from '../controllers/lessonJournalController.js';
import { authenticateToken, requirePermission } from '../middleware/rbac.js';

const router = express.Router();

// Routes GET
router.get('/', authenticateToken, lessonJournalController.getAllEntries);
router.get('/:id', authenticateToken, lessonJournalController.getEntryById);
router.get('/:lessonId/attachments', authenticateToken, lessonJournalController.getAttachments);

// Routes POST / PUT / DELETE
router.post('/', authenticateToken, requirePermission('enter_grades'), [
    body('teacher_id').notEmpty().withMessage('Enseignant requis'),
    body('class_id').notEmpty().withMessage('Classe requise'),
    body('subject_id').notEmpty().withMessage('Matière requise'),
    body('title').trim().notEmpty().withMessage('Titre requis'),
    body('lesson_date').isISO8601().withMessage('Date invalide'),
    body('content').optional().trim(),
    body('homework').optional().trim(),
    body('resources').optional(),
    body('start_time').optional().matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    body('end_time').optional().matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    body('is_published').optional().isBoolean(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    await lessonJournalController.createEntry(req, res);
});

router.put('/:id', authenticateToken, requirePermission('enter_grades'), [
    body('title').optional().trim().notEmpty(),
    body('lesson_date').optional().isISO8601(),
    body('content').optional().trim(),
    body('homework').optional().trim(),
    body('resources').optional(),
    body('is_published').optional().isBoolean(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    await lessonJournalController.updateEntry(req, res);
});

router.delete('/:id', authenticateToken, requirePermission('enter_grades'), lessonJournalController.deleteEntry);

// Attachments
router.post('/:lessonId/attachments', authenticateToken, requirePermission('enter_grades'), lessonJournalController.uploadAttachment);
router.delete('/attachments/:attachmentId', authenticateToken, requirePermission('enter_grades'), lessonJournalController.deleteAttachment);

export default router;