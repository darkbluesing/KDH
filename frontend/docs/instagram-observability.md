# Instagram Reels 운영 메모

## 크롤러 모니터링

- `crawler.py` 실행 로그를 수집해 성공/실패 여부와 수집 건수를 기록합니다.
- 0건 또는 이전 대비 급감 시 Instagram 페이지 구조 변경을 의심하고 즉시 확인합니다.
- 크롤링 주기는 최소 1시간 이상 간격을 권장합니다.

## `reels.json` 검증 항목

- JSON이 유효한지, `reels` 배열에 `permalink`, `thumbnail_url`이 포함되어 있는지 확인합니다.
- 정적 파일은 Git에 포함하지 않고 배포 대상(WAF, CDN)에만 저장합니다.
- Netlify 배포 후 `https://<도메인>/reels.json`으로 접근해 최신 데이터가 노출되는지 확인합니다.

## 프런트엔드 감시 포인트

- `/reels.json` fetch 실패 시 콘솔에 "Failed to fetch Instagram reels" 에러 로그가 남습니다. 해당 에러가 반복되면 배포된 JSON이 없거나 CORS/경로 문제를 점검합니다.
- 썸네일이 비어 있는 경우 디자인 폴백 이미지를 사용하거나 크롤러가 이미지 URL을 제대로 수집하는지 확인합니다.

## 비상 대응 절차

1. `reels.json`이 비었거나 오래된 경우 `python crawler.py`로 재생성합니다.
2. Instagram에서 302/403 등의 응답이 지속되면 크롤링 간격을 늘리고, 필요 시 수동으로 데이터를 보충합니다.
3. 구조 변경으로 크롤러가 실패하면 Selenium 셀렉터를 업데이트하고, QA 환경에서 충분히 테스트한 뒤 배포합니다.
