import { Router } from "express";
import { pool } from "../auth.js";
import { authorize } from "../middleware.js";

export const locationsRouter = Router();

// GET /states - List all states
locationsRouter.get("/states", authorize(), async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM states ORDER BY name ASC");
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching states:", error);
        res.status(500).json({ error: "Failed to fetch states" });
    }
});

// GET /cities/:stateId - List cities by state
locationsRouter.get("/cities/:stateId", authorize(), async (req, res) => {
    try {
        const { stateId } = req.params;
        const result = await pool.query(
            "SELECT * FROM cities WHERE state_id = $1 ORDER BY name ASC",
            [stateId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching cities:", error);
        res.status(500).json({ error: "Failed to fetch cities" });
    }
});

// GET /neighborhoods/:cityId - List neighborhoods by city
locationsRouter.get("/neighborhoods/:cityId", authorize(), async (req, res) => {
    try {
        const { cityId } = req.params;
        const result = await pool.query(
            "SELECT * FROM neighborhoods WHERE city_id = $1 ORDER BY name ASC",
            [cityId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching neighborhoods:", error);
        res.status(500).json({ error: "Failed to fetch neighborhoods" });
    }
});

// POST /cities - Create new city
locationsRouter.post("/cities", authorize(), async (req, res) => {
    try {
        const { name, stateId } = req.body;

        if (!name || !stateId) {
            return res.status(400).json({ error: "Name and State ID are required" });
        }

        const result = await pool.query(
            "INSERT INTO cities (name, state_id) VALUES ($1, $2) RETURNING *",
            [name, stateId]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating city:", error);
        if ((error as any).code === '23505') {
            return res.status(409).json({ error: "City already exists in this state" });
        }
        res.status(500).json({ error: "Failed to create city" });
    }
});

// POST /neighborhoods - Create new neighborhood
locationsRouter.post("/neighborhoods", authorize(), async (req, res) => {
    try {
        const { name, cityId } = req.body;

        if (!name || !cityId) {
            return res.status(400).json({ error: "Name and City ID are required" });
        }

        const result = await pool.query(
            "INSERT INTO neighborhoods (name, city_id) VALUES ($1, $2) RETURNING *",
            [name, cityId]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating neighborhood:", error);
        // Handle unique constraint violation
        if ((error as any).code === '23505') {
            return res.status(409).json({ error: "Neighborhood already exists in this city" });
        }
        res.status(500).json({ error: "Failed to create neighborhood" });
    }
});

// PUT /cities/:id - Update city
locationsRouter.put("/cities/:id", authorize(), async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Name is required" });
        }

        const result = await pool.query(
            "UPDATE cities SET name = $1 WHERE id = $2 RETURNING *",
            [name, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "City not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating city:", error);
        if ((error as any).code === '23505') {
            return res.status(409).json({ error: "City name already exists in this state" });
        }
        res.status(500).json({ error: "Failed to update city" });
    }
});

// DELETE /cities/:id - Delete city
locationsRouter.delete("/cities/:id", authorize(), async (req, res) => {
    try {
        const { id } = req.params;

        // Check for dependencies (neighborhoods)
        const check = await pool.query("SELECT count(*) FROM neighborhoods WHERE city_id = $1", [id]);
        if (parseInt(check.rows[0].count) > 0) {
            return res.status(400).json({ error: "Cannot delete city with registered neighborhoods" });
        }

        const result = await pool.query("DELETE FROM cities WHERE id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "City not found" });
        }

        res.json({ message: "City deleted successfully" });
    } catch (error) {
        console.error("Error deleting city:", error);
        res.status(500).json({ error: "Failed to delete city" });
    }
});

// PUT /neighborhoods/:id - Update neighborhood
locationsRouter.put("/neighborhoods/:id", authorize(), async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Name is required" });
        }

        const result = await pool.query(
            "UPDATE neighborhoods SET name = $1 WHERE id = $2 RETURNING *",
            [name, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Neighborhood not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating neighborhood:", error);
        if ((error as any).code === '23505') {
            return res.status(409).json({ error: "Neighborhood name already exists in this city" });
        }
        res.status(500).json({ error: "Failed to update neighborhood" });
    }
});

// DELETE /neighborhoods/:id - Delete neighborhood
locationsRouter.delete("/neighborhoods/:id", authorize(), async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query("DELETE FROM neighborhoods WHERE id = $1 RETURNING *", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Neighborhood not found" });
        }

        res.json({ message: "Neighborhood deleted successfully" });
    } catch (error) {
        console.error("Error deleting neighborhood:", error);
        res.status(500).json({ error: "Failed to delete neighborhood" });
    }
});
