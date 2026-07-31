import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import pool from './database/db.js';
import lessonJournalRoutes from './routes/lesson-journal.js';
// Routes
import authRoutes from './routes/auth.js';
import studentsRoutes from './routes/students.js';
import classesRoutes from './routes/classes.js';
import attendanceRoutes from './routes/attendance.js';
import financeRoutes from './routes/finance.js';
import messagesRoutes from './routes/messages.js';
import documentsRoutes from './routes/documents.js';
import teachersRoutes from './routes/teachers.js';
import gradesRoutes from './routes/grades.js';
import schedulesRoutes from './routes/schedules.js';
import feeTypesRoutes from './routes/fee-types.js';
import semestersRoutes from './routes/semesters.js';
import exportRoutes from './routes/export.js';
import announcementsRoutes from './routes/announcements.js';
import bulletinsRoutes from './routes/bulletins.js';
import subjectsRoutes from './routes/subjects.js';
import roomsRoutes from './routes/rooms.js';
import schoolYearRoutes from './routes/schoolYearRoutes.js';
import academicPeriodRoutes from './routes/academicPeriodRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// ============================================================
// 1. Middlewares
// ============================================================
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// ============================================================
// 2. Routes (TOUTES avec app.use, PAS p.use)
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/fee-types', feeTypesRoutes);
app.use('/api/semesters', semestersRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/bulletins', bulletinsRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/school-years', schoolYearRoutes);
app.use('/api/academic-periods', academicPeriodRoutes);
app.use('/api/lesson-journal', lessonJournalRoutes);
// ...
app.use('/api/lesson-journal', lessonJournalRoutes);
// ============================================================
// 3. Health checks
// ============================================================
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

app.get('/db-test', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1+1 as result');
    res.json({ success: true, result: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// 4. Error handling
// ============================================================
app.use((err, req, res, next) => {
  console.error('='.repeat(50));
  console.error('[ERROR]', new Date().toISOString());
  console.error('Method:', req.method);
  console.error('URL:', req.originalUrl);
  console.error('Body:', req.body);
  console.error('Error Message:', err.message);
  console.error('Error Stack:', err.stack);
  console.error('='.repeat(50));

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================
// 5. Démarrer
// ============================================================
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});