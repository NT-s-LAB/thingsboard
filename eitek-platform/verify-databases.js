#!/usr/bin/env node
// Database verification script
// File: verify-databases.js
// Usage: node verify-databases.js

const { Client } = require('pg');

async function verifyDatabases() {
  console.log('🔍 Verifying database setup...\n');

  // ThingsBoard Database
  const tbClient = new Client({
    host: 'localhost',
    port: 5432,
    database: 'thingsboard',
    user: 'postgres',
    password: '01041998@',
  });

  // EITEK Platform Database  
  const eitekClient = new Client({
    host: 'localhost',
    port: 5432,
    database: 'eitek_platform',
    user: 'postgres',
    password: '01041998@',
  });

  try {
    // Check ThingsBoard database
    console.log('📊 Checking ThingsBoard database...');
    await tbClient.connect();
    
    const tbTables = await tbClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`✓ ThingsBoard: ${tbTables.rows.length} tables found`);
    console.log('  Sample tables:', tbTables.rows.slice(0, 5).map(r => r.table_name).join(', '));
    
    await tbClient.end();

    // Check EITEK Platform database
    console.log('\n📊 Checking EITEK Platform database...');
    await eitekClient.connect();
    
    const eitekTables = await eitekClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`✓ EITEK Platform: ${eitekTables.rows.length} tables found`);
    console.log('  Tables:', eitekTables.rows.map(r => r.table_name).join(', '));

    // Check for specific EITEK tables
    const expectedTables = [
      'tenants', 'users', 'roles', 'user_roles',
      'projects', 'sites', 'areas', 'device_types', 'devices',
      'scada_views', 'scada_widgets', 'widgets', 'symbols'
    ];

    const existingTables = eitekTables.rows.map(r => r.table_name);
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));

    if (missingTables.length === 0) {
      console.log('✅ All expected tables are present');
    } else {
      console.log('⚠️  Missing tables:', missingTables.join(', '));
    }

    // Check sample data
    const userCount = await eitekClient.query('SELECT COUNT(*) FROM users');
    const roleCount = await eitekClient.query('SELECT COUNT(*) FROM roles');
    const tenantCount = await eitekClient.query('SELECT COUNT(*) FROM tenants');

    console.log('\n📈 Sample data:');
    console.log(`  • Users: ${userCount.rows[0].count}`);
    console.log(`  • Roles: ${roleCount.rows[0].count}`);
    console.log(`  • Tenants: ${tenantCount.rows[0].count}`);

    await eitekClient.end();

    console.log('\n🎉 Database verification completed successfully!');
    console.log('\n🔗 Connection strings:');
    console.log('  ThingsBoard:', 'postgresql://postgres:01041998@@localhost:5432/thingsboard');
    console.log('  EITEK Platform:', 'postgresql://postgres:01041998@@localhost:5432/eitek_platform');

  } catch (error) {
    console.error('❌ Error verifying databases:', error.message);
    process.exit(1);
  }
}

verifyDatabases();