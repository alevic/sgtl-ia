import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { authClient } from '../../lib/auth-client';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { data: session, isPending } = authClient.useSession();
    const location = useLocation();

    if (isPending) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if accessing admin routes
    const isAdminRoute = location.pathname.startsWith('/admin');
    const userRole = session.user.role || 'user';

    console.log('🔒 ProtectedRoute Debug:', {
        pathname: location.pathname,
        isAdminRoute,
        userRole,
        sessionUser: session.user
    });

    // For admin routes, only allow admin, operacional, and financeiro roles
    if (isAdminRoute) {
        const allowedAdminRoles = ['admin', 'operacional', 'financeiro'];

        if (!allowedAdminRoles.includes(userRole)) {
            console.log('❌ Access DENIED - Redirecting to /cliente/dashboard');
            // Redirect public portal users to their dashboard
            return <Navigate to="/cliente/dashboard" replace />;
        }
        console.log('✅ Access GRANTED to admin route');
    }

    // Check specific route permissions if allowedRoles is provided
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Redirect to dashboard if user doesn't have permission
        // Or to a 403 page
        return <Navigate to="/admin/dashboard" replace />;
    }

    return <>{children}</>;
};
