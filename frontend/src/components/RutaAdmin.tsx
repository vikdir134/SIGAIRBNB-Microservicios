import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

type RutaAdminProps = {
    children: ReactNode;
};

function RutaAdmin({ children }: RutaAdminProps) {
    const token = localStorage.getItem('token');
    const usuarioGuardado = localStorage.getItem('usuario');

    if (!token || !usuarioGuardado) {
        return <Navigate to="/Login" replace />;
    }

    try {
        const usuario = JSON.parse(usuarioGuardado);

        const roles: string[] = Array.isArray(usuario.roles)
            ? usuario.roles
            : [];

        if (!roles.includes('ADMIN')) {
            if (roles.includes('SECRETARIO')) {
                return (
                    <Navigate
                        to="/GestionSolicitudesReserva"
                        replace
                    />
                );
            }

            return <Navigate to="/" replace />;
        }

        return <>{children}</>;
    } catch (error) {
        console.error(
            'No se pudieron validar los permisos del usuario:',
            error
        );

        return <Navigate to="/Login" replace />;
    }
}

export default RutaAdmin;