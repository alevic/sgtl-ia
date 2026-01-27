import dotenv from 'dotenv';
import pg from 'pg';
import { z } from 'zod';

// Load .env
dotenv.config();

/**
 * Environment Variables Schema
 */
const envSchema = z.object({
    PORT: z.string().default('4000').transform(Number),
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
    BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
    BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
    CLIENT_URL: z.string().default('http://localhost:3000,http://localhost:8080')
        .transform(val => val.split(',').map(url => url.trim())),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    WHATSAPP_API_URL: z.string().url().default('https://evolution-api.a2tec.com.br'),
    WHATSAPP_API_KEY: z.string().default(''),
    WHATSAPP_INSTANCE_NAME: z.string().default('a2tec'),
});

// Validate process.env
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error('❌ Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
    process.exit(1);
}

const env = parsedEnv.data;

export const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
});

/**
 * Interface and Config Object
 */
export interface Config {
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

export const config: Config = {
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    betterAuthSecret: env.BETTER_AUTH_SECRET,
    betterAuthUrl: env.BETTER_AUTH_URL,
    clientUrls: env.CLIENT_URL,
    isProduction: env.NODE_ENV === 'production',
    whatsapp: {
        apiUrl: env.WHATSAPP_API_URL,
        apiKey: env.WHATSAPP_API_KEY,
        instanceName: env.WHATSAPP_INSTANCE_NAME,
    }
};

// Log configuration summary
console.log('🔧 Server Configuration Loaded Successfully');
if (!config.isProduction) {
    console.log('   CLIENT_URL:', config.clientUrls);
    console.log('   BETTER_AUTH_URL:', config.betterAuthUrl);
}

export default config;
