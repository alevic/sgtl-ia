import { betterAuth } from "better-auth";
import { admin, organization, phoneNumber } from "better-auth/plugins";
import { sendWhatsAppMessage } from "./services/whatsappService";
import { config, pool } from "./config";

export { pool };

export const auth = betterAuth({
    database: pool,
    secret: config.betterAuthSecret,
    baseURL: config.betterAuthUrl,
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
    trustedOrigins: config.clientUrls,
});
