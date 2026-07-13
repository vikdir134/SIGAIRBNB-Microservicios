const axios = require('axios');

const CATALOG_SERVICE_URL =
  process.env.CATALOG_SERVICE_URL || 'http://catalog-service:8082';

const GATEWAY_SECRET = process.env.GATEWAY_SECRET || 'staype-secret';

const obtenerPublicacionPorInmueble = async (inmueble_id) => {
  try {
    const response = await axios.get(
      `${CATALOG_SERVICE_URL}/api/publicaciones/internal/inmuebles/${inmueble_id}`,
      {
        headers: {
          'x-gateway-secret': GATEWAY_SECRET
        },
        timeout: 8000
      }
    );

    return response.data.publicacion || null;

  } catch (error) {
    console.error(
      `Error obteniendo publicación del inmueble ${inmueble_id}:`,
      error.message
    );

    return null;
  }
};

const obtenerPublicacionReservablePorId = async (publicacion_id) => {
  try {
    const response = await axios.get(
      `${CATALOG_SERVICE_URL}/api/publicaciones/internal/${publicacion_id}/reservable`,
      {
        headers: { 'x-gateway-secret': GATEWAY_SECRET },
        timeout: 8000
      }
    );

    return response.data.publicacion || null;
  } catch (error) {
    console.error(
      `Error obteniendo publicación reservable ${publicacion_id}:`,
      error.message
    );
    return null;
  }
};

module.exports = {
  obtenerPublicacionPorInmueble,
  obtenerPublicacionReservablePorId
};