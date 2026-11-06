# 대한바른자세걷기협회 홈페이지

기획안을 바탕으로 제작한 27개 HTML 페이지와 Cloudflare 문의 접수 서버입니다. 현재는 로컬 미리보기 버전이며 외부에 배포하지 않았습니다.

## 지금 보기

Node.js 22 이상에서 이 폴더를 열고 실행합니다. 추가 패키지 설치 없이 미리보기를 실행할 수 있습니다.

```powershell
node scripts/build.mjs
node scripts/serve.mjs
```

브라우저에서 `http://127.0.0.1:4173`을 엽니다. 종료는 터미널에서 Ctrl+C입니다.

미리보기는 개인정보를 저장하지 않습니다. 문의 양식에 입력하고 보내기를 누르면 Cloudflare 미연결 안내가 나옵니다. 서버 저장에 성공하지 않았는데 접수 완료라고 표시하지 않습니다.

## 구성

- `site.config.json`: 협회명, 전화, 이메일, 운영 도메인과 검색 등록 인증값
- `content.mjs`: 프로그램 5개, 활동 사례 7개, 교육 정보 3개와 FAQ
- `scripts/build.mjs`: 본문과 구조화 데이터를 포함한 HTML 생성
- `assets/styles.css`, `assets/app.js`: 반응형 디자인, 메뉴, 사례 필터, 문의 양식
- `assets/images`: 압축된 WebP 이미지와 공유용 이미지
- `server/worker.mjs`: Cloudflare Workers 진입점
- `server/inquiries.mjs`: 문의 검증, D1 저장, 스팸 제한, 선택적 이메일 알림
- `migrations/0001_inquiries.sql`: 문의 저장 테이블
- `wrangler.jsonc`: 정적 파일·서버·D1·예약 삭제 작업 설정
- `dist`: 만들어진 정적 파일. 소스가 수정되면 다시 빌드

웹사이트에 자료 PPTX나 HWP 원본을 그대로 올리지 않습니다. 실제 첨부 자료에서 선정한 이미지와 편집한 설명만 사용했습니다. 일부 사례의 직접 사진이 아닌 이미지는 해당 페이지에 참고 사진이라고 표시했습니다. 첨부 홍보영상은 내용·음원·자막 검토 후 추가할 수 있도록 이번 버전에서 제외했습니다.

## Cloudflare에 올릴 때

온라인 문의를 실제 저장하려면 **Cloudflare Workers Static Assets + D1** 구성을 사용합니다. 홈페이지는 정적 HTML로 빠르게 제공하고 `/api/inquiries`만 서버에서 처리합니다. 별도 상시 실행 서버는 필요하지 않습니다.

`dist` 폴더만 업로드하면 화면은 열리지만 문의 서버는 배포되지 않습니다. 온라인 문의까지 운영하려면 아래 절차로 전체 프로젝트를 배포해야 합니다. Cloudflare 계정 연결이나 배포는 아직 하지 않았습니다.

### 1. 계정과 D1 연결

Node.js 환경에서 공식 Wrangler CLI를 준비합니다. 아래 명령은 배포 시 사용자가 계정을 연결한 뒤 실행할 절차이며, 이번 제작 과정에서 실행하지 않았습니다.

```powershell
npx wrangler login
npx wrangler d1 create walking-inquiries
```

반환된 `database_id`를 `wrangler.jsonc`의 `REPLACE_WITH_CLOUDFLARE_DATABASE_ID`에 입력합니다.

```powershell
npx wrangler d1 migrations apply walking-inquiries --remote
npx wrangler secret put INQUIRY_HASH_SALT
```

`INQUIRY_HASH_SALT`에는 충분히 긴 임의의 비밀값을 입력합니다. 실제 비밀값을 소스 파일이나 대화창에 넣지 않습니다.

### 2. 도메인과 운영 빌드

처음에는 Cloudflare에서 제공하는 `workers.dev` 주소를 운영 주소로 사용할 수 있습니다. 추후 자체 도메인이 생기면 같은 설정을 변경해 다시 빌드합니다.

`site.config.json`의 `origin`에 실제 HTTPS 주소를 경로 없이 입력합니다. 예: `https://실제-프로젝트.실제-계정.workers.dev`. 가짜 예시 주소를 그대로 사용하지 않습니다.

```powershell
node scripts/build.mjs --production
npx wrangler deploy
```

최초에 주소를 확인할 필요가 있다면 미리보기 빌드 상태로 먼저 배포해 `workers.dev` 주소를 확인하고, 그 주소를 설정한 뒤 운영 빌드로 다시 배포합니다. 첫 배포 버전은 검색 차단 상태입니다. D1 및 비밀값 연결을 확인하기 전 온라인 접수는 작동하지 않습니다.

운영 빌드에서는 canonical, Open Graph 이미지 주소, 조직 식별 URL, 페이지 경로와 사이트맵을 실제 도메인으로 생성합니다. 도메인이 없는 상태에서 운영 빌드를 실행하면 중단합니다.

### 3. 문의 확인과 이메일 알림

문의는 서버 검증과 D1 저장이 성공한 뒤 접수번호를 반환합니다. 기본 확인 위치는 Cloudflare의 D1 콘솔입니다.

```sql
SELECT id,
  datetime(created_at, 'unixepoch', '+9 hours') AS received_kst,
  json_extract(payload, '$.organization') AS organization,
  json_extract(payload, '$.name') AS name,
  json_extract(payload, '$.phone') AS phone,
  json_extract(payload, '$.email') AS email,
  json_extract(payload, '$.message') AS message,
  notification_status
FROM inquiries
ORDER BY created_at DESC;
```

