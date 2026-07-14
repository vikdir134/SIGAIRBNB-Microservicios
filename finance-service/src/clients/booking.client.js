const axios = require('axios');

const BOOKING_SERVICE_URL =
  process.env.BOOKING_SERVICE_URL || 'http://booking-service:8083';

const GATEWAY_SECRET = process.env.GATEWAY_SECRET || 'staype-secret';

const obtenerReservaFinance = async (reserva_id) => {
  try {
    const response = await axios.get(
      `${BOOKING_SERVICE_URL}/api/reservas/internal/${reserva_id}/finance`,
      {
        headers: { 'x-gateway-secret': GATEWAY_SECRET },
        timeout: 10000
      }
    );

    return response.data.reserva || null;
  } catch (error) {
    console.error(
      `Error obteniendo reserva ${reserva_id} desde booking-service:`,
      error.message
    );

    return null;
  }
};

module.exports = {
  obtenerReservaFinance
};