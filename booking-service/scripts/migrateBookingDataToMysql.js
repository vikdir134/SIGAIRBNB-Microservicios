const path = require('path');
const dotenv = require('dotenv');
const sql = require('mssql');
const mysql = require('mysql2/promise');

dotenv.config({
  path: path.join(__dirname, '..', '.env')
});

const sourceConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT || 1433),
  options: {
    encrypt: String(process.env.DB_ENCRYPT).toLowerCase() === 'true',
    trustServerCertificate:
      String(process.env.DB_TRUST_SERVER_CERTIFICATE).toLowerCase() === 'true'
  }
};

const targetConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3307),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'staype_booking_db',
  multipleStatements: true
};

const tables = [
  {
    source: '[booking].[Reserva]',
    target: 'reserva',
    orderBy: 'reserva_id'
  },
  {
    source: '[booking].[ReservaEvento]',
    target: 'reserva_evento',
    orderBy: 'reserva_evento_id'
  },
  {
    source: '[booking].[EvaluacionInquilino]',
    target: 'evaluacion_inquilino',
    orderBy: 'evaluacion_inquilino_id'
  },
  {
    source: '[booking].[SolicitudExtension]',
    target: 'solicitud_extension',
    orderBy: 'solicitud_extension_id'
  }
];

async function getMySqlColumns(connection, tableName) {
  const [rows] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\`;`);
  return rows.map((row) => row.Field);
}

function buildInsertQuery(tableName, columns) {
  const columnList = columns.map((col) => `\`${col}\``).join(', ');
  const placeholders = columns.map(() => '?').join(', ');

  return `
    INSERT INTO \`${tableName}\` (${columnList})
    VALUES (${placeholders});
  `;
}

async function clearTargetTables(connection) {
  console.log('Limpiando tablas destino en MySQL...');

  await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

  for (const table of [...tables].reverse()) {
    await connection.query(`TRUNCATE TABLE \`${table.target}\`;`);
    console.log(`Tabla limpiada: ${table.target}`);
  }

  await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
}

async function migrateTable(sqlPool, mysqlConnection, table) {
  console.log(`\nMigrando ${table.source} → ${table.target}`);

  const columns = await getMySqlColumns(mysqlConnection, table.target);
  const sourceColumns = columns.map((col) => `[${col}]`).join(', ');

  const query = `
    SELECT ${sourceColumns}
    FROM ${table.source}
    ORDER BY [${table.orderBy}] ASC;
  `;

  const result = await sqlPool.request().query(query);
  const rows = result.recordset;

  console.log(`Registros encontrados: ${rows.length}`);

  if (rows.length === 0) {
    console.log(`Sin registros para migrar en ${table.target}`);
    return;
  }

  const insertQuery = buildInsertQuery(table.target, columns);

  for (const row of rows) {
    const values = columns.map((col) => row[col] ?? null);
    await mysqlConnection.execute(insertQuery, values);
  }

  console.log(`Migración completada: ${table.target}`);
}

async function main() {
  let sqlPool;
  let mysqlConnection;

  try {
    console.log('Conectando a Azure SQL origen...');
    sqlPool = await sql.connect(sourceConfig);

    console.log('Conectando a MySQL destino...');
    mysqlConnection = await mysql.createConnection(targetConfig);

    await clearTargetTables(mysqlConnection);

    for (const table of tables) {
      await migrateTable(sqlPool, mysqlConnection, table);
    }

    console.log('\nMigración de booking completada correctamente.');
  } catch (error) {
    console.error('\nError durante la migración:', error);
    process.exitCode = 1;
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
    }

    if (sqlPool) {
      await sqlPool.close();
    }
  }
}

main();