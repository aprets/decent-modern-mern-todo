import type { ObjectId } from 'mongodb';
import type { z } from 'zod';
import type { prioritySchema, statusSchema, taskDataSchema, userDataSchema } from './schemas';

export type User = z.infer<typeof userDataSchema>;

export type Priority = z.infer<typeof prioritySchema>;
export type Status = z.infer<typeof statusSchema>;

export type Task = z.infer<typeof taskDataSchema>;

export interface InternalTask extends Task {
	userId: ObjectId;
}

