const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const validateGatewayRequest = require('./middlewares/validateGatewayRequest');
const reservaRoutes = require('./routes/reserva.routes');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8083;
const SERVICE_NAME = process.env.SERVICE_NAME || 'booking-service';
const REGISTRY_SERVER_URL = process.env.REGISTRY_SERVER_URL || 'http://localhost:8761';

function printBanner() {
  console.log('');
  console.log('========================================');
  console.log('        STAY.PE BOOKING SERVICE');
  console.log('========================================');
  console.log(`Puerto: ${PORT}`);
  console.log('Rol: Microservicio de Reservas');
  console.log('Módulos: Solicitudes, Gestión, Vetting, Check-in, Check-out, Extensiones');
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

    console.log('[BOOKING-SERVICE] Registrado correctamente en registry-service');
  } catch (error) {
    console.error('[BOOKING-SERVICE] Error al registrarse:', error.message);
  }
}

app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/reservas/test', (req, res) => {
  res.json({
    message: 'Booking Service funcionando correctamente',
    service: SERVICE_NAME
  });
});

/*
  Desde aquí se bloquea el acceso directo.
  Toda ruta real de reservas debe venir desde el API Gateway.
*/
app.use(validateGatewayRequest);

app.use('/api/reservas', reservaRoutes);

app.listen(PORT, async () => {
  printBanner();
  console.log(`[BOOKING-SERVICE] Ejecutándose en http://localhost:${PORT}`);

  await registerService();
});