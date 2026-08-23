import request from 'supertest';

import { createFullAccount } from './account.js';
import { app } from '../../src/app.js';
import { Media } from '../../src/database/media-upload.model.js';
import { User } from '../../src/database/user.model.js';
import { hashPassword } from '../../src/libs/utils/password-hash.js';

export const PASSWORD = 'Password123!';

let seq = 0;

// Plain user without an Account profile (marking flows must 400 on these)
export async function mkUserOnly(role = 'user') {
  seq += 1;
  const img = await Media.create({ alt: `img-${seq}`, src: `/uploads/${seq}.webp` });
  return User.create({
    name: `Plain ${seq}`,
    email: `plain-${seq}-${Date.now()}@test.dev`,
    password: await hashPassword(PASSWORD),
    role,
    emailVerified: true,
    isActive: true,
    isBanned: false,
    image: img._id,
  });
}

export interface Ctx {
  email: string;
  password: string;
  cookie: string;
  userId: string;
}

const login = async (email: string, password: string) =>
  request(app).post('/api/auth/login').send({ email, password });

export const cookieOf = (res: request.Response) =>
  (res.headers['set-cookie'] as string[]).map((c) => c.split(';')[0]).join('; ');

// Full account chain + logged-in cookie
export async function mkPerson(role = 'user'): Promise<Ctx> {
  seq += 1;
  const email = `${role}-${seq}-${Date.now()}@test.dev`;
  const { user } = await createFullAccount({ name: `${role} ${seq}`, role, email });
  const res = await login(email, PASSWORD);
  expect(res.status).toBe(200);
  return { email, password: PASSWORD, cookie: cookieOf(res), userId: String(user._id) };
}
