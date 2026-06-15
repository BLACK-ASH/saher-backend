import fs from 'fs/promises';
import path from 'path';

import type { Request, Response } from 'express';

import { ApiError } from '../../libs/class/api-error.js';

const REPORT_DIR = path.join(process.cwd(), 'public', 'temp');

export const downloadReportController = async (req: Request, res: Response) => {
  const fileName = req.params.fileName as string;

  const safeFileName = path.basename(fileName);

  const filePath = path.join(REPORT_DIR, safeFileName);

  const stats = await fs.stat(filePath);

  if (!stats.isFile()) {
    throw new ApiError(404, 'Report not found.');
  }

  return res.download(filePath, safeFileName);
};
