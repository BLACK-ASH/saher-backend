import { Router, Request, Response } from 'express';
import { getUserController } from './main.js';

export const redisRouter = Router();
redisRouter.get('/', async (req: Request, res: Response) => {
  return res.json({ message: 'sdjkfvn' });
});
redisRouter.get('/:id', getUserController);
