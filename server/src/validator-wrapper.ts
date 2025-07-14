import type { ValidationTargets } from 'hono'
import type { ZodType } from 'zod'
import { zValidator as zv } from '@hono/zod-validator'
import { z } from 'zod'

export function zValidator<T extends ZodType, Target extends keyof ValidationTargets>(target: Target, schema: T) {
  return zv(target, schema, (result, c) => {
    if (!result.success) {
      return c.json({ error: z.flattenError(result.error) }, 400)
    }
  })
}
