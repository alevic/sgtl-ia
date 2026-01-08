import express from "express";
import { auth } from "./auth";

export const authorize = (allowedRoles: string[] = []) => {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
            if (!session) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            // Check if user has active organization
            if (!session.session.activeOrganizationId) {
                return res.status(401).json({ error: "Unauthorized: No active organization" });
            }

            const userRole = (session.user as any).role || 'user'; // Default to 'user' if undefined

            if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
                return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
            }

            // Attach session to request for use in handlers
            (req as any).session = session;
            next();
        } catch (error) {
            console.error("Auth middleware error:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    };
};

export const clientAuthorize = () => {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
            if (!session) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            // For clients, we DON'T check for activeOrganizationId because they can span multiple orgs
            (req as any).session = session;
            next();
        } catch (error) {
            console.error("Client auth middleware error:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    };
};
