const { getConnection, sql } = require('../config/db');

const obtenerRolesUsuarioBD = async (usuario_id) => {
  const pool = await getConnection();

  const result = await pool.request()
    .input('usuario_id', sql.Int, usuario_id)
    .query(`
      SELECT r.nombre
      FROM auth.UsuarioRol ur
      INNER JOIN auth.Rol r
        ON r.rol_id = ur.rol_id
      WHERE ur.usuario_id = @usuario_id
        AND r.activo = 1;
    `);

  return result.recordset.map((rol) => rol.nombre);
};

const normalizarRoles = (roles = []) => {
  if (!Array.isArray(roles)) {
    return [];
  }

  return roles.map((rol) => {
    if (typeof rol === 'string') {
      return rol.toUpperCase();
    }

    return String(
      rol?.nombre ||
      rol?.nombre_rol ||
      rol?.codigo ||
      rol?.codigo_rol ||
      ''
    ).toUpperCase();
  }).filter(Boolean);
};

const permitirRoles = (...rolesPermitidos) => {
  return async (req, res, next) => {
    try {
      if (!req.usuario) {
        return res.status(401).json({
          mensaje: 'Usuario no autenticado.'
        });
      }

      const usuario_id = req.usuario.usuario_id || req.usuario.id;

      if (!usuario_id) {
        return res.status(401).json({
          mensaje: 'Token inválido: no se encontró el usuario.'
        });
      }

      let rolesUsuario = normalizarRoles(req.usuario.roles);

      if (rolesUsuario.length === 0) {
        const rolesBD = await obtenerRolesUsuarioBD(usuario_id);
        rolesUsuario = normalizarRoles(rolesBD);
      }

      const rolesPermitidosNormalizados = rolesPermitidos.map((rol) =>
        String(rol).toUpperCase()
      );

      const tienePermiso = rolesUsuario.some((rol) =>
        rolesPermitidosNormalizados.includes(rol)
      );

      if (!tienePermiso) {
        return res.status(403).json({
          mensaje: 'No tienes permisos para realizar esta acción.',
          roles_detectados: rolesUsuario
        });
      }

      next();
    } catch (error) {
      console.error('Error al validar roles:', error);

      return res.status(500).json({
        mensaje: 'Error interno al validar permisos.'
      });
    }
  };
};

module.exports = {
  permitirRoles
};