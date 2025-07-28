import { describe, expect, it } from 'vitest'
import app from '../../src'

describe('/sessions route', () => {
  it('responds with unauthorized when missing clerk token', async () => {
    const res = await app.request('/sessions')
    expect(res.status).toBe(401)
  })
})
