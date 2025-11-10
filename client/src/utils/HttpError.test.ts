import { describe, expect, it } from 'vitest'
import { HttpError, isHttpError } from './HttpError'

describe('httpError', () => {
  it('should create HttpError with message and status', () => {
    const error = new HttpError('Not Found', 404)

    expect(error).toBeInstanceOf(HttpError)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Not Found')
    expect(error.status).toBe(404)
    expect(error.name).toBe('HttpError')
    expect(error.details).toBeUndefined()
  })

  it('should create HttpError with details', () => {
    const details = { code: 'ERR_404', description: 'Resource not found' }
    const error = new HttpError('Not Found', 404, details)

    expect(error.message).toBe('Not Found')
    expect(error.status).toBe(404)
    expect(error.details).toEqual(details)
  })

  it('should create HttpError with string details', () => {
    const error = new HttpError('Server Error', 500, 'Internal server error occurred')

    expect(error.status).toBe(500)
    expect(error.details).toBe('Internal server error occurred')
  })

  describe('isHttpError', () => {
    it('should return true for HttpError instance', () => {
      const error = new HttpError('Error', 500)
      expect(isHttpError(error)).toBe(true)
    })

    it('should return false for regular Error', () => {
      const error = new Error('Regular error')
      expect(isHttpError(error)).toBe(false)
    })

    it('should return false for non-error objects', () => {
      expect(isHttpError({})).toBe(false)
      expect(isHttpError(null)).toBe(false)
      expect(isHttpError(undefined)).toBe(false)
      expect(isHttpError('string')).toBe(false)
      expect(isHttpError(123)).toBe(false)
    })
  })
})
