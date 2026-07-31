import Schedule from '../models/Schedule.js';
import { generateUUID } from '../utils/uuid.js';

class ScheduleService {
    async getAll(filters = {}) {
        return await Schedule.findAll(filters);
    }

    async getById(id) {
        const schedule = await Schedule.findById(id);
        if (!schedule) {
            throw new Error('Emploi du temps non trouvé');
        }
        return schedule;
    }

    async create(data) {
        // Vérifier les conflits
        const conflicts = await Schedule.findConflicts(
            data.teacher_id,
            data.room_id,
            data.class_id,
            data.day,
            data.start_time,
            data.end_time
        );

        if (conflicts.length > 0) {
            const messages = [];
            for (const c of conflicts) {
                if (c.teacher_id === data.teacher_id) {
                    messages.push(`Enseignant déjà occupé de ${c.start_time} à ${c.end_time}`);
                }
                if (c.room_id === data.room_id) {
                    messages.push(`Salle déjà réservée de ${c.start_time} à ${c.end_time}`);
                }
                if (c.class_id === data.class_id) {
                    messages.push(`Classe déjà occupée de ${c.start_time} à ${c.end_time}`);
                }
            }
            throw new Error('Conflit d\'horaire: ' + messages.join(', '));
        }

        const id = generateUUID();
        const scheduleData = {
            id,
            teacher_id: data.teacher_id,
            class_id: data.class_id,
            subject_id: data.subject_id,
            room_id: data.room_id,
            day: data.day,
            start_time: data.start_time,
            end_time: data.end_time,
            school_year_id: data.school_year_id,
            academic_period_id: data.academic_period_id || null
        };
        await Schedule.create(scheduleData);
        return this.getById(id);
    }

    async update(id, data) {
        const existing = await this.getById(id);
        const teacherId = data.teacher_id || existing.teacher_id;
        const roomId = data.room_id || existing.room_id;
        const classId = data.class_id || existing.class_id;
        const day = data.day || existing.day;
        const startTime = data.start_time || existing.start_time;
        const endTime = data.end_time || existing.end_time;

        const conflicts = await Schedule.findConflicts(
            teacherId,
            roomId,
            classId,
            day,
            startTime,
            endTime,
            id
        );

        if (conflicts.length > 0) {
            const messages = [];
            for (const c of conflicts) {
                if (c.teacher_id === teacherId) {
                    messages.push(`Enseignant déjà occupé de ${c.start_time} à ${c.end_time}`);
                }
                if (c.room_id === roomId) {
                    messages.push(`Salle déjà réservée de ${c.start_time} à ${c.end_time}`);
                }
                if (c.class_id === classId) {
                    messages.push(`Classe déjà occupée de ${c.start_time} à ${c.end_time}`);
                }
            }
            throw new Error('Conflit d\'horaire: ' + messages.join(', '));
        }

        await Schedule.update(id, data);
        return this.getById(id);
    }

    async delete(id) {
        await this.getById(id);
        await Schedule.delete(id);
    }
}

export default ScheduleService;