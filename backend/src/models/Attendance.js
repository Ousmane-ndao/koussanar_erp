import pool from '../database/db.js';

class Attendance {
    static async findAll(filters = {}) {
        let sql = `
            SELECT a.*,
                   ast.code as status_code, ast.label as status_label, ast.color,
                   p.nom as student_nom, p.prenom as student_prenom, s.matricule,
                   c.nom as class_nom,
                   r.nom as recorder_nom, r.prenom as recorder_prenom
            FROM attendance a
            JOIN attendance_status ast ON a.status_id = ast.id
            JOIN students s ON a.student_id = s.id
            JOIN profiles p ON s.user_id = p.id
            JOIN classes c ON a.class_id = c.id
            JOIN profiles r ON a.recorded_by = r.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.student_id) {
            sql += ' AND a.student_id = ?';
            params.push(filters.student_id);
        }
        if (filters.class_id) {
            sql += ' AND a.class_id = ?';
            params.push(filters.class_id);
        }
        if (filters.status_id) {
            sql += ' AND a.status_id = ?';
            params.push(filters.status_id);
        }
        if (filters.date) {
            sql += ' AND a.date = ?';
            params.push(filters.date);
        }
        if (filters.start_date && filters.end_date) {
            sql += ' AND a.date BETWEEN ? AND ?';
            params.push(filters.start_date, filters.end_date);
        }
        sql += ' ORDER BY a.date DESC, a.created_at DESC';
        const [rows] = await pool.execute(sql, params);
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.execute(`
            SELECT a.*,
                   ast.code as status_code, ast.label as status_label, ast.color,
                   p.nom as student_nom, p.prenom as student_prenom, s.matricule,
                   c.nom as class_nom,
                   r.nom as recorder_nom, r.prenom as recorder_prenom
            FROM attendance a
            JOIN attendance_status ast ON a.status_id = ast.id
            JOIN students s ON a.student_id = s.id
            JOIN profiles p ON s.user_id = p.id
            JOIN classes c ON a.class_id = c.id
            JOIN profiles r ON a.recorded_by = r.id
            WHERE a.id = ?
        `, [id]);
        return rows[0];
    }

    static async findByStudentAndDate(studentId, date) {
        const [rows] = await pool.execute(
            'SELECT * FROM attendance WHERE student_id = ? AND date = ?',
            [studentId, date]
        );
        return rows[0];
    }

    static async create(data) {
        const { id, student_id, class_id, status_id, date, start_time, end_time, hours, justification, recorded_by } = data;
        const [result] = await pool.execute(`
            INSERT INTO attendance
            (id, student_id, class_id, status_id, date, start_time, end_time, hours, justification, recorded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, student_id, class_id, status_id, date, start_time || null, end_time || null, hours || 1.0, justification || null, recorded_by]);
        return result;
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        if (data.status_id !== undefined) { fields.push('status_id = ?'); values.push(data.status_id); }
        if (data.start_time !== undefined) { fields.push('start_time = ?'); values.push(data.start_time); }
        if (data.end_time !== undefined) { fields.push('end_time = ?'); values.push(data.end_time); }
        if (data.hours !== undefined) { fields.push('hours = ?'); values.push(data.hours); }
        if (data.justification !== undefined) { fields.push('justification = ?'); values.push(data.justification); }
        if (fields.length === 0) return null;
        values.push(id);
        const [result] = await pool.execute(
            `UPDATE attendance SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return result;
    }

    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM attendance WHERE id = ?', [id]);
        return result;
    }

    // Statistiques pour un élève
    static async getStats(studentId, startDate = null, endDate = null) {
        let sql = `
            SELECT
                COUNT(*) as total_days,
                SUM(CASE WHEN ast.is_absent = TRUE THEN 1 ELSE 0 END) as total_absences,
                SUM(CASE WHEN ast.code = 'present' THEN 1 ELSE 0 END) as total_presences,
                SUM(CASE WHEN ast.code = 'late' THEN 1 ELSE 0 END) as total_lates,
                SUM(CASE WHEN ast.code = 'absent_justified' THEN 1 ELSE 0 END) as justified_absences,
                SUM(CASE WHEN ast.code = 'absent_unjustified' THEN 1 ELSE 0 END) as unjustified_absences,
                ROUND(SUM(CASE WHEN ast.code IN ('present', 'late', 'early_leave') THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as attendance_rate
            FROM attendance a
            JOIN attendance_status ast ON a.status_id = ast.id
            WHERE a.student_id = ?
        `;
        const params = [studentId];
        if (startDate && endDate) {
            sql += ' AND a.date BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }
        const [rows] = await pool.execute(sql, params);
        return rows[0];
    }
}

export default Attendance;