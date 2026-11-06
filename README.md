# 대한바른자세걷기협회 홈페이지

협회 소개와 교육 프로그램, 활동 사례, 보도자료 게시판을 제공합니다. 주 배포 환경은 Cloudflare Pages + D1 + R2입니다.

## Cloudflare Pages 설정

| 항목 | 값 |
|---|---|
| Framework preset | None |
| Build command | node scripts/build.mjs |
| Build output directory | dist |
| Root directory | 저장소 루트, 비워두기 |
| Node.js | NODE_VERSION=22 이상 |
| D1 binding | walking-db → 기존 walking-db |
| R2 binding | walking-r2 → 기존 walking-r2 |

빌드가 dist/_worker.js와 서버 모듈을 생성합니다. Git 연동으로 재배포하면 서버 기능도 함께 배포됩니다. 서버 코드 경로는 외부 요청에서 차단합니다. 이전 Workers 전용 예시는 wrangler.worker.example.jsonc로 옮겨 Pages 설정과 충돌하지 않도록 했습니다.

## 관리자 설정

Pages 프로젝트의 Settings → Variables and Secrets에서 ADMIN_PASSWORD를 Secret으로 추가하고 재배포합니다. 값은 직접 정한 16자 이상의 충분히 긴 비밀번호입니다. 실제 비밀번호를 GitHub, 소스 파일, 대화창에 적지 않습니다.

배포 후 사이트주소/admin/에서 로그인합니다. 로그인 세션은 HttpOnly·SameSite=Strict 쿠키를 사용하고 HTTPS에서 Secure 속성을 적용합니다. 비밀번호를 바꾸면 기존 서명 세션은 무효화됩니다. 로그인 시도는 접속 정보의 해시값으로 제한합니다.

앱은 기존 데이터를 삭제하지 않고 필요한 press_posts, press_media, press_login_attempts 테이블과 인덱스를 CREATE IF NOT EXISTS로 자동 생성합니다. 수동 관리용 동일 스키마는 migrations/0002_press.sql에 있습니다.

## 보도자료 작성

1. /admin/에서 로그인합니다.
2. 새 글 작성에서 제목, 분류, 작성자, 요약과 본문을 입력합니다.
3. 사진이나 PDF를 업로드합니다. JPG·PNG·WebP·PDF를 지원하며 파일당 최대 10MB, 글당 최대 20개입니다.
4. 사진은 대표 사진으로 지정하거나 본문에 넣을 수 있습니다.
5. 원문 매체·자료명과 기사 링크를 필요에 따라 입력합니다.
6. 임시저장 → 미리보기 → 발행하기 순서로 확인합니다.

본문은 빈 줄로 문단을 나눕니다. ## 소제목, ### 작은 소제목, - 목록, **강조**, [링크](https://...)를 지원합니다. HTML 태그는 실행하지 않습니다.

발행 글 주소는 /press/글주소/입니다. 한 번 발행한 글 주소는 유지합니다. 다른 창에서 수정한 글을 덮어쓰지 않도록 저장 버전을 확인합니다. 발행된 글은 수정하거나 비공개로 전환할 수 있습니다. 영구 삭제 기능은 넣지 않았습니다.

관리자 목록은 최근 수정한 200개 글을 표시하며 그 안에서 제목으로 찾을 수 있습니다. 연결 해제한 파일은 R2에서 즉시 삭제하지 않으므로 원본이 실수로 사라지지 않습니다. 미사용 파일은 운영자가 별도로 관리합니다.

## 데이터 저장과 공개 범위

- D1: 제목·본문·요약·작성자·출처·발행 상태·파일 연결 정보
- R2: 사진·PDF 원본
- 임시저장 글과 파일: 관리자 세션으로만 열람
- 발행 글에 연결된 파일: /media/파일ID로 제공
- R2 버킷 자체를 public으로 전환할 필요 없음
- 비공개 전환 시 글과 파일의 공개 접근을 재확인하고 응답을 캐시하지 않음

## 검색·AI 검색

기존 페이지는 정적 HTML이며 보도자료 목록과 상세는 서버에서 본문 전체를 HTML로 응답합니다. 발행 글에는 고유 제목·요약·대표 이미지, 작성자, 발행·수정일과 NewsArticle 또는 BlogPosting 구조화 데이터를 제공합니다. 홈페이지와 협회 소식에 최근 발행 글이 표시됩니다. 검색·분류·페이지 이동, RSS(/press/feed.xml), 발행 글을 포함하는 동적 사이트맵을 제공합니다.

