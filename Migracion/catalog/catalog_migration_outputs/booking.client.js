const axios = require('axios');

const BOOKING_SERVICE_URL =
  process.env.BOOKING_SERVICE_URL || 'http://booking-service:8083';

const INTERNAL_SERVICE_SECRET =
  process.env.INTERNAL_SERVICE_SECRET ||
  process.env.GATEWAY_SECRET ||
  'staype-secret';

const internalClient = axios.create({
  baseURL: BOOKING_SERVICE_URL,
  timeout: 8000,
  headers: {
    'x-gateway-secret': INTERNAL_SERVICE_SECRET
  }
});

const existenReservasSolapadas = async ({
  inmueble_id,
  fecha_inicio,
  fecha_fin,
  estados = ['APROBADA', 'ACTIVA']
}) => {
  const response = await internalClient.get('/api/internal/reservas/conflictos', {
    params: {
      inmueble_id,
      fecha_inicio,
      fecha_fin,
      estados: estados.join(',')
    }
  });

  return Boolean(response.data?.hay_conflicto);
};

const listarReservasPorRango = async ({
  empresa_id,
  inmueble_id,
  fecha_inicio,
  fecha_fin,
  estados = ['SOLICITADA', 'APROBADA', 'ACTIVA']
}) => {
  const response = await internalClient.get('/api/internal/reservas/rango', {
    params: {
      empresa_id,
      inmueble_id,
      fecha_inicio,
      fecha_fin,
      estados: estados.join(',')
    }
  });

  return response.data?.data || [];
};

module.exports = {
  existenReservasSolapadas,
  listarReservasPorRango
};
