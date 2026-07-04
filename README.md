# BOOKMATE 4.0 Foundation

BOOKMATE 4.0 Foundation은 기능 추가 없이 기존 3.8.2 프로젝트를 정리한 리팩터링 기준본입니다.
화면, 레이아웃, 주요 기능은 유지하고 파일 구조와 데이터 관리 위치를 정리했습니다.

## 작업 원칙

- 기능 추가 없음
- UI/디자인/레이아웃 변경 없음
- 실제 사용하는 파일 중심으로 정리
- 기본 데이터는 localStorage에 저장하지 않고 `/data` 파일을 기준으로 반영
- 사용자가 직접 만든 활동 데이터만 localStorage 저장

## 폴더 구조

```
/assets
  /images/lounge      북라운지 실제 PNG 이미지
  /icons              로고, favicon, PWA 아이콘
  /books              책 이미지 추가 공간
  /characters         기본 AI 모아, 프로필 모아
/css
  style.css
/js
  app.js              공통 앱/화면/검색/프로필 기본 로직
  ai.js               AI 독서파트너 로직
  gathering.js        독서모임/라이브 모임 로직
  archive.js          로그인/계정/토론방/아카이브 연동 로직
  lounge.js           북라운지 로직
  ui.js               UI 보조 파일 자리
  state.js            기본 상태
  storage.js          저장소 처리
  book-api.js         책 검색/표지 API
/data
  accounts.js         가계정/게스트 데이터
  groups.js           기본 독서모임 데이터
  archives.js         토론방/알림 기본 데이터
  library.js          내서재 기본 데이터 자리
  lounge.js           북라운지 기본 데이터 자리
  books.js            책 메타데이터 자리
  settings.js         분리된 데이터를 BOOKMATE_DATA로 조립
  admin.js            관리자 데이터
/netlify/functions    API 함수
index.html
README.md
```

## 자주 수정하는 위치

### 가계정 수정

`data/accounts.js`

- 닉네임
- 소속도서관
- 프로필 모아
- 계정별 내서재
- 계정별 아카이브
- 계정별 북라운지
- 가입 모임 ID

### 독서모임 수정

`data/groups.js`

- 기본 독서모임 목록
- 책 제목
- 일정
- 모임 방식
- 키워드

### 토론방/알림 기본 데이터 수정

`data/archives.js`

### AI 수정

`js/ai.js`

4.0 Foundation에서는 AI 모드 캐릭터를 제거하고 기본 AI 모아 하나만 사용합니다. 기존 모드 호출은 호환을 위해 모두 `moa`로 연결됩니다.

### 북라운지 수정

`js/lounge.js`

북라운지 실제 이미지는 `assets/images/lounge`에 있습니다.

## localStorage 원칙

### 저장하는 것

- AI 대화
- 북라운지 변경
- 가입 모임
- 작성 글
- 아카이브 추가

### 저장하지 않는 것

- 가계정 기본값
- 기본 독서모임
- 기본 토론방 데이터
- 기본 북라운지 데이터

기본 데이터는 GitHub에 올린 `/data` 파일이 기준입니다.

## 삭제/정리한 것

- AI 모드별 캐릭터 이미지 제거
- 예전 북라운지 SVG 이미지 제거
- 중복 PNG 제거
- 루트 CSS를 `/css/style.css`로 이동
- 데이터 통합 파일을 기능별 파일로 분리
- 대형 `app.js`를 기능 영역별 JS 파일로 분리

## 배포

Netlify 기준 설정은 `netlify.toml`을 사용합니다.