현재 운영 도메인을 전달받지 않아 기본 빌드는 검색 차단 상태입니다. 운영 주소가 정해지면 Pages 빌드 환경변수 SITE_ORIGIN에 실제 HTTPS 주소를 경로 없이 입력하고 빌드 명령을 node scripts/build.mjs --production으로 바꿉니다. 자체 도메인 없이도 실제 https://프로젝트명.pages.dev 주소를 사용할 수 있습니다. 관리자와 임시저장 글은 사이트맵에 포함하지 않습니다. 검색 순위와 AI 인용은 보장되지 않습니다.

## 연락처와 기존 문의 기능

대표 전화: 02-3472-4177
대표 이메일 및 기본 알림 수신 주소: kptchoi7205@gamil.com

새 D1에서 문의 접수까지 운영한다면 migrations/0001_inquiries.sql도 적용하고 INQUIRY_HASH_SALT Secret을 설정합니다. 자동 이메일 알림은 선택적으로 RESEND_API_KEY, 검증된 발신 주소 CONTACT_FROM, CONTACT_TO를 설정한 경우 동작합니다. 메일 서비스 없이도 문의 DB 저장은 가능합니다. Cloudflare에 기존 CONTACT_TO 환경변수를 별도로 설정했다면 새 주소로 수정해야 합니다.

Pages에는 Cron Triggers가 없으므로 문의 개인정보의 자동 보관기한 관리는 별도 예약 Worker 또는 운영 절차를 연결해야 합니다. 문의 접수 시에도 만료 데이터를 정리합니다. Workers 예시에는 하루 한 번 정리하는 예약 작업이 있습니다.

## 로컬 확인

첫 화면에는 15초 키네틱 타이포그래피를 적용했습니다. 세 장면이 한 번 재생된 뒤 마지막 문구에 머물며, 일시정지·이어서 재생·다시 재생을 지원합니다. 탭을 숨기거나 히어로를 벗어나면 재생을 멈춥니다. 기기의 움직임 줄이기 설정에서는 마지막 장면을 정지 화면으로 제공합니다.

글꼴은 공식 Pretendard v1.3.9의 가변 웹폰트를 내려받아 사이트에 포함했습니다. 외부 폰트 CDN 없이 제공하며 SIL Open Font License 1.1 전문은 `assets/fonts/Pretendard-LICENSE.txt`에 있습니다. 원본: https://github.com/orioncactus/pretendard/tree/v1.3.9

히어로 문구와 사진은 `scripts/hero.mjs`, 디자인은 `assets/hero.css`, 재생 동작은 `assets/hero-motion.js`에서 수정합니다. 마지막 장면 사진은 협회 소개자료의 권선구보건소·서호노인복지관 프로그램 현장 사진을 사용했습니다.

Node.js 22 이상에서 추가 패키지 설치 없이 실행합니다.

    node scripts/build.mjs
    node scripts/serve.mjs

브라우저에서 http://127.0.0.1:4173을 엽니다. 종료는 Ctrl+C입니다. 기본 미리보기는 실제 문의를 저장하지 않습니다.

편집실 검토는 node scripts/serve.mjs --cms-demo로 실행합니다. 메모리 DB와 파일 저장소를 사용하며 종료 시 테스트 데이터가 사라집니다. 실제 Cloudflare D1·R2와 연결하지 않습니다. 검토 전용 비밀번호는 preview-only-walking-2026이며 배포 서버에 기본 비밀번호로 설정되지 않습니다.

## 검증

    node --test tests/*.test.mjs

29개 정적 HTML, 제목·설명·H1·내부 링크·구조화 데이터, 운영 주소 생성, 문의 저장, 관리자 인증, 글 상태 변경·수정 충돌, R2 저장·비공개 접근, XSS 방지, RSS·사이트맵 반영을 검사합니다. 검사는 가상 도메인과 메모리 SQLite/R2를 사용합니다. 실제 Cloudflare 계정에서의 저장·접수·메일 발송 검증은 별도입니다.

## 주요 파일

- site.config.json: 협회 연락처·운영 주소
- assets/admin.html, assets/admin.js, assets/cms.css: 관리자 편집실
- server/auth.mjs: 관리자 인증
- server/press.mjs: D1·R2 저장과 파일 접근
- server/render-press.mjs: 기사 HTML·RSS·사이트맵
- server/worker.mjs: Pages와 Workers 공통 요청 처리
- scripts/build.mjs: 정적 페이지와 Pages 서버 출력 생성

첨부 원본 PPTX·HWP, 검토용 테스트 출력, 실제 비밀값은 Git에 올리지 않습니다.

## 공식 참고

- [Cloudflare Pages Advanced mode](https://developers.cloudflare.com/pages/functions/advanced-mode/)
- [Cloudflare R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)
- [Google AI 검색 안내](https://developers.google.com/search/docs/appearance/ai-features)
