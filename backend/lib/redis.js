import Redis from "ioredis"
import dotenv from 'dotenv';

dotenv.config();

export const redis = new Redis(process.env.REDIS_URL);

//? redis is key-value store database

await redis.set('foo', 'bar'); //* set a key-value pair