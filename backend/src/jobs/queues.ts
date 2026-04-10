import { Queue, ConnectionOptions } from "bullmq";

const connection: ConnectionOptions = {
  host: new URL(process.env.REDIS_URL || "redis://localhost:6379").hostname,
  port: Number(
    new URL(process.env.REDIS_URL || "redis://localhost:6379").port || 6379,
  ),
  password:
    new URL(process.env.REDIS_URL || "redis://localhost:6379").password ||
    undefined,
};

export { connection };

export const disputeQueue = new Queue("dispute-processing", { connection });
export const notificationQueue = new Queue("notifications", { connection });
