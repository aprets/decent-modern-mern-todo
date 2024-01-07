import { HTTPException } from 'hono/http-exception';
import type { Db } from 'mongodb';
import { MongoClient, ObjectId } from 'mongodb';
import type { InternalTask, Priority, Status, Task, User } from './types';

async function getDb(): Promise<Db> {
	const uri = process.env.MONGO_CONNECTION_STRING;
	if (!uri) throw new Error('MONGODB_URI is not defined');

	const client = new MongoClient(uri);

	try {
		await client.connect();
		const db = client.db();
		return db;
	} catch (error) {
		throw new Error('Failed to connect to MongoDB');
	}
}

const dbPromise = getDb();
export const usersCollectionPromise = dbPromise.then((db) => db.collection<User>('users'));
export const tasksCollectionPromise = dbPromise.then((db) => db.collection<InternalTask>('tasks'));

export const registerUser = async (username: string, rawPassword: string) => {
	const usersCollection = await usersCollectionPromise;
	const existingUser = await usersCollection.findOne({ username: username }, { projection: { _id: 1 } });
	if (existingUser) {
		throw new HTTPException(400, { message: 'User already exists' });
	}

	const hashedPassword = await Bun.password.hash(rawPassword); 

	await usersCollection.insertOne({ username: username, password: hashedPassword });
};

export const validateUserPassword = async (username: string, rawPassword: string) => {
	const usersCollection = await usersCollectionPromise;
	const user = await usersCollection.findOne({ username: username }, { projection: { _id: 1, password: 1 } });
	if (!user) {
		throw new HTTPException(401, { message: 'Invalid credentials' });
	}

	const passwordMatch = await Bun.password.verify(rawPassword, user.password); 
	if (!passwordMatch) {
		throw new HTTPException(401, { message: 'Invalid credentials' });
	}

	return user._id.toString();

};

export const createTask = async (userId: string, task: Task) => {
	const tasksCollection = await tasksCollectionPromise;
	await tasksCollection.insertOne({ userId: new ObjectId(userId), ...task});
};

export const updateTask = async (userId: string, taskId: string, task: Partial<Task>) => {
	const tasksCollection = await tasksCollectionPromise;
	await tasksCollection.updateOne({ _id: new ObjectId(taskId), userId: new ObjectId(userId) }, { $set: task });
};

export const getTaskByIds = async (userId: string, taskId: string) => {
	const tasksCollection = await tasksCollectionPromise;
	const task = await tasksCollection.findOne({ _id: new ObjectId(taskId), userId: new ObjectId(userId) }, { projection: { _id: 1, text: 1, priority: 1, status: 1 } });
	if (!task) {
		throw new HTTPException(404, { message: 'Task not found' });
	}
	return task;
};

export const getAllTasksForUser = async (userId: string) => {
	const tasksCollection = await tasksCollectionPromise;
	const tasks = await tasksCollection.find({ userId: new ObjectId(userId) }, { projection: { _id: 1, text: 1, priority: 1, status: 1 } }).toArray();
	return tasks;
};
