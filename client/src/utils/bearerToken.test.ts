import { DateTime } from 'luxon'
import {
  getLocalBearerToken,
  removeLocalBearerToken,
  setLocalBearerToken,
} from './utils'

const LOCAL_BEARER_TOKEN_KEY = 'bearer_token'
const LOCAL_BEARER_TOKEN_EXPIRY_KEY = 'bearer_token_expiry'

beforeEach(() => {
  localStorage.clear()
})

describe('bearer token management', () => {
  it('setLocalBearerToken stores token and expiry', () => {
    setLocalBearerToken('my-token')

    expect(localStorage.getItem(LOCAL_BEARER_TOKEN_KEY)).toBe(encodeURIComponent('my-token'))
    expect(localStorage.getItem(LOCAL_BEARER_TOKEN_EXPIRY_KEY)).toBeTruthy()
  })

  it('getLocalBearerToken returns token when valid', () => {
    setLocalBearerToken('valid-token')

    expect(getLocalBearerToken()).toBe(encodeURIComponent('valid-token'))
  })

  it('getLocalBearerToken returns null when no token stored', () => {
    expect(getLocalBearerToken()).toBeNull()
  })

  it('getLocalBearerToken returns null and clears when token is expired', () => {
    localStorage.setItem(LOCAL_BEARER_TOKEN_KEY, 'expired-token')
    localStorage.setItem(
      LOCAL_BEARER_TOKEN_EXPIRY_KEY,
      DateTime.now().minus({ days: 1 }).toISO(),
    )

    expect(getLocalBearerToken()).toBeNull()
    expect(localStorage.getItem(LOCAL_BEARER_TOKEN_KEY)).toBeNull()
  })

  it('removeLocalBearerToken clears both token and expiry', () => {
    setLocalBearerToken('some-token')

    removeLocalBearerToken()

    expect(localStorage.getItem(LOCAL_BEARER_TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(LOCAL_BEARER_TOKEN_EXPIRY_KEY)).toBeNull()
  })
})
