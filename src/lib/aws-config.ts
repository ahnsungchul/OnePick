import { S3Client } from "@aws-sdk/client-s3";

// LocalStack S3 설정
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test", // LocalStack 기본 더미값
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
  },
  // LocalStack 엔드포인트 고정
  endpoint: process.env.AWS_S3_ENDPOINT || "http://localhost:4566",
  // S3 버킷 이름이 호스트명이 되지 않도록 강제 (LocalStack 등에서 필수)
  forcePathStyle: true,
});
