// Script pour vérifier la configuration de la base de données
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function checkDatabase() {
  console.log('='.repeat(50));
  console.log('Database Configuration Check');
  console.log('='.repeat(50));
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'koussanar_erp',
    port: parseInt(process.env.DB_PORT || '3306'),
  };
  
  console.log('\nConfiguration:');
  console.log(`  Host: ${config.host}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Password: ${config.password ? '***' : '(empty)'}`);
  console.log(`  Database: ${config.database}`);
  console.log(`  Port: ${config.port}`);
  
  // Test connection without database
  console.log('\n1. Testing MySQL server connection...');
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port,
    });
    console.log('   ✓ MySQL server is reachable');
    await connection.end();
  } catch (error) {
    console.error('   ✗ Cannot connect to MySQL server:', error.message);
    console.error('\n   Solutions:');
    console.error('   - Make sure MySQL is running');
    console.error('   - Check DB_HOST and DB_PORT in .env');
    console.error('   - Verify MySQL credentials');
    process.exit(1);
  }
  
  // Test database exists
  console.log('\n2. Checking if database exists...');
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port,
    });
    
    const [databases] = await connection.execute(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [config.database]
    );
    
    if (databases.length > 0) {
      console.log(`   ✓ Database "${config.database}" exists`);
    } else {
      console.log(`   ✗ Database "${config.database}" does not exist`);
      console.log(`\n   Create it with:`);
      console.log(`   CREATE DATABASE ${config.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    }
    
    await connection.end();
  } catch (error) {
    console.error('   ✗ Error checking database:', error.message);
  }
  
  // Test connection with database
  console.log('\n3. Testing connection to database...');
  try {
    const connection = await mysql.createConnection(config);
    console.log(`   ✓ Successfully connected to "${config.database}"`);
    
    // Check tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`   ✓ Found ${tables.length} table(s)`);
    
    if (tables.length > 0) {
      console.log('\n   Existing tables:');
      tables.forEach((table, index) => {
        console.log(`     ${index + 1}. ${Object.values(table)[0]}`);
      });
    }
    
    await connection.end();
  } catch (error) {
    console.error(`   ✗ Cannot connect to database "${config.database}":`, error.message);
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n   Solution: Create the database first');
      console.error(`   CREATE DATABASE ${config.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    }
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✓ All checks passed! You can run: npm run migrate');
  console.log('='.repeat(50));
  process.exit(0);
}

checkDatabase().catch(error => {
  console.error('\n✗ Unexpected error:', error);
  process.exit(1);
});


