import LessonJournalService from '../services/lessonJournalService.js';

const lessonJournalService = new LessonJournalService();

export const getAllLessons = async (req, res) => {
    try {
        const filters = {};
        if (req.query.teacher_id) filters.teacher_id = req.query.teacher_id;
        if (req.query.class_id) filters.class_id = req.query.class_id;
        if (req.query.subject_id) filters.subject_id = req.query.subject_id;
        if (req.query.lesson_date) filters.lesson_date = req.query.lesson_date;
        if (req.query.start_date && req.query.end_date) {
            filters.start_date = req.query.start_date;
            filters.end_date = req.query.end_date;
        }
        if (req.query.is_published) filters.is_published = req.query.is_published === 'true';
        const lessons = await lessonJournalService.getAll(filters);
        res.json(lessons);
    } catch (error) {
        console.error('Get lessons error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des cours' });
    }
};

export const getLessonById = async (req, res) => {
    try {
        const lesson = await lessonJournalService.getById(req.params.id);
        res.json(lesson);
    } catch (error) {
        console.error('Get lesson error:', error);
        res.status(404).json({ message: error.message });
    }
};

export const createLesson = async (req, res) => {
    try {
        const lesson = await lessonJournalService.create(req.body, req.user.id);
        res.status(201).json(lesson);
    } catch (error) {
        console.error('Create lesson error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const updateLesson = async (req, res) => {
    try {
        const lesson = await lessonJournalService.update(req.params.id, req.body);
        res.json(lesson);
    } catch (error) {
        console.error('Update lesson error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const deleteLesson = async (req, res) => {
    try {
        await lessonJournalService.delete(req.params.id);
        res.json({ message: 'Cours supprimé avec succès' });
    } catch (error) {
        console.error('Delete lesson error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const getAttachments = async (req, res) => {
    try {
        const attachments = await lessonJournalService.getAttachments(req.params.lessonId);
        res.json(attachments);
    } catch (error) {
        console.error('Get attachments error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const addAttachment = async (req, res) => {
    try {
        const attachment = await lessonJournalService.addAttachment(req.params.lessonId, req.body);
        res.status(201).json(attachment);
    } catch (error) {
        console.error('Add attachment error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const deleteAttachment = async (req, res) => {
    try {
        await lessonJournalService.deleteAttachment(req.params.id);
        res.json({ message: 'Pièce jointe supprimée avec succès' });
    } catch (error) {
        console.error('Delete attachment error:', error);
        res.status(400).json({ message: error.message });
    }
};