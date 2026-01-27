import { auth, pool } from "../src/auth.js";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    try {
        console.log("Creating admin user...");
        
        // Attempt to create user using Better Auth API
        // Note: The API signature might vary based on version, trying standard signUpEmail
        const res = await auth.api.signUpEmail({
            body: {
                email: "admin@sgtl.com",
                password: "password123",
                name: "Admin User"
            }
        });

        console.log("User created successfully.");
        
        // Promote to admin
        console.log("Promoting to admin...");
        await pool.query("UPDATE \"user\" SET role = 'admin' WHERE email = 'admin@sgtl.com'");
        console.log("User promoted to admin.");

    } catch (error) {
        console.error("Error creating user:", error);
        // If it fails because user exists, we still try to promote
        if (JSON.stringify(error).includes("exists")) {
             console.log("User might already exist, trying to promote...");
             await pool.query("UPDATE \"user\" SET role = 'admin' WHERE email = 'admin@sgtl.com'");
        }
    } finally {
        await pool.end();
    }
}

main();
