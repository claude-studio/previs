// 문서 id는 임의 문자열(%, /, 유니코드 허용)이라 URL param 왕복이 안전하지 않다.
// base64url로 불투명 키를 만들어 라우트에 쓰고, 조회는 키끼리 비교한다(디코딩 불필요).
export function documentRouteKey(documentId: string): string {
  const bytes = new TextEncoder().encode(documentId);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
