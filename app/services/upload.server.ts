import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public/uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

export async function processAvatar(arrayBuffer: ArrayBuffer, userId: string): Promise<string> {
    const filename = `${userId}.jpg`;
    const filepath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(arrayBuffer);

    try {
        await sharp(buffer)
            .resize(400, 400, {
                fit: 'cover',
                position: 'center',
            })
            .jpeg({ quality: 90 })
            .toFile(filepath);

        return `/uploads/avatars/${filename}`;
    } catch (error) {
        console.error("Error processing avatar:", error);
        throw new Error("Failed to process image");
    }
}
