import { zValidator as zv } from '@hono/zod-validator';
import type { ValidationTargets } from 'hono';
import { z, ZodType } from 'zod/v4';

export const zValidator = <T extends ZodType, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T
) =>
  zv(target, schema, (result, c) => {
    if (!result.success) {
      return c.json({ error: z.flattenError(result.error) }, 400);
    }
  });
