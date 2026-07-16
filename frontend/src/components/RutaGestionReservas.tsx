import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

type RutaGestionReservasProps = {
    children: ReactNode;
};

function RutaGestionReservas({
    children
}: RutaGestionReservasProps) {
    const token = localStorage.getItem('token');
    const usuarioGuardado = localStorage.getItem('usuario');

    if (!token || !usuarioGuardado) {
        return <Navigate to="/Login" replace />;
    }

    try {
        const usuario = JSON.parse(usuarioGuardado);

        const roles: string[] = Array.isArray(usuario.roles)
            ? usuario.roles.map((rol: unknown) =>
                String(rol).toUpperCase()
            )
            : [];

        const tienePermiso =
            roles.includes('ADMIN') ||
            roles.includes('SECRETARIO');

        if (!tienePermiso) {
            return <Navigate to="/" replace />;
        }

        return <>{children}</>;
    } catch (error) {
        console.error(
            'No se pudieron validar los permisos para gestionar reservas:',
            error
        );

        return <Navigate to="/Login" replace />;
    }
}

export default RutaGestionReservas;