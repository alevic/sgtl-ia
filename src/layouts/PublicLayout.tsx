import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Bus, MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react';
import { publicService } from '../services/publicService';
import { authClient } from '../lib/auth-client';

export const PublicLayout: React.FC = () => {
    const location = useLocation();
    const [settings, setSettings] = React.useState<any>(null);
    const { data: session } = authClient.useSession();

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await publicService.getSettings('');
                setSettings(data);
            } catch (error) {
                console.error('Error fetching portal settings:', error);
            }
        };
        fetchSettings();
    }, [location.pathname]);

    const handleLogout = async () => {
        await authClient.signOut();
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
            {/* Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link to="/viagens" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <Bus size={24} className="text-white" />
                            </div>
                            <div>
                                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {settings?.portal_logo_text || 'SGTL Viagens'}
                                </span>
                                <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
                                    {settings?.portal_header_slogan || 'Sua viagem começa aqui'}
                                </p>
                            </div>
                        </Link>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            {session ? (
                                <div className="flex items-center gap-4">
                                    <Link
                                        to="/cliente/dashboard"
                                        className="text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        Olá, {session.user.name.split(' ')[0]}
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider"
                                    >
                                        Sair
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/cliente/login"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm transition-colors"
                                >
                                    Entrar
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-8 mt-12">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* About */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <Bus size={18} className="text-white" />
                                </div>
                                <span className="font-bold text-lg">{settings?.portal_logo_text || 'SGTL Viagens'}</span>
                            </div>
                            <p className="text-slate-400 text-sm">
                                {settings?.portal_footer_description || 'Viagens rodoviárias com conforto e segurança para você e sua família.'}
                            </p>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="font-semibold mb-4">Contato</h3>
                            <div className="space-y-2 text-sm text-slate-400">
                                <div className="flex items-center gap-2">
                                    <Phone size={14} />
                                    <span>{settings?.portal_contact_phone || '(11) 99999-9999'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail size={14} />
                                    <span>{settings?.portal_contact_email || 'contato@sgtlviagens.com.br'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} />
                                    <span>{settings?.portal_contact_address || 'São Paulo, SP'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Social */}
                        <div>
                            <h3 className="font-semibold mb-4">Redes Sociais</h3>
                            <div className="flex gap-3">
                                {settings?.portal_social_instagram && (
                                    <a href={`https://instagram.com/${settings.portal_social_instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors">
                                        <Instagram size={20} />
                                    </a>
                                )}
                                {settings?.portal_social_facebook && (
                                    <a href={`https://facebook.com/${settings.portal_social_facebook}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors">
                                        <Facebook size={20} />
                                    </a>
                                )}
                                {!settings?.portal_social_instagram && !settings?.portal_social_facebook && (
                                    <>
                                        <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors">
                                            <Instagram size={20} />
                                        </a>
                                        <a href="#" className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors">
                                            <Facebook size={20} />
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 mt-8 pt-6 text-center text-sm text-slate-500">
                        {settings?.portal_copyright || `© ${new Date().getFullYear()} SGTL Viagens. Todos os direitos reservados.`}
                    </div>
                </div>
            </footer>
        </div>
    );
};
