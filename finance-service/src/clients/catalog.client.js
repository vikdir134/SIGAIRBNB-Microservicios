const axios = require('axios');

const CATALOG_SERVICE_URL =
  process.env.CATALOG_SERVICE_URL || 'http://catalog-service:8082';

const GATEWAY_SECRET = process.env.GATEWAY_SECRET || 'staype-secret';

const listarInmueblesConRentaCatalog = async (empresa_id) => {
  const response = await axios.get(
    `${CATALOG_SERVICE_URL}/api/publicaciones/internal/empresas/${empresa_id}/inmuebles-renta`,
    {
      headers: { 'x-gateway-secret': GATEWAY_SECRET },
      timeout: 10000
    }
  );

  return response.data.inmuebles || [];
};

const obtenerInmuebleConRentaCatalog = async (empresa_id, inmueble_id) => {
  const response = await axios.get(
    `${CATALOG_SERVICE_URL}/api/publicaciones/internal/empresas/${empresa_id}/inmuebles/${inmueble_id}/renta`,
    {
      headers: { 'x-gateway-secret': GATEWAY_SECRET },
      timeout: 10000
    }
  );

  return response.data.inmueble || null;
};

const actualizarRentaInmuebleCatalog = async (inmueble_id, nueva_renta) => {
  const response = await axios.patch(
    `${CATALOG_SERVICE_URL}/api/publicaciones/internal/inmuebles/${inmueble_id}/renta`,
    { nueva_renta },
    {
      headers: { 'x-gateway-secret': GATEWAY_SECRET },
      timeout: 10000
    }
  );

  return response.data.inmueble || null;
};

module.exports = {
  listarInmueblesConRentaCatalog,
  obtenerInmuebleConRentaCatalog,
  actualizarRentaInmuebleCatalog
};