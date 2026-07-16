const sql = require('mssql');

const maxRetries = Number(process.env.DB_WAIT_RETRIES || 60);
const delayMs = Number(process.env.DB_WAIT_DELAY_MS || 5000);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT || 1433),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
  },
  connectionTimeout: 15000,
  requestTimeout: 15000
};

const validarVariables = () => {
  const requeridas = [
    'DB_USER',
    'DB_PASSWORD',
    'DB_SERVER',
    'DB_DATABASE',
    'DB_PORT'
  ];

  const faltantes = requeridas.filter((key) => !process.env[key]);

  if (faltantes.length > 0) {
    console.error('[auth-service] Faltan variables de BD:', faltantes.join(', '));
    process.exit(1);
  }
};

const main = async () => {
  validarVariables();

  console.log('[auth-service] Esperando conexion a la BD en la nube...');
  console.log('[auth-service] Servidor:', process.env.DB_SERVER);
  console.log('[auth-service] Base de datos:', process.env.DB_DATABASE);

  for (let intento = 1; intento <= maxRetries; intento++) {
    let pool;

    try {
      pool = await sql.connect(dbConfig);
      await pool.request().query('SELECT 1 AS ok');

      console.log('[auth-service] Conexion a BD en la nube establecida correctamente.');
      await pool.close();
      process.exit(0);
    } catch (error) {
      console.error(`[auth-service] Intento ${intento}/${maxRetries} fallido: ${error.message}`);

      if (pool) {
        try {
          await pool.close();
        } catch (_) {}
      }

      if (intento === maxRetries) {
        console.error('[auth-service] No se pudo conectar a la BD en la nube.');
        process.exit(1);
      }

      await sleep(delayMs);
    }
  }
};

main();
