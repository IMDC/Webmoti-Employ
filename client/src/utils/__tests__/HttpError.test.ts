import { describe, expect, it } from 'vitest'
import { HttpError, isHttpError } from '../HttpError'

describe('HttpError', () => {
  it('should create an HttpError with message and status', () => {
    const error = new HttpError('Not found', 404)

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(HttpError)
    expect(error.message).toBe('Not found')
    expect(error.status).toBe(404)
    expect(error.name).toBe('HttpError')
    expect(error.details).toBeUndefined()
  })

  it('should create an HttpError with details', () => {
    const details = { field: 'email', reason: 'invalid format' }
    const error = new HttpError('Validation failed', 400, details)

    expect(error.message).toBe('Validation failed')
    expect(error.status).toBe(400)
    expect(error.details).toEqual(details)
  })

  it('should create an HttpError with string details', () => {
    const error = new HttpError('Server error', 500, 'Internal server issue')

    expect(error.message).toBe('Server error')
    expect(error.status).toBe(500)
    expect(error.details).toBe('Internal server issue')
  })

  describe('isHttpError', () => {
    it('should return true for HttpError instances', () => {
      const error = new HttpError('Error', 500)
      expect(isHttpError(error)).toBe(true)
    })

    it('should return false for regular Error instances', () => {
      const error = new Error('Regular error')
      expect(isHttpError(error)).toBe(false)
    })

    it('should return false for non-error objects', () => {
      expect(isHttpError({ message: 'Not an error' })).toBe(false)
      expect(isHttpError(null)).toBe(false)
      expect(isHttpError(undefined)).toBe(false)
      expect(isHttpError('string')).toBe(false)
      expect(isHttpError(123)).toBe(false)
    })
  })
})
