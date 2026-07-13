const axios = require('axios');

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || 'http://auth-service:8081';

const GATEWAY_SECRET = process.env.GATEWAY_SECRET || 'staype-secret';

const obtenerResumenUsuario = async (usuario_id) => {
  try {
    const response = await axios.get(
      `${AUTH_SERVICE_URL}/api/perfil/internal/usuarios/${usuario_id}/resumen`,
      {
        headers: {
          'x-gateway-secret': GATEWAY_SECRET
        },
        timeout: 8000
      }
    );

    return response.data.usuario || null;

  } catch (error) {
    console.error(
      `Error obteniendo resumen del usuario ${usuario_id}:`,
      error.message
    );

    return null;
  }
};

const obtenerEmpresasSecretarioUsuario = async (usuario_id) => {
  try {
    const response = await axios.get(
      `${AUTH_SERVICE_URL}/api/perfil/internal/usuarios/${usuario_id}/empresas-secretario`,
      {
        headers: {
          'x-gateway-secret': GATEWAY_SECRET
        },
        timeout: 8000
      }
    );

    return response.data.empresas || [];

  } catch (error) {
    console.error(
      `Error obteniendo empresas del secretario ${usuario_id}:`,
      error.message
    );

    return [];
  }
};

module.exports = {
  obtenerResumenUsuario,
  obtenerEmpresasSecretarioUsuario
};