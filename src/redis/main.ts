import { redisDatabase } from './client.js';
import { Request, Response } from 'express';

// async function init(){
//     const user = await redisDatabase.get('user:1')
//     console.log(user);

// }

export const getUserController = async (req: Request, res: Response) => {
  const { id } = req.params;

  const userName = await redisDatabase.get(`user:${id}`);

  return res
    .status(200)
    .json({ message: 'The name of the user is ', data: userName, success: true });
};
