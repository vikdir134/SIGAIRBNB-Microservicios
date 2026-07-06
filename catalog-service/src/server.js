const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const validateGatewayRequest = require('./middlewares/validateGatewayRequest');

const edificioRoutes = require('./routes/edificio.routes');
const publicacionRoutes = require('./routes/publicacion.routes');
const disponibilidadRoutes = require('./routes/disponibilidad.routes');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8082;
const SERVICE_NAME = process.env.SERVICE_NAME || 'catalog-service';
const REGISTRY_SERVER_URL = process.env.REGISTRY_SERVER_URL || 'http://localhost:8761';

function printBanner() {
  console.log('');
  console.log('========================================');
  console.log('        STAY.PE CATALOG SERVICE');
  console.log('========================================');
  console.log(`Puerto: ${PORT}`);
  console.log('Rol: Microservicio de negocio - Catálogo');
  console.log('Módulos: Edificios, Publicaciones, Disponibilidad');
  console.log('========================================');
  console.log('');
}

async function registerService() {
  try {
    await axios.post(`${REGISTRY_SERVER_URL}/register`, {
      name: SERVICE_NAME,
      host: SERVICE_NAME,
      port: Number(PORT),
      healthUrl: `http://${SERVICE_NAME}:${PORT}/health`
    });

    console.log('[CATALOG-SERVICE] Registrado correctamente en registry-service');
  } catch (error) {
    console.error('[CATALOG-SERVICE] Error al registrarse:', error.message);
  }
}

app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/catalog/test', (req, res) => {
  res.json({
    message: 'Catalog Service funcionando correctamente',
    service: SERVICE_NAME
  });
});

/*
  Desde aquí se bloquea el acceso directo.
  Toda ruta real de negocio debe venir desde el API Gateway.
*/
app.use(validateGatewayRequest);

app.use('/api/edificios', edificioRoutes);
app.use('/api/publicaciones', publicacionRoutes);
app.use('/api/disponibilidad', disponibilidadRoutes);

app.listen(PORT, async () => {
  printBanner();
  console.log(`[CATALOG-SERVICE] Ejecutándose en http://localhost:${PORT}`);

  await registerService();
});