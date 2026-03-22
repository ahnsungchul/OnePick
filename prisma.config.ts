import { defineConfig } from '@prisma/config';
import 'dotenv/config';

// 디버깅을 위해 현재 로드된 URL 출력 (보안 주의)
console.log('📡 Attempting to connect to:', process.env.DATABASE_URL);

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
});
