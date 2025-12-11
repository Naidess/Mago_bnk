// Script para ejecutar las migraciones de la base de datos
const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function runMigrations() {
    const migrationsDir = path.join(__dirname, '../../database/migrations');
    
    try {
        // Leer todos los archivos de migración
        const files = fs.readdirSync(migrationsDir).sort();
        
        console.log('🚀 Ejecutando migraciones...\n');
        
        for (const file of files) {
            if (!file.endsWith('.sql')) continue;
            
            console.log(`📄 Ejecutando: ${file}`);
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');
            
            try {
                await pool.query(sql);
                console.log(`✅ ${file} - Completada\n`);
            } catch (error) {
                console.error(`❌ Error en ${file}:`, error.message);
                // Continuar con la siguiente migración
            }
        }
        
        console.log('✨ Migraciones completadas');
        
        // Verificar estructura de cuentas_corrientes
        console.log('\n📊 Verificando estructura de cuentas_corrientes...');
        const result = await pool.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = 'cuentas_corrientes'
            ORDER BY ordinal_position;
        `);
        
        console.log('Columnas encontradas:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type})`);
        });
        
    } catch (error) {
        console.error('❌ Error general:', error);
    } finally {
        await pool.end();
    }
}

runMigrations();
