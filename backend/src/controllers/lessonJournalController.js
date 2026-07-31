import LessonJournalService from '../services/lessonJournalService.js';

const lessonJournalService = new LessonJournalService();

export const getAllEntries = async (req, res) => {
    try {
        const filters = {};
        if (req.query.teacher_id) filters.teacher_id = req.query.teacher_id;
        if (req.query.class_id) filters.class_id = req.query.class_id;
        if (req.query.subject_id) filters.subject_id = req.query.subject_id;
        if (req.query.start_date && req.query.end_date) {
            filters.start_date = req.query.start_date;
            filters.end_date = req.query.end_date;
        }
        if (req.query.is_published !== undefined) {
            filters.is_published = req.query.is_published === 'true';
        }
        const entries = await lessonJournalService.getAll(filters);
        res.json(entries);
    } catch (error) {
        console.error('Get lesson journal entries error:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du cahier de texte' });
    }
};

export const getEntryById = async (req, res) => {
    try {
        const entry = await lessonJournalService.getById(req.params.id);
        res.json(entry);
    } catch (error) {
        console.error('Get lesson journal entry error:', error);
        res.status(404).json({ message: error.message });
    }
};

export const createEntry = async (req, res) => {
    try {
        const entry = await lessonJournalService.create(req.body, req.user.id);
        res.status(201).json(entry);
    } catch (error) {
        console.error('Create lesson journal entry error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const updateEntry = async (req, res) => {
    try {
        const entry = await lessonJournalService.update(req.params.id, req.body);
        res.json(entry);
    } catch (error) {
        console.error('Update lesson journal entry error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const deleteEntry = async (req, res) => {
    try {
        await lessonJournalService.delete(req.params.id);
        res.json({ message: 'Séance supprimée avec succès' });
    } catch (error) {
        console.error('Delete lesson journal entry error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const getAttachments = async (req, res) => {
    try {
        const attachments = await lessonJournalService.getAttachments(req.params.lessonId);
        res.json(attachments);
    } catch (error) {
        console.error('Get attachments error:', error);
        res.status(404).json({ message: error.message });
    }
};

export const uploadAttachment = async (req, res) => {
    try {
        // Ici, vous pouvez intégrer multer pour gérer les fichiers
        // Pour l'exemple, nous supposons que les données sont envoyées dans req.body
        const { file_name, file_path, file_type, file_size } = req.body;
        const attachments = await lessonJournalService.addAttachment(req.params.lessonId, {
            file_name,
            file_path,
            file_type,
            file_size
        });
        res.status(201).json(attachments);
    } catch (error) {
        console.error('Upload attachment error:', error);
        res.status(400).json({ message: error.message });
    }
};

export const deleteAttachment = async (req, res) => {
    try {
        await lessonJournalService.deleteAttachment(req.params.attachmentId);
        res.json({ message: 'Fichier supprimé avec succès' });
    } catch (error) {
        console.error('Delete attachment error:', error);
        res.status(400).json({ message: error.message });
    }
};