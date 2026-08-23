import { vi } from 'vitest';

// Stateful in-memory redis — sessions, sets and one-time tokens behave like the
// real thing so login/refresh/logout/token-confirm flows are exercised end to end.
// ponytail: no TTL expiry — add lazy expiry sweep if a test ever needs TTL semantics.

export const kv = new Map<string, string>();
export const sets = new Map<string, Set<string>>();

export const fakeRedis = {
  isOpen: true,
  connect: vi.fn(async () => {}),
  quit: vi.fn(async () => {}),
  on: vi.fn(),
  get: vi.fn(async (k: string) => kv.get(k) ?? null),
  set: vi.fn(async (k: string, v: string, _opts?: unknown) => {
    kv.set(k, v);
    return 'OK';
  }),
  del: vi.fn(async (...args: unknown[]) => {
    let n = 0;
    for (const k of args.flat()) {
      if (kv.delete(k as string)) n++;
      sets.delete(k as string);
    }
    return n;
  }),
  sAdd: vi.fn(async (k: string, ...members: string[]) => {
    const s = sets.get(k) ?? new Set<string>();
    members.forEach((m) => s.add(m));
    sets.set(k, s);
    return s.size;
  }),
  sRem: vi.fn(async (k: string, ...members: string[]) => {
    const s = sets.get(k);
    if (!s) return 0;
    let n = 0;
    members.forEach((m) => s.delete(m) && n++);
    if (s.size === 0) sets.delete(k);
    return n;
  }),
  sMembers: vi.fn(async (k: string) => [...(sets.get(k) ?? [])]),
  multi: vi.fn(() => {
    const ops: Array<() => Promise<unknown>> = [];
    const pipeline = {
      del: (k: string) => {
        ops.push(() => fakeRedis.del(k));
        return pipeline;
      },
      exec: async () => {
        for (const op of ops) await op();
        return [];
      },
    };
    return pipeline;
  }),
};

export const redisState = { kv, sets };
