import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { Sidebar } from '@/components/Layout/Sidebar';
import { Header } from '@/components/Layout/Header';
import { Footer } from '@/components/Layout/Footer';
import { AppProvider } from '@/context/AppContext';
import { authClient } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';

export default function AdminLayout() {
    const { data: session, isPending } = authClient.useSession();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isPending && !session) {
            navigate("/login");
        }
    }, [session, isPending, navigate]);

    if (isPending) {
        return (
            <div className="flex h-screen bg-background items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <AppProvider>
            <div className="flex h-screen bg-background overflow-hidden transition-colors duration-200">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <Header />
                    <main className="flex-1 overflow-y-auto flex flex-col">
                        <div className="max-w-7xl mx-auto w-full p-6 flex-1">
                            <Outlet />
                        </div>
                        <Footer />
                    </main>
                </div>
            </div>
        </AppProvider>
    );
}
