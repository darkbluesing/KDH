# TikTok Grid Replacement

Instagram Reels 영역을 TikTok 검색 결과로 대체하는 Flask 기반 웹 애플리케이션입니다. `TikTokApi`를 이용해 특정 키워드의 상위 영상(최대 100개)을 수집하고, 기존 그리드 레이아웃 그대로 렌더링합니다.

## 요구 사항

- macOS (또는 Linux)
- Python 3.11 이상
- Node.js 16+ (Playwright 브라우저 설치용)
- Chromium 또는 Chrome (Playwright가 자동 다운로드)

## 설치 및 실행

```bash
python -m venv .venv
source .venv/bin/activate  # Windows는 .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
python -m playwright install  # TikTokApi에서 사용하는 Chromium 설치
python app.py
```

앱은 기본적으로 `http://127.0.0.1:5000/`에서 실행됩니다. 기본 검색 키워드는 `KPOP DEMON HUNTERS`이며, URL 쿼리(`?q=검색어`) 또는 상단 입력창으로 다른 키워드를 조회할 수 있습니다.

## 프로젝트 구조

```
app.py                # Flask 엔트리 포인트
crawler.py            # TikTokApi 크롤링 로직 및 CLI
requirements.txt      # 의존성 정의
static/
  └── css/
      └── styles.css  # 기존 Reels용 반응형 그리드 스타일
templates/
  └── index.html      # TikTok 결과를 출력하는 템플릿
README.md             # 실행 방법 및 안내
```

## 주요 기능

- `crawler.py`: `TikTokApi`를 이용해 지정 키워드의 상위 영상 메타데이터(영상 URL, 썸네일, 작성자, 설명)를 비동기로 수집 후 캐싱합니다.
- `app.py`: Flask 라우트(`/`, `/refresh`, `/api/videos`)에서 크롤링 결과를 제공하고, 오류 발생 시 캐시 데이터를 활용해 graceful fallback을 제공합니다.
- `templates/index.html`: 기존 인스타그램 Reels 그리드 구조를 그대로 유지하면서 TikTok embed로 영상들을 출력합니다.
- `static/css/styles.css`: 모바일과 데스크톱에 대응하는 반응형 레이아웃 유지 및 약간의 비주얼 튜닝.

## 크롤러 단독 실행

표준 출력으로 수집 결과를 확인하려면 아래 명령을 사용하세요.

```bash
python crawler.py "검색 키워드" --count 50 --refresh
```

결과는 JSON 형식으로 출력됩니다. 크롤링에 실패했지만 캐시된 데이터가 있는 경우, `from_cache: true`로 표시됩니다. 실패했고 캐시가 없으면 프로세스가 종료 코드 `1`로 종료됩니다.

## 환경 변수 (선택 사항)

| 이름 | 설명 | 기본값 |
| ---- | ---- | ------ |
| `TIKTOK_KEYWORD` | 기본 검색 키워드 | `KPOP DEMON HUNTERS` |
| `TIKTOK_CACHE_TTL` | 캐시 TTL(초) | `1800` |
| `TIKTOK_HEADLESS` | Playwright를 헤드리스 모드로 실행 (`0`이면 브라우저 노출) | `1` |
| `TIKTOK_MAX_PAGES` | 검색 페이지 최대 반복 호출 수 | `20` |
| `PORT` | Flask 서버 포트 | `5000` |
| `FLASK_DEBUG` | Flask 디버그 모드 (`1` or `0`) | `1` |

## 에러 핸들링

- TikTok API 호출 문제가 발생하면 Flask 페이지 상단에 오류 메시지가 노출됩니다.
- 이전에 성공한 결과가 있으면 캐시 데이터로 graceful fallback을 제공합니다.
- `/api/videos` 엔드포인트는 오류 발생 시 HTTP 503을 반환합니다.

## 참고

- TikTok의 페이지 구조, 차단 정책 등에 따라 크롤링이 실패할 수 있습니다. 이 경우 브라우저 환경을 조정하거나 VPN/프록시를 고려해야 할 수 있습니다.
- Playwright는 최초 실행 시 필요한 브라우저 바이너리를 다운로드하므로, 인터넷이 가능한 환경에서 `python -m playwright install`을 반드시 실행하세요.
