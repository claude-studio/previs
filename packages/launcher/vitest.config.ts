import { defineConfig } from 'vitest/config';

// 런처 테스트는 전용 포트 대역(47738~47801)에 실제 소켓을 bind한다.
// 파일 병렬 실행 시 서로 다른 파일이 같은 대역 포트를 다투므로 직렬 실행한다.
export default defineConfig({
  test: {
    fileParallelism: false,
  },
});
