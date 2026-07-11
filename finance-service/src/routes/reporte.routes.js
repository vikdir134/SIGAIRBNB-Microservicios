const express = require('express');

const {
  obtenerReporteFinancieroMensual,
  obtenerDetalleMovimientosMensuales,
  obtenerDashboardKpis,
  obtenerReportePagosDeudores
} = require('../controllers/reporte.controller');

const {
  verificarToken,
  autorizarRoles
} = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * HU21 - Reporte financiero mensual
 */
router.get(
  '/financiero-mensual',
  verificarToken,
  autorizarRoles('SECRETARIO', 'ADMIN', 'ADMIN_EMPRESA'),
  obtenerReporteFinancieroMensual
);

/**
 * HU21 - Detalle de movimientos mensuales
 */
router.get(
  '/financiero-mensual/detalle',
  verificarToken,
  autorizarRoles('SECRETARIO', 'ADMIN', 'ADMIN_EMPRESA'),
  obtenerDetalleMovimientosMensuales
);

/**
 * HU22 - Dashboard de KPIs
 * Muestra indicadores de rentabilidad y ocupación.
 */
router.get(
  '/dashboard-kpis',
  verificarToken,
  autorizarRoles('SECRETARIO', 'ADMIN', 'ADMIN_EMPRESA'),
  obtenerDashboardKpis
);

/**
 * HU23 - Reporte de Pagos y Deudores
 * Lista a los inquilinos que han pagado o mantienen deuda en un periodo.
 */
router.get(
  '/pagos-deudores',
  verificarToken,
  autorizarRoles('SECRETARIO', 'ADMIN', 'ADMIN_EMPRESA'),
  obtenerReportePagosDeudores
);

module.exports = router;