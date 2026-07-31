import pool from '../database/db.js';

class SchoolYear {
    static async findAll() {
        const [rows] = await pool.execute('SELECT * FROM school_years ORDER BY start_date DESC');
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM school_years WHERE id = ?', [id]);
        return rows[0];
    }

    static async findActive() {
        const [rows] = await pool.execute('SELECT * FROM school_years WHERE is_active = TRUE');
        return rows;
    }

    static async getCurrent() {
        const [rows] = await pool.execute(
            `SELECT * FROM school_years WHERE is_active = TRUE ORDER BY start_date DESC LIMIT 1`
        );
        return rows[0];
    }

    static async findPeriods(schoolYearId) {
        const [rows] = await pool.execute(
            'SELECT * FROM academic_periods WHERE school_year_id = ?',
            [schoolYearId]
        );
        return rows;
    }

    static async create(data) {
        const { id, name, start_date, end_date, is_active } = data;
        const [result] = await pool.execute(
            `INSERT INTO school_years (id, name, start_date, end_date, is_active)
             VALUES (?, ?, ?, ?, ?)`,
            [id, name, start_date, end_date, is_active ?? true]
        );
        return result;
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
        if (data.start_date !== undefined) { fields.push('start_date = ?'); values.push(data.start_date); }
        if (data.end_date !== undefined) { fields.push('end_date = ?'); values.push(data.end_date); }
        if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }
        if (fields.length === 0) return null;
        values.push(id);
        const [result] = await pool.execute(
            `UPDATE school_years SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return result;
    }

    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM school_years WHERE id = ?', [id]);
        return result;
    }
}

export default SchoolYear;