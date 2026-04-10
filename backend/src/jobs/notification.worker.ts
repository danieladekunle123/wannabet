import { Worker } from "bullmq";
import logger from "../lib/logger";
import { getIo } from "../lib/socket";
import { connection } from "./queues";

export interface NotificationJobData {
  userId: string;
  notification: {
    id: string;
    type: string;
    title: string;
    body: string;
    timestamp: string;
    data?: Record<string, unknown>;
  };
}

export function startNotificationWorker() {
  const worker = new Worker<NotificationJobData>(
    "notifications",
    async (job) => {
      const { userId, notification } = job.data;

      logger.info("Notification job started", {
        jobId: job.id,
        userId,
        type: notification.type,
      });

      const io = getIo();
      io.to(`user:${userId}`).emit("notification:new", notification);

      logger.info("Notification delivered", {
        jobId: job.id,
        userId,
        type: notification.type,
      });
    },
    {
      connection,
      concurrency: 5,
    },
  );

  worker.on("failed", (job, err) => {
    logger.error("Notification job failed", {
      jobId: job?.id,
      userId: job?.data?.userId,
      type: job?.data?.notification?.type,
      error: err.message,
      attempt: job?.attemptsMade,
    });
  });

  worker.on("error", (err) => {
    logger.error("Notification worker error", { error: err.message });
  });

  logger.info("Notification worker started");
  return worker;
}
