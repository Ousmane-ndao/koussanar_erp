import Attendance from '../models/Attendance.js';
import { generateUUID } from '../utils/uuid.js';

class AttendanceService {
    async getAll(filters = {}) {
        return await Attendance.findAll(filters);
    }

    async getById(id) {
        const record = await Attendance.findById(id);
        if (!record) {
            throw new Error('Enregistrement de présence non trouvé');
        }
        return record;
    }

    async getByStudentAndDate(studentId, date) {
        const record = await Attendance.findByStudentAndDate(studentId, date);
        return record;
    }

    async create(data, userId) {
        // Vérifier si l'élève existe et sa classe
        const [students] = await pool.execute(
            'SELECT id, classe_id FROM students WHERE id = ?',
            [data.student_id]
        );
        if (students.length === 0) {
            throw new Error('Élève non trouvé');
        }
        const student = students[0];

        // Vérifier si l'enregistrement existe déjà pour ce jour
        const existing = await Attendance.findByStudentAndDate(data.student_id, data.date);
        if (existing) {
            throw new Error('Une présence a déjà été enregistrée pour cet élève aujourd\'hui');
        }

        const id = generateUUID();
        const recordData = {
            id,
            student_id: data.student_id,
            class_id: student.classe_id,
            status_id: data.status_id,
            date: data.date,
            start_time: data.start_time || null,
            end_time: data.end_time || null,
            hours: data.hours || 1.0,
            justification: data.justification || null,
            recorded_by: userId
        };
        await Attendance.create(recordData);
        return this.getById(id);
    }

    async update(id, data, userId) {
        const existing = await this.getById(id);
        // On pourrait vérifier les droits ici (admin ou enseignant de la classe)
        await Attendance.update(id, data);
        return this.getById(id);
    }

    async delete(id) {
        await this.getById(id);
        await Attendance.delete(id);
    }

    async getStats(studentId, startDate = null, endDate = null) {
        const stats = await Attendance.getStats(studentId, startDate, endDate);
        if (!stats || stats.total_days === 0) {
            return {
                total_days: 0,
                total_absences: 0,
                total_presences: 0,
                total_lates: 0,
                justified_absences: 0,
                unjustified_absences: 0,
                attendance_rate: 0
            };
        }
        return stats;
    }
}

export default AttendanceService;