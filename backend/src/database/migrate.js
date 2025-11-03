import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  try {
    console.log('Starting database migration...');
    console.log('Connecting to database...');
    
    // Test connection
    try {
      const connection = await pool.getConnection();
      console.log('✓ Database connection established');
      connection.release();
    } catch (error) {
      console.error('✗ Failed to connect to database:', error.message);
      console.error('\nPlease check your .env file and ensure:');
      console.error('  - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME are correct');
      console.error('  - MySQL server is running');
      console.error('  - Database exists (create it first if needed)');
      process.exit(1);
    }
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');
    
    // Remove comments
    let cleanSchema = schema
      .replace(/--.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
    
    // Handle DELIMITER blocks (functions, procedures)
    const delimiterRegex = /DELIMITER\s+(\S+)[\s\S]*?DELIMITER\s*;/gi;
    const delimiterBlocks = [];
    let match;
    
    while ((match = delimiterRegex.exec(cleanSchema)) !== null) {
      delimiterBlocks.push(match[0]);
      cleanSchema = cleanSchema.replace(match[0], '');
    }
    
    // Split remaining schema by semicolon
    const statements = cleanSchema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.toLowerCase().includes('delimiter'));
    
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Execute regular statements
    for (const statement of statements) {
      if (!statement || statement.length < 10) continue;
      
      try {
        await pool.execute(statement);
        successCount++;
        console.log(`✓ Executed statement (${successCount})`);
      } catch (error) {
        const errorMsg = error.message.toLowerCase();
        // Ignore errors for "already exists" cases
        if (
          errorMsg.includes('already exists') || 
          errorMsg.includes('duplicate') ||
          errorMsg.includes('table already exists') ||
          errorMsg.includes('duplicate key name')
        ) {
          skippedCount++;
          console.log(`⊘ Skipped (already exists): ${statement.substring(0, 50)}...`);
        } else {
          errorCount++;
          console.error(`✗ Error executing statement:`, error.message);
          console.error(`Statement: ${statement.substring(0, 150)}...`);
          // Provide helpful error message for CHECK constraint errors
          if (error.message.includes('CHECK') || error.message.includes('check constraint')) {
            console.error(`\n  ⚠ CHECK constraint not supported in MySQL < 8.0.16`);
            console.error(`  Using compatibility mode (CHECK constraint removed from schema)`);
          }
        }
      }
    }
    
    // Execute DELIMITER blocks (functions, procedures) separately
    if (delimiterBlocks.length > 0) {
      console.log(`\nProcessing ${delimiterBlocks.length} DELIMITER block(s)...`);
      
      for (const block of delimiterBlocks) {
        try {
          // Remove DELIMITER declarations and execute the function/procedure
          const cleanedBlock = block
            .replace(/DELIMITER\s+\S+/gi, '')
            .replace(/DELIMITER\s*;/gi, '')
            .trim();
          
          if (cleanedBlock) {
            await pool.query(cleanedBlock);
            successCount++;
            console.log(`✓ Executed DELIMITER block`);
          }
        } catch (error) {
          const errorMsg = error.message.toLowerCase();
          if (
            errorMsg.includes('already exists') ||
            errorMsg.includes('duplicate function')
          ) {
            skippedCount++;
            console.log(`⊘ Skipped function (already exists)`);
          } else {
            errorCount++;
            console.error(`✗ Error executing DELIMITER block:`, error.message);
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('Migration Summary:');
    console.log(`  ✓ Successfully executed: ${successCount}`);
    console.log(`  ⊘ Skipped (already exists): ${skippedCount}`);
    console.log(`  ✗ Errors: ${errorCount}`);
    console.log('='.repeat(50));
    
    if (errorCount === 0) {
      console.log('\n✓ Migration completed successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠ Migration completed with errors. Please review the errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Migration error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

migrate();

