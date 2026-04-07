import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateUploadUrl } from "../services/s3Service";

export const uploadRouter = Router();

const CONTEXT_FOLDERS: Record<string, string> = {
  evidence: "evidence",
  message: "messages",
  profile: "profiles",
};

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
]);

uploadRouter.post("/upload-url", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { fileType, context } = req.body as {
      fileType?: string;
      context?: string;
    };

    if (!fileType || !context) {
      return res
        .status(400)
        .json({ message: "fileType and context are required" });
    }

    if (!ALLOWED_TYPES.has(fileType)) {
      return res
        .status(400)
        .json({
          message: "File type not allowed. Use JPEG, PNG, WebP, or MP4",
        });
    }

    const folder = CONTEXT_FOLDERS[context];
    if (!folder) {
      return res
        .status(400)
        .json({ message: "context must be evidence, message, or profile" });
    }

    const { uploadUrl, fileUrl } = await generateUploadUrl(
      userId,
      fileType,
      folder,
    );

    return res.json({ uploadUrl, fileUrl });
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: err.message ?? "Failed to generate upload URL" });
  }
});
