const { S3Client, PutBucketPolicyCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const policy = {
  Version: "2012-10-17",
  Statement: [
    {
      Sid: "PublicRead",
      Effect: "Allow",
      Principal: "*",
      Action: ["s3:GetObject"],
      Resource: [`arn:aws:s3:::${process.env.AWS_BUCKET_NAME}/*`],
    },
  ],
};

(async () => {
  await s3.send(
    new PutBucketPolicyCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Policy: JSON.stringify(policy),
    }),
  );
  console.log("Bucket policy applied successfully.");
})();
