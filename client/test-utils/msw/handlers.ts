import { http, HttpResponse } from 'msw'

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5173/api'

/** Default MSW handlers — return empty/success for all known endpoints. */
export const handlers = [
  // GET /interviews
  http.get(`${API_BASE}/interviews`, () => {
    return HttpResponse.json({ interviews: [] })
  }),

  // POST /interviews
  http.post(`${API_BASE}/interviews`, () => {
    return HttpResponse.json(
      { sessionId: '550e8400-e29b-41d4-a716-446655440000' },
      { status: 201 },
    )
  }),

  // DELETE /interviews/:id
  http.delete(`${API_BASE}/interviews/:id`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // POST /profiles
  http.post(`${API_BASE}/profiles`, () => {
    return HttpResponse.json({})
  }),

  // GET /sessions (instant meeting)
  http.get(`${API_BASE}/sessions`, () => {
    return HttpResponse.json({
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      token: 'mock-zoom-jwt',
    })
  }),

  // GET /sessions/:sessionId (join)
  http.get(`${API_BASE}/sessions/:sessionId`, () => {
    return HttpResponse.json({ token: 'mock-zoom-jwt' })
  }),

  // POST /speechmatics/token
  http.post(`${API_BASE}/speechmatics/token`, () => {
    return HttpResponse.json({ key: 'mock-speechmatics-jwt' })
  }),
]
