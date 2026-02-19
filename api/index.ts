import { handle } from '@hono/node-server/vercel'
// @ts-ignore
import app from '../dist/server-internal.js'

export const config = {
    runtime: 'nodejs'
}

export default handle(app)
