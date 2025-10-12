# Instagram Reels 크롤링 개요

## 접근 방식

- Selenium을 이용해 공개 계정 페이지(`https://www.instagram.com/kpopdemonhunters/`)를 스크롤링하면서 `<a href=".../reel/...">` 요소를 추출합니다.
- 각 앵커의 자식 `<img>`를 통해 썸네일 URL과 캡션(alt 속성)을 수집합니다.
- 최대 100개의 릴스를 수집해 `frontend/public/reels.json`에 저장합니다.

## `reels.json` 구조

```
{
  "fetched_at": 1700000000,
  "count": 100,
  "reels": [
    {
      "permalink": "https://www.instagram.com/reel/.../",
      "thumbnail_url": "https://...jpg",
      "caption": "캡션 텍스트"
    }
  ]
}
```

- 프런트엔드는 해당 JSON을 fetch 한 뒤 `VideoItem` 배열로 변환해 기존 그리드/모달 흐름에 통합합니다.
- 썸네일이 없는 경우 디자인 시스템에서 제공하는 Instagram 폴백 이미지를 사용할 수 있습니다.

## 운영 시 고려 사항

1. **요청 제한**: Instagram 페이지 구조 변경이나 레이트 리밋에 대비해 크롤링 주기를 완화하고 재시도/폴백 로직을 준비합니다.
2. **데이터 무결성**: `reels.json`을 Git에 커밋하지 않고 Netlify 정적 자산으로만 배포하며, 최신 데이터 유지를 위해 CI에서 주기적으로 크롤러를 실행합니다.
3. **법적 검토**: 자동화된 스크래핑은 Instagram 약관에 저촉될 수 있으므로, 서비스 오너의 승인을 받아야 합니다.
4. **모니터링**: 크롤러 실행 결과(수집 개수, 오류)를 로그/Slack 등으로 알림하여 수집 실패에 빠르게 대응합니다.
