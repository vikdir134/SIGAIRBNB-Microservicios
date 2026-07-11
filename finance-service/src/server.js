const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const validateGatewayRequest = require('./middlewares/validateGatewayRequest');

const conceptoCobroRoutes = require('./routes/conceptoCobro.routes');
const reciboRoutes = require('./routes/recibo.routes');
const pagoRoutes = require('./routes/pago.routes');
const mantenimientoRoutes = require('./routes/mantenimiento.routes');
const ingresoAlquilerRoutes = require('./routes/ingresoAlquiler.routes');
const tarifaRoutes = require('./routes/tarifa.routes');
const reporteRoutes = require('./routes/reporte.routes');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8084;
const SERVICE_NAME = process.env.SERVICE_NAME || 'finance-service';
const REGISTRY_SERVER_URL =
  process.env.REGISTRY_SERVER_URL || 'http://localhost:8761';

function printBanner() {
  console.log('');
  console.log('========================================');
  console.log('        STAY.PE FINANCE SERVICE');
  console.log('========================================');
  console.log(`Puerto: ${PORT}`);
  console.log('Rol: Microservicio Financiero');
  console.log('Módulos: Conceptos, Recibos, Pagos, Mantenimiento, Ingresos, Tarifas, Reportes');
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

    console.log('[FINANCE-SERVICE] Registrado correctamente en registry-service');
  } catch (error) {
    console.error('[FINANCE-SERVICE] Error al registrarse:', error.message);
  }
}

app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/recibos/test', (req, res) => {
  res.json({
    message: 'Finance Service funcionando correctamente',
    service: SERVICE_NAME
  });
});

app.use(validateGatewayRequest);

app.use('/api/conceptos-cobro', conceptoCobroRoutes);
app.use('/api/recibos', reciboRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/mantenimiento', mantenimientoRoutes);
app.use('/api/ingresos-alquiler', ingresoAlquilerRoutes);
app.use('/api/tarifas', tarifaRoutes);
app.use('/api/reportes', reporteRoutes);

app.listen(PORT, async () => {
  printBanner();
  console.log(`[FINANCE-SERVICE] Ejecutándose en http://localhost:${PORT}`);
  await registerService();
});