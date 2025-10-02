import type { AppContext } from '../..'
import { Hono } from 'hono'

const wsRoute = new Hono<AppContext>()

export default wsRoute
