import { zValidator } from '@hono/zod-validator';
import { addHours, getUnixTime } from 'date-fns';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { jwt, sign } from 'hono/jwt';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import {
  createTask,
  deleteTask,
  getAllTasksForUser,
  getTask,
  registerUser,
  updateTask,
  validateUserPassword,
} from './db';
import { taskDataSchema, userDataSchema } from './schemas';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined');

const sessionSchema = z.object({
  exp: z.number(),
  id: z.string(),
  username: z.string(),
});

const app = new Hono<{
  Variables: {
    session: z.infer<typeof sessionSchema>;
    task: Awaited<ReturnType<typeof getTask>>;
  };
}>()

  .post('/register', zValidator('json', userDataSchema), async (c) => {
    const { username, password } = c.req.valid('json');
    await registerUser(username, password);
    return c.json({ success: true });
  })

  .post('/login', zValidator('json', userDataSchema), async (c) => {
    const { username, password } = c.req.valid('json');
    const id = await validateUserPassword(username, password);
    const token = await sign(
      {
        id,
        username,
        exp: getUnixTime(addHours(new Date(), 8)),
      } satisfies z.infer<typeof sessionSchema>,
      JWT_SECRET,
    );
    return c.json(token);
  })

  .get('/me', async (c) => {
    const user = await c.get('session');
    return c.json(user);
  })

  .use(
    '*',
    jwt({
      secret: JWT_SECRET,
    }),
    async (c, next) => {
      c.set('session', sessionSchema.parse(c.get('jwtPayload')));
      await next();
    },
  )

  .post('/tasks', zValidator('json', taskDataSchema), async (c) => {
    await createTask(c.get('session').id, c.req.valid('json'));
    return c.json({ success: true });
  })

  .use('/tasks/:id', async (c, next) => {
    const taskId = c.req.param('id');
    const userId = c.get('session').id;
    if (!ObjectId.isValid(taskId)) throw new HTTPException(400, { message: 'Invalid task ID' });
    const task = await getTask(userId, taskId);
    c.set('task', task);
    await next();
  })

  .get('/tasks/:id', (c) => c.json(c.get('task')))
  .get(
    '/tasks',
    zValidator(
      'query',
      z.object({
        page: z.string().regex(/^\d+$/).transform(Number),
        limit: z.string().regex(/^\d+$/).transform(Number),
      }),
    ),
    async (c) => {
      const { page, limit } = c.req.valid('query');
      const tasks = await getAllTasksForUser(c.get('session').id, page, limit);
      return c.json(tasks);
    },
  )

  .put('/tasks/:id', zValidator('json', taskDataSchema.partial()), async (c) => {
    await updateTask(c.get('session').id, c.req.param('id'), c.req.valid('json'));
    return c.json({ success: true });
  })

  .delete('/tasks/:id', async (c) => {
    await deleteTask(c.get('session').id, c.req.param('id'));
    return c.json({ success: true });
  });

export type App = typeof app;
export default app;