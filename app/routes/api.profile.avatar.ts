import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireAuth, pool } from "@/lib/auth.server";
import { processAvatar } from "@/services/upload.server";

// POST /api/profile/avatar
export async function action({ request }: ActionFunctionArgs) {
    const session = await requireAuth(request);

    if (request.method !== "POST") {
        return data({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("avatar") as File;

        if (!file || file.size === 0) {
            return data({ error: "No image provided" }, { status: 400 });
        }

        if (!file.type.startsWith("image/")) {
            return data({ error: "Only images are allowed" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const imageUrl = await processAvatar(arrayBuffer, session.user.id);

        await pool.query(
            'UPDATE "user" SET image = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2',
            [imageUrl, session.user.id]
        );

        return data({ success: true, imageUrl });

    } catch (error) {
        console.error("Avatar upload error:", error);
        return data({ error: "Failed to upload avatar" }, { status: 500 });
    }
}
