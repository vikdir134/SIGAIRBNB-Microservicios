const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const validateGatewayRequest = require('./middlewares/validateGatewayRequest');

const authRoutes = require('./routes/auth.routes');
const perfilRoutes = require('./routes/perfil.routes');
const notificacionRoutes = require('./routes/notificacion.routes');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8081;
const SERVICE_NAME = process.env.SERVICE_NAME || 'auth-service';
const REGISTRY_SERVER_URL = process.env.REGISTRY_SERVER_URL || 'http://localhost:8761';

function printBanner() {
  console.log('');
  console.log('========================================');
  console.log('        STAY.PE AUTH SERVICE');
  console.log('========================================');
  console.log(`Puerto: ${PORT}`);
  console.log('Rol: Microservicio de Autenticación');
  console.log('Módulos: Auth, Perfil, Notificaciones');
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

    console.log('[AUTH-SERVICE] Registrado correctamente en registry-service');
  } catch (error) {
    console.error('[AUTH-SERVICE] Error al registrarse:', error.message);
  }
}

app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/auth/test', (req, res) => {
  res.json({
    message: 'Auth Service funcionando correctamente',
    service: SERVICE_NAME
  });
});

/*
  Desde aquí se bloquea el acceso directo.
  Las rutas reales deben entrar por el API Gateway.
*/
app.use(validateGatewayRequest);

app.use('/api/auth', authRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/notificaciones', notificacionRoutes);

app.listen(PORT, async () => {
  printBanner();
  console.log(`[AUTH-SERVICE] Ejecutándose en http://localhost:${PORT}`);

  await registerService();
});