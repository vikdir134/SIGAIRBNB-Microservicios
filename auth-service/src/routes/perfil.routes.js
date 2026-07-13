const express = require('express');
const router = express.Router();

const validateGatewayRequest = require('../middlewares/validateGatewayRequest');

const {
  obtenerMiPerfil,
  actualizarMiPerfil,
  actualizarMisNotificaciones,
  obtenerResumenUsuarioInterno,
  obtenerEmpresasSecretarioInterno
} = require('../controllers/perfil.controller');

const {
  verificarToken
} = require('../middlewares/auth.middleware');

router.get(
  '/internal/usuarios/:usuario_id/resumen',
  validateGatewayRequest,
  obtenerResumenUsuarioInterno
);

router.get(
  '/internal/usuarios/:usuario_id/empresas-secretario',
  validateGatewayRequest,
  obtenerEmpresasSecretarioInterno
);

// Obtener perfil del usuario autenticado
router.get('/', verificarToken, obtenerMiPerfil);

// Actualizar datos básicos del perfil
router.put('/', verificarToken, actualizarMiPerfil);

// Actualizar configuración de notificaciones
router.put('/notificaciones', verificarToken, actualizarMisNotificaciones);

module.exports = router;