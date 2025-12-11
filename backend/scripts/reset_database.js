// Script para resetear completamente la base de datos
const pool = require('../db');
const fs = require('fs');
const path = require('path');

async function resetDatabase() {
    try {
        console.log('🗑️  Eliminando todas las tablas...\n');
        
        // Eliminar tablas en orden inverso por dependencias
        const dropTables = `
            DROP TABLE IF EXISTS solicitudes_productos CASCADE;
            DROP TABLE IF EXISTS magys_historial CASCADE;
            DROP TABLE IF EXISTS magys_reglas CASCADE;
            DROP TABLE IF EXISTS transacciones CASCADE;
            DROP TABLE IF EXISTS mensajes CASCADE;
            DROP TABLE IF EXISTS password_reset_tokens CASCADE;
            DROP TABLE IF EXISTS auth_logs CASCADE;
            DROP TABLE IF EXISTS refresh_tokens CASCADE;
            DROP TABLE IF EXISTS cuentas_corrientes CASCADE;
            DROP TABLE IF EXISTS magys CASCADE;
            DROP TABLE IF EXISTS usuarios CASCADE;
            DROP TABLE IF EXISTS juegos_historial CASCADE;
            DROP TABLE IF EXISTS premios_canjeados CASCADE;
            DROP TABLE IF EXISTS premios_catalogo CASCADE;
            DROP TABLE IF EXISTS tickets CASCADE;
        `;
        
        await pool.query(dropTables);
        console.log('✅ Tablas eliminadas\n');
        
        // Aplicar schema.sql
        console.log('📄 Aplicando schema.sql...');
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schemaSql);
        console.log('✅ Schema base creado\n');
        
        // Aplicar migraciones
        console.log('📄 Aplicando migraciones...\n');
        const migrationsDir = path.join(__dirname, '../../database/migrations');
        const files = fs.readdirSync(migrationsDir).sort();
        
        for (const file of files) {
            if (!file.endsWith('.sql')) continue;
            
            console.log(`  📋 Ejecutando: ${file}`);
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');
            
            try {
                await pool.query(sql);
                console.log(`  ✅ ${file} completada`);
            } catch (error) {
                console.error(`  ❌ Error en ${file}:`, error.message);
            }
        }
        
        console.log('\n✨ Base de datos reseteada completamente\n');
        
        // Verificar tablas creadas
        console.log('📊 Verificando tablas creadas:');
        const tablesResult = await pool.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename;
        `);
        
        tablesResult.rows.forEach(row => {
            console.log(`  ✓ ${row.tablename}`);
        });
        
        console.log('\n📋 Estructura de cuentas_corrientes:');
        const columnsResult = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'cuentas_corrientes'
            ORDER BY ordinal_position;
        `);
        
        columnsResult.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

resetDatabase();
