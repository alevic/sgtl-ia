import * as React from "react";
import {
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
} from "react-router";
import type { LinksFunction } from "react-router";

import "./index.css";

export const links: LinksFunction = () => [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
    },
];

export default function App() {
    return (
        <html lang="pt-BR">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
            </head>
            <body className="antialiased">
                <Outlet />
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export function ErrorBoundary({ error }: { error?: Error }) {
    const [showDetails, setShowDetails] = React.useState(false);
    const isDevelopment = process.env.NODE_ENV !== 'production';

    return (
        <html lang="pt-BR">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Erro</title>
                <Links />
            </head>
            <body className="antialiased">
                <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-red-50 to-orange-50">
                    <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Oops! Algo deu errado.</h1>
                                <p className="mt-1 text-gray-600">
                                    Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.
                                </p>
                            </div>
                        </div>

                        {isDevelopment && error && (
                            <div className="border-t pt-6">
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                                >
                                    <svg
                                        className={`w-5 h-5 transition-transform ${showDetails ? 'rotate-90' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <span className="uppercase tracking-wide">Ver Detalhes do Erro (Dev)</span>
                                </button>

                                {showDetails && (
                                    <div className="mt-4 space-y-4">
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <h3 className="text-sm font-bold text-red-900 mb-2">Mensagem de Erro:</h3>
                                            <pre className="text-xs text-red-800 whitespace-pre-wrap font-mono">
                                                {error.message}
                                            </pre>
                                        </div>

                                        {error.stack && (
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                <h3 className="text-sm font-bold text-gray-900 mb-2">Stack Trace:</h3>
                                                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto max-h-96 overflow-y-auto">
                                                    {error.stack}
                                                </pre>
                                            </div>
                                        )}

                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h3 className="text-sm font-bold text-blue-900 mb-2">Informações Adicionais:</h3>
                                            <div className="text-xs text-blue-800 space-y-1">
                                                <p><strong>Tipo:</strong> {error.constructor.name}</p>
                                                <p><strong>Ambiente:</strong> {process.env.NODE_ENV}</p>
                                                <p><strong>Timestamp:</strong> {new Date().toLocaleString('pt-BR')}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                            >
                                Recarregar Página
                            </button>
                            <button
                                onClick={() => window.history.back()}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-colors"
                            >
                                Voltar
                            </button>
                        </div>
                    </div>
                </div>
                <Scripts />
            </body>
        </html>
    );
}
