import { betterAuth } from "better-auth";
import { admin, organization, phoneNumber } from "better-auth/plugins";
import { sendWhatsAppMessage } from "./services/whatsappService.js";
import { config, pool } from "./config.js";

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
            console.log("🔑 RESET PASSWORD LINK:");
            console.log("   User:", data.user.email);
            console.log("   Link:", data.url);
            console.log("========================================");
            console.log("⚠️  IMPORTANTE: Configure um serviço de email (SMTP, SendGrid, etc.) para enviar este link automaticamente.");
            console.log("   Por enquanto, copie o link acima e envie manualmente para o usuário.");
            // TODO: Implementar envio de email via WhatsApp ou SMTP
            // await sendWhatsAppMessage(data.user.phone, `Link para redefinir sua senha: ${data.url}`);
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
