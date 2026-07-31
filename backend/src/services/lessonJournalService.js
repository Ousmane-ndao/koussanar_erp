import LessonJournal from '../models/LessonJournal.js';
import { generateUUID } from '../utils/uuid.js';

class LessonJournalService {
    async getAll(filters = {}) {
        return await LessonJournal.findAll(filters);
    }

    async getById(id) {
        const entry = await LessonJournal.findById(id);
        if (!entry) {
            throw new Error('Séance non trouvée');
        }
        return entry;
    }

    async create(data, userId) {
        const id = generateUUID();
        const entryData = {
            id,
            teacher_id: data.teacher_id,
            class_id: data.class_id,
            subject_id: data.subject_id,
            schedule_id: data.schedule_id || null,
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
        await LessonJournal.create(entryData);
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
        return await LessonJournal.findAttachments(lessonId);
    }

    async addAttachment(lessonId, fileData) {
        await this.getById(lessonId);
        const id = generateUUID();
        await LessonJournal.addAttachment({
            id,
            lesson_id: lessonId,
            ...fileData
        });
        return await this.getAttachments(lessonId);
    }

    async deleteAttachment(attachmentId) {
        await LessonJournal.deleteAttachment(attachmentId);
    }
}

export default LessonJournalService;