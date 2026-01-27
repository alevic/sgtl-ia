import { betterAuth } from "better-auth";
import { admin, organization, phoneNumber } from "better-auth/plugins";
import { Pool } from "pg";

// Environment configuration
const getRequiredEnv = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        console.warn(`⚠️  AVISO: Variável de ambiente ${name} não definida.`);
        return '';
    }
    return value;
};

const getArrayEnv = (name: string, fallback: string[]): string[] => {
    const value = process.env[name];
    if (!value) return fallback;
    return value.split(',').map(url => url.trim());
};

// Database pool for Better Auth and queries
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://admin:admin123@localhost:5432/sgtl_db",
});

// Configuration object
export const config = {
    databaseUrl: process.env.DATABASE_URL || "postgresql://admin:admin123@localhost:5432/sgtl_db",
    betterAuthSecret: getRequiredEnv('BETTER_AUTH_SECRET'),
    betterAuthUrl: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    clientUrls: getArrayEnv('CLIENT_URL', ['http://localhost:3000', 'http://localhost:3001']),
    isProduction: process.env.NODE_ENV === 'production',
    whatsapp: {
        apiUrl: process.env.WHATSAPP_API_URL || 'https://evolution-api.a2tec.com.br',
        apiKey: process.env.WHATSAPP_API_KEY || '',
        instanceName: process.env.WHATSAPP_INSTANCE_NAME || 'a2tec',
    }
};

// WhatsApp service placeholder (to be migrated later)
async function sendWhatsAppMessage(phone: string, message: string): Promise<void> {
    // TODO: Migrate WhatsApp service
    console.log(`[WhatsApp] Sending to ${phone}: ${message}`);
}

// Better Auth instance
export const auth = betterAuth({
    database: pool,
    secret: config.betterAuthSecret,
    baseURL: config.betterAuthUrl,
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        async sendResetPassword(data, request) {
            console.log("========================================");
            console.log("🔑 RESET PASSWORD LINK:");
            console.log("   User:", data.user.email);
            console.log("   Link:", data.url);
            console.log("========================================");
        },
    },
    user: {
        additionalFields: {
            username: { type: "string", required: false },
            documento: { type: "string", required: false },
            documento_tipo: { type: "string", required: false },
            phone: { type: "string", required: false },
        },
    },
    advanced: {
        useSecureCookies: config.betterAuthUrl.startsWith('https://'),
        crossOriginCookies: {
            enabled: true,
            origin: config.clientUrls,
        },
    },
    plugins: [
        admin(),
        organization(),
        phoneNumber({
            signUpOnVerification: {
                getTempEmail: (phone) => `${phone.replace(/\D/g, '')}@sgtl-customer.com`,
                getTempName: (phone) => `Cliente ${phone}`
            },
            callbackOnVerification: async (data, request) => {
                console.log(`[AUTH] Telefone verificado com sucesso: ${data.user.phoneNumber}`);
            },
            sendOTP: async (data, request) => {
                const message = `Seu código de acesso para o Portal do Cliente JJê é: ${data.code}`;
                await sendWhatsAppMessage(data.phoneNumber, message);
            },
        })
    ],
    trustedOrigins: config.clientUrls,
});

// Helper to get session from request
export async function getSession(request: Request) {
    return await auth.api.getSession({ headers: request.headers });
}

// Helper to check if user is authenticated
export async function requireAuth(request: Request) {
    const session = await getSession(request);
    if (!session) {
        throw new Response("Não autenticado", { status: 401 });
    }
    return session;
}

// Helper to check if user has required role
export async function requireRole(request: Request, allowedRoles: string[]) {
    const session = await requireAuth(request);
    const userRole = (session.user as any).role || 'user';

    // Check if any of the user's roles match allowed roles
    const userRoles = userRole.split(',').map((r: string) => r.trim());
    const hasPermission = allowedRoles.some(role => userRoles.includes(role));

    if (!hasPermission) {
        throw new Response("Acesso negado", { status: 403 });
    }

    return session;
}
