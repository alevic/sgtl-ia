import { betterAuth } from "better-auth";
import { admin, organization } from "better-auth/plugins";
import pg from "pg";
import dotenv from "dotenv";

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
    advanced: {
        useSecureCookies: false, // Force false for localhost
    },
    plugins: [
        admin(),
        organization()
    ],
    trustedOrigins: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : ["http://localhost:3000", "http://localhost:8080"],
});
