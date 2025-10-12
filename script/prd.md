---npx task-master parse-prd ./script/prd.txt 

# 📄 PRD: K-POP Demon Hunters 쇼츠모음 반응형 웹페이지 (최종 확정본)

## 1. 프로젝트 개요

* **프로젝트명:** K-POP Demon Hunters Shorts Hub
* **설명:** YouTube와 Instagram에 업로드된 **K-POP Demon Hunters** 관련 숏폼 콘텐츠를 모아 반응형으로 표시하는 웹페이지.
* **형식:** Figma 스타일의 모던한 UI/UX, 7x20 그리드 기반, 광고 모달 및 배너 포함.

---

## 2. 목표

* 팬들이 K-POP Demon Hunters 관련 숏폼 영상을 **빠르게 탐색 및 감상**할 수 있는 허브 제공.
* **광고 기반 수익화**와 **고퀄리티 UI/UX**를 동시에 실현.
* **영화의 주요 컬러톤**을 활용하여 브랜드 세계관과 시각적 일관성을 확보.

---

## 3. 주요 기능

### 3.1 그리드 (Video Grid)

* **구성:** 7x20 셀 (총 140개).

* **셀 크기:** 135x240px (9:16 비율).

* **데이터:**

  * **YouTube Data API** 사용.

    * 검색 키워드:

      * `"K-POP Demon Hunters"`
      * `"케이팝 데몬헌터스"`
      * `"Kpop Demon Hunters"`
      * `"Demon Hunters KPOP"`
      * `"K-POP Demon Hunters 직캠"`
      * `"K-POP Demon Hunters 무대"`
      * `"K-POP Demon Hunters 쇼츠"`
    * 정렬 기준: 조회수(viewCount).
    * 새로고침 시 API 재호출.
  * **Instagram Reels**

    * 공개 계정 릴스 크롤링 후 표시.

* **호버 효과:** CSS keyframes 기반 물결(wave ripple) 애니메이션.

---

### 3.2 광고 모달 (Ad Modal)

* **동작:** 썸네일 클릭 → 광고 모달 팝업 → 닫기(X) → 실제 영상 페이지로 이동.
* **디자인:**

  * 둥근 모서리(border-radius).
  * Fade-in 애니메이션.
  * 반투명 배경(overlay).

---

### 3.3 배너 (Banner Ads)

* **좌우 배너 크기:** 120x600px.
* **위치:** `position: fixed`, 스크롤 따라오기.
* **디자인:** 그림자(shadow) + 둥근 모서리(radius).
* **반응형:** 모바일(768px 이하)에서 자동 숨김 처리.

---

## 4. 기술 요구사항

* **Frontend:** React.js (Next.js 고려 가능).
* **API 연동:**

  * YouTube Data API v3 (위의 키워드 기준).
  * Instagram 크롤링 로직 (공개 릴스).
* **스타일:** CSS keyframes + Figma 기반 모던 UI.

---

## 5. 디자인 가이드

* **컬러톤:**

  * K-POP Demon Hunters 영화의 메인 팔레트 활용

    * 딥 블랙 & 차콜 그레이 (어두운 베이스)
    * 네온 퍼플 & 일렉트릭 블루 (강조 컬러)
    * 블러디 레드 & 메탈릭 실버 (액션 포인트)
* **분위기:** 영화적 긴장감과 세계관을 반영한 다크 판타지 + KPOP 퍼포먼스 스타일.
* **호버 애니메이션:** 물결 효과를 컬러 팔레트와 조화롭게 적용.
* **모달/배너:** 라운드 코너, 그림자, 영화 톤에 맞춘 배경 그래픽.

---

## 6. 성과 측정 기준 (KPI)

* 페이지 평균 체류 시간.
* 영상 클릭률(CTR).
* 광고 모달 이탈률.
* 재방문율.

---
