import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('🔍 Diagnostic de la connexion MySQL...\n');
  
  // Afficher la configuration (sans le mot de passe)
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ? '***' : '(vide)',
    database: process.env.DB_NAME || 'koussanar_erp',
    port: parseInt(process.env.DB_PORT || '3306'),
  };
  
  console.log('📋 Configuration détectée:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Password: ${config.password}`);
  console.log(`   Database: ${config.database}`);
  console.log('');
  
  // Test 1: Vérifier si on peut se connecter sans spécifier la base de données
  console.log('1️⃣ Test de connexion au serveur MySQL (sans base de données)...');
  try {
    const connection1 = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: process.env.DB_PASSWORD || '',
      connectTimeout: 5000,
    });
    
    console.log('   ✅ Connexion au serveur MySQL réussie!\n');
    
    // Vérifier si la base de données existe
    const [databases] = await connection1.execute('SHOW DATABASES');
    const dbNames = databases.map(db => db.Database);
    
    console.log('2️⃣ Vérification de la base de données...');
    if (dbNames.includes(config.database)) {
      console.log(`   ✅ La base de données "${config.database}" existe\n`);
    } else {
      console.log(`   ❌ La base de données "${config.database}" n'existe PAS\n`);
      console.log('   Bases de données disponibles:');
      dbNames.forEach(db => {
        console.log(`      - ${db}`);
      });
      console.log('\n   💡 Pour créer la base de données, exécutez:');
      console.log(`      CREATE DATABASE ${config.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    }
    
    await connection1.end();
    
    // Test 2: Connexion avec la base de données
    if (dbNames.includes(config.database)) {
      console.log('3️⃣ Test de connexion avec la base de données...');
      try {
        const connection2 = await mysql.createConnection({
          host: config.host,
          port: config.port,
          user: config.user,
          password: process.env.DB_PASSWORD || '',
          database: config.database,
          connectTimeout: 5000,
        });
        
        console.log(`   ✅ Connexion à la base "${config.database}" réussie!\n`);
        
        // Vérifier les tables
        const [tables] = await connection2.execute('SHOW TABLES');
        console.log(`   📊 Tables trouvées: ${tables.length}`);
        if (tables.length > 0) {
          console.log('   Tables:');
          tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`      - ${tableName}`);
          });
        }
        
        await connection2.end();
        console.log('\n✅ Tous les tests sont passés avec succès!');
        console.log('   Le problème pourrait être lié au timeout de connexion dans le pool.');
        
      } catch (error) {
        console.log(`   ❌ Erreur de connexion: ${error.message}`);
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
          console.log('   💡 Problème d\'authentification. Vérifiez le nom d\'utilisateur et le mot de passe.');
        }
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Erreur de connexion: ${error.message}`);
    console.log(`   Code d'erreur: ${error.code}`);
    console.log('');
    
    if (error.code === 'ETIMEDOUT') {
      console.log('💡 Solutions possibles:');
      console.log('   1. Vérifiez que MySQL est démarré');
      console.log('      - Windows: Services > MySQL > Démarrer');
      console.log('      - Ou: net start MySQL (en tant qu\'administrateur)');
      console.log('   2. Vérifiez que le port MySQL est correct (par défaut: 3306)');
      console.log('   3. Vérifiez que l\'adresse host est correcte');
      console.log('      - Si MySQL est sur la même machine: localhost ou 127.0.0.1');
      console.log('      - Si MySQL est sur une autre machine: l\'adresse IP ou le nom d\'hôte');
      console.log('   4. Vérifiez que le pare-feu n\'bloque pas la connexion');
      console.log('   5. Vérifiez les paramètres dans le fichier .env');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 MySQL n\'est pas accessible à cette adresse/port');
      console.log('   Vérifiez que MySQL est démarré et écoute sur le bon port');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Problème d\'authentification');
      console.log('   Vérifiez le nom d\'utilisateur et le mot de passe dans .env');
    }
  }
}

testConnection().catch(console.error);


















