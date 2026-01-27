import "dotenv/config";
import { initCronJobs } from "./app/services/cron.server";

console.log("🚀 Starting SGTL Cron Worker...");

// Handle Process Signals for graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down cron worker...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down cron worker...');
    process.exit(0);
});

// Initialize Jobs
try {
    initCronJobs();
    console.log("✅ Cron Worker is running.");
} catch (error) {
    console.error("❌ Failed to initialize Cron Jobs:", error);
    process.exit(1);
}

// Keep process alive
setInterval(() => {
    // Heartbeat
}, 60000);
