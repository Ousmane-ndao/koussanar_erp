import pool from '../database/db.js';

class AcademicPeriod {
    static async findAll(filters = {}) {
        let sql = 'SELECT * FROM academic_periods WHERE 1=1';
        const params = [];
        if (filters.school_year_id) {
            sql += ' AND school_year_id = ?';
            params.push(filters.school_year_id);
        }
        if (filters.is_active !== undefined) {
            sql += ' AND is_active = ?';
            params.push(filters.is_active);
        }
        sql += ' ORDER BY sequence ASC';
        const [rows] = await pool.execute(sql, params);
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM academic_periods WHERE id = ?', [id]);
        return rows[0];
    }

    static async findBySchoolYear(schoolYearId) {
        const [rows] = await pool.execute(
            'SELECT * FROM academic_periods WHERE school_year_id = ? ORDER BY sequence ASC',
            [schoolYearId]
        );
        return rows;
    }

    static async create(data) {
        const { id, school_year_id, name, type, sequence, start_date, end_date, is_active } = data;
        const [result] = await pool.execute(
            `INSERT INTO academic_periods (id, school_year_id, name, type, sequence, start_date, end_date, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, school_year_id, name, type, sequence, start_date, end_date, is_active ?? true]
        );
        return result;
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
        if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
        if (data.sequence !== undefined) { fields.push('sequence = ?'); values.push(data.sequence); }
        if (data.start_date !== undefined) { fields.push('start_date = ?'); values.push(data.start_date); }
        if (data.end_date !== undefined) { fields.push('end_date = ?'); values.push(data.end_date); }
        if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }
        if (fields.length === 0) return null;
        values.push(id);
        const [result] = await pool.execute(
            `UPDATE academic_periods SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return result;
    }

    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM academic_periods WHERE id = ?', [id]);
        return result;
    }

    static async getActivePeriods() {
        const [rows] = await pool.execute(
            `SELECT * FROM academic_periods WHERE is_active = TRUE ORDER BY school_year_id, sequence`
        );
        return rows;
    }

    static async getCurrentPeriod() {
        const now = new Date().toISOString().split('T')[0];
        const [rows] = await pool.execute(
            `SELECT * FROM academic_periods WHERE is_active = TRUE AND start_date <= ? AND end_date >= ? LIMIT 1`,
            [now, now]
        );
        return rows[0];
    }
}

export default AcademicPeriod;