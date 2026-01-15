import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';

// Carrega o .env da pasta root do servidor ou da raiz do projeto
dotenv.config();

// Helper para validar variáveis obrigatórias
const getRequiredEnv = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        // Em desenvolvimento, avisamos. Em produção, poderíamos lançar erro.
        console.warn(`⚠️  AVISO: Variável de ambiente ${name} não definida.`);
        return '';
    }
    return value;
};

export const pool = new pg.Pool({
    connectionString: getRequiredEnv('DATABASE_URL'),
});

/**
 * Interface para as configurações do sistema
 */
interface Config {
    port: number;
    databaseUrl: string;
    betterAuthSecret: string;
    betterAuthUrl: string;
    clientUrls: string[];
    isProduction: boolean;
    whatsapp: {
        apiUrl: string;
        apiKey: string;
        instanceName: string;
    };
}

// Helper para processar listas de URLs (CORS/Trusted Origins)
const getArrayEnv = (name: string, fallback: string[]): string[] => {
    const value = process.env[name];
    if (!value) return fallback;
    return value.split(',').map(url => url.trim());
};

export const config: Config = {
    port: parseInt(process.env.PORT || '4000', 10),
    databaseUrl: getRequiredEnv('DATABASE_URL'),
    betterAuthSecret: getRequiredEnv('BETTER_AUTH_SECRET'),
    betterAuthUrl: getRequiredEnv('BETTER_AUTH_URL'),
    clientUrls: getArrayEnv('CLIENT_URL', ['http://localhost:3000', 'http://localhost:8080']),
    isProduction: process.env.NODE_ENV === 'production',
    whatsapp: {
        apiUrl: process.env.WHATSAPP_API_URL || 'https://evolution-api.a2tec.com.br',
        apiKey: process.env.WHATSAPP_API_KEY || '',
        instanceName: process.env.WHATSAPP_INSTANCE_NAME || 'a2tec',
    }
};

// Exportar como default também para facilitar
export default config;
