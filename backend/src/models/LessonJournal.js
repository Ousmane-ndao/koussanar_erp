import pool from '../database/db.js';

class LessonJournal {
    static async findAll(filters = {}) {
        let sql = `
            SELECT lj.*,
                   t.matricule as teacher_matricule,
                   p.nom as teacher_nom, p.prenom as teacher_prenom,
                   c.nom as class_nom,
                   m.nom as subject_nom,
                   creator.nom as creator_nom, creator.prenom as creator_prenom
            FROM lesson_journal lj
            LEFT JOIN teachers t ON lj.teacher_id = t.id
            LEFT JOIN profiles p ON t.user_id = p.id
            LEFT JOIN classes c ON lj.class_id = c.id
            LEFT JOIN matieres m ON lj.subject_id = m.id
            LEFT JOIN profiles creator ON lj.created_by = creator.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.teacher_id) {
            sql += ' AND lj.teacher_id = ?';
            params.push(filters.teacher_id);
        }
        if (filters.class_id) {
            sql += ' AND lj.class_id = ?';
            params.push(filters.class_id);
        }
        if (filters.subject_id) {
            sql += ' AND lj.subject_id = ?';
            params.push(filters.subject_id);
        }
        if (filters.start_date && filters.end_date) {
            sql += ' AND lj.lesson_date BETWEEN ? AND ?';
            params.push(filters.start_date, filters.end_date);
        }
        if (filters.is_published !== undefined) {
            sql += ' AND lj.is_published = ?';
            params.push(filters.is_published);
        }
        sql += ' ORDER BY lj.lesson_date DESC, lj.start_time';
        const [rows] = await pool.execute(sql, params);
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.execute(`
            SELECT lj.*,
                   t.matricule as teacher_matricule,
                   p.nom as teacher_nom, p.prenom as teacher_prenom,
                   c.nom as class_nom,
                   m.nom as subject_nom,
                   creator.nom as creator_nom, creator.prenom as creator_prenom
            FROM lesson_journal lj
            LEFT JOIN teachers t ON lj.teacher_id = t.id
            LEFT JOIN profiles p ON t.user_id = p.id
            LEFT JOIN classes c ON lj.class_id = c.id
            LEFT JOIN matieres m ON lj.subject_id = m.id
            LEFT JOIN profiles creator ON lj.created_by = creator.id
            WHERE lj.id = ?
        `, [id]);
        return rows[0];
    }

    static async create(data) {
        const {
            id, teacher_id, class_id, subject_id, schedule_id,
            title, content, homework, resources, lesson_date,
            start_time, end_time, duration, is_published, created_by
        } = data;
        const [result] = await pool.execute(`
            INSERT INTO lesson_journal
            (id, teacher_id, class_id, subject_id, schedule_id,
             title, content, homework, resources, lesson_date,
             start_time, end_time, duration, is_published, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, teacher_id, class_id, subject_id, schedule_id || null,
            title, content || null, homework || null, resources || null,
            lesson_date, start_time || null, end_time || null,
            duration || null, is_published || false, created_by]);
        return result;
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
        if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content); }
        if (data.homework !== undefined) { fields.push('homework = ?'); values.push(data.homework); }
        if (data.resources !== undefined) { fields.push('resources = ?'); values.push(data.resources); }
        if (data.lesson_date !== undefined) { fields.push('lesson_date = ?'); values.push(data.lesson_date); }
        if (data.start_time !== undefined) { fields.push('start_time = ?'); values.push(data.start_time); }
        if (data.end_time !== undefined) { fields.push('end_time = ?'); values.push(data.end_time); }
        if (data.duration !== undefined) { fields.push('duration = ?'); values.push(data.duration); }
        if (data.is_published !== undefined) { fields.push('is_published = ?'); values.push(data.is_published); }
        if (fields.length === 0) return null;
        values.push(id);
        const [result] = await pool.execute(
            `UPDATE lesson_journal SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return result;
    }

    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM lesson_journal WHERE id = ?', [id]);
        return result;
    }

    static async findAttachments(lessonId) {
        const [rows] = await pool.execute(
            'SELECT * FROM lesson_attachments WHERE lesson_id = ?',
            [lessonId]
        );
        return rows;
    }

    static async addAttachment(data) {
        const { id, lesson_id, file_name, file_path, file_type, file_size } = data;
        const [result] = await pool.execute(`
            INSERT INTO lesson_attachments (id, lesson_id, file_name, file_path, file_type, file_size)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [id, lesson_id, file_name, file_path, file_type || null, file_size || null]);
        return result;
    }

    static async deleteAttachment(id) {
        const [result] = await pool.execute('DELETE FROM lesson_attachments WHERE id = ?', [id]);
        return result;
    }
}

export default LessonJournal;