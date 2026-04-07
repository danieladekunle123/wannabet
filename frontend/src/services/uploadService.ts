const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

export async function uploadFile(
  file: File,
  context: "evidence" | "message" | "profile",
): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("File type not allowed. Use JPEG, PNG, WebP, or MP4");
  }

  const maxSize = file.type.startsWith("video/")
    ? MAX_VIDEO_SIZE
    : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    const limitMB = maxSize / (1024 * 1024);
    throw new Error(
      `File too large. Max ${limitMB}MB for ${file.type.startsWith("video/") ? "videos" : "images"}`,
    );
  }

  const token = localStorage.getItem("token");

  // 1. Get presigned upload URL
  const res = await fetch(`${API_URL}/api/upload-url`, {
    method: "POST",
    body: JSON.stringify({ fileType: file.type, context }),
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to get upload URL");
  }

  const { uploadUrl, fileUrl } = await res.json();

  // 2. Upload file to S3
  const put = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!put.ok) {
    throw new Error("Failed to upload file to S3");
  }

  // 3. Return the public URL
  return fileUrl;
}
