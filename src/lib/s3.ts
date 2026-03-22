import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';

const config: S3ClientConfig = {
  region: 'ap-northeast-2',
  credentials: {
    // 임시 자격 증명 (배포 시에는 IAM Role 등을 활용하거나 별도의 ENV로 교체 필요)
    accessKeyId: 'test',
    secretAccessKey: 'test',
  }
};

// S3_ENDPOINT 환경 변수가 있으면 해당 엔드포인트를 사용 (예: 로컬스택)
// 없으면 AWS 기본 주소(s3.ap-northeast-2.amazonaws.com)를 자동 사용
if (process.env.S3_ENDPOINT) {
  config.endpoint = process.env.S3_ENDPOINT;
  config.forcePathStyle = true; // LocalStack/S3 호환 API를 위해 필수
}

export const s3Client = new S3Client(config);
