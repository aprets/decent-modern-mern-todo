import { HTTPException } from 'hono/http-exception';
import { MongoClient, ObjectId } from 'mongodb';
import type { InternalTask, Task, User } from './types';

async function getDb() {
  console.log('Connecting to MongoDB...');
  const uri = process.env.MONGO_CONNECTION_STRING;
  if (!uri) throw new Error('MONGODB_URI is not defined');

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db();
    return db;
  } catch (error) {
    throw new Error('Failed to connect to MongoDB');
  }
}

const db = await getDb();
export const usersCollection = db.collection<User>('users');
await usersCollection.createIndex({ username: 1 }, { unique: true });
export const tasksCollection = db.collection<InternalTask>('tasks');
await tasksCollection.createIndex({ userId: 1, _id: 1 }, { unique: true });

export const registerUser = async (username: string, rawPassword: string) => {
  const existingUser = await usersCollection.findOne({ username: username }, { projection: { _id: 1 } });
  if (existingUser) throw new HTTPException(400, { message: 'User already exists' });

  const hashedPassword = await Bun.password.hash(rawPassword);

  await usersCollection.insertOne({ username: username, password: hashedPassword });
};

export const validateUserPassword = async (username: string, rawPassword: string) => {
  const user = await usersCollection.findOne({ username: username }, { projection: { _id: 1, password: 1 } });
  if (!user) {
    throw new HTTPException(400, { message: 'Invalid credentials' });
  }

  const passwordMatch = await Bun.password.verify(rawPassword, user.password);
  if (!passwordMatch) throw new HTTPException(400, { message: 'Invalid credentials' });

  return user._id.toString();
};

export const createTask = async (userId: string, task: Task) => {
  await tasksCollection.insertOne({ userId: new ObjectId(userId), ...task });
};

export const getTask = async (userId: string, taskId: string) => {
  const task = await tasksCollection.findOne(
    { _id: new ObjectId(taskId), userId: new ObjectId(userId) },
    { projection: { _id: 1, text: 1, priority: 1, status: 1 } },
  );
  if (!task) throw new HTTPException(404, { message: 'Task not found' });

  return task;
};

export const getAllTasksForUser = async (userId: string, page: number = 1, pageSize: number = Infinity) => {
  const skip = (page - 1) * pageSize;
  const tasks = await tasksCollection
    .find({ userId: new ObjectId(userId) }, { projection: { _id: 1, text: 1, priority: 1, status: 1 } })
    .skip(skip)
    .limit(pageSize)
    .toArray();
  return tasks;
};

export const updateTask = async (userId: string, taskId: string, task: Partial<Task>) => {
  await tasksCollection.updateOne({ _id: new ObjectId(taskId), userId: new ObjectId(userId) }, { $set: task });
};

export const deleteTask = async (userId: string, taskId: string) => {
  await tasksCollection.deleteOne({ _id: new ObjectId(taskId), userId: new ObjectId(userId) });
};
