# 🔒 보안 모범 사례

## MCP 서버 설정 보안 가이드

### ✅ 현재 구조 (권장)

```
프로젝트 구조:
├── .mcp.json                 ← Git에 커밋 (토큰 참조만, 실제 값 없음)
├── .env                      ← Git에서 제외 (실제 토큰 저장)
├── .gitignore               ← .env와 .claude/settings.local.json 포함
└── .claude/
    └── settings.local.json  ← Git에서 제외 (로컬 설정)
```

### 🎯 보안 계층

#### 1. **프로젝트 스코프 MCP 설정** (`.mcp.json`)

**장점**:
- ✅ 팀원과 MCP 서버 구조 공유 가능
- ✅ 프로젝트별로 다른 Supabase 인스턴스 격리
- ✅ Git에 커밋 가능 (실제 토큰은 환경변수 참조)
- ✅ 다른 프로젝트에서 실수로 접근 불가

**내용**:
```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://your-project.supabase.co/mcp",
      "headers": {
        "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}"
      }
    }
  }
}
```

#### 2. **환경변수 관리** (`.env`)

**장점**:
- ✅ 실제 토큰을 코드와 분리
- ✅ `.gitignore`에 포함되어 Git 커밋 방지
- ✅ 개발자마다 다른 토큰 사용 가능
- ✅ CI/CD 환경에서 안전하게 주입 가능

**내용**:
```bash
# .env
SUPABASE_ACCESS_TOKEN="sbp_실제토큰"
GOOGLE_MAPS_API_KEY="실제API키"
```

#### 3. **글로벌 설정 제외**

**`.claude.json` (전역)**에 토큰을 넣지 않는 이유:
- ❌ 모든 프로젝트에서 동일한 토큰 노출
- ❌ 의도하지 않은 프로젝트에서 토큰 사용 가능
- ❌ 보안 범위가 너무 넓음

### 📋 비교표

| 방법 | 보안성 | 공유 가능성 | 격리 수준 | 권장도 |
|------|--------|-------------|-----------|--------|
| 프로젝트 `.mcp.json` + `.env` | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ **강력 권장** |
| 프로젝트 `.claude.json` | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️ 괜찮음 |
| 글로벌 `~/.claude.json` | ⭐⭐ | ❌ | ⭐ | ❌ 비권장 |
| 하드코딩 | ❌ | ❌ | ❌ | 🚫 절대 안됨 |

### 🔐 추가 보안 조치

#### 1. `.gitignore` 검증

다음 파일들이 **반드시** 포함되어야 합니다:

```gitignore
# Environment variables
.env
.env.local
.env*.local

# Claude Code local settings
.claude/settings.local.json

# Sensitive files
*.pem
*.key
```

#### 2. Supabase 토큰 권한 최소화

Personal Access Token 생성 시 필요한 권한만 부여:

**필수 권한**:
- ✅ `read:projects` - 프로젝트 읽기
- ✅ `write:sql` - SQL 쿼리 실행 (migration 적용용)

**불필요한 권한 (제외)**:
- ❌ `admin` - 관리자 권한
- ❌ `delete:projects` - 프로젝트 삭제

#### 3. 토큰 주기적 갱신

- 🔄 **Personal Access Token**: 6개월마다 재발급
- 🔄 **Service Role Key**: 프로덕션 환경에서만 사용, 주기적 검토

#### 4. Git 커밋 전 체크리스트

커밋하기 전 확인:
```bash
# .env 파일이 스테이징되지 않았는지 확인
git status

# .gitignore가 제대로 작동하는지 확인
git check-ignore .env
# 출력: .env (이 출력이 나와야 함)

# 실수로 커밋된 토큰 검색
git log -p | grep -i "supabase_access_token"
```

### 🚨 토큰 유출 시 대응

만약 실수로 토큰을 Git에 커밋했다면:

1. **즉시 토큰 폐기**
   - Supabase Dashboard → Access Tokens → Revoke

2. **Git 히스토리에서 제거**
   ```bash
   # BFG Repo-Cleaner 사용 (권장)
   git filter-repo --replace-text <(echo "노출된토큰==>REDACTED")

   # Force push (주의: 팀원과 협의 후)
   git push --force
   ```

3. **새 토큰 발급 및 재설정**

### 💡 팀 협업 가이드

#### 새 팀원 온보딩

1. `.mcp.json` 파일은 Git에서 자동으로 받음
2. `.env.example` 파일 복사:
   ```bash
   cp .env.example .env
   ```
3. Supabase 관리자에게 Personal Access Token 요청
4. `.env` 파일에 토큰 입력

#### `.env.example` 템플릿

```bash
# .env.example (Git에 커밋)
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL="your-supabase-url"
EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# MCP Server Tokens
SUPABASE_ACCESS_TOKEN="your-personal-access-token"
GOOGLE_MAPS_API_KEY="your-google-maps-key"
```

### 📚 참고 자료

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Claude Code MCP Security](https://code.claude.com/docs/en/mcp#security)

---

**결론**: 현재 프로젝트 `.mcp.json` + `.env` 구조가 **가장 안전**하고 **팀 협업에 최적**입니다.
