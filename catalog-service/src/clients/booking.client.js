const axios = require('axios');

const BOOKING_SERVICE_URL =
  process.env.BOOKING_SERVICE_URL || 'http://booking-service:8083';

const GATEWAY_SECRET = process.env.GATEWAY_SECRET || 'staype-secret';

const listarReservasPorRango = async (
  empresa_id,
  inmueble_id,
  fecha_inicio,
  fecha_fin,
  estados = ['SOLICITADA', 'APROBADA', 'ACTIVA']
) => {
  const response = await axios.get(
    `${BOOKING_SERVICE_URL}/api/reservas/internal/rango`,
    {
      params: {
        inmueble_id,
        fecha_inicio,
        fecha_fin,
        estados: estados.join(',')
      },
      headers: {
        'x-gateway-secret': GATEWAY_SECRET
      },
      timeout: 8000
    }
  );

  return response.data.reservas || [];
};

const tieneReservasConfirmadasPorRango = async (
  inmueble_id,
  fecha_inicio,
  fecha_fin
) => {
  const reservas = await listarReservasPorRango(
    null,
    inmueble_id,
    fecha_inicio,
    fecha_fin,
    ['APROBADA', 'ACTIVA']
  );

  return reservas.length > 0;
};

module.exports = {
  listarReservasPorRango,
  tieneReservasConfirmadasPorRango
};