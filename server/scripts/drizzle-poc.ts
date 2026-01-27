import { db } from "../src/db/drizzle.js";
import { user } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

async function main() {
    console.log("🚀 Running Drizzle PoC...");

    try {
        // Fetch all users
        console.log("\n--- Fetching all users ---");
        const allUsers = await db.select().from(user);
        console.log(`Found ${allUsers.length} users.`);
        allUsers.forEach(u => {
            console.log(`- [${u.id}] ${u.name} (@${u.username}) | Role: ${u.role}`);
        });

        // Fetch a specific user (alevic)
        console.log("\n--- Fetching user 'alevic' ---");
        const alevic = await db.query.user.findFirst({
            where: eq(user.username, 'alevic')
        });

        if (alevic) {
            console.log("User 'alevic' found:");
            console.log(JSON.stringify(alevic, null, 2));
        } else {
            console.log("User 'alevic' not found.");
        }

        console.log("\n✅ Drizzle PoC completed successfully!");
    } catch (error) {
        console.error("\n❌ Drizzle PoC failed:");
        console.error(error);
        process.exit(1);
    } finally {
        // No need to close pool here as it's managed externally or we can just let process exit
        process.exit(0);
    }
}

main();
