# K-POP Demon Hunters Shorts Hub

다크 판타지 세계관을 살린 7x20 숏폼 미디어 허브입니다. YouTube와 Instagram 데이터를 통합해 팬이 최신 영상을 한곳에서 탐색할 수 있도록 설계했습니다.

## 기술 스택
- Next.js (App Router)
- TypeScript
- Tailwind CSS (커스텀 테마 & 애니메이션 확장)
- next/font 기반 Inter, Space Grotesk 폰트 로딩

## 실행 방법
```bash
npm install
npm run dev
# http://localhost:3000 접속
```

## 디렉터리 구조
```
frontend/
├── src/
│   ├── app/            # 라우트 및 레이아웃 (App Router)
│   ├── components/     # 재사용 UI 컴포넌트 (VideoGrid, SideBanner 등)
│   ├── hooks/          # 공통 훅 (예: useModalState)
│   ├── lib/            # 타입, 상수 등 순수 유틸
│   ├── services/       # API 연동 로직 (YouTube/Instagram)
│   └── styles/         # 디자인 토큰, 공통 스타일 유틸
├── public/             # 정적 에셋
└── tailwind.config.ts  # 팔레트/애니메이션 확장 설정
```

> **규칙 요약**
> - 데이터 타입과 상수는 `@/lib`에서 관리합니다.
> - 외부 API 호출은 `@/services`에서 구현하고, 훅/컴포넌트는 해당 서비스를 의존합니다.
> - 모달/상태 관련 로직은 `@/hooks`에 배치합니다.
> - 디자인 시스템(색상, 배지, 레이아웃 수치)은 `@/styles/design-tokens.ts`로 통합합니다.

## 디자인 가이드 적용
- 글로벌 배경과 네온 오버레이는 `globals.css`와 Tailwind 커스텀 클라스로 구성했습니다.
- 7x20 그리드 레이아웃, 사이드 배너, CTA 영역을 초기 페이지(`app/page.tsx`)에 구현해 전체 톤앤매너를 확인할 수 있습니다.
- Hover ripple, glow pulse 등 애니메이션은 Tailwind keyframes로 관리합니다.

## 향후 작업 메모
- `@/services/videoService.ts`에서 YouTube Data API, Instagram 크롤링을 연동합니다.
- 모달 상태 훅(`useModalState`)을 광고 모달과 상세 뷰에 재사용합니다.
- 디자인 토큰은 차후 스토리북/디자인 QA 단계에서 확장할 수 있도록 모듈화되어 있습니다.

## 환경 변수
- `.env.example`를 복사해 `.env`를 만들고 API 키를 채워주세요.
- 최소 `OPENAI_API_KEY` 또는 `PERPLEXITY_API_KEY`가 있어야 Task Master 및 AI 기능이 동작합니다.
- 클라이언트에 노출되면 안 되는 값은 서버 컴포넌트나 API Route에서만 사용하세요.
