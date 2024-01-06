import { Hono } from 'hono'
import { jwt, sign } from 'hono/jwt'

const app = new Hono()

app.use(
  '/auth/*',
  jwt({
    secret: 'it-is-very-secret',
  })
)

app.get('/auth/page', (c) => {
  const x = c.get('jwtPayload')
  return c.text('You are authorized')
})
export default app
