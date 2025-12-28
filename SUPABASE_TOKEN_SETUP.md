# Supabase Access Token 설정 가이드

## 🔑 Access Token 발급 방법

Supabase MCP 서버를 사용하려면 Personal Access Token이 필요합니다.

### 방법 1: Personal Access Token 생성 (권장)

1. Supabase Dashboard 로그인: https://supabase.com/dashboard
2. 우측 상단 프로필 아이콘 클릭
3. **Account Settings** 선택
4. 좌측 메뉴에서 **Access Tokens** 선택
5. **Generate New Token** 클릭
6. Token 이름 입력 (예: "Claude Code MCP")
7. 필요한 권한 선택 (최소: `read:projects`, `write:sql`)
8. **Generate Token** 클릭
9. 생성된 토큰 복사 (⚠️ 한 번만 표시됩니다!)

### 방법 2: Service Role Key 사용 (관리자용)

1. Supabase Dashboard → 프로젝트 선택
2. **Settings** → **API**
3. **Project API keys** 섹션에서 `service_role` 키 복사
   - ⚠️ 주의: Service Role Key는 모든 RLS를 우회하므로 신중히 사용

## 📝 Token 설정

### 1. `.env` 파일에 토큰 추가

`.env` 파일을 열어 다음 줄을 수정:

```bash
SUPABASE_ACCESS_TOKEN="your-actual-token-here"
```

실제 발급받은 토큰으로 `your-supabase-access-token-here`를 교체하세요.

### 2. 설정 확인

현재 `.claude.json` 파일에 이미 다음과 같이 설정되어 있습니다:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://nqenvrfatfirzemievwe.supabase.co/mcp",
      "headers": {
        "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}"
      }
    }
  }
}
```

`${SUPABASE_ACCESS_TOKEN}`은 `.env` 파일에서 자동으로 읽어옵니다.

## ✅ 연결 테스트

토큰을 설정한 후 MCP 서버 상태를 확인:

```bash
claude mcp list
```

**supabase** 항목이 ✓ Connected로 표시되어야 합니다.

## 🔧 문제 해결

### "Failed to connect" 오류

1. `.env` 파일에 토큰이 올바르게 설정되었는지 확인
2. 토큰에 따옴표가 포함되어 있는지 확인 (있어야 함)
3. 토큰이 만료되지 않았는지 확인
4. Claude Code 재시작: 세션을 종료하고 다시 시작

### "Unauthorized" 오류

- 토큰 권한 확인: `read:projects`, `write:sql` 권한 필요
- 토큰이 해당 프로젝트에 대한 액세스 권한이 있는지 확인

### 환경 변수가 인식되지 않음

`.env` 파일이 프로젝트 루트 디렉토리(`c:\Texitogether\`)에 있는지 확인

## 📚 참고 링크

- [Supabase Access Tokens 문서](https://supabase.com/docs/guides/platform/access-control)
- [Supabase MCP Server](https://github.com/supabase/mcp-server-supabase)

## 🎯 다음 단계

토큰 설정 완료 후:
1. ✅ Supabase migration 적용 ([MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) 참고)
2. ✅ 데이터베이스 연결 테스트 (`npm run test:db`)
3. ✅ Task 5 시작: 실시간 방 목록 화면 구현
