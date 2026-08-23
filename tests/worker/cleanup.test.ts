import { vi, describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs/promises';
import { cleanupTempFiles } from '../../src/worker/cleanup.js';

vi.mock('fs/promises');
vi.mock('../../src/libs/logger/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

describe('cleanupTempFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes files older than 24 hours', async () => {
    const mockFiles = ['old.txt', 'new.txt'];
    vi.mocked(fs.stat).mockImplementation((filePath: any) => {
      if (String(filePath).endsWith('old.txt')) {
        return Promise.resolve({
          isFile: () => true,
          mtimeMs: Date.now() - 25 * 60 * 60 * 1000,
        } as any);
      }
      if (String(filePath).endsWith('new.txt')) {
        return Promise.resolve({
          isFile: () => true,
          mtimeMs: Date.now() - 1 * 60 * 60 * 1000,
        } as any);
      }
      return Promise.resolve({ isFile: () => true } as any);
    });

    vi.mocked(fs.readdir).mockResolvedValue(mockFiles as any);
    vi.mocked(fs.unlink).mockResolvedValue(undefined);

    await cleanupTempFiles();

    expect(fs.unlink).toHaveBeenCalledTimes(1);
    expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('old.txt'));
    expect(fs.unlink).not.toHaveBeenCalledWith(expect.stringContaining('new.txt'));
  });
});
