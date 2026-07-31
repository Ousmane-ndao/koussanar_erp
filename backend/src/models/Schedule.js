import pool from '../database/db.js';

class Schedule {
    static async findAll(filters = {}) {
        let sql = `
            SELECT s.*,
                   t.matricule as teacher_matricule,
                   p.nom as teacher_nom, p.prenom as teacher_prenom,
                   c.nom as class_nom,
                   m.nom as subject_nom,
                   r.name as room_name
            FROM schedules s
            LEFT JOIN teachers t ON s.teacher_id = t.id
            LEFT JOIN profiles p ON t.user_id = p.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN matieres m ON s.subject_id = m.id
            LEFT JOIN rooms r ON s.room_id = r.id
            WHERE 1=1
        `;
        const params = [];
        if (filters.teacher_id) {
            sql += ' AND s.teacher_id = ?';
            params.push(filters.teacher_id);
        }
        if (filters.class_id) {
            sql += ' AND s.class_id = ?';
            params.push(filters.class_id);
        }
        if (filters.room_id) {
            sql += ' AND s.room_id = ?';
            params.push(filters.room_id);
        }
        if (filters.school_year_id) {
            sql += ' AND s.school_year_id = ?';
            params.push(filters.school_year_id);
        }
        if (filters.academic_period_id) {
            sql += ' AND s.academic_period_id = ?';
            params.push(filters.academic_period_id);
        }
        if (filters.day) {
            sql += ' AND s.day = ?';
            params.push(filters.day);
        }
        sql += ' ORDER BY s.day, s.start_time';
        const [rows] = await pool.execute(sql, params);
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.execute(`
            SELECT s.*,
                   t.matricule as teacher_matricule,
                   p.nom as teacher_nom, p.prenom as teacher_prenom,
                   c.nom as class_nom,
                   m.nom as subject_nom,
                   r.name as room_name
            FROM schedules s
            LEFT JOIN teachers t ON s.teacher_id = t.id
            LEFT JOIN profiles p ON t.user_id = p.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN matieres m ON s.subject_id = m.id
            LEFT JOIN rooms r ON s.room_id = r.id
            WHERE s.id = ?
        `, [id]);
        return rows[0];
    }

    static async findConflicts(teacherId, roomId, classId, day, startTime, endTime, excludeId = null) {
        const conditions = [];
        const params = [];
        const query = `
            SELECT * FROM schedules
            WHERE day = ?
            AND (
                (start_time < ? AND end_time > ?) OR
                (start_time < ? AND end_time > ?) OR
                (start_time >= ? AND end_time <= ?)
            )
        `;
        const conflictParams = [day, endTime, startTime, endTime, startTime, startTime, endTime];
        const whereClauses = [];
        let sql = `SELECT * FROM schedules WHERE day = ?`;
        const allParams = [day];

        // Vérifier conflit enseignant
        if (teacherId) {
            sql += ` AND teacher_id = ?`;
            allParams.push(teacherId);
        }
        // Vérifier conflit salle
        if (roomId) {
            sql += ` AND room_id = ?`;
            allParams.push(roomId);
        }
        // Vérifier conflit classe
        if (classId) {
            sql += ` AND class_id = ?`;
            allParams.push(classId);
        }

        sql += ` AND (
            (start_time < ? AND end_time > ?) OR
            (start_time < ? AND end_time > ?) OR
            (start_time >= ? AND end_time <= ?)
        )`;
        allParams.push(endTime, startTime, endTime, startTime, startTime, endTime);

        if (excludeId) {
            sql += ` AND id != ?`;
            allParams.push(excludeId);
        }

        const [rows] = await pool.execute(sql, allParams);
        return rows;
    }

    static async create(data) {
        const { id, teacher_id, class_id, subject_id, room_id, day, start_time, end_time, school_year_id, academic_period_id } = data;
        const [result] = await pool.execute(`
            INSERT INTO schedules
            (id, teacher_id, class_id, subject_id, room_id, day, start_time, end_time, school_year_id, academic_period_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, teacher_id, class_id, subject_id, room_id, day, start_time, end_time, school_year_id, academic_period_id || null]);
        return result;
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        if (data.teacher_id !== undefined) { fields.push('teacher_id = ?'); values.push(data.teacher_id); }
        if (data.class_id !== undefined) { fields.push('class_id = ?'); values.push(data.class_id); }
        if (data.subject_id !== undefined) { fields.push('subject_id = ?'); values.push(data.subject_id); }
        if (data.room_id !== undefined) { fields.push('room_id = ?'); values.push(data.room_id); }
        if (data.day !== undefined) { fields.push('day = ?'); values.push(data.day); }
        if (data.start_time !== undefined) { fields.push('start_time = ?'); values.push(data.start_time); }
        if (data.end_time !== undefined) { fields.push('end_time = ?'); values.push(data.end_time); }
        if (data.school_year_id !== undefined) { fields.push('school_year_id = ?'); values.push(data.school_year_id); }
        if (data.academic_period_id !== undefined) { fields.push('academic_period_id = ?'); values.push(data.academic_period_id); }
        if (fields.length === 0) return null;
        values.push(id);
        const [result] = await pool.execute(
            `UPDATE schedules SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return result;
    }

    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM schedules WHERE id = ?', [id]);
        return result;
    }
}

export default Schedule;