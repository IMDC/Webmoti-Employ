import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import app from '../../src'

export function protectedRouteTest(path: string, method: string = 'GET') {
  it(`returns 401 for unauthenticated ${method} to ${path}`, async () => {
    const res = await app.request(path, { method }, env)
    expect(res.status).toBe(401)
  })
}

describe('/sessions route', () => protectedRouteTest('/sessions'))
describe('/sessions/:sessionId route', () => {
  const sessionId = 'abc123'
  protectedRouteTest(`/sessions/${sessionId}`)
})

describe('/profiles route', () => protectedRouteTest('/profiles', 'POST'))

describe('/interviews GET route', () => protectedRouteTest('/interviews'))
describe('/interviews POST route', () => protectedRouteTest('/interviews', 'POST'))

describe('/auth route', () => {
  it('allows unauthenticated access to /auth', async () => {
    const res = await app.request('/auth', {}, env)
    expect(res.status).not.toBe(401)
  })
})
