import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const CDN_URL = process.env.CDN_URL;
const BUCKET = process.env.AWS_BUCKET_NAME!;
const REGION = process.env.AWS_REGION!;

function buildFileUrl(key: string): string {
  if (CDN_URL) return `${CDN_URL.replace(/\/+$/, "")}/${key}`;
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

export function buildS3Key(
  folder: string,
  userId: string,
  fileType: string,
): string {
  const ext = fileType.split("/")[1] || "bin";
  return `${folder}/${userId}/${Date.now()}.${ext}`;
}

export async function generateUploadUrl(
  userId: string,
  fileType: string,
  folder: string,
) {
  const key = buildS3Key(folder, userId, fileType);

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: fileType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 60 });

  return {
    uploadUrl: url,
    fileUrl: buildFileUrl(key),
  };
}

export async function uploadBufferToS3(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return buildFileUrl(key);
}
