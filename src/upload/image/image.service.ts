import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import sharp from 'sharp';

const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'images');

export const processAndSaveImage = async (file: Express.Multer.File) => {
  const fileName = `${crypto.randomUUID()}.webp`;
  const filePath = path.join(uploadPath, fileName);
  const imageUrl = `/uploads/images/${fileName}`;

  try {
    // Ensure Directory Exists
    await fs.mkdir(uploadPath, { recursive: true });

    const info = await sharp(file.buffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filePath);

    return {
      fileName,
      imageUrl,
      size: info.size,
      width: info.width,
      height: info.height,
      mimetype: 'image/webp',
    };
  } catch (error) {
    console.error('Image Upload Failed', error);
    throw error;
  }
};
