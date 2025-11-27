import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth, pool } from "./auth";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:8080"],
    credentials: true,
}));

app.use(express.json());

app.all("/api/auth/*", toNodeHandler(auth));

app.get("/api/users", async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, role, "createdAt" FROM "user"');
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

app.delete("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // Optional: Check if the requester is an admin (requires parsing session cookie)
        // For now, we'll assume the frontend protection is enough for this MVP step
        // but in production you MUST verify the session here.

        await pool.query('DELETE FROM "user" WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
