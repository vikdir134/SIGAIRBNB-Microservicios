const normalizarRoles = (roles = []) => {
  if (!Array.isArray(roles)) {
    return [];
  }

  return roles
    .map((rol) => {
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
    })
    .filter(Boolean);
};

const obtenerRolesUsuario = (req) => {
  const usuario = req.usuario || req.user || {};

  const rolesDesdeArray = normalizarRoles(usuario.roles);

  if (rolesDesdeArray.length > 0) {
    return rolesDesdeArray;
  }

  if (usuario.rol) {
    return [String(usuario.rol).toUpperCase()];
  }

  if (usuario.role) {
    return [String(usuario.role).toUpperCase()];
  }

  return [];
};

const permitirRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    try {
      if (!req.usuario && !req.user) {
        return res.status(401).json({
          mensaje: 'Usuario no autenticado.'
        });
      }

      const rolesUsuario = obtenerRolesUsuario(req);

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

      return next();
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