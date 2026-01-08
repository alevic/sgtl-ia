import { betterAuth } from "better-auth";
import { admin, organization, phoneNumber } from "better-auth/plugins";
import pg from "pg";
import dotenv from "dotenv";
import { sendWhatsAppMessage } from "./services/whatsappService";

dotenv.config();

export const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

export const auth = betterAuth({
    database: pool,
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        async sendResetPassword(data, request) {
            console.log("========================================");
            console.log("RESET PASSWORD LINK:", data.url);
            console.log("========================================");
        },
    },
    user: {
        additionalFields: {
            cpf: {
                type: "string",
                required: false,
            },
            phone: {
                type: "string",
                required: false,
            },
        },
    },
    advanced: {
        useSecureCookies: false, // Force false for localhost
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
    trustedOrigins: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : ["http://localhost:3000", "http://localhost:8080"],
});
