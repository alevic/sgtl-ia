import multer from 'multer';
import sharp from 'sharp';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for memory storage
const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas'));
        }
    },
});

export async function processAvatar(buffer: Buffer, userId: string): Promise<string> {
    const filename = `${userId}.jpg`;
    const filepath = path.join(uploadsDir, filename);

    await sharp(buffer)
        .resize(400, 400, {
            fit: 'cover',
            position: 'center',
        })
        .jpeg({ quality: 90 })
        .toFile(filepath);

    return `/uploads/avatars/${filename}`;
}
