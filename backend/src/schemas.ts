import { z } from 'zod';

export const userDataSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const prioritySchema = z.enum(['low', 'medium', 'high']);
export const statusSchema = z.enum(['todo', 'in-progress', 'done']);

export const taskDataSchema = z.object({
  text: z.string(),
  priority: prioritySchema,
  status: statusSchema,
});
