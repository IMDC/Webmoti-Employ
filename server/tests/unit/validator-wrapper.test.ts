import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { zValidator } from '../../src/utils/validator-wrapper'

describe('zValidator', () => {
  it('should pass validation for valid data', async () => {
    const app = new Hono()
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    })

    app.post('/test', zValidator('json', schema), (c) => {
      const data = c.req.valid('json')
      return c.json({ success: true, data })
    })

    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John', age: 30 }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      success: true,
      data: { name: 'John', age: 30 },
    })
  })

  it('should return 400 for invalid data', async () => {
    const app = new Hono()
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    })

    app.post('/test', zValidator('json', schema), (c) => {
      return c.json({ success: true })
    })

    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John', age: 'invalid' }),
    })

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })

  it('should return formatted error with field issues', async () => {
    const app = new Hono()
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    })

    app.post('/test', zValidator('json', schema), (c) => {
      return c.json({ success: true })
    })

    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid', password: 'short' }),
    })

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toHaveProperty('formErrors')
    expect(body.error).toHaveProperty('fieldErrors')
  })

  it('should validate query parameters', async () => {
    const app = new Hono()
    const schema = z.object({
      page: z.string().regex(/^\d+$/),
    })

    app.get('/test', zValidator('query', schema), (c) => {
      const data = c.req.valid('query')
      return c.json({ success: true, data })
    })

    const res = await app.request('/test?page=1')

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.page).toBe('1')
  })

  it('should return 400 for missing required fields', async () => {
    const app = new Hono()
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    })

    app.post('/test', zValidator('json', schema), (c) => {
      return c.json({ success: true })
    })

    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John' }), // missing age
    })

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })
})
