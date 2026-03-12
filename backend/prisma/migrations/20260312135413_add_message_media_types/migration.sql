-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "messageType" TEXT NOT NULL DEFAULT 'text';
