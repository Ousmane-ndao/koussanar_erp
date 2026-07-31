import pool from '../database/db.js';

class Grade {
    static async findAll(filters = {}) {
        let sql = `
            SELECT g.*,
                   s.matricule,
                   p.nom, p.prenom,
                   creator.nom as creator_nom, creator.prenom as creator_prenom
            FROM grades g
            LEFT JOIN students s ON g.student_id = s.id
            LEFT JOIN profiles p ON s.user_id = p.id
            LEFT JOIN profiles creator ON g.created_by = creator.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.student_id) {
            sql += ' AND g.student_id = ?';
            params.push(filters.student_id);
        }
        if (filters.matiere) {
            sql += ' AND g.matiere = ?';
            params.push(filters.matiere);
        }
        if (filters.annee_scolaire) {
            sql += ' AND g.annee_scolaire = ?';
            params.push(filters.annee_scolaire);
        }
        if (filters.semestre_id) {
            sql += ' AND g.semestre_id = ?';
            params.push(filters.semestre_id);
        }
        if (filters.class_id) {
            sql += ' AND s.classe_id = ?';
            params.push(filters.class_id);
        }

        sql += ' ORDER BY g.date_evaluation DESC';
        const [rows] = await pool.execute(sql, params);
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.execute(`
            SELECT g.*,
                   s.matricule, s.classe_id,
                   p.nom, p.prenom,
                   creator.nom as creator_nom, creator.prenom as creator_prenom
            FROM grades g
            LEFT JOIN students s ON g.student_id = s.id
            LEFT JOIN profiles p ON s.user_id = p.id
            LEFT JOIN profiles creator ON g.created_by = creator.id
            WHERE g.id = ?
        `, [id]);
        return rows[0];
    }

    static async findByStudentAndSemester(studentId, semestreId) {
        const [rows] = await pool.execute(
            'SELECT * FROM grades WHERE student_id = ? AND semestre_id = ?',
            [studentId, semestreId]
        );
        return rows;
    }

    static async create(data) {
        const {
            id, student_id, matiere, note, coefficient, type_evaluation,
            date_evaluation, annee_scolaire, remarque, created_by, semestre_id
        } = data;
        const [result] = await pool.execute(`
            INSERT INTO grades
            (id, student_id, matiere, note, coefficient, type_evaluation,
             date_evaluation, annee_scolaire, remarque, created_by, semestre_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [id, student_id, matiere, note, coefficient, type_evaluation,
            date_evaluation, annee_scolaire, remarque, created_by, semestre_id]);
        return result;
    }

    static async update(id, data) {
        const fields = [];
        const values = [];
        if (data.matiere !== undefined) { fields.push('matiere = ?'); values.push(data.matiere); }
        if (data.note !== undefined) { fields.push('note = ?'); values.push(data.note); }
        if (data.coefficient !== undefined) { fields.push('coefficient = ?'); values.push(data.coefficient); }
        if (data.type_evaluation !== undefined) { fields.push('type_evaluation = ?'); values.push(data.type_evaluation); }
        if (data.date_evaluation !== undefined) { fields.push('date_evaluation = ?'); values.push(data.date_evaluation); }
        if (data.annee_scolaire !== undefined) { fields.push('annee_scolaire = ?'); values.push(data.annee_scolaire); }
        if (data.remarque !== undefined) { fields.push('remarque = ?'); values.push(data.remarque); }
        if (data.semestre_id !== undefined) { fields.push('semestre_id = ?'); values.push(data.semestre_id); }
        if (fields.length === 0) return null;
        values.push(id);
        const [result] = await pool.execute(
            `UPDATE grades SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return result;
    }

    static async delete(id) {
        const [result] = await pool.execute('DELETE FROM grades WHERE id = ?', [id]);
        return result;
    }

    // Calcul de la moyenne pour un élève, une matière et un semestre
    static async calculateAverage(studentId, matiere, semestreId) {
        const [rows] = await pool.execute(`
            SELECT
                AVG(note * coefficient) / AVG(coefficient) as moyenne_ponderee,
                AVG(note) as moyenne_simple,
                SUM(coefficient) as total_coeff,
                COUNT(*) as nb_notes
            FROM grades
            WHERE student_id = ?
              AND matiere = ?
              AND semestre_id = ?
        `, [studentId, matiere, semestreId]);
        return rows[0];
    }

    // Moyenne générale d’un élève pour un semestre
    static async calculateOverallAverage(studentId, semestreId) {
        const [rows] = await pool.execute(`
            SELECT
                SUM(note * coefficient) / SUM(coefficient) as moyenne_generale,
                SUM(coefficient) as total_coeff,
                COUNT(*) as nb_notes
            FROM grades
            WHERE student_id = ?
              AND semestre_id = ?
        `, [studentId, semestreId]);
        return rows[0];
    }
}

export default Grade;