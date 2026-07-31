import LessonJournal from '../models/LessonJournal.js';
import { generateUUID } from '../utils/uuid.js';
import pool from '../database/db.js';

class LessonJournalService {
    async getAll(filters = {}) {
        return await LessonJournal.findAll(filters);
    }

    async getById(id) {
        const lesson = await LessonJournal.findById(id);
        if (!lesson) {
            throw new Error('Cours non trouvé');
        }
        return lesson;
    }

    async create(data, userId) {
        const [teacher] = await pool.execute('SELECT id FROM teachers WHERE id = ?', [data.teacher_id]);
        if (teacher.length === 0) {
            throw new Error('Enseignant non trouvé');
        }
        const id = generateUUID();
        const lessonData = {
            id,
            teacher_id: data.teacher_id,
            class_id: data.class_id,
            subject_id: data.subject_id,
            title: data.title,
            content: data.content || null,
            homework: data.homework || null,
            resources: data.resources || null,
            lesson_date: data.lesson_date,
            start_time: data.start_time || null,
            end_time: data.end_time || null,
            duration: data.duration || null,
            is_published: data.is_published || false,
            created_by: userId
        };
        await LessonJournal.create(lessonData);
        return this.getById(id);
    }

    async update(id, data) {
        await this.getById(id);
        await LessonJournal.update(id, data);
        return this.getById(id);
    }

    async delete(id) {
        await this.getById(id);
        await LessonJournal.delete(id);
    }

    async getAttachments(lessonId) {
        await this.getById(lessonId);
        return await LessonJournal.getAttachments(lessonId);
    }

    async addAttachment(lessonId, fileData) {
        await this.getById(lessonId);
        const id = generateUUID();
        const attachmentData = {
            id,
            lesson_id: lessonId,
            file_name: fileData.file_name,
            file_path: fileData.file_path,
            file_type: fileData.file_type || null,
            file_size: fileData.file_size || null
        };
        await LessonJournal.addAttachment(attachmentData);
        return attachmentData;
    }

    async deleteAttachment(id) {
        await LessonJournal.deleteAttachment(id);
    }
}

export default LessonJournalService;