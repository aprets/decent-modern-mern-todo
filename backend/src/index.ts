import { zValidator } from '@hono/zod-validator';
import { addHours, getUnixTime } from 'date-fns';
import { Hono } from 'hono';
import { jwt, sign } from 'hono/jwt';
import { z } from 'zod';
import { createTask, getAllTasksForUser, getTaskByIds, registerUser, updateTask, validateUserPassword } from './db';
import { taskDataSchema, userDataSchema } from './schemas';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined');

const sessionSchema = z.object({
  exp: z.number(),
  id: z.string(),
});

const app = new Hono<{
  Variables: {
    session: z.infer<typeof sessionSchema>;
    task: Awaited<ReturnType<typeof getTaskByIds>>;
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
        exp: getUnixTime(addHours(new Date(), 8)),
      },
      JWT_SECRET,
    );
    return c.json(token);
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

  .use('/tasks/:id', async (c, next) => {
    const taskId = c.req.param('id');
    const userId = c.get('session').id;
    const task = await getTaskByIds(userId, taskId);
    c.set('task', task);
    await next();
  })

  .post('/tasks', zValidator('json', taskDataSchema), async (c) => {
    await createTask(c.get('session').id, c.req.valid('json'));
    return c.json({ success: true });
  })
  .put('/tasks/:id', zValidator('json', taskDataSchema.partial()), async (c) => {
    await updateTask(c.get('session').id, c.req.param('id'), c.req.valid('json'));
    return c.json({ success: true });
  })
  .get('/tasks/:id', (c) => c.json(c.get('task')))
  .get('/tasks', async (c) => c.json(await getAllTasksForUser(c.get('session').id)));

export default app;
