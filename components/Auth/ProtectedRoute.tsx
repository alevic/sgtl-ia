import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authClient } from '../../lib/auth-client';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

    return <>{children}</>;
};
