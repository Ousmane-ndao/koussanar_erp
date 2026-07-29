import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
// Ajoutez ceci dans la configuration du pool
ssl: {
  rejectUnauthorized: false
}
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'koussanar_erp',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000,
  // 👇 AJOUT OBLIGATOIRE pour Aiven (mode SSL REQUIS)
  ssl: {
    rejectUnauthorized: false // Permet la connexion sans avoir à télécharger le certificat CA
  }
});

pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to MySQL database (Aiven)');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error connecting to MySQL:', err);
    // Le pool réessaiera automatiquement
  });

export default pool;