`kptchoi@gmail.com`으로 자동 알림을 받으려면 선택적으로 Resend를 연결합니다. 홈페이지에 Gmail 주소를 적는 것만으로 서버에서 이메일이 발송되지는 않습니다. Resend의 발신 도메인 확인이 필요합니다.

```powershell
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CONTACT_FROM
```

`CONTACT_FROM`은 Resend에서 검증한 발신 주소입니다. 수신 주소는 `wrangler.jsonc`의 `CONTACT_TO`이며 현재 `kptchoi@gmail.com`입니다. 알림 실패가 문의 데이터 손실로 이어지지 않도록 문의를 먼저 저장합니다. 이메일 실패 시 DB의 `notification_status`는 `failed`가 됩니다. 외부 메일 서비스를 실제로 연결한다면 개인정보 안내의 처리업무·수탁/이전 관련 설명도 실제 환경에 맞춰 확정합니다.

자동 알림 미설정 시에도 D1 접수는 가능하지만, 운영자가 D1의 새 문의를 정기적으로 확인해야 합니다. 공개 전 시험 문의 1건을 실제 배포 주소에서 보내 저장·답변 동선을 확인합니다. 테스트를 위해 실제 사용자 문의를 대신 보내지는 않았습니다.

### 4. 보관과 스팸 제한

- 동의, 필수값, 형식, 길이를 서버에서도 검증합니다.
- 동일 출처 JSON 요청만 허용하고 허니팟과 요청 크기 제한을 사용합니다.
- 원본 IP를 저장하지 않고 비밀값으로 해시한 값으로 시간당 5건을 제한합니다.
- 문의는 89일 후 삭제 대상이 되고 하루 1회 예약 작업으로 정리해 정상 실행 시 90일 이내 삭제합니다. Cron 실행 상태를 운영 중 점검합니다.
- 요청 실패 시 입력값을 유지합니다. 브라우저 저장소에는 개인정보를 저장하지 않습니다.
- 문의 API에는 조회 기능을 공개하지 않습니다. DB 접근은 Cloudflare 계정 권한으로 제한합니다.

## SEO · GEO · AEO 적용 내용

1. 모든 주요 내용이 최초 HTML 응답에 포함됩니다. JavaScript 실행 없이도 협회·프로그램·활동 정보를 읽을 수 있습니다.
2. 페이지별 고유 title·description·H1, 의미 있는 URL, 내부 링크와 탐색 경로를 제공합니다.
3. Organization, WebSite, WebPage, BreadcrumbList, Service, Article, Person 구조화 데이터를 실제 본문과 맞춰 생성합니다.
4. FAQ는 화면에서 읽을 수 있는 질문·답변과 FAQPage 의미 구조로 제공합니다. Google FAQ 리치결과나 AI 인용 노출을 약속하지 않습니다.
5. 협회 이름·전화·이메일을 일관되게 사용하고, 활동 사례의 기관·대상·시기·근거 자료를 표시합니다.
6. 교육 정보는 질문에 대한 답을 먼저 제시하고, 작성 주체·자료 근거·수정 기준을 안내합니다. 확인되지 않은 전문가 검수나 치료 효과를 만들지 않습니다.
7. 이미지 압축, 크기 지정, 적응형 이미지, 지연 로딩, 대표 이미지 우선 로딩을 적용했습니다. 외부 폰트·대형 프레임워크·광고 스크립트는 사용하지 않습니다.
8. 운영 빌드에서 sitemap.xml·robots.txt·canonical·공유 메타데이터를 생성합니다. 현재 미리보기는 noindex 상태입니다.

Google 공식 안내에 따르면 AI 검색을 위한 별도의 특수 마크업이나 AI 텍스트 파일은 필수가 아닙니다. 그래서 `llms.txt`가 노출을 높인다고 주장하거나 확인되지 않은 자동 인용 기능을 추가하지 않았습니다. 검색 노출과 순위, AI 답변 인용은 보장되지 않습니다.

## 공개 후 검색 등록

1. 실제 도메인으로 운영 빌드했는지, HTML robots가 `index, follow`이고 robots.txt가 접근을 허용하는지 확인합니다.
2. Google Search Console과 네이버 서치어드바이저에서 사이트 소유권을 확인합니다. HTML 인증값은 `site.config.json`에 넣고 재빌드할 수 있습니다.
3. `/sitemap.xml`을 제출하고 대표 페이지의 색인 상태를 확인합니다.
4. Cloudflare의 봇 차단·접근 제어가 검색용 크롤링을 막지 않는지 실제 계정 설정을 확인합니다.
5. 자체 도메인으로 이전하면 이전 호스트에서 새 도메인으로 리디렉션을 설정하고, canonical·사이트맵을 새 도메인으로 다시 생성합니다.

## 검증

```powershell
node --test tests/inquiries.test.mjs tests/site.test.mjs
```

27개 HTML의 제목·설명·H1·구조화 데이터·내부 링크, 운영 도메인 생성, 문의 검증·실제 SQLite 저장·속도 제한·DB 장애·기한 만료 삭제를 확인합니다. 테스트는 메모리 DB와 가상 도메인을 사용하며 외부로 메일을 발송하지 않습니다.

## 공개 전에 확인할 내용

전화·이메일은 사용자 제공값을 반영했습니다. 임원 직함과 활동 기록은 첨부 자료 기준이므로 최신 상태를 확인합니다. 현장 사진·학생 안내 이미지와 기관명 사용 범위, 개인정보 처리 주체·운영 환경을 최종 확인합니다. 도메인·Cloudflare DB·비밀값·메일 발신 설정은 배포 시 연결합니다.

## 공식 참고 문서

- [Google AI 검색과 웹사이트](https://developers.google.com/search/docs/appearance/ai-features)
- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Resend 이메일 API](https://resend.com/docs/api-reference/emails/send-email)